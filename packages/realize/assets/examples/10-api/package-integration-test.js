#!/usr/bin/env node
/**
 * SpecVerse npm Package Integration Test
 * 
 * Tests the actual npm package installation and API usage
 * This validates that the built package works when installed externally
 */

import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

async function testPackageIntegration() {
  console.log('🧪 Testing npm package integration...');
  
  let testDir;
  let packagePath;
  
  try {
    // 1. Create package from current source
    console.log('1️⃣ Creating package...');
    const packOutput = execSync('npm pack --silent', { encoding: 'utf8' }).trim();
    // Extract just the .tgz filename from the output (last line that ends with .tgz)
    const tgzFilename = packOutput.split('\n').filter(line => line.endsWith('.tgz')).pop() || packOutput;
    packagePath = join(process.cwd(), tgzFilename);
    console.log(`✅ Package created: ${tgzFilename}`);
    
    // 2. Create temporary test directory
    console.log('2️⃣ Setting up test environment...');
    testDir = mkdtempSync(join(tmpdir(), 'specverse-test-'));
    console.log(`✅ Test directory: ${testDir}`);
    
    // 3. Install package in test directory
    console.log('3️⃣ Installing package...');
    execSync(`cd "${testDir}" && npm init -y --silent`, { stdio: 'ignore' });
    // Set type to module for ES module support
    const packageJsonPath = join(testDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    packageJson.type = 'module';
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    execSync(`cd "${testDir}" && npm install "${packagePath}" --silent`, { stdio: 'ignore' });
    console.log('✅ Package installed successfully');
    
    // 4. Create test script (ES module)
    console.log('4️⃣ Creating test script...');
    const testScript = `
import { SpecVerseParser, LogicalInferenceEngine } from '@specverse/lang';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest() {
  console.log('🔍 Testing installed package...');

  // Simple test specification
  const testSpec = \`components:
  TestComponent:
    version: "3.2.0"
    description: "Test component for package integration"

    models:
      Product:
        description: "Test product model"
        attributes:
          id: UUID required unique
          name: String required
          price: Number required
        lifecycles:
          status:
            flow: draft -> active -> archived

deployments: {}
\`;

  try {
    // Test 1: Parse specification
    const schemaPath = join(__dirname, 'node_modules/@specverse/lang/schema/SPECVERSE-SCHEMA.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const parser = new SpecVerseParser(schema);

    const parseResult = parser.parseContent(testSpec, 'test.specly');
    if (parseResult.errors.length > 0) {
      throw new Error('Parsing failed: ' + parseResult.errors.map(e => e.message).join(', '));
    }
    console.log('✅ Parsing successful');

    // Test 2: Run inference
    const config = {
      logical: {
        generateControllers: true,
        generateServices: true,
        generateEvents: true,
        generateViews: true
      },
      rules: {
        logicalRulesPath: join(__dirname, 'node_modules/@specverse/lang/dist/inference-engine/rules/logical')
      }
    };

    const engine = new LogicalInferenceEngine(config);
    await engine.loadRules();

    // Get the first (and only) component since parser uses array-style indexing
    const componentName = Object.keys(parseResult.ast.components)[0];
    const component = parseResult.ast.components[componentName];
    const models = component.models;
    const inference = await engine.inferLogicalSpecification(models, 'TestComponent');

    console.log(\`✅ Inference successful:\`);
    console.log(\`   Controllers: \${Object.keys(inference.controllers || {}).length}\`);
    console.log(\`   Services: \${Object.keys(inference.services || {}).length}\`);
    console.log(\`   Events: \${Object.keys(inference.events || {}).length}\`);
    console.log(\`   Views: \${Object.keys(inference.views || {}).length}\`);

    console.log('🎉 PACKAGE INTEGRATION TEST SUCCESS!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
`;
    
    writeFileSync(join(testDir, 'test.js'), testScript);
    console.log('✅ Test script created');
    
    // 5. Run the test
    console.log('5️⃣ Running package integration test...');
    execSync(`cd "${testDir}" && node test.js`, { 
      stdio: 'inherit',
      timeout: 30000 
    });
    
    console.log('🎉 npm Package Integration Test PASSED!');
    
  } catch (error) {
    console.error('❌ Package integration test failed:', error.message);
    throw error;
    
  } finally {
    // Cleanup
    if (testDir) {
      try {
        rmSync(testDir, { recursive: true, force: true });
        console.log('🧹 Cleaned up test directory');
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up test directory:', cleanupError.message);
      }
    }
    
    if (packagePath) {
      try {
        rmSync(packagePath, { force: true });
        console.log('🧹 Cleaned up package file');
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up package file:', cleanupError.message);
      }
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPackageIntegration().catch((error) => {
    console.error('Package integration test failed:', error.message);
    process.exit(1);
  });
}

export { testPackageIntegration };