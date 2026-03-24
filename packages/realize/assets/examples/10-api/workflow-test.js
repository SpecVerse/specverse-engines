/**
 * SpecVerse API Workflow Test
 * 
 * Focused end-to-end workflow test for the SpecVerse API
 * This is a minimal, streamlined test extracted from test-specverse-api
 */

import { SpecVerseParser, LogicalInferenceEngine } from '../../dist/index.js';
import { readFileSync, writeFileSync } from 'fs';

// Simple test specification
const testSpec = `components:
  UserManagement:
    version: "1.0.0"
    description: "User management system"

    models:
      User:
        description: "User model for API testing"
        attributes:
          id: UUID required
          name: String required
          email: Email unique required
          created_at: DateTime auto=now

        lifecycles:
          status:
            flow: inactive -> active -> suspended

deployments: {}`;

async function testFullWorkflow() {
  console.log('🧪 Testing full API workflow...');
  
  try {
    // 1. Parse the spec
    console.log('1️⃣ Parsing specification...');
    
    const schema = JSON.parse(readFileSync('schema/SPECVERSE-SCHEMA.json', 'utf8'));
    const parser = new SpecVerseParser(schema);
    const result = parser.parseContent(testSpec, 'test.specly');
    
    if (result.errors.length > 0) {
      throw new Error('Parse failed: ' + result.errors.map(e => e.message).join(', '));
    }
    
    const ast = result.ast;
    console.log('✅ Parsed successfully');
    
    // 2. Run inference
    console.log('2️⃣ Running inference...');
    const config = {
      logical: {
        generateControllers: true,
        generateServices: true,
        generateEvents: true,
        generateViews: true,
        generateTypes: true
      },
      rules: {
        logicalRulesPath: 'dist/inference-engine/rules/logical',
        deploymentRulesPath: 'dist/inference-engine/rules/deployment'
      }
    };
    
    const engine = new LogicalInferenceEngine(config);
    const models = ast.components.flatMap(c => c.models);
    
    // Load rules
    const rulesResult = await engine.loadRules();
    if (!rulesResult.valid) {
      throw new Error('Failed to load rules: ' + rulesResult.errors.map(e => e.message).join(', '));
    }
    
    // Run inference
    const inferenceResult = await engine.inferLogicalSpecification(models, 'TestComponent');
    
    console.log('✅ Inference completed!');
    console.log('   Generated Controllers:', inferenceResult.statistics.controllersGenerated || 0);
    console.log('   Generated Services:', inferenceResult.statistics.servicesGenerated || 0);
    console.log('   Generated Events:', inferenceResult.statistics.eventsGenerated || 0);
    console.log('   Generated Views:', inferenceResult.statistics.viewsGenerated || 0);
    
    if (inferenceResult.validation.valid) {
      console.log('✅ Generated specification is valid!');
      console.log('🎉 FULL API WORKFLOW SUCCESS!');
      return true;
    } else {
      console.log('⚠️ Generated specification has warnings:', inferenceResult.validation.errors.length);
      inferenceResult.validation.errors.forEach(error => {
        console.log('   -', error.message);
      });
      return false;
    }
    
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
    return false;
  }
}

// Export for use in tests
export { testFullWorkflow };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFullWorkflow()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}