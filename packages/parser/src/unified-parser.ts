/**
 * Unified SpecVerse Parser
 * 
 * Combines functionality of SpecVerseParser and EnhancedSpecVerseParser
 * into a single configurable parser with optional import resolution
 */

import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs/promises';
import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
const Ajv = (AjvModule as any).default || AjvModule;
const addFormats = (addFormatsModule as any).default || addFormatsModule;
import { ConventionProcessor } from './convention-processor.js';
import { SpecVerseAST, ComponentSpec, DeploymentSpec } from './types/ast.js';
import { ImportResolver } from './import-resolver/index.js';
import type { ImportSpec, ResolvedImport } from './import-resolver/types.js';

export interface ParseOptions {
  // Import resolution options
  enableImports?: boolean;
  importResolver?: ImportResolver;
  basePath?: string;
  cacheDir?: string;
  offline?: boolean;
  
  // Debug output
  debug?: boolean;
}

export interface ParseResult {
  ast?: SpecVerseAST;
  errors: string[];
  warnings?: string[];
  // Always included (undefined if imports disabled)
  resolvedImports?: Map<string, ResolvedImportInfo[]>;
}

export interface ResolvedImportInfo {
  importSpec: ImportSpec;
  resolved: ResolvedImport;
  selectedTypes?: Map<string, any>;
  foundOriginalTypes?: Set<string>; // Track which originally requested types were found
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

export interface ComponentTypeInfo {
  name: string;
  version: string;
  models: Set<string>;
  controllers: Set<string>;
  services: Set<string>;
  views: Set<string>;
  events: Set<string>;
  exports: { [category: string]: string[] };
}

export class UnifiedSpecVerseParser {
  private conventionProcessor: ConventionProcessor;
  private schemaValidator: any;
  private schema: any;
  private options: ParseOptions;
  private importResolver?: ImportResolver;
  private warnings: string[] = [];

  constructor(schema: any, options: ParseOptions = {}) {
    this.options = options;
    
    this.conventionProcessor = new ConventionProcessor();
    
    // Create AJV instance - v8 uses 2020-12 draft by default
    this.schemaValidator = new Ajv({ 
      allErrors: true,
      strict: false,
      removeAdditional: false, // Don't remove additional properties, fail validation instead
      useDefaults: false,      // Don't apply default values
      coerceTypes: false,      // Don't coerce types
      validateFormats: true,   // Ensure format validation is enabled
      formats: {}              // Initialize empty formats object
    });
    
    // Add commonly used formats manually to avoid ajv-formats compatibility issues
    this.schemaValidator.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    this.schemaValidator.addFormat('uri', /^https?:\/\/[^\s]+$/);
    this.schemaValidator.addFormat('uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    this.schemaValidator.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
    this.schemaValidator.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    
    // Try to add full ajv-formats if possible, but continue if it fails
    try {
      addFormats(this.schemaValidator);
    } catch (error) {
      // ajv-formats has compatibility issues in mixed CommonJS/ES module environments
      // We've already added the most common formats manually above
      console.debug('Note: Using manual format validators due to ajv-formats compatibility issue');
    }

    // Remove $schema property to avoid meta-schema issues
    // AJV v8 uses Draft 2020-12 by default, so we don't need the $schema property
    // Ensure $id is preserved when processing the schema for validation
    const { $schema, ...schemaForValidation } = schema;
    if (schema.$id) {
        Object.assign(schemaForValidation, { $id: schema.$id });
    }
    this.schema = schemaForValidation;
    
    // Initialize import resolver if imports are enabled (default: enabled)
    if (options.enableImports !== false) {
      this.importResolver = options.importResolver || new ImportResolver({
        basePath: options.basePath || process.cwd(),
        cacheDir: options.cacheDir,
        offline: options.offline || false,
        debug: options.debug || false
      });
    }
  }

  /**
   * Parse content from a string with optional filename for context
   */
  parseContent(content: string, filename?: string): ParseResult {
    if (this.options.debug) {
      console.log('[DEBUG] parseContent method called with debug:', this.options.debug);
    }
    try {
      this.warnings = [];
      
      // 1. Handle imports if enabled
      let processedContent = content;
      let resolvedImports: Map<string, ResolvedImportInfo[]> | undefined;
      
      if (this.importResolver && this.options.enableImports !== false) {
        const importResult = this.resolveAndMergeImports(content, filename);
        processedContent = importResult.content;
        resolvedImports = importResult.resolvedImports;
      }
      
      // 2. Parse YAML
      const yamlData = yaml.load(processedContent);
      
      if (this.options.debug) {
        console.log('[UnifiedParser] Parsed YAML data:', JSON.stringify(yamlData, null, 2));
      }
      
      // 3. PRE-PROCESSING SCHEMA VALIDATION - validate original YAML structure
      if (this.options.debug) {
        console.log('[UnifiedParser] Starting pre-processing validation...');
        try {
          console.log('[UnifiedParser] About to run pre-processing validation on:', JSON.stringify(yamlData, null, 2));
        } catch (e: any) {
          console.log('[UnifiedParser] Error in debug logging:', e.message);
        }
      }
      
      let preSchemaErrors: string[] = [];
      try {
        preSchemaErrors = this.validateWithSchema(yamlData);
        if (this.options.debug) {
          console.log('[UnifiedParser] Pre-processing schema errors:', preSchemaErrors.length);
          if (preSchemaErrors.length > 0) {
            console.log('[UnifiedParser] Pre-processing errors details:', preSchemaErrors);
          }
        }
      } catch (e: any) {
        if (this.options.debug) {
          console.log('[UnifiedParser] Exception in pre-processing validation:', e.message);
        }
        preSchemaErrors = [`Pre-processing validation error: ${e.message}`];
      }
      if (preSchemaErrors.length > 0) {
        // Return early if original structure is invalid
        return {
          errors: preSchemaErrors,
          warnings: [...this.warnings]
        };
      }
      
      // 4. Process conventions (only if pre-validation passed)
      const ast = this.conventionProcessor.process(yamlData);
      
      // 5. Collect warnings from convention processor
      this.warnings.push(...this.conventionProcessor.getWarnings());
      
      // 6. Convert AST back to expanded YAML for post-processing validation
      const processedYamlString = this.astToExpandedYaml(ast);
      const processedYaml = yaml.load(processedYamlString);
      
      if (this.options.debug) {
        console.log('[UnifiedParser] Processed YAML string:', processedYamlString);
        console.log('[UnifiedParser] Processed YAML after convention processing:', JSON.stringify(processedYaml, null, 2));
      }
      
      // 7. POST-PROCESSING SCHEMA VALIDATION - validate expanded conventions
      if (this.options.debug) {
        console.log('[UnifiedParser] About to run post-processing validation on:', JSON.stringify(processedYaml, null, 2));
      }
      const postSchemaErrors = this.validateWithSchema(processedYaml);
      if (this.options.debug) {
        console.log('[UnifiedParser] Post-processing schema errors:', postSchemaErrors.length);
        if (postSchemaErrors.length > 0) {
          console.log('[UnifiedParser] Post-processing errors details:', postSchemaErrors);
        }
      }
      
      // 8. Semantic validation (if post-processing schema validation passes)
      let semanticErrors: string[] = [];
      if (postSchemaErrors.length === 0) {
        semanticErrors = this.validateSemantics(ast);
      }
      
      // 9. Return unified result
      return {
        ast,
        errors: [...postSchemaErrors, ...semanticErrors],
        warnings: [...this.warnings],
        resolvedImports
      };
      
    } catch (error: any) {
      return {
        errors: [error.message],
        warnings: [...this.warnings]
      };
    }
  }

  /**
   * Parse a file from the filesystem
   */
  parseFromFile(filePath: string): ParseResult {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      return this.parseContent(content, filePath);
    } catch (error) {
      return {
        errors: [`File reading error: ${(error as Error).message}`],
        warnings: []
      };
    }
  }

  /**
   * Parse YAML content directly (for compatibility)
   */
  parse(yamlContent: string, format?: 'specly' | 'yaml'): ParseResult {
    return this.parseContent(yamlContent);
  }

  /**
   * Parse .specly file specifically (for compatibility)
   */
  parseSpeclyFile(content: string): ParseResult {
    return this.parse(content, 'specly');
  }

  /**
   * Parse .yaml file specifically (for compatibility)
   */
  parseYamlFile(content: string): ParseResult {
    return this.parse(content, 'yaml');
  }

  /**
   * Process .specly content to expanded YAML format (for compatibility)
   */
  processToYaml(speclyContent: string): { yaml: string; errors: string[] } {
    const parseResult = this.parseSpeclyFile(speclyContent);
    
    if (parseResult.errors.length > 0) {
      return { yaml: '', errors: parseResult.errors };
    }
    
    if (!parseResult.ast) {
      return { yaml: '', errors: ['No AST generated'] };
    }
    
    // Convert AST back to expanded YAML format
    const expandedYaml = this.astToExpandedYaml(parseResult.ast);
    return { yaml: expandedYaml, errors: [] };
  }

  /**
   * Parse a file with import resolution (async version)
   */
  async parseFileWithImports(
    filePath: string,
    options?: Partial<ParseOptions>
  ): Promise<ParseResult> {
    // Merge options
    const resolveOptions = { ...this.options, ...options };
    
    // Read and parse the main file
    const fileContent = await this.readFile(filePath);
    const basePath = path.dirname(path.resolve(filePath));
    
    // Parse without import resolution first
    const parseResult = this.parseContent(fileContent, filePath);
    
    if (!parseResult.ast || !this.importResolver || resolveOptions.enableImports === false) {
      return parseResult;
    }

    // Resolve imports for each component
    const enhancedResult: ParseResult = {
      ...parseResult,
      resolvedImports: new Map()
    };

    for (const component of parseResult.ast.components) {
      if (component.imports && component.imports.length > 0) {
        const componentImports = await this.resolveComponentImports(
          component,
          basePath
        );
        
        enhancedResult.resolvedImports!.set(component.name, componentImports);
        
        // Merge imported types into the component
        if (componentImports.length > 0) {
          this.mergeImportedTypes(component, componentImports);
        }
      }
    }

    // Re-validate with resolved imports
    const validationErrors = this.validateWithResolvedImports(
      parseResult.ast,
      enhancedResult.resolvedImports!
    );
    
    if (validationErrors.length > 0) {
      enhancedResult.errors.push(...validationErrors);
    }

    return enhancedResult;
  }

  /**
   * Resolve imports for a component
   */
  private async resolveComponentImports(
    component: ComponentSpec,
    basePath: string
  ): Promise<ResolvedImportInfo[]> {
    if (!this.importResolver) {
      return [];
    }
    
    const resolvedImports: ResolvedImportInfo[] = [];

    for (const importSpec of component.imports || []) {
      try {
        if (this.options.debug) {
          console.log(`[UnifiedParser] Resolving import for ${component.name}:`, importSpec);
        }

        // Resolve the import
        const resolved = await this.importResolver.resolve(importSpec as ImportSpec, basePath);
        
        // Parse the imported content
        const importedAst = await this.parseImportedContent(
          resolved.content,
          resolved.contentType,
          resolved.path || resolved.url || 'imported'
        );

        // Extract selected types
        const { selectedTypes, foundOriginalTypes } = this.extractSelectedTypes(
          importedAst,
          importSpec.select || [],
          importSpec.as || {}
        );

        resolvedImports.push({
          importSpec: importSpec as ImportSpec,
          resolved,
          selectedTypes,
          foundOriginalTypes
        });

        if (this.options.debug) {
          console.log(`[UnifiedParser] Resolved ${selectedTypes.size} types from import`);
        }
      } catch (error: any) {
        console.error(`[UnifiedParser] Failed to resolve import:`, error.message);
        // Continue with other imports even if one fails
      }
    }

    return resolvedImports;
  }

  /**
   * Parse imported content
   */
  private async parseImportedContent(
    content: string,
    contentType: 'yaml' | 'json',
    source: string
  ): Promise<SpecVerseAST> {
    let parsed: any;

    if (contentType === 'json') {
      parsed = JSON.parse(content);
    } else {
      parsed = yaml.load(content) as any;
    }

    if (this.options.debug) {
      console.log(`[UnifiedParser] parseImportedContent - source: ${source}`);
      console.log(`[UnifiedParser] parseImportedContent - parsed keys:`, Object.keys(parsed));
      console.log(`[UnifiedParser] parseImportedContent - has exports:`, !!parsed.exports);
    }

    // Handle different import formats
    if (parsed.components) {
      // Full SpecVerse specification
      const result = this.parse(content);
      if (result.ast) {
        return result.ast;
      }
      // If parsing failed, log the errors for debugging
      if (this.options.debug && result.errors.length > 0) {
        console.log(`[UnifiedParser] Failed to parse imported content: ${result.errors.join(', ')}`);
      }
    } else if (parsed.exports) {
      // Library catalog format
      return await this.createAstFromLibraryCatalog(parsed, source);
    } else if (parsed.types) {
      // Type definitions file
      return this.createAstFromTypes(parsed.types);
    } else if (parsed.models || parsed.controllers || parsed.services || parsed.events || parsed.views) {
      // Partial component specification
      return this.createAstFromPartial(parsed);
    }

    // Fallback - treat as raw type definitions
    return this.createAstFromTypes(parsed);
  }

  /**
   * Create AST from type definitions
   */
  private createAstFromTypes(types: any): SpecVerseAST {
    const component: ComponentSpec = {
      name: 'imported-types',
      namespace: 'imported',
      version: '1.0.0',
      description: 'Imported type definitions',
      primitives: [],
      models: [],
      controllers: [],
      services: [],
      views: [],
      events: [],
      imports: [],
      exports: {}
    };

    // Convert type definitions to models
    for (const [typeName, typeDef] of Object.entries(types)) {
      if (typeof typeDef === 'object' && typeDef !== null) {
        component.models.push({
          name: typeName,
          description: (typeDef as any).description || `Imported type ${typeName}`,
          attributes: (typeDef as any).attributes || {},
          relationships: (typeDef as any).relationships || {},
          lifecycles: (typeDef as any).lifecycles || {},
          behaviors: (typeDef as any).behaviors || {}
        });
      }
    }

    return {
      components: [component],
      deployments: [],
      manifests: []
    };
  }

  /**
   * Create AST from partial component specification
   */
  private createAstFromPartial(partial: any): SpecVerseAST {
    const component: ComponentSpec = {
      name: 'imported-component',
      namespace: 'imported',
      version: '1.0.0',
      description: 'Imported component',
      primitives: partial.primitives || [],
      models: [],
      controllers: partial.controllers || [],
      services: partial.services || [],
      views: partial.views || [],
      events: partial.events || [],
      imports: [],
      exports: {}
    };

    // Convert models object to array format
    if (partial.models && typeof partial.models === 'object') {
      for (const [modelName, modelDef] of Object.entries(partial.models)) {
        if (typeof modelDef === 'object' && modelDef !== null) {
          component.models.push({
            name: modelName,
            description: (modelDef as any).description || `Model ${modelName}`,
            attributes: (modelDef as any).attributes || {},
            relationships: (modelDef as any).relationships || {},
            lifecycles: (modelDef as any).lifecycles || {},
            behaviors: (modelDef as any).behaviors || {}
          });
        }
      }
    }

    return {
      components: [component],
      deployments: [],
      manifests: []
    };
  }

  /**
   * Create AST from library catalog format
   */
  private async createAstFromLibraryCatalog(catalog: any, basePath: string): Promise<SpecVerseAST> {
    if (this.options.debug) {
      console.log(`[UnifiedParser] Creating AST from library catalog, basePath: ${basePath}`);
    }
    const component: ComponentSpec = {
      name: catalog.domain?.name || 'library-catalog',
      namespace: 'library',
      version: catalog.domain?.version || '1.0.0',
      description: catalog.domain?.description || 'Library catalog',
      primitives: [],
      models: [],
      controllers: [],
      services: [],
      views: [],
      events: [],
      imports: [],
      exports: {}
    };

    // Process exports from catalog
    if (catalog.exports) {
      for (const [category, categoryExports] of Object.entries(catalog.exports)) {
        if (typeof categoryExports === 'object' && categoryExports !== null) {
          for (const [exportName, exportInfo] of Object.entries(categoryExports as Record<string, any>)) {
            if (exportInfo && typeof exportInfo === 'object' && exportInfo.source && exportInfo.types) {
              try {
                // Resolve relative path from catalog location
                const catalogDir = basePath.endsWith('.yaml') || basePath.endsWith('.yml') 
                  ? path.dirname(basePath)
                  : basePath;
                const sourcePath = path.resolve(catalogDir, exportInfo.source);
                
                if (this.options.debug) {
                  console.log(`[UnifiedParser] Loading catalog source: ${sourcePath}`);
                }

                // Load the referenced source file
                const sourceContent = await fs.readFile(sourcePath, 'utf8');
                const sourceContentType = this.detectContentType(sourcePath, sourceContent);
                
                // Parse the source content
                const sourceAst = await this.parseImportedContent(sourceContent, sourceContentType, sourcePath);
                
                // Extract types from the source
                for (const sourceComponent of sourceAst.components) {
                  // Add models from source
                  for (const model of sourceComponent.models) {
                    if (exportInfo.types.includes(model.name)) {
                      component.models.push(model);
                    }
                  }
                  
                  // Add other types as needed
                  for (const primitive of sourceComponent.primitives || []) {
                    if (exportInfo.types.includes(primitive.name)) {
                      component.primitives.push(primitive);
                    }
                  }
                  
                  for (const controller of sourceComponent.controllers || []) {
                    if (exportInfo.types.includes(controller.name)) {
                      component.controllers.push(controller);
                    }
                  }
                  
                  for (const service of sourceComponent.services || []) {
                    if (exportInfo.types.includes(service.name)) {
                      component.services.push(service);
                    }
                  }
                  
                  for (const view of sourceComponent.views || []) {
                    if (exportInfo.types.includes(view.name)) {
                      component.views.push(view);
                    }
                  }
                  
                  for (const event of sourceComponent.events || []) {
                    if (exportInfo.types.includes(event.name)) {
                      component.events.push(event);
                    }
                  }
                }
              } catch (error: any) {
                if (this.options.debug) {
                  console.log(`[UnifiedParser] Failed to load catalog source ${exportInfo.source}: ${error.message}`);
                }
                // Continue with other exports even if one fails
              }
            }
          }
        }
      }
    }

    return {
      components: [component],
      deployments: [],
      manifests: []
    };
  }

  /**
   * Detect content type from path or content
   */
  private detectContentType(pathOrUrl: string, content: string): 'yaml' | 'json' {
    // Check file extension
    if (pathOrUrl.endsWith('.json')) return 'json';
    if (pathOrUrl.endsWith('.yaml') || pathOrUrl.endsWith('.yml') || pathOrUrl.endsWith('.specly')) return 'yaml';

    // Try to detect from content
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }

    // Default to YAML
    return 'yaml';
  }

  /**
   * Extract selected types from imported AST
   */
  private extractSelectedTypes(
    importedAst: SpecVerseAST,
    select: string[],
    aliases: Record<string, string>
  ): { selectedTypes: Map<string, any>, foundOriginalTypes: Set<string> } {
    const selectedTypes = new Map<string, any>();
    const foundOriginalTypes = new Set<string>();


    if (this.options.debug) {
      console.log(`[UnifiedParser] Extracting types from imported AST with ${importedAst.components.length} components`);
      for (const comp of importedAst.components) {
        console.log(`[UnifiedParser] Component ${comp.name} has primitives: ${comp.primitives?.map(p => p.name) || []}`);
        console.log(`[UnifiedParser] Component ${comp.name} has models: ${comp.models.map(m => m.name)}`);
        console.log(`[UnifiedParser] Component ${comp.name} has events: ${comp.events?.map(e => e.name) || []}`);
        console.log(`[UnifiedParser] Component ${comp.name} has controllers: ${comp.controllers?.map(c => c.name) || []}`);
      }
    }

    // If no select list, import everything
    if (select.length === 0) {
      for (const component of importedAst.components) {
        // Add all primitives
        for (const primitive of component.primitives || []) {
          const name = aliases[primitive.name] || primitive.name;
          selectedTypes.set(name, { type: 'primitive', definition: primitive });
          foundOriginalTypes.add(primitive.name);
        }
        // Add all models
        for (const model of component.models) {
          const name = aliases[model.name] || model.name;
          selectedTypes.set(name, { type: 'model', definition: model });
          foundOriginalTypes.add(model.name);
        }
        // Add all events
        for (const event of component.events || []) {
          const name = aliases[event.name] || event.name;
          selectedTypes.set(name, { type: 'event', definition: event });
          foundOriginalTypes.add(event.name);
        }
      }
      return { selectedTypes, foundOriginalTypes };
    }

    // Extract only selected types
    for (const typeName of select) {
      if (this.options.debug) {
        console.log(`[UnifiedParser] Looking for type: ${typeName}`);
      }
      
      let found = false;
      for (const component of importedAst.components) {
        
        // Check primitives first
        const primitive = (component.primitives || []).find((p: any) => p.name === typeName);
        if (primitive) {
          const name = aliases[typeName] || typeName;
          selectedTypes.set(name, { type: 'primitive', definition: primitive });
          foundOriginalTypes.add(typeName);
          found = true;
          if (this.options.debug) {
            console.log(`[UnifiedParser] Found primitive: ${typeName} as ${name}`);
          }
          break;
        }

        // Check models
        const model = component.models.find(m => m.name === typeName);
        if (model) {
          const name = aliases[typeName] || typeName;
          selectedTypes.set(name, { type: 'model', definition: model });
          foundOriginalTypes.add(typeName);
          found = true;
          if (this.options.debug) {
            console.log(`[UnifiedParser] Found model: ${typeName} as ${name}`);
          }
          break;
        }

        // Check events
        const event = (component.events || []).find(e => e.name === typeName);
        if (event) {
          const name = aliases[typeName] || typeName;
          selectedTypes.set(name, { type: 'event', definition: event });
          foundOriginalTypes.add(typeName);
          found = true;
          if (this.options.debug) {
            console.log(`[UnifiedParser] Found event: ${typeName} as ${name}`);
          }
          break;
        }

        // Check controllers
        const controller = (component.controllers || []).find(c => c.name === typeName);
        if (controller) {
          const name = aliases[typeName] || typeName;
          selectedTypes.set(name, { type: 'controller', definition: controller });
          foundOriginalTypes.add(typeName);
          found = true;
          if (this.options.debug) {
            console.log(`[UnifiedParser] Found controller: ${typeName} as ${name}`);
          }
          break;
        }

        // Check services
        const service = (component.services || []).find(s => s.name === typeName);
        if (service) {
          const name = aliases[typeName] || typeName;
          selectedTypes.set(name, { type: 'service', definition: service });
          foundOriginalTypes.add(typeName);
          found = true;
          if (this.options.debug) {
            console.log(`[UnifiedParser] Found service: ${typeName} as ${name}`);
          }
          break;
        }

        // Check views
        const view = (component.views || []).find(v => v.name === typeName);
        if (view) {
          const name = aliases[typeName] || typeName;
          selectedTypes.set(name, { type: 'view', definition: view });
          foundOriginalTypes.add(typeName);
          found = true;
          if (this.options.debug) {
            console.log(`[UnifiedParser] Found view: ${typeName} as ${name}`);
          }
          break;
        }
      }
      
      if (!found && this.options.debug) {
        console.log(`[UnifiedParser] Type not found: ${typeName}`);
      }
    }

    return { selectedTypes, foundOriginalTypes };
  }

  /**
   * Merge imported types into component
   */
  private mergeImportedTypes(
    component: ComponentSpec,
    imports: ResolvedImportInfo[]
  ): void {
    // Create a set of imported type names for tracking
    const importedTypeNames = new Set<string>();

    for (const importInfo of imports) {
      if (!importInfo.selectedTypes) continue;

      for (const [name, typeInfo] of importInfo.selectedTypes) {
        importedTypeNames.add(name);
        
        // Store import metadata on the component
        if (!component.importedTypes) {
          component.importedTypes = new Map();
        }
        
        component.importedTypes.set(name, {
          source: importInfo.resolved.url || importInfo.resolved.path || importInfo.resolved.packageName || 'unknown',
          type: typeInfo.type,
          definition: typeInfo.definition
        });
      }
    }

    // Update component metadata
    if (!component.metadata) {
      component.metadata = {};
    }
    component.metadata.importedTypes = Array.from(importedTypeNames);
  }

  /**
   * Validate with resolved imports
   */
  private validateWithResolvedImports(
    ast: SpecVerseAST,
    resolvedImports: Map<string, ResolvedImportInfo[]>
  ): string[] {
    const errors: string[] = [];

    for (const component of ast.components) {
      const componentImports = resolvedImports.get(component.name) || [];
      
      // Check that all selected types were found
      for (const importInfo of componentImports) {
        const requestedTypes = importInfo.importSpec.select || [];
        const foundTypes = importInfo.foundOriginalTypes || new Set<string>();
        
        for (const requested of requestedTypes) {
          if (!foundTypes.has(requested)) {
            errors.push(
              `Component ${component.name}: Type '${requested}' not found in import from '${
                importInfo.importSpec.from || importInfo.importSpec.file || importInfo.importSpec.package
              }'`
            );
          }
        }
      }
      
      // Validate import conflicts (prevent duplicate type definitions)
      errors.push(...this.validateImportConflicts(component, componentImports));
    }

    return errors;
  }

  /**
   * Validate import conflicts (prevent duplicate type definitions)
   * Checks if types imported from external files are redefined locally
   */
  private validateImportConflicts(component: ComponentSpec, componentImports: ResolvedImportInfo[]): string[] {
    const errors: string[] = [];
    
    // Collect all imported type names
    const importedTypes = new Set<string>();
    const importSources = new Map<string, string>(); // type name -> source file
    
    for (const importInfo of componentImports) {
      const importSpec = importInfo.importSpec;
      const sourceFile = importSpec.from || importSpec.file || importSpec.package || 'unknown';
      
      if (importSpec.select && Array.isArray(importSpec.select)) {
        for (const typeName of importSpec.select) {
          if (importedTypes.has(typeName)) {
            errors.push(`Component ${component.name}: Duplicate import: Type '${typeName}' is imported from multiple sources (${importSources.get(typeName)} and ${sourceFile})`);
          } else {
            importedTypes.add(typeName);
            importSources.set(typeName, sourceFile);
          }
        }
      }
    }
    
    // Check for conflicts between imported types and locally defined primitives
    const localPrimitiveNames = new Set((component.primitives || []).map((p: any) => p.name));
    for (const importedType of importedTypes) {
      if (localPrimitiveNames.has(importedType)) {
        errors.push(`Component ${component.name}: Import conflict: Type '${importedType}' is imported from ${importSources.get(importedType)} but also defined as a local primitive`);
      }
    }
    
    // Check for conflicts between imported types and locally defined entities
    // Derive entity type names from the component's own keys (covers any entity type, including extensions)
    const entityTypes = Object.keys(component).filter(k =>
      Array.isArray((component as any)[k]) && (component as any)[k].length > 0 && (component as any)[k][0]?.name
    );
    for (const entityType of entityTypes) {
      const localNames = new Set(((component as any)[entityType] || []).map((item: any) => item.name));
      for (const importedType of importedTypes) {
        if (localNames.has(importedType)) {
          const singular = entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
          errors.push(`Component ${component.name}: Import conflict: Type '${importedType}' is imported from ${importSources.get(importedType)} but also defined as a local ${singular}`);
        }
      }
    }
    
    return errors;
  }

  /**
   * Read file content
   */
  private async readFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    return fs.readFile(filePath, 'utf8');
  }

  /**
   * Resolve and merge imports (private method) - for sync parsing
   */
  private resolveAndMergeImports(content: string, filename?: string): {
    content: string;
    resolvedImports?: Map<string, ResolvedImportInfo[]>;
  } {
    // For synchronous parsing, we can't resolve imports
    // This is a limitation - imports require async processing
    if (this.options.debug) {
      console.log('[UnifiedParser] Import resolution requires async parsing - use parseFileWithImports() instead');
    }
    
    return {
      content,
      resolvedImports: new Map()
    };
  }

  /**
   * Validate with JSON Schema
   */
  private validateWithSchema(data: any): string[] {
    const errors: string[] = [];
    
    try {
      // Debug: check what schema we're compiling
      if (this.options.debug) {
        console.log('[UnifiedParser] Schema has $schema:', !!this.schema.$schema);
        console.log('[UnifiedParser] Schema keys:', Object.keys(this.schema));
      }
      
      // Compile schema each time (matches original parser behavior)
      const validate = this.schemaValidator.compile(this.schema);
      const valid = validate(data);
      
      if (!valid && validate.errors) {
        if (this.options.debug) {
          console.log('[UnifiedParser] Detailed AJV errors:', JSON.stringify(validate.errors, null, 2));
        }
        
        for (const error of validate.errors) {
          let path = error.instancePath || 'root';
          if (error.instancePath === '') {
            path = 'root';
          }
          
          let message = error.message || 'Unknown error';
          if (error.keyword === 'additionalProperties') {
            message = `Unknown property '${error.params?.additionalProperty}'`;
          }
          
          errors.push(`${path}: ${message}`);
        }
      }
    } catch (validationError: any) {
      errors.push(`Schema validation error: ${validationError.message}`);
    }
    
    return errors;
  }


  /**
   * Convert AST to expanded YAML format for tools (copied from original parser)
   */
  astToExpandedYaml(ast: SpecVerseAST): string {
    const result: any = {
      components: {},
      deployments: {},
      manifests: {}
    };

    // Convert components - preserve all properties for validation
    for (const component of ast.components) {
      // Start with basic component structure
      result.components[component.name] = {
        version: component.version,
        description: component.description,
        ...(component.tags && component.tags.length > 0 && { tags: component.tags }),
        ...(component.imports && component.imports.length > 0 && { import: component.imports }),
        ...(component.exports && Object.keys(component.exports).length > 0 && { export: component.exports })
      };
      
      // Add any additional properties (unknown ones) that were preserved
      const knownProps = new Set(['name', 'namespace', 'version', 'description', 'tags', 'imports', 'exports', 'primitives', 'models', 'controllers', 'services', 'views', 'events', 'commands', 'constraints']);
      Object.keys(component).forEach(key => {
        if (!knownProps.has(key)) {
          result.components[component.name][key] = (component as any)[key];
        }
      });

      // Add primitives - convert PrimitiveSpec array back to PrimitivesSection object format
      if (component.primitives && component.primitives.length > 0) {
        result.components[component.name].primitives = {};
        for (const primitive of component.primitives) {
          // Convert back to expanded PrimitiveDefinition format
          result.components[component.name].primitives[primitive.name] = {
            name: primitive.name,
            baseType: primitive.baseType,
            description: primitive.description,
            typeAlias: primitive.typeAlias,
            ...(primitive.required !== undefined && { required: primitive.required }),
            ...(primitive.unique !== undefined && { unique: primitive.unique }),
            ...(primitive.validation && Object.keys(primitive.validation).length > 0 && { validation: primitive.validation })
          };
        }
      }

      // Add models
      if (component.models && component.models.length > 0) {
        result.components[component.name].models = {};
        for (const model of component.models) {
          result.components[component.name].models[model.name] = {
            ...(model.description && { description: model.description }),
            ...(model.metadata && { metadata: model.metadata }), // v3.3+ metadata primitives
            attributes: {},
            ...(model.relationships.length > 0 && { relationships: {} }),
            ...(model.lifecycles.length > 0 && { lifecycles: {} }),
            ...(Object.keys(model.behaviors).length > 0 && { behaviors: model.behaviors })
          };

          // Expand attributes
          for (const attr of model.attributes) {
            result.components[component.name].models[model.name].attributes[attr.name] = {
              name: attr.name,
              type: attr.type,
              required: attr.required,
              unique: attr.unique,
              ...(attr.default !== undefined && { default: attr.default }),
              ...(attr.min !== undefined && { min: attr.min }),
              ...(attr.max !== undefined && { max: attr.max }),
              ...(attr.auto !== undefined && { auto: attr.auto }),
              ...(attr.values !== undefined && { values: attr.values })
            };
          }

          // Expand relationships
          for (const rel of model.relationships) {
            result.components[component.name].models[model.name].relationships[rel.name] = {
              name: rel.name,
              type: rel.type,
              target: rel.target,
              ...(rel.cascade && { cascade: rel.cascade }),
              ...(rel.eager && { eager: rel.eager }),
              ...(rel.through && { through: rel.through })
            };
          }

          // Expand lifecycles - output schema-compliant format
          for (const lifecycle of model.lifecycles) {
            if (lifecycle.type === 'shorthand') {
              // Convert back to flow format for schema compliance
              const flow = lifecycle.states.join(' -> ');
              result.components[component.name].models[model.name].lifecycles[lifecycle.name] = {
                flow: flow
              };
            } else if (lifecycle.type === 'structured') {
              // Convert structured format to schema-compliant transitions
              const transitions: { [key: string]: string } = {};
              if (lifecycle.transitions) {
                for (const [action, transition] of Object.entries(lifecycle.transitions)) {
                  transitions[action] = `${transition.from} -> ${transition.to}`;
                }
              }
              result.components[component.name].models[model.name].lifecycles[lifecycle.name] = {
                states: lifecycle.states,
                transitions: transitions
              };
            }
          }
        }
      }

      // Add controllers, services, events, views similarly...
      if (component.controllers && component.controllers.length > 0) {
        result.components[component.name].controllers = {};
        for (const controller of component.controllers) {
          result.components[component.name].controllers[controller.name] = {
            ...(controller.model && { model: controller.model }),
            ...(controller.path && { path: controller.path }),
            ...(controller.description && { description: controller.description }),
            ...(controller.subscriptions.events.length > 0 && { subscribes_to: controller.subscriptions.handlers }),
            ...(Object.keys(controller.cured).length > 0 && { cured: controller.cured }),
            ...(Object.keys(controller.actions).length > 0 && { actions: controller.actions })
          };
        }
      }

      if (component.services && component.services.length > 0) {
        result.components[component.name].services = {};
        for (const service of component.services) {
          result.components[component.name].services[service.name] = {
            ...(service.description && { description: service.description }),
            ...(service.subscriptions.events.length > 0 && { subscribes_to: service.subscriptions.handlers }),
            ...(Object.keys(service.operations).length > 0 && { operations: service.operations })
          };
        }
      }

      if (component.events && component.events.length > 0) {
        result.components[component.name].events = {};
        for (const event of component.events) {
          result.components[component.name].events[event.name] = {
            ...(event.description && { description: event.description }),
            attributes: {}
          };

          // Expand event attributes (same as model attributes)
          for (const attr of event.payload) {
            result.components[component.name].events[event.name].attributes[attr.name] = {
              name: attr.name,
              type: attr.type,
              required: attr.required,
              unique: attr.unique
            };
          }
        }
      }

      if (component.views && component.views.length > 0) {
        result.components[component.name].views = {};
        for (const view of component.views) {
          result.components[component.name].views[view.name] = {
            ...(view.description && { description: view.description }),
            ...(view.type && { type: view.type }),
            ...(view.model && { model: view.model }),
            ...(view.tags && view.tags.length > 0 && { tags: view.tags }),
            ...(view.export !== undefined && { export: view.export }),
            ...(view.layout && { layout: view.layout }),
            ...(view.subscriptions.events.length > 0 && { subscribes_to: view.subscriptions.handlers }),
            ...(Object.keys(view.uiComponents).length > 0 && { uiComponents: view.uiComponents }),
            ...(Object.keys(view.properties).length > 0 && { properties: view.properties })
          };
        }
      }

      // Add commands back as object format (convert from CommandSpec[] to {name: def})
      if (component.commands && (component.commands as any[]).length > 0) {
        result.components[component.name].commands = {};
        for (const cmd of component.commands as any[]) {
          const { name: cmdName, ...cmdDef } = cmd;
          result.components[component.name].commands[cmdName] = cmdDef;
        }
      }
    }

    // Convert deployments - preserve all properties for validation
    for (const deployment of ast.deployments) {
      const { name, namespace, ...deploymentProps } = deployment;
      result.deployments[deployment.name] = deploymentProps;
    }

    // Convert manifests - preserve all properties for validation (keep name property)
    for (const manifest of ast.manifests) {
      const { namespace, ...manifestProps } = manifest;
      result.manifests[manifest.name] = manifestProps;
    }

    return yaml.dump(result, { 
      indent: 2, 
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false
    });
  }

  /**
   * Get component type information (for compatibility)
   */
  getComponentTypes(ast: SpecVerseAST): ComponentTypeInfo[] {
    return ast.components.map(component => ({
      name: component.name,
      version: component.version || '1.0.0',
      models: new Set((component.models || []).map(m => m.name)),
      controllers: new Set((component.controllers || []).map(c => c.name)),
      services: new Set((component.services || []).map(s => s.name)),
      views: new Set((component.views || []).map(v => v.name)),
      events: new Set((component.events || []).map(e => e.name)),
      exports: component.exports || {}
    }));
  }

  /**
   * Enable imports dynamically
   */
  enableImports(options?: Partial<ParseOptions>): void {
    this.options.enableImports = true;
    if (options) {
      Object.assign(this.options, options);
    }
    
    if (!this.importResolver) {
      this.importResolver = new ImportResolver({
        basePath: this.options.basePath || process.cwd(),
        cacheDir: this.options.cacheDir,
        offline: this.options.offline || false,
        debug: this.options.debug || false
      });
    }
  }

  /**
   * Disable imports dynamically
   */
  disableImports(): void {
    this.options.enableImports = false;
  }

  /**
   * Get import resolver instance (for compatibility)
   */
  getImportResolver(): ImportResolver | undefined {
    return this.importResolver;
  }

  /**
   * Get current options
   */
  getOptions(): ParseOptions {
    return { ...this.options };
  }

  /**
   * Format validation errors for display
   */
  formatErrors(errors: string[]): string {
    if (errors.length === 0) {
      return 'No errors found.';
    }
    
    return `Found ${errors.length} error(s):\n` + 
           errors.map((err, i) => `  ${i + 1}. ${err}`).join('\n');
  }

  /**
   * Get available model names (for IDE support)
   */
  getModelNames(ast: SpecVerseAST): string[] {
    const modelNames: string[] = [];
    for (const component of ast.components) {
      modelNames.push(...(component.models || []).map((m: any) => m.name));
    }
    return modelNames;
  }

  /**
   * Get available event names (for IDE support)
   */
  getEventNames(ast: SpecVerseAST): string[] {
    const eventNames: string[] = [];
    for (const component of ast.components) {
      eventNames.push(...(component.events || []).map((e: any) => e.name));
    }
    return eventNames;
  }

  /**
   * Get lifecycle actions for a model (for IDE support)
   */
  getLifecycleActions(ast: SpecVerseAST, modelName: string): { [lifecycle: string]: string[] } {
    for (const component of ast.components) {
      const model = component.models.find((m: any) => m.name === modelName);
      if (model) {
        const result: { [lifecycle: string]: string[] } = {};
        for (const lifecycle of model.lifecycles) {
          result[lifecycle.name] = lifecycle.actions;
        }
        return result;
      }
    }
    return {};
  }

  // =============================================================================
  // SEMANTIC VALIDATION SYSTEM
  // =============================================================================

  /**
   * Semantic validation rules — data-driven cross-entity constraints.
   * Each rule defines what to check without hardcoding entity type names.
   */
  private static readonly SEMANTIC_RULES: Array<{
    name: string;
    validate: (component: ComponentSpec, importedTypes: Set<string>) => string[];
  }> = [
    {
      name: 'controller-model-connections',
      validate: (component, _importedTypes) => {
        const errors: string[] = [];
        const modelNames = new Set((component.models || []).map((m: any) => m.name));
        for (const controller of (component.controllers || [])) {
          if (!controller.model) {
            errors.push(`Component ${component.name}: Controller ${controller.name} missing required model reference`);
          } else if (!modelNames.has(controller.model)) {
            errors.push(`Component ${component.name}: Controller ${controller.name} references non-existent model ${controller.model}`);
          }
        }
        return errors;
      }
    },
    {
      name: 'subscription-targets',
      validate: (component, _importedTypes) => {
        const errors: string[] = [];
        const eventNames = new Set((component.events || []).map((e: any) => e.name));
        // Check subscriptions on any entity type that has them
        const subscriberTypes: Array<{ items: any[]; typeName: string }> = [
          { items: component.controllers || [], typeName: 'Controller' },
          { items: component.services || [], typeName: 'Service' },
          { items: component.views || [], typeName: 'View' },
        ];
        for (const { items, typeName } of subscriberTypes) {
          for (const item of items) {
            for (const event of (item.subscriptions?.events || [])) {
              if (!eventNames.has(event)) {
                errors.push(`Component ${component.name}: ${typeName} ${item.name} subscribes to unknown event ${event}`);
              }
            }
          }
        }
        return errors;
      }
    },
    {
      name: 'relationship-targets',
      validate: (component, importedTypes) => {
        const errors: string[] = [];
        const localTypes = new Set((component.models || []).map((m: any) => m.name));
        for (const model of (component.models || [])) {
          for (const relationship of (model.relationships || [])) {
            const target = relationship.target;
            if (target && !target.includes('.')) {
              if (!localTypes.has(target) && !importedTypes.has(target)) {
                errors.push(`Component ${component.name}: Model ${model.name} relationship ${relationship.name} targets non-existent model ${target}`);
              }
            }
          }
        }
        return errors;
      }
    },
  ];

  /**
   * Perform semantic validation on the parsed AST
   */
  private validateSemantics(ast: SpecVerseAST): string[] {
    const errors: string[] = [];

    for (const component of ast.components) {
      const importedTypes = this.buildImportedTypesSet(component);
      for (const rule of UnifiedSpecVerseParser.SEMANTIC_RULES) {
        errors.push(...rule.validate(component, importedTypes));
      }
    }

    return errors;
  }

  /**
   * Build set of imported types available to a component
   */
  private buildImportedTypesSet(component: ComponentSpec): Set<string> {
    const importedTypes = new Set<string>();
    
    for (const importDef of component.imports || []) {
      for (const typeName of importDef.select || []) {
        importedTypes.add(typeName);
      }
    }
    
    return importedTypes;
  }
}

// =============================================================================
// BACKWARD COMPATIBILITY LAYER
// =============================================================================

// Backward compatibility exports removed - use UnifiedSpecVerseParser directly