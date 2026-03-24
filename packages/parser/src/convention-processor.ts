/**
 * SpecVerse v3.1 Convention Processor
 *
 * Processes YAML + conventions into structured AST
 * Handles v3.1 container format with namespaces and "name: Type modifiers" patterns
 *
 * Convention processors are discovered from entity modules via the entity registry.
 * Each entity module provides its own processor; this class orchestrates them.
 */

import {
  PrimitiveSpec,
  ComponentSpec,
  ManifestSpec,
  SpecVerseAST,
  ExpandedConstraint
} from './types/ast.js';

import { ProcessorContext } from '@specverse/types';
import type { EntityConventionProcessor } from '@specverse/types';
import { bootstrapEntityModules, getEntityRegistry, BehaviouralConventionProcessor } from '@specverse/engine-entities';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, realpathSync } from 'fs';

export class ConventionProcessor implements ProcessorContext {
  public warnings: string[] = [];

  private entityProcessors: Map<string, EntityConventionProcessor>;
  private behaviouralProcessor: BehaviouralConventionProcessor;
  // Entity type names derived from registered processors (not hardcoded)
  private componentEntityTypes: string[];

  constructor() {
    // Bootstrap entity modules and discover convention processors from registry
    bootstrapEntityModules();
    this.entityProcessors = getEntityRegistry().getConventionProcessors();
    // Derive component entity types from registered convention processors.
    // Filter to types that have completed schema integration (in root.schema.json
    // ComponentsContainer and in ComponentSpec AST type). Top-level types (deployments)
    // and extension types not yet in the component schema (conventions, measures) are excluded.
    const COMPONENT_ENTITY_TYPES = new Set(['models', 'controllers', 'services', 'views', 'events', 'commands']);
    this.componentEntityTypes = Array.from(this.entityProcessors.keys())
      .filter(name => COMPONENT_ENTITY_TYPES.has(name));

    // Load behavioural convention grammars from entity modules
    this.behaviouralProcessor = new BehaviouralConventionProcessor();
    try {
      const thisDir = dirname(fileURLToPath(import.meta.url));

      // Path 1: specverse-lang layout (src/parser/../entities)
      let entitiesDir = resolve(thisDir, '..', 'entities');
      if (!existsSync(entitiesDir)) {
        // Path 2: specverse-engines layout (via @specverse/engine-entities package)
        const symlinkPath = resolve(thisDir, '..', '..', '..', 'node_modules', '@specverse', 'engine-entities');
        if (existsSync(symlinkPath)) {
          entitiesDir = resolve(realpathSync(symlinkPath), 'src');
        }
      }

      this.behaviouralProcessor.loadGrammarsFromEntities(entitiesDir);
    } catch {
      // Grammars are optional — not available in all contexts (packaged builds, test environments)
    }
  }
  
  /**
   * Get accumulated warnings
   */
  getWarnings(): string[] {
    return this.warnings;
  }

  /**
   * Clear accumulated warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Add a warning
   */
  addWarning(message: string): void {
    this.warnings.push(message);
  }

  /**
   * Main processing entry point for v3.1 container format
   */
  process(yamlData: any): SpecVerseAST {
    const result: SpecVerseAST = {
      components: [],
      deployments: [],
      manifests: []
    };

    // Process components section (v3.1 container format only)
    if (yamlData.components) {
      for (const [componentName, componentData] of Object.entries(yamlData.components)) {
        result.components.push(this.processComponent(componentName, componentData as any));
      }
    }

    // Process deployments section via entity registry
    if (yamlData.deployments) {
      const deploymentsProcessor = this.entityProcessors.get('deployments');
      if (deploymentsProcessor) {
        const deployments = deploymentsProcessor.process(yamlData.deployments, this);
        result.deployments.push(...deployments);
      }
    }

    // Process manifests section
    if (yamlData.manifests) {
      for (const [manifestName, manifestData] of Object.entries(yamlData.manifests)) {
        result.manifests.push(this.processManifest(manifestName, manifestData as any));
      }
    }

    return result;
  }

  /**
   * Process a single component
   */
  private processComponent(componentName: string, componentData: any): ComponentSpec {
    // Known valid properties for components (static props + entity types from registry)
    const validProperties = [
      'version', 'description', 'tags', 'import', 'export', 'primitives',
      'constraints',
      ...this.componentEntityTypes
    ];
    
    // Check for unknown properties and warn about them
    const unknownProperties = Object.keys(componentData).filter(
      key => !validProperties.includes(key)
    );
    
    if (unknownProperties.length > 0) {
      this.warnings.push(
        `Component '${componentName}' contains unknown properties that will be preserved for validation: ${unknownProperties.join(', ')}`
      );
    }
    
    // Process known properties but also preserve unknown ones for schema validation
    const processedComponent: any = {
      name: componentName,
      namespace: componentName, // For now, name = namespace
      version: componentData.version,
      description: componentData.description,
      tags: componentData.tags || [],
      imports: componentData.import || [],
      exports: componentData.export || {},
      primitives: this.processPrimitives(componentData.primitives || {}),
    };

    // Process each component section via entity registry convention processors.
    // Core types (models, controllers, etc.) default to [] when absent.
    // Extension types (commands) are only included when present in the source.
    const CORE_DEFAULTS = new Set(['models', 'controllers', 'services', 'views', 'events']);
    for (const entityType of this.componentEntityTypes) {
      if (componentData[entityType]) {
        const processor = this.entityProcessors.get(entityType);
        if (processor) {
          processedComponent[entityType] = processor.process(componentData[entityType], this);
        }
      } else if (CORE_DEFAULTS.has(entityType)) {
        processedComponent[entityType] = [];
      }
      // Extension types omitted when not present — avoids schema type mismatches
    }
    
    // Process behavioural constraints into expanded Quint specifications
    if (componentData.constraints && Array.isArray(componentData.constraints)) {
      const expandedConstraints: ExpandedConstraint[] = [];
      for (const constraint of componentData.constraints) {
        const result = this.behaviouralProcessor.expand(constraint);
        if (result) {
          expandedConstraints.push(result);
        } else {
          this.warnings.push(
            `Component '${componentName}': Unrecognized constraint "${constraint}". No matching behavioural convention found.`
          );
        }
      }
      processedComponent.constraints = expandedConstraints;
    }

    // Add any unknown properties to be caught by schema validation
    unknownProperties.forEach(prop => {
      (processedComponent as any)[prop] = componentData[prop];
    });

    return processedComponent;
  }

  /**
   * Process a single manifest
   */
  private processManifest(manifestName: string, manifestData: any): ManifestSpec {
    // Preserve all manifest properties as-is for diagram generation
    return {
      name: manifestName,
      namespace: manifestName, // For now, name = namespace
      ...manifestData
    };
  }

  /**
   * Process types section with convention expansion
   * "ProductCode: String pattern='^[A-Z]{3}-\\d{4}$'" -> Full type model
   */
  private processPrimitives(primitivesData: any): PrimitiveSpec[] {
    const primitives: PrimitiveSpec[] = [];
    
    for (const [typeName, definition] of Object.entries(primitivesData)) {
      if (typeof definition === 'string') {
        // Parse convention: "String pattern='^[A-Z]{3}-\\d{4}$' description='Product code'"
        const expanded = this.parsePrimitiveConvention(typeName, definition as string);
        primitives.push(expanded);
      } else if (typeof definition === 'object') {
        // Already expanded format
        primitives.push({
          name: typeName,
          baseType: (definition as any).baseType || 'String',
          description: (definition as any).description || `Custom type: ${typeName}`,
          typeAlias: true,
          required: (definition as any).required,
          unique: (definition as any).unique,
          validation: (definition as any).validation
        });
      }
    }
    
    return primitives;
  }

  /**
   * Parse type convention string
   * "String pattern='^[A-Z]{3}-\\d{4}$' required description='Product code'"
   */
  private parsePrimitiveConvention(name: string, convention: string): PrimitiveSpec {
    const parts = this.smartSplit(convention.trim());
    const baseType = parts[0] as 'String' | 'Integer' | 'Number' | 'Boolean';
    const modifiers = parts.slice(1);
    
    const spec: PrimitiveSpec = {
      name,
      baseType,
      description: `Custom type: ${name}`,
      validation: {},
      typeAlias: true
    };
    
    // Data-driven primitive modifier definitions
    const BOOL_MODS: Record<string, { target: 'spec' | 'validation'; field: string; value: boolean }> = {
      'required': { target: 'spec', field: 'required', value: true },
      'unique':   { target: 'spec', field: 'unique', value: true },
    };
    const KV_MODS: Record<string, { target: 'spec' | 'validation'; field: string; parse: 'string' | 'quoted' | 'number' | 'array' }> = {
      'pattern':     { target: 'validation', field: 'pattern', parse: 'quoted' },
      'values':      { target: 'validation', field: 'values', parse: 'array' },
      'min':         { target: 'validation', field: 'min', parse: 'number' },
      'max':         { target: 'validation', field: 'max', parse: 'number' },
      'format':      { target: 'validation', field: 'format', parse: 'string' },
      'description': { target: 'spec', field: 'description', parse: 'quoted' },
    };

    for (const modifier of modifiers) {
      // Boolean modifiers (exact keyword)
      const boolMod = BOOL_MODS[modifier];
      if (boolMod) {
        const obj = boolMod.target === 'spec' ? spec : spec.validation!;
        (obj as any)[boolMod.field] = boolMod.value;
        continue;
      }

      // Key=value modifiers
      const eqIndex = modifier.indexOf('=');
      if (eqIndex > 0) {
        const key = modifier.substring(0, eqIndex);
        const kvMod = KV_MODS[key];
        if (kvMod) {
          const obj = kvMod.target === 'spec' ? spec : spec.validation!;
          switch (kvMod.parse) {
            case 'string':  (obj as any)[kvMod.field] = modifier.split('=')[1]; break;
            case 'quoted':  (obj as any)[kvMod.field] = this.parseQuotedValue(modifier); break;
            case 'number':  (obj as any)[kvMod.field] = parseFloat(modifier.split('=')[1]); break;
            case 'array':   (obj as any)[kvMod.field] = this.parseArrayValue(modifier); break;
          }
        }
      }
    }
    
    return spec;
  }

  /**
   * Smart split that respects brackets and quotes
   * "String values=['a', 'b', 'c'] required" -> ["String", "values=['a', 'b', 'c']", "required"]
   */
  private smartSplit(text: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inBrackets = 0;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prevChar = i > 0 ? text[i - 1] : '';
      
      // Handle quotes
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        }
      }
      
      // Handle brackets (only when not in quotes)
      if (!inQuotes) {
        if (char === '[') inBrackets++;
        if (char === ']') inBrackets--;
      }
      
      // Split on whitespace only when not in brackets or quotes
      if (char.match(/\s/) && !inQuotes && inBrackets === 0) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    // Add the last part
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    return parts;
  }

  /**
   * Parse quoted value from modifier: pattern="value" -> "value"
   */
  private parseQuotedValue(modifier: string): string {
    // First try double quotes
    const doubleQuoteMatch = modifier.match(/="([^\"]*)"/);
    if (doubleQuoteMatch) {
      return doubleQuoteMatch[1];
    }
    
    // Then try single quotes  
    const singleQuoteMatch = modifier.match(/='([^']*)'/);
    if (singleQuoteMatch) {
      return singleQuoteMatch[1];
    }
    
    // No quotes, return the value after =
    return modifier.split('=')[1];
  }

  /**
   * Parse array value from modifier: values=["a","b","c"] -> ["a","b","c"]
   */
  private parseArrayValue(modifier: string): string[] {
    const match = modifier.match(/=\[([^\]]*)\]/);
    if (match) {
      const content = match[1].trim();
      // If empty brackets [], return empty array
      if (!content) {
        return [];
      }
      return content.split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
    }
    return [];
  }
}
