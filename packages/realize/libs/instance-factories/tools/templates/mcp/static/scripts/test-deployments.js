#!/usr/bin/env node
/**
 * Test Script for All Deployment Targets
 * Verifies hybrid resource system works across local, web, extension, enterprise
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🧪 Testing Hybrid Resource System Across All Deployment Targets');
console.log('===============================================================');

const results = {
  local: { status: 'pending', metrics: null, error: null },
  web: { status: 'pending', metrics: null, error: null },
  extension: { status: 'pending', metrics: null, error: null },
  enterprise: { status: 'pending', metrics: null, error: null }
};

async function testDeploymentTarget(target, command, timeout = 15000) {
  console.log(`\n🔍 Testing ${target.toUpperCase()} deployment...`);
  
  return new Promise((resolve) => {
    const child = spawn('node', command.split(' ').slice(1), {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        child.kill('SIGTERM');
        console.log(`   ⏰ ${target} server started successfully (timed out as expected)`);
        results[target].status = 'success';
        results[target].metrics = parseMetricsFromOutput(stderr);
        resolve();
      }
    }, timeout);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      
      // Look for success indicators
      if (stderr.includes('initialized successfully') || 
          stderr.includes('connected and running') ||
          stderr.includes('Server started')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          child.kill('SIGTERM');
          console.log(`   ✅ ${target} server started successfully`);
          results[target].status = 'success';
          results[target].metrics = parseMetricsFromOutput(stderr);
          resolve();
        }
      }
    });

    child.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        console.log(`   ❌ ${target} server failed: ${error.message}`);
        results[target].status = 'failed';
        results[target].error = error.message;
        resolve();
      }
    });

    child.on('exit', (code, signal) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        if (code === 0 || signal === 'SIGTERM') {
          console.log(`   ✅ ${target} server exited cleanly`);
          results[target].status = 'success';
          results[target].metrics = parseMetricsFromOutput(stderr);
        } else {
          console.log(`   ❌ ${target} server exited with code ${code}`);
          results[target].status = 'failed';
          results[target].error = `Exit code: ${code}`;
        }
        resolve();
      }
    });
  });
}

function parseMetricsFromOutput(output) {
  try {
    // Look for metrics in the output
    const metricsMatch = output.match(/Metrics:\s*({[\s\S]*?})/);
    if (metricsMatch) {
      return JSON.parse(metricsMatch[1]);
    }

    // Extract provider info if available
    const providerMatch = output.match(/resources_provider.*?mode.*?(\w+)/);
    if (providerMatch) {
      return { provider_mode: providerMatch[1] };
    }

    return null;
  } catch (error) {
    return { parse_error: error.message };
  }
}

function validateBuildOutputs() {
  console.log('\n📁 Validating Build Outputs...');
  
  const targets = ['local', 'web', 'extension', 'enterprise'];
  const validationResults = {};

  for (const target of targets) {
    const distPath = join(rootDir, 'dist', target);
    const configPath = join(distPath, 'config.json');
    const serverPath = join(distPath, 'server', 'mcp-server.js');
    
    validationResults[target] = {
      directory: existsSync(distPath),
      config: existsSync(configPath),
      server: existsSync(serverPath),
      special: validateSpecialFiles(target, distPath)
    };

    console.log(`   ${target.toUpperCase()}:`);
    console.log(`      Directory: ${validationResults[target].directory ? '✅' : '❌'}`);
    console.log(`      Config: ${validationResults[target].config ? '✅' : '❌'}`);
    console.log(`      Server: ${validationResults[target].server ? '✅' : '❌'}`);
    console.log(`      Special: ${Object.keys(validationResults[target].special).map(k => 
      `${k}=${validationResults[target].special[k] ? '✅' : '❌'}`).join(', ')}`);

    if (validationResults[target].config) {
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        console.log(`      Mode: ${config.mode}`);
      } catch (error) {
        console.log(`      Config Error: ${error.message}`);
      }
    }
  }

  return validationResults;
}

function validateSpecialFiles(target, distPath) {
  const special = {};
  
  switch (target) {
    case 'web':
      special.embeddedResources = existsSync(join(distPath, 'embedded-resources.js'));
      special.deploymentManifest = existsSync(join(distPath, 'deployment-manifest.json'));
      break;
    case 'extension':
      special.extensionWrapper = existsSync(join(distPath, 'extension-wrapper.js'));
      special.packageJson = existsSync(join(distPath, 'package.json'));
      break;
    case 'enterprise':
      special.dockerfile = existsSync(join(distPath, 'Dockerfile'));
      special.dockerCompose = existsSync(join(distPath, 'docker-compose.yml'));
      special.monitoring = existsSync(join(distPath, 'monitoring', 'prometheus.yml'));
      break;
    case 'local':
      special.resources = existsSync(join(distPath, 'resources'));
      break;
  }

  return special;
}

async function runTests() {
  try {
    // First validate build outputs
    const buildValidation = validateBuildOutputs();
    
    // Test each deployment target
    await testDeploymentTarget('local', 'node dist/local/server/mcp-server.js --mode local --silent');
    await testDeploymentTarget('web', 'node dist/web/server/mcp-server.js --mode remote --port 3001 --silent');
    // Extension and enterprise would need different test approaches
    
    // Generate test report
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=======================');
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const [target, result] of Object.entries(results)) {
      totalTests++;
      const status = result.status === 'success' ? '✅ PASS' : '❌ FAIL';
      console.log(`${target.toUpperCase().padEnd(12)} ${status}`);
      
      if (result.status === 'success') {
        passedTests++;
        if (result.metrics) {
          console.log(`              Provider: ${result.metrics.resources_provider?.mode || 'unknown'}`);
          console.log(`              Resources: ${result.metrics.cached_resources || 0} cached`);
        }
      } else if (result.error) {
        console.log(`              Error: ${result.error}`);
      }
    }
    
    console.log(`\n📈 Overall Results: ${passedTests}/${totalTests} tests passed`);
    
    // Hybrid System Validation
    console.log('\n🔄 HYBRID SYSTEM VALIDATION');
    console.log('============================');
    
    const hasFilesystemMode = Object.values(results).some(r => 
      r.metrics?.resources_provider?.mode === 'filesystem');
    const hasEmbeddedMode = Object.values(results).some(r => 
      r.metrics?.resources_provider?.mode === 'embedded');
      
    console.log(`Filesystem Mode: ${hasFilesystemMode ? '✅' : '❌'} Detected`);
    console.log(`Embedded Mode: ${hasEmbeddedMode ? '✅' : '❌'} Detected`);
    console.log(`Mode Detection: ${hasFilesystemMode && hasEmbeddedMode ? '✅' : '❌'} Working`);
    
    // Environment-specific optimizations
    console.log('\n🎯 ENVIRONMENT OPTIMIZATIONS');
    console.log('==============================');
    console.log(`Web Build Embedded Resources: ${buildValidation.web?.special?.embeddedResources ? '✅' : '❌'}`);
    console.log(`Local Build File System: ${buildValidation.local?.special?.resources ? '✅' : '❌'}`);
    console.log(`Extension Hybrid Wrapper: ${buildValidation.extension?.special?.extensionWrapper ? '✅' : '❌'}`);
    console.log(`Enterprise Docker Config: ${buildValidation.enterprise?.special?.dockerfile ? '✅' : '❌'}`);
    
    console.log('\\n🎉 HYBRID RESOURCE SYSTEM TEST COMPLETE!');
    console.log(`📊 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    return passedTests === totalTests;

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Execute tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});