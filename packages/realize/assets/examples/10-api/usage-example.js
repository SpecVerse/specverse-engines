/**
 * SpecVerse JavaScript API Usage Examples
 * 
 * Simple examples showing how to use SpecVerse from JavaScript
 */

import { SpecVerseParser } from '../../dist/index.js';
import { readFileSync, writeFileSync } from 'fs';
import * as yaml from 'js-yaml';

// ============================================
// BASIC USAGE EXAMPLE
// ============================================

// 1. Parse a SpecVerse file
function parseSpec(filePath) {
  // Load the schema (in real usage, this would be from node_modules/@specverse/lang/schema/)
  const schema = JSON.parse(readFileSync('../../schema/SPECVERSE-SCHEMA.json', 'utf8'));
  
  // Create parser
  const parser = new SpecVerseParser(schema);
  
  // Parse the file
  const content = readFileSync(filePath, 'utf8');
  const result = parser.parseContent(content, filePath);
  
  if (result.errors.length > 0) {
    console.error('Errors:', result.errors);
    return null;
  }
  
  console.log('✅ Parsed successfully');
  return result.ast;
}

// 2. Validate a specification
function validateSpec(filePath) {
  const schema = JSON.parse(readFileSync('../../schema/SPECVERSE-SCHEMA.json', 'utf8'));
  const parser = new SpecVerseParser(schema);
  
  const content = readFileSync(filePath, 'utf8');
  const result = parser.parseContent(content, filePath);
  
  return result.errors.length === 0;
}

// 3. Convert .specly to .yaml
function speclyToYaml(inputPath, outputPath) {
  const schema = JSON.parse(readFileSync('../../schema/SPECVERSE-SCHEMA.json', 'utf8'));
  const parser = new SpecVerseParser(schema);
  
  const content = readFileSync(inputPath, 'utf8');
  const result = parser.processToYaml(content);
  
  if (result.errors.length === 0) {
    writeFileSync(outputPath, result.yaml);
    console.log('✅ Converted to YAML');
    return true;
  }
  
  console.error('❌ Conversion failed:', result.errors);
  return false;
}

// 4. Extract information from AST
function analyzeSpec(ast) {
  if (!ast) return null;
  
  // Count different elements
  const stats = {
    components: ast.components.length,
    models: 0,
    controllers: 0,
    services: 0,
    events: 0,
    views: 0
  };
  
  // Iterate through components
  ast.components.forEach(component => {
    stats.models += component.models?.length || 0;
    stats.controllers += component.controllers?.length || 0;
    stats.services += component.services?.length || 0;
    stats.events += component.events?.length || 0;
    stats.views += component.views?.length || 0;
  });
  
  return stats;
}

// 5. Example: Generate a simple report
function generateReport(filePath) {
  const ast = parseSpec(filePath);
  if (!ast) return;
  
  const stats = analyzeSpec(ast);
  
  const report = {
    file: filePath,
    timestamp: new Date().toISOString(),
    statistics: stats,
    components: ast.components.map(c => ({
      name: c.name,
      version: c.version,
      modelCount: c.models?.length || 0,
      exports: c.exports
    }))
  };
  
  console.log('\n📊 Specification Report:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

// ============================================
// USING THE INFERENCE ENGINE
// ============================================

import { LogicalInferenceEngine } from '../../dist/index.js';

async function runInference(filePath) {
  // Parse the file first
  const ast = parseSpec(filePath);
  if (!ast) return;
  
  // Configure inference
  const config = {
    logical: {
      generateControllers: true,
      generateServices: true,
      generateEvents: true,
      generateViews: true,
      generateTypes: true
    },
    rules: {
      logicalRulesPath: '../../dist/inference-engine/rules/logical',
      deploymentRulesPath: '../../dist/inference-engine/rules/deployment'
    }
  };
  
  // Create and run inference engine
  const engine = new LogicalInferenceEngine(config);
  
  // Extract models from AST
  const models = ast.components.flatMap(c => c.models);
  
  // Load rules first
  console.log('📋 Loading inference rules...');
  const rulesValidation = await engine.loadRules();
  
  if (!rulesValidation.valid) {
    console.error('❌ Failed to load inference rules:', rulesValidation.errors.map(e => e.message));
    return null;
  }
  
  // Run inference
  const componentName = 'GeneratedComponent';
  const result = await engine.inferLogicalSpecification(models, componentName);
  
  console.log('✅ Inference complete:');
  console.log('   Validation:', result.validation.valid ? '✅' : '❌');
  console.log('   Controllers:', result.statistics.controllersGenerated);
  console.log('   Services:', result.statistics.servicesGenerated);
  console.log('   Events:', result.statistics.eventsGenerated);
  console.log('   Views:', result.statistics.viewsGenerated);
  
  if (!result.validation.valid) {
    console.error('   Errors:', result.validation.errors.map(e => e.message));
  }
  
  // Save the inferred specification
  const output = yaml.dump(result.specification, {
    indent: 2,
    lineWidth: 120
  });
  
  writeFileSync('inferred-spec.yaml', output);
  console.log('💾 Saved to inferred-spec.yaml');
  
  return result;
}

// ============================================
// USING GENERATORS
// ============================================

import { 
  AIViewGenerator, 
  UMLGenerator, 
  DocumentationGenerator 
} from '../../dist/index.js';

function generateAIView(ast) {
  try {
    const generator = new AIViewGenerator();
    const aiSpec = generator.generate(ast);
    
    // Save as YAML
    const output = yaml.dump(aiSpec, { indent: 2 });
    writeFileSync('ai-spec.yaml', output);
    
    console.log('✅ AI specification generated');
    return aiSpec;
  } catch (error) {
    console.warn('⚠️ AI view generation failed:', error.message);
  }
}

function generateDiagrams(ast) {
  try {
    const generator = new UMLGenerator();
    
    // Generate ER diagram
    const erDiagram = generator.generate(ast, { 
      type: 'er', 
      includeAttributes: true,
      includeRelationships: true 
    });
    if (erDiagram) {
      writeFileSync('diagram-er.mmd', erDiagram);
      console.log('✅ ER diagram generated');
    }
    
    // Generate architecture diagram  
    const archDiagram = generator.generate(ast, { 
      type: 'architecture', 
      includeControllers: true,
      includeServices: true,
      includeEvents: true
    });
    if (archDiagram) {
      writeFileSync('diagram-architecture.mmd', archDiagram);
      console.log('✅ Architecture diagram generated');
    }
  } catch (error) {
    console.warn('⚠️ Diagram generation failed:', error.message);
  }
}

function generateDocs(ast) {
  try {
    const generator = new DocumentationGenerator();
    
    // Generate markdown
    const markdown = generator.generate(ast, { 
      format: 'markdown',
      includeTableOfContents: true,
      includeExamples: true,
      includeDiagrams: false
    });
    writeFileSync('documentation.md', markdown);
    
    // Generate HTML
    const html = generator.generate(ast, { 
      format: 'html',
      includeTableOfContents: true,
      includeExamples: true
    });
    writeFileSync('documentation.html', html);
    
    // Generate OpenAPI
    const openapi = generator.generate(ast, { 
      format: 'openapi',
      baseUrl: 'https://api.example.com'
    });
    writeFileSync('openapi.json', openapi);
    
    console.log('✅ Documentation generated (Markdown, HTML, OpenAPI)');
    return markdown;
  } catch (error) {
    console.warn('⚠️ Documentation generation failed:', error.message);
  }
}

// ============================================
// MAIN EXAMPLE
// ============================================

async function main() {
  const specFile = '../01-fundamentals/01-01-basic-model.specly';
  
  // Basic operations
  console.log('1️⃣ Parsing...');
  const ast = parseSpec(specFile);
  
  if (ast) {
    console.log('2️⃣ Analyzing...');
    const stats = analyzeSpec(ast);
    console.log('   Stats:', stats);
    
    console.log('3️⃣ Running inference...');
    await runInference(specFile);
    
    console.log('4️⃣ Generating outputs...');
    generateAIView(ast);
    generateDiagrams(ast);
    generateDocs(ast);
    
    console.log('5️⃣ Converting to YAML...');
    speclyToYaml(specFile, 'converted.yaml');
  }
  
  console.log('\n✨ Done!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export functions for use in other modules
export {
  parseSpec,
  validateSpec,
  speclyToYaml,
  analyzeSpec,
  generateReport,
  runInference,
  generateAIView,
  generateDiagrams,
  generateDocs
};