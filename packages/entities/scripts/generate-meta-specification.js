#!/usr/bin/env node

/**
 * Generate the SpecVerse Meta-Specification from JSON Schema
 * 
 * This script auto-generates examples/05-meta/05-01-specverse-meta-specification.specly
 * by analyzing the SPECVERSE-V3.1-SCHEMA.json and creating a self-describing specification.
 * 
 * Usage: node scripts/generate-meta-specification.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Default: use caller's working directory
const projectRoot = process.cwd();
const _args = process.argv.slice(2);

// File paths (accept positional args or use cwd-relative defaults)
const SCHEMA_PATH = _args[0] || path.join(projectRoot, 'schema', 'SPECVERSE-SCHEMA.json');
const OUTPUT_PATH = _args[1] || path.join(projectRoot, 'examples', '05-meta', '05-01-specverse-meta-specification.specly');
const BACKUP_PATH = OUTPUT_PATH + '.backup';

// Generation metadata (no timestamp to avoid constant changes)
const GENERATION_HEADER = `# Auto-generated SpecVerse Meta-Specification
# Generated from: schema/SPECVERSE-SCHEMA.json
# 
# This file is auto-generated. Manual edits will be overwritten.
# To modify the meta-specification, update the generator script:
# scripts/generate-meta-specification.js

`;

class MetaSpecificationGenerator {
  constructor() {
    this.schema = null;
    this.models = new Map();
    this.controllers = new Map();
    this.events = new Map();
  }

  async generate() {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('🔧 Generating SpecVerse Meta-Specification...');
    
    // Backup existing file
    if (fs.existsSync(OUTPUT_PATH)) {
      fs.copyFileSync(OUTPUT_PATH, BACKUP_PATH);
      if (verbose) console.log(`📄 Backed up existing file to ${path.basename(BACKUP_PATH)}`);
    }

    // Load and parse schema
    this.loadSchema();
    
    // Generate models from schema definitions
    this.generateModels();
    
    // Generate controllers from processing operations
    this.generateControllers();
    
    // Generate events from workflow operations
    this.generateEvents();
    
    // Build complete specification
    const specification = this.buildSpecification();
    
    // Write output
    this.writeSpecification(specification);
    
    // Validate the generated specification
    await this.validateSpecification();
    
    if (verbose) {
      console.log('✅ Meta-specification generated successfully!');
      console.log(`📍 Output: ${path.relative(projectRoot, OUTPUT_PATH)}`);
    }
  }

  loadSchema() {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('📖 Loading JSON Schema...');
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
    this.schema = JSON.parse(schemaContent);
    if (verbose) console.log(`📊 Schema loaded: ${this.schema.title} (${this.schema.$id})`);
  }

  generateModels() {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('🏗️ Generating models from schema definitions...');
    
    const defs = this.schema.$defs || {};
    let modelCount = 0;

    // Core container models
    this.addModel('Component', {
      description: 'Root container for a SpecVerse specification',
      attributes: {
        name: 'String required',
        version: 'String required',
        description: 'String required',
        tags: 'String'
      }
    });

    // Generate models from schema definitions
    for (const [defName, defSchema] of Object.entries(defs)) {
      if (this.shouldGenerateModel(defName, defSchema)) {
        const model = this.schemaToModel(defName, defSchema);
        if (model) {
          this.addModel(defName, model);
          modelCount++;
        }
      }
    }

    // Add core language models
    this.addCoreLanguageModels();
    
    if (verbose) console.log(`📦 Generated ${modelCount} models from schema definitions`);
  }

  shouldGenerateModel(name, schema) {
    // Skip technical/internal schemas
    const skipPatterns = [
      /Pattern$/,
      /String$/,
      /Version$/,
      /Container$/,
      /Section$/
    ];
    
    return schema.type === 'object' && 
           !skipPatterns.some(pattern => pattern.test(name)) &&
           schema.properties;
  }

  schemaToModel(name, schema) {
    const attributes = {};
    
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        attributes[propName] = this.schemaPropertyToAttribute(propSchema, schema.required?.includes(propName));
      }
    }

    return {
      description: schema.description || `${name} definition from SpecVerse schema`,
      attributes
    };
  }

  schemaPropertyToAttribute(propSchema, isRequired = false) {
    let type = 'String';
    let modifiers = [];

    // Determine base type
    if (propSchema.$ref) {
      const refType = propSchema.$ref.split('/').pop();
      type = this.mapSchemaRefToSpecVerseType(refType);
    } else if (propSchema.type === 'integer') {
      type = 'Integer';
    } else if (propSchema.type === 'boolean') {
      type = 'Boolean';
    } else if (propSchema.type === 'array') {
      type = 'String'; // Arrays are stored as strings in this meta-model
    }

    // Add modifiers
    if (isRequired) {
      modifiers.push('required');
    }

    if (propSchema.enum) {
      modifiers.push(`values=[${propSchema.enum.map(v => `"${v}"`).join(', ')}]`);
    }

    if (propSchema.default !== undefined) {
      modifiers.push(`default=${propSchema.default}`);
    }

    return modifiers.length > 0 ? `${type} ${modifiers.join(' ')}` : type;
  }

  mapSchemaRefToSpecVerseType(refType) {
    const typeMap = {
      'SemanticVersion': 'String',
      'NamespaceString': 'String',
      'DateTime': 'DateTime',
      'UUID': 'UUID',
      'URL': 'URL'
    };
    return typeMap[refType] || 'String';
  }

  addCoreLanguageModels() {
    // Add models that represent SpecVerse language concepts
    this.addModel('Model', {
      description: 'Business entity or data structure definition',
      attributes: {
        name: 'String required',
        description: 'String required',
        modelType: 'String values=["Entity", "ValueObject", "Aggregate"]'
      }
    });

    this.addModel('Attribute', {
      description: 'Model property definition',
      attributes: {
        name: 'String required',
        type: 'String required',
        required: 'Boolean default=false',
        description: 'String',
        constraints: 'String',
        defaultValue: 'String'
      }
    });

    this.addModel('Controller', {
      description: 'Handles operations on specifications',
      attributes: {
        name: 'String required',
        description: 'String required',
        model: 'String required'
      }
    });

    this.addModel('Action', {
      description: 'Operation that can be performed by a controller',
      attributes: {
        name: 'String required',
        description: 'String required',
        httpMethod: 'String values=["GET", "POST", "PUT", "PATCH", "DELETE"]'
      }
    });

    this.addModel('Event', {
      description: 'Notification about specification state changes',
      attributes: {
        name: 'String required',
        description: 'String required',
        eventType: 'String required values=["Created", "Updated", "Validated", "Published", "Deprecated"]'
      }
    });

    this.addModel('View', {
      description: 'Representation of specification data',
      attributes: {
        name: 'String required',
        baseModel: 'String required',
        format: 'String values=["JSON", "YAML", "HTML", "Markdown"]'
      }
    });
  }

  addModel(name, model) {
    this.models.set(name, model);
  }

  generateControllers() {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('🎮 Generating controllers for specification processing...');

    this.addController('SpecificationParser', {
      description: 'Parses SpecVerse YAML and Specly DSL into AST',
      model: 'Component',
      actions: {
        parseComponent: {
          description: 'Parse a Component specification',
          parameters: {
            sourceContent: 'String required',
            sourceFormat: 'String required values=["YAML", "Specly"]'
          },
          returns: 'String',
          requires: ['Source content is valid syntax', 'Source format is supported'],
          ensures: ['AST is generated', 'Syntax errors are captured'],
          publishes: ['ComponentParsed', 'ParseError']
        }
      }
    });

    this.addController('SpecificationValidator', {
      description: 'Validates specifications against schema and business rules',
      model: 'Component',
      actions: {
        validateComponent: {
          description: 'Validate a complete component specification',
          parameters: {
            componentAST: 'String required',
            schemaVersion: 'String required'
          },
          returns: 'String',
          requires: ['AST is well-formed', 'Schema version is supported'],
          ensures: ['All references are resolved', 'Business rules are enforced'],
          publishes: ['ValidationCompleted']
        }
      }
    });

    this.addController('SpecificationProcessor', {
      description: 'Processes Specly format to expanded YAML representation',
      model: 'Component',
      actions: {
        processToYaml: {
          description: 'Process Specly DSL to expanded YAML format',
          parameters: {
            speclyContent: 'String required'
          },
          returns: 'String',
          requires: ['Specly content follows grammar rules'],
          ensures: ['YAML output includes all expansions', 'All information is preserved'],
          publishes: ['ProcessingCompleted']
        }
      }
    });

    if (verbose) console.log(`🎮 Generated ${this.controllers.size} controllers`);
  }

  addController(name, controller) {
    this.controllers.set(name, controller);
  }

  generateEvents() {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('📡 Generating events for specification workflows...');

    this.addEvent('ComponentParsed', {
      description: 'A SpecVerse component was successfully parsed',
      attributes: {
        componentName: 'String required',
        sourceFormat: 'String required values=["YAML", "Specly"]',
        parseTime: 'DateTime required',
        astNodeCount: 'Integer required'
      }
    });

    this.addEvent('ValidationCompleted', {
      description: 'Component validation process finished',
      attributes: {
        componentName: 'String required',
        validationStatus: 'String required values=["Valid", "Invalid"]',
        errorCount: 'Integer required',
        warningCount: 'Integer required'
      }
    });

    this.addEvent('ProcessingCompleted', {
      description: 'Specly processing to YAML completed successfully',
      attributes: {
        componentName: 'String required',
        processingTime: 'DateTime required',
        expandedElements: 'Integer required'
      }
    });

    this.addEvent('ParseError', {
      description: 'Syntax error encountered during parsing',
      attributes: {
        sourceFormat: 'String required',
        errorMessage: 'String required',
        lineNumber: 'Integer',
        columnNumber: 'Integer',
        errorCode: 'String required'
      }
    });

    if (verbose) console.log(`📡 Generated ${this.events.size} events`);
  }

  addEvent(name, event) {
    this.events.set(name, event);
  }

  buildSpecification() {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('🔧 Building complete specification...');

    const spec = {
      components: {
        SpecVerseLanguageSpecification: {
          version: '"5.0.0"',
          description: '"The SpecVerse specification language meta-model - auto-generated from JSON Schema"',

          // Using built-in primitive types - no imports needed

          export: {
            models: Array.from(this.models.keys()),
            controllers: Array.from(this.controllers.keys()),
            events: Array.from(this.events.keys())
          },

          models: Object.fromEntries(this.models),
          controllers: Object.fromEntries(this.controllers),
          events: Object.fromEntries(this.events)
        }
      },
      manifests: {
        SpecVerseLanguageManifest: {
          specVersion: '"3.1.0"',
          name: '"SpecVerseLanguageManifest"',
          description: '"Implementation manifest for SpecVerse language processing"',
          version: '"5.0.0"',

          component: {
            componentSource: '"SpecVerseLanguageSpecification"',
            componentVersion: '"^3.1.0"',
            description: '"Reference to the SpecVerse language specification component"'
          },

          implementationTypes: {
            SpecParser: {
              type: '"service"',
              technology: '"typescript"',
              framework: '"nodejs"'
            },

            SchemaValidator: {
              type: '"service"',
              technology: '"ajv"',
              framework: '"json-schema"'
            },

            YamlProcessor: {
              type: '"service"',
              technology: '"js-yaml"',
              framework: '"nodejs"'
            }
          },

          behaviorMappings: [
            {
              modelName: '"Component"',
              behaviorName: '"validate"',
              implementationMethod: '"validateComponent"',
              implementationPath: '"src/parser/component-validator.ts"',
              description: '"Validate component structure and schema compliance"'
            },
            {
              modelName: '"Model"',
              behaviorName: '"process"',
              implementationMethod: '"processModel"',
              implementationPath: '"src/parser/model-processor.ts"',
              description: '"Process model definitions and relationships"'
            }
          ],

          capabilityMappings: [
            {
              capability: '"parsing.*"',
              implementationType: '"SpecParser"'
            },
            {
              capability: '"validation.*"',
              implementationType: '"SchemaValidator"'
            }
          ],

          communicationChannels: [
            {
              channelName: '"cli"',
              implementationType: '"SpecParser"',
              namespace: '"command-line"',
              capabilities: ['"parsing.*"', '"validation.*"']
            },
            {
              channelName: '"api"',
              implementationType: '"YamlProcessor"',
              namespace: '"programmatic"',
              capabilities: ['"processing.*"', '"generation.*"']
            }
          ]
        }
      },
      deployments: {}
    };

    return spec;
  }

  buildSpeclyOutput(spec) {
    let output = GENERATION_HEADER;
    
    output += 'components:\n';
    output += '  SpecVerseLanguageSpecification:\n';
    output += `    version: ${spec.components.SpecVerseLanguageSpecification.version}\n`;
    output += `    description: ${spec.components.SpecVerseLanguageSpecification.description}\n`;
    output += '\n';

    // Import section (if needed)
    const importDefs = spec.components.SpecVerseLanguageSpecification.import;
    if (importDefs && importDefs.length > 0) {
      output += '    import:\n';
      for (const importDef of importDefs) {
        output += `      - file: ${importDef.file}\n`;
        output += `        select: [${importDef.select.join(', ')}]\n`;
      }
      output += '\n';
    }

    // Export section
    const exportDef = spec.components.SpecVerseLanguageSpecification.export;
    output += '    export:\n';
    output += `      models: [${exportDef.models.join(', ')}]\n`;
    output += `      controllers: [${exportDef.controllers.join(', ')}]\n`;
    output += `      events: [${exportDef.events.join(', ')}]\n`;
    output += '\n';

    // Models section
    output += '    models:\n';
    for (const [modelName, model] of Object.entries(spec.components.SpecVerseLanguageSpecification.models)) {
      output += `      ${modelName}:\n`;
      output += `        description: "${model.description}"\n`;
      output += '        attributes:\n';
      for (const [attrName, attrType] of Object.entries(model.attributes)) {
        output += `          ${attrName}: ${attrType}\n`;
      }
      output += '\n';
    }

    // Controllers section  
    output += '    controllers:\n';
    for (const [controllerName, controller] of Object.entries(spec.components.SpecVerseLanguageSpecification.controllers)) {
      output += `      ${controllerName}:\n`;
      output += `        description: "${controller.description}"\n`;
      output += `        model: ${controller.model}\n`;
      output += '        actions:\n';
      
      for (const [actionName, action] of Object.entries(controller.actions)) {
        output += `          ${actionName}:\n`;
        output += `            description: "${action.description}"\n`;
        
        if (action.parameters) {
          output += '            parameters:\n';
          for (const [paramName, paramType] of Object.entries(action.parameters)) {
            output += `              ${paramName}: ${paramType}\n`;
          }
        }
        
        output += `            returns: ${action.returns}\n`;
        
        if (action.requires) {
          output += `            requires: [${action.requires.map(r => `"${r}"`).join(', ')}]\n`;
        }
        
        if (action.ensures) {
          output += `            ensures: [${action.ensures.map(e => `"${e}"`).join(', ')}]\n`;
        }
        
        if (action.publishes) {
          output += `            publishes: [${action.publishes.join(', ')}]\n`;
        }
        
        output += '\n';
      }
    }

    // Events section
    output += '    events:\n';
    for (const [eventName, event] of Object.entries(spec.components.SpecVerseLanguageSpecification.events)) {
      output += `      ${eventName}:\n`;
      output += `        description: "${event.description}"\n`;
      output += '        attributes:\n';
      for (const [attrName, attrType] of Object.entries(event.attributes)) {
        output += `          ${attrName}: ${attrType}\n`;
      }
      output += '\n';
    }

    // Manifests section
    output += 'manifests:\n';
    for (const [manifestName, manifest] of Object.entries(spec.manifests)) {
      output += `  ${manifestName}:\n`;
      output += `    specVersion: ${manifest.specVersion}\n`;
      output += `    name: ${manifest.name}\n`;
      output += `    description: ${manifest.description}\n`;
      output += `    version: ${manifest.version}\n`;
      output += '\n';

      // Component reference
      output += '    component:\n';
      output += `      componentSource: ${manifest.component.componentSource}\n`;
      output += `      componentVersion: ${manifest.component.componentVersion}\n`;
      output += `      description: ${manifest.component.description}\n`;
      output += '\n';

      // Implementation types
      output += '    implementationTypes:\n';
      for (const [typeName, type] of Object.entries(manifest.implementationTypes)) {
        output += `      ${typeName}:\n`;
        output += `        type: ${type.type}\n`;
        output += `        technology: ${type.technology}\n`;
        if (type.framework) {
          output += `        framework: ${type.framework}\n`;
        }
        output += '\n';
      }

      // Behavior mappings
      output += '    behaviorMappings:\n';
      for (const behavior of manifest.behaviorMappings) {
        output += `      - modelName: ${behavior.modelName}\n`;
        output += `        behaviorName: ${behavior.behaviorName}\n`;
        output += `        implementationMethod: ${behavior.implementationMethod}\n`;
        output += `        implementationPath: ${behavior.implementationPath}\n`;
        output += `        description: ${behavior.description}\n`;
        output += '\n';
      }

      // Capability mappings
      output += '    capabilityMappings:\n';
      for (const capability of manifest.capabilityMappings) {
        output += `      - capability: ${capability.capability}\n`;
        output += `        implementationType: ${capability.implementationType}\n`;
        output += '\n';
      }

      // Communication channels
      output += '    communicationChannels:\n';
      for (const channel of manifest.communicationChannels) {
        output += `      - channelName: ${channel.channelName}\n`;
        output += `        implementationType: ${channel.implementationType}\n`;
        output += `        namespace: ${channel.namespace}\n`;
        output += `        capabilities: [${channel.capabilities.join(', ')}]\n`;
        output += '\n';
      }
    }

    // Deployments section
    output += 'deployments: {}\n';

    return output;
  }

  writeSpecification(spec) {
    const verbose = process.env.VERBOSE === 'true';
    if (verbose) console.log('💾 Writing specification to file...');
    
    const speclyContent = this.buildSpeclyOutput(spec);
    fs.writeFileSync(OUTPUT_PATH, speclyContent, 'utf8');
    
    if (verbose) console.log(`📄 Written ${speclyContent.length} characters to ${path.basename(OUTPUT_PATH)}`);
  }

  async validateSpecification() {
    const verbose = process.env.VERBOSE === 'true';
    const { execSync } = await import('child_process');
    
    try {
      if (verbose) console.log('🔍 Validating generated meta-specification...');
      
      const cliPath = path.join(projectRoot, 'dist/cli/specverse-cli.js');
      const result = execSync(`node "${cliPath}" validate "${OUTPUT_PATH}"`, { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
      
      if (verbose) console.log('✅ Meta-specification validation passed!');
    } catch (error) {
      console.error('❌ Meta-specification validation failed:');
      console.error(error.stdout || error.message);
      throw new Error('Generated meta-specification is invalid');
    }
  }
}

// Main execution
async function main() {
  try {
    const generator = new MetaSpecificationGenerator();
    await generator.generate();
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MetaSpecificationGenerator };