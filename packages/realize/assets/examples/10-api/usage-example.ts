/**
 * SpecVerse TypeScript/JavaScript API Usage Examples
 * 
 * This file demonstrates how to use SpecVerse functionality programmatically
 * instead of through the CLI.
 */

import {
  // Parser and AST
  SpecVerseParser,
  ParseResult,
  SpecVerseAST,
  
  // Inference Engine
  LogicalInferenceEngine,
  InferenceEngineConfig,
  
  // Generators
  AIViewGenerator,
  UMLGenerator,
  DocumentationGenerator,
  DiagramGeneratorV31,
  
  // Types
  ModelSpec,
  ControllerSpec,
  ServiceSpec,
  EventSpec,
  ViewSpec
} from '@specverse/lang';

import { readFileSync, writeFileSync } from 'fs';
import * as yaml from 'js-yaml';

// ============================================
// 1. PARSING SPECVERSE FILES
// ============================================

async function parseSpecification(filePath: string): Promise<SpecVerseAST | undefined> {
  // Load the schema (in real usage, this would be from node_modules/@specverse/lang/schema/)
  const schema = JSON.parse(readFileSync('node_modules/@specverse/lang/schema/SPECVERSE-SCHEMA.json', 'utf8'));
  
  // Create parser instance
  const parser = new SpecVerseParser(schema);
  
  // Read and parse the file
  const content = readFileSync(filePath, 'utf8');
  const result: ParseResult = parser.parseContent(content, filePath);
  
  // Check for errors
  if (result.errors.length > 0) {
    console.error('Parse errors:', result.errors);
    return undefined;
  }
  
  // Handle warnings if any
  if (result.warnings && result.warnings.length > 0) {
    console.warn('Parse warnings:', result.warnings);
  }
  
  console.log('✅ Successfully parsed:', filePath);
  return result.ast;
}

// ============================================
// 2. USING THE INFERENCE ENGINE
// ============================================

async function runInference(ast: SpecVerseAST): Promise<any> {
  // Configure inference options
  const config: Partial<InferenceEngineConfig> = {
    logical: {
      generateControllers: true,
      generateServices: true,
      generateEvents: true,
      generateViews: true,
      generateTypes: true,
    },
    rules: {
      logicalRulesPath: 'node_modules/@specverse/lang/dist/inference-engine/rules/logical',
      deploymentRulesPath: 'node_modules/@specverse/lang/dist/inference-engine/rules/deployment'
    }
  };
  
  // Create inference engine instance
  const inferenceEngine = new LogicalInferenceEngine(config);
  
  // Extract models from AST
  const models = ast.components.flatMap(c => c.models);
  
  // Load rules first
  console.log('📋 Loading inference rules...');
  const rulesValidation = await inferenceEngine.loadRules();
  
  if (!rulesValidation.valid) {
    console.error('❌ Failed to load inference rules:', rulesValidation.errors.map(e => e.message));
    return undefined;
  }
  
  // Run inference on models
  const componentName = 'GeneratedComponent';
  const inferenceResult = await inferenceEngine.inferLogicalSpecification(models, componentName);
  
  console.log('📊 Inference Results:');
  console.log('   Validation:', inferenceResult.validation.valid ? '✅' : '❌');
  console.log('   Models processed:', inferenceResult.statistics.modelsProcessed);
  console.log('   Controllers generated:', inferenceResult.statistics.controllersGenerated);
  console.log('   Services generated:', inferenceResult.statistics.servicesGenerated);
  console.log('   Events generated:', inferenceResult.statistics.eventsGenerated);
  console.log('   Views generated:', inferenceResult.statistics.viewsGenerated);
  
  if (!inferenceResult.validation.valid) {
    console.error('   Errors:', inferenceResult.validation.errors.map(e => e.message));
  }
  
  return inferenceResult;
}

// ============================================
// 3. GENERATING AI-OPTIMIZED SPECIFICATIONS
// ============================================

async function generateAIView(ast: SpecVerseAST): Promise<void> {
  const generator = new AIViewGenerator();
  
  // Generate AI-optimized specification
  const aiSpec = generator.generate(ast);
  
  // Convert to YAML for readability
  const yamlOutput = yaml.dump(aiSpec, {
    indent: 2,
    lineWidth: 120,
    noRefs: true
  });
  
  writeFileSync('output/ai-optimized.yaml', yamlOutput);
  console.log('✅ AI-optimized specification generated');
}

// ============================================
// 4. GENERATING UML DIAGRAMS
// ============================================

async function generateUMLDiagrams(ast: SpecVerseAST): Promise<void> {
  try {
    const generator = new UMLGenerator();
    
    // Generate different types of diagrams with proper options
    const diagramTypes = [
      { type: 'er' as const, includeAttributes: true, includeRelationships: true },
      { type: 'sequence' as const, includeEvents: true },
      { type: 'architecture' as const, includeControllers: true, includeServices: true, includeEvents: true },
      { type: 'lifecycle' as const }
    ];
    
    // Generate and save diagrams
    for (const options of diagramTypes) {
      const content = generator.generate(ast, options);
      if (content) {
        writeFileSync(`output/diagram-${options.type}.mmd`, content);
        console.log(`✅ Generated ${options.type} diagram`);
      }
    }
  } catch (error) {
    console.warn('⚠️ UML diagram generation failed:', error instanceof Error ? error.message : String(error));
  }
}

// ============================================
// 5. GENERATING DOCUMENTATION
// ============================================

async function generateDocumentation(ast: SpecVerseAST): Promise<void> {
  try {
    const generator = new DocumentationGenerator();
    
    // Generate markdown documentation
    const markdown = generator.generate(ast, { 
      format: 'markdown',
      includeTableOfContents: true,
      includeExamples: true,
      includeDiagrams: false
    });
    writeFileSync('output/documentation.md', markdown);
    
    // Generate HTML documentation  
    const html = generator.generate(ast, { 
      format: 'html',
      includeTableOfContents: true,
      includeExamples: true
    });
    writeFileSync('output/documentation.html', html);
    
    // Generate OpenAPI specification
    const openapi = generator.generate(ast, { 
      format: 'openapi',
      baseUrl: 'https://api.example.com'
    });
    writeFileSync('output/openapi.json', openapi);
    
    console.log('✅ Documentation generated (Markdown, HTML, OpenAPI)');
  } catch (error) {
    console.warn('⚠️ Documentation generation failed:', error instanceof Error ? error.message : String(error));
  }
}

// ============================================
// 6. WORKING WITH MERMAID DIAGRAMS (V3.1)
// ============================================

async function generateMermaidDiagrams(filePath: string): Promise<void> {
  const generator = new DiagramGeneratorV31();
  
  // Generate all diagram types
  const outputDir = 'output/diagrams';
  await generator.generateFromFile(filePath, outputDir);
  
  console.log('✅ Mermaid diagrams generated in:', outputDir);
}

// ============================================
// 7. CUSTOM PROCESSING EXAMPLE
// ============================================

async function customProcessing(ast: SpecVerseAST): Promise<void> {
  // Extract all models
  const allModels: ModelSpec[] = ast.components.flatMap(c => c.models);
  
  // Extract all controllers
  const allControllers: ControllerSpec[] = ast.components.flatMap(c => c.controllers);
  
  // Extract all events
  const allEvents: EventSpec[] = ast.components.flatMap(c => c.events);
  
  // Custom analysis
  console.log('\n📊 Custom Analysis:');
  console.log('Total models:', allModels.length);
  console.log('Models with lifecycles:', allModels.filter(m => m.lifecycle).length);
  console.log('Total endpoints:', allControllers.flatMap(c => c.actions).length);
  console.log('Total events:', allEvents.length);
  
  // Generate custom output
  const customOutput = {
    summary: {
      modelCount: allModels.length,
      controllerCount: allControllers.length,
      eventCount: allEvents.length,
    },
    models: allModels.map(m => ({
      name: m.name,
      attributeCount: Object.keys(m.attributes || {}).length,
      hasLifecycle: !!m.lifecycle,
      relationshipCount: m.relationships?.length || 0
    })),
    controllers: allControllers.map(c => ({
      name: c.name,
      actionCount: c.actions.length,
      model: c.model
    }))
  };
  
  writeFileSync('output/custom-analysis.json', JSON.stringify(customOutput, null, 2));
  console.log('✅ Custom analysis saved');
}

// ============================================
// 8. VALIDATION ONLY
// ============================================

function validateSpecification(filePath: string): boolean {
  const schema = JSON.parse(readFileSync('node_modules/@specverse/lang/schema/SPECVERSE-SCHEMA.json', 'utf8'));
  const parser = new SpecVerseParser(schema);
  
  const content = readFileSync(filePath, 'utf8');
  const result = parser.parseContent(content, filePath);
  
  if (result.errors.length === 0) {
    console.log('✅ Specification is valid');
    return true;
  } else {
    console.error('❌ Validation errors:');
    result.errors.forEach(error => console.error('  -', error));
    return false;
  }
}

// ============================================
// 9. PROCESSING SPECLY TO YAML
// ============================================

function processSpeclyToYaml(speclyPath: string, outputPath: string): void {
  const schema = JSON.parse(readFileSync('node_modules/@specverse/lang/schema/SPECVERSE-SCHEMA.json', 'utf8'));
  const parser = new SpecVerseParser(schema);
  
  const content = readFileSync(speclyPath, 'utf8');
  const result = parser.processToYaml(content);
  
  if (result.errors.length > 0) {
    console.error('❌ Processing errors:', result.errors);
    return;
  }
  
  writeFileSync(outputPath, result.yaml);
  console.log('✅ Processed to YAML:', outputPath);
}

// ============================================
// MAIN EXAMPLE USAGE
// ============================================

async function main() {
  try {
    const specFile = 'examples/01-fundamentals/01-01-basic-model.specly';
    
    // 1. Parse the specification
    const ast = await parseSpecification(specFile);
    if (!ast) {
      console.error('Failed to parse specification');
      return;
    }
    
    // 2. Run inference to generate complete architecture
    const inferenceResult = await runInference(ast);
    
    // 3. Generate various outputs
    await generateAIView(ast);
    await generateUMLDiagrams(ast);
    await generateDocumentation(ast);
    await generateMermaidDiagrams(specFile);
    
    // 4. Custom processing
    await customProcessing(ast);
    
    // 5. Process .specly to .yaml
    processSpeclyToYaml(specFile, 'output/processed.yaml');
    
    console.log('\n✨ All operations completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// ============================================
// EXPORTS FOR USE IN OTHER MODULES
// ============================================

export {
  parseSpecification,
  runInference,
  generateAIView,
  generateUMLDiagrams,
  generateDocumentation,
  generateMermaidDiagrams,
  customProcessing,
  validateSpecification,
  processSpeclyToYaml
};