#!/usr/bin/env node
/**
 * Simple test CLI for the Inference Engine
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { LogicalInferenceEngine } from './logical/logical-engine.js';
import { ModelDefinition, InferenceEngineConfig } from './core/types.js';
import { SpeclyConverter } from './core/specly-converter.js';
import { UnifiedSpecVerseParser } from '../parser/unified-parser.js';
import { resolveRulesPath } from '../utils/path-resolver.js';

/**
 * Parse a .specly file and extract models for inference
 */
async function parseInputFile(filePath: string): Promise<{ models: ModelDefinition[], componentName: string }> {
  try {
    console.log(`📖 Parsing input file: ${filePath}`);
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Load the schema (we'll need this for the parser)
    const schemaPath = path.join('schema', 'SPECVERSE-SCHEMA.json');
    let schema: any = {};
    if (fs.existsSync(schemaPath)) {
      schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    }
    
    // Parse with SpecVerse parser
    const parser = new UnifiedSpecVerseParser(schema);
    const result = parser.parse(fileContent);
    
    if (result.errors.length > 0) {
      console.warn('⚠️ File parsing had errors, but proceeding with available data');
      console.warn('   Errors:', result.errors.join(', '));
    }
    
    // Extract models from the parsed AST
    const models: ModelDefinition[] = [];
    
    if (result.ast?.components && result.ast.components.length > 0) {
      const component = result.ast.components[0]; // Use first component
      
      for (const modelAst of component.models) {
        const model: ModelDefinition = {
          name: modelAst.name,
          attributes: []
        };
        
        // Convert attributes from AST
        for (const attr of modelAst.attributes) {
          model.attributes.push({
            name: attr.name,
            type: attr.type,
            required: attr.required,
            unique: attr.unique,
            default: attr.default
          });
        }
        
        // Convert relationships from AST
        if (modelAst.relationships && modelAst.relationships.length > 0) {
          model.relationships = [];
          for (const rel of modelAst.relationships) {
            model.relationships.push({
              name: rel.name,
              type: rel.type,
              targetModel: rel.target
            });
          }
        }
        
        // Convert lifecycle from AST
        if (modelAst.lifecycles && modelAst.lifecycles.length > 0) {
          const lifecycle = modelAst.lifecycles[0];
          model.lifecycle = {
            name: lifecycle.name,
            states: lifecycle.states || [],
            transitions: lifecycle.transitions ? Object.values(lifecycle.transitions).map((t: any) => ({
              name: t.name || t.action,
              from: t.from,
              to: t.to
            })) : []
          };
        }
        
        models.push(model);
      }
      
      console.log(`✅ Parsed ${models.length} models from ${fileName}`);
      models.forEach(m => console.log(`   - ${m.name} (${m.attributes.length} attributes)`));
      
      return { 
        models, 
        componentName: component.name || fileName 
      };
    }
    
    // If no models found, return fallback
    console.warn('⚠️ No models found in parsed file, using fallback');
    return createFallbackModel(fileName);
    
  } catch (error) {
    console.warn(`⚠️ Failed to parse ${filePath}, using fallback model extraction`);
    console.warn(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    
    return createFallbackModel(path.basename(filePath, path.extname(filePath)));
  }
}

/**
 * Create a fallback model when parsing fails
 */
function createFallbackModel(fileName: string): { models: ModelDefinition[], componentName: string } {
  const fallbackModel: ModelDefinition = {
    name: 'Product', // Default for basic model example
    attributes: [
      { name: 'id', type: 'UUID', required: true, unique: true },
      { name: 'name', type: 'String', required: true },
      { name: 'summary', type: 'String', required: false },
      { name: 'price', type: 'Money', required: true },
      { name: 'inStock', type: 'Boolean', required: false, default: 'true' },
      { name: 'category', type: 'String', required: true },
      { name: 'contactEmail', type: 'Email', required: false }
    ]
  };
  
  return {
    models: [fallbackModel],
    componentName: fileName
  };
}

async function testInferenceEngine() {
  console.log('🧪 Testing SpecVerse v3.1 Inference Engine...');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const inputFile = args[0];
  const outputFile = args.includes('-o') ? args[args.indexOf('-o') + 1] : undefined;

  // Create temp directory for rules
  const tempDir = '/tmp/specverse-inference-test';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create minimal rules
  const controllerRules = `
version: "v3.1"
logical_inference:
  controllers:
    - name: basic_cured
      pattern: BasicCRUD
      priority: 100
      template:
        type: json
        content: |
          {
            "{{modelName}}Controller": {
              "model": "{{modelName}}",
              "description": "CURED controller for {{modelName}}",
              "cured": {
                "create": {
                  "parameters": {"{{modelName}}Data": "{{modelName}} required"},
                  "returns": "{{modelName}}",
                  "publishes": ["{{modelName}}Created"]
                },
                "retrieve": {
                  "parameters": {"id": "UUID required"},
                  "returns": "{{modelName}}"
                },
                "retrieve_many": {
                  "parameters": {"filters": "{{modelName}}Filter optional"},
                  "returns": "Array[{{modelName}}]"
                }
              }
            }
          }
`;

  const eventRules = `
version: "v3.1"
logical_inference:
  events:
    - name: standard_events
      pattern: StandardEvents
      priority: 100
      template:
        type: json
        content: |
          {
            "{{modelName}}Created": {
              "description": "{{modelName}} was created",
              "attributes": {
                "id": "UUID required",
                "timestamp": "DateTime required"
              }
            }
          }
`;

  // Write rule files
  fs.writeFileSync(path.join(tempDir, 'controllers.yaml'), controllerRules);
  fs.writeFileSync(path.join(tempDir, 'events.yaml'), eventRules);

  // Parse input file or use default models
  let testModels: ModelDefinition[];
  let componentName = 'TestComponent';
  
  if (inputFile && fs.existsSync(inputFile)) {
    // Parse the actual input file
    const parseResult = await parseInputFile(inputFile);
    testModels = parseResult.models;
    componentName = parseResult.componentName;
  } else {
    // Default test models when no input file provided
    console.log('ℹ️ No input file provided, using default test models');
    testModels = [
      {
        name: 'Customer',
        attributes: [
          { name: 'id', type: 'UUID', required: true, unique: true },
          { name: 'email', type: 'String', required: true, unique: true },
          { name: 'name', type: 'String', required: true }
        ],
        relationships: [
          { name: 'orders', type: 'hasMany', targetModel: 'Order' }
        ]
      },
      {
        name: 'Product',
        attributes: [
          { name: 'id', type: 'UUID', required: true, unique: true },
          { name: 'name', type: 'String', required: true },
          { name: 'price', type: 'Money', required: true }
        ]
      }
    ];
  }

  // Configure engine to use actual rule files and generate all components
  const config: Partial<InferenceEngineConfig> = {
    logical: {
      generateControllers: true,
      generateServices: true,
      generateEvents: true,
      generateViews: true,
      generateTypes: false
    },
    rules: {
      logicalRulesPath: resolveRulesPath('logical'),
      deploymentRulesPath: tempDir
    },
    validation: {
      strictMode: false,
      failOnWarnings: false
    }
  };

  try {
    const engine = new LogicalInferenceEngine(config, true);
    console.log('✅ Engine created successfully');

    // Load rules
    console.log('📋 Loading rules...');
    const rulesValidation = await engine.loadRules();
    
    if (!rulesValidation.valid) {
      console.error('❌ Rules loading failed:', rulesValidation.errors);
      return;
    }
    console.log('✅ Rules loaded successfully');

    // Run inference
    console.log('🚀 Running inference...');
    const result = await engine.inferLogicalSpecification(testModels, componentName);
    
    console.log('📊 Results:');
    console.log(`   Validation: ${result.validation.valid ? '✅' : '❌'}`);
    console.log(`   Models processed: ${result.statistics.modelsProcessed}`);
    console.log(`   Controllers generated: ${result.statistics.controllersGenerated}`);
    console.log(`   Events generated: ${result.statistics.eventsGenerated}`);
    console.log(`   Processing time: ${result.statistics.processingTimeMs}ms`);

    if (result.validation.errors?.length > 0) {
      console.log('❌ Errors:');
      result.validation.errors.forEach(err => console.log(`   - ${err.message}`));
    }

    if (result.validation.warnings?.length > 0) {
      console.log('⚠️ Warnings:');
      result.validation.warnings.forEach(warn => console.log(`   - ${warn.message}`));
    }

    // Generate .specly output
    const outputSpecly = SpeclyConverter.toSpecly(result.specification, componentName);
    
    // Save to file if output path specified
    if (outputFile) {
      console.log(`💾 Saving to: ${outputFile}`);
      fs.writeFileSync(outputFile, outputSpecly, 'utf8');
      console.log('✅ File saved successfully!');
    } else {
      // Show generated specification
      console.log('\n📄 Generated Specification:');
      console.log(outputSpecly);
    }

    console.log('🎉 Inference engine test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Stack:', error.stack);
    }
  } finally {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  }
}

// Run the test
testInferenceEngine().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});