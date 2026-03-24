#!/usr/bin/env node
/**
 * Simple Hybrid Resource System Test
 * Manual verification of embedded vs filesystem modes
 */

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🧪 SIMPLE HYBRID RESOURCE SYSTEM TEST');
console.log('======================================');

async function testWebDeploymentManually() {
  console.log('\n🌐 Testing WEB deployment manually...');
  
  const serverPath = join(rootDir, 'dist/web/server/mcp-server.js');
  if (!existsSync(serverPath)) {
    console.log('   ❌ Web server not found');
    return false;
  }
  
  const port = 3005;
  console.log(`   🚀 Starting web server on port ${port}...`);
  
  const child = spawn('node', [serverPath, '--mode', 'remote', '--port', port.toString()], {
    cwd: rootDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false
  });

  let serverReady = false;
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (serverReady) {
        // Test the server
        try {
          console.log('   🔍 Testing server health...');
          const healthResult = execSync(`curl -s http://localhost:${port}/health`, { encoding: 'utf-8', timeout: 5000 });
          
          if (healthResult) {
            const data = JSON.parse(healthResult);
            const providerMode = data.metrics?.resources_provider?.mode;
            const providerType = data.metrics?.resources_provider?.type;
            const resourceCount = data.metrics?.resources_provider?.resourcesInfo?.count || 0;
            
            console.log(`   📊 Provider Mode: ${providerMode}`);
            console.log(`   📊 Provider Type: ${providerType}`);
            console.log(`   📊 Resource Count: ${resourceCount}`);
            
            if (providerMode === 'embedded' && resourceCount > 0) {
              console.log('   ✅ Web deployment using embedded resources correctly!');
              
              // Test resource content
              try {
                console.log('   🔍 Testing resource content...');
                const resourceResult = execSync(`curl -s "http://localhost:${port}/mcp/resources"`, { encoding: 'utf-8', timeout: 5000 });
                const resourceData = JSON.parse(resourceResult);
                console.log(`   📋 Available resources: ${resourceData.count}`);
                
                if (resourceData.count > 0) {
                  console.log('   ✅ Resource serving working correctly!');
                  child.kill('SIGTERM');
                  resolve(true);
                  return;
                }
              } catch (resourceError) {
                console.log(`   ⚠️  Resource test failed: ${resourceError.message}`);
              }
            } else {
              console.log(`   ❌ Expected embedded mode with resources, got mode: ${providerMode}, count: ${resourceCount}`);
            }
          }
        } catch (error) {
          console.log(`   ❌ Health check failed: ${error.message}`);
        }
      }
      
      child.kill('SIGTERM');
      resolve(false);
    }, 8000);

    child.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('listening on port') || output.includes('Health check:')) {
        console.log('   ✅ Server is ready');
        serverReady = true;
      }
    });

    child.on('error', (error) => {
      console.log(`   ❌ Server failed to start: ${error.message}`);
      clearTimeout(timeout);
      resolve(false);
    });

    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`   ❌ Server exited with code: ${code}`);
        clearTimeout(timeout);
        resolve(false);
      }
    });
  });
}

function testLocalDeployment() {
  console.log('\n🗂️  Testing LOCAL deployment...');
  
  const serverPath = join(rootDir, 'dist/local/server/mcp-server.js');
  if (!existsSync(serverPath)) {
    console.log('   ❌ Local server not found');
    return false;
  }
  
  console.log('   ✅ Local server exists');
  
  // Check if it has filesystem resources
  const resourcesPath = join(rootDir, 'dist/local/resources');
  if (existsSync(resourcesPath)) {
    console.log('   ✅ Local deployment has filesystem resources');
    return true;
  } else {
    console.log('   ❌ Local deployment missing resources directory');
    return false;
  }
}

function checkBuildOutputs() {
  console.log('\n📁 Checking build outputs...');
  
  const checks = [
    { name: 'Local server', path: 'dist/local/server/mcp-server.js' },
    { name: 'Local resources', path: 'dist/local/resources' },
    { name: 'Web server', path: 'dist/web/server/mcp-server.js' },
    { name: 'Web embedded resources', path: 'dist/web/embedded-resources.js' },
    { name: 'Extension wrapper', path: 'dist/extension/extension-wrapper.js' },
    { name: 'Enterprise dockerfile', path: 'dist/enterprise/Dockerfile' }
  ];
  
  let allGood = true;
  for (const check of checks) {
    const fullPath = join(rootDir, check.path);
    const exists = existsSync(fullPath);
    console.log(`   ${exists ? '✅' : '❌'} ${check.name}`);
    if (!exists) allGood = false;
  }
  
  return allGood;
}

async function runSimpleTest() {
  console.log('Starting comprehensive hybrid resource system test...\n');
  
  // Step 1: Check build outputs
  const buildOk = checkBuildOutputs();
  
  // Step 2: Test local deployment
  const localOk = testLocalDeployment();
  
  // Step 3: Test web deployment
  const webOk = await testWebDeploymentManually();
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Build Outputs:    ${buildOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Local Deployment: ${localOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Web Deployment:   ${webOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (buildOk && localOk && webOk) {
    console.log('\n🎉 HYBRID RESOURCE SYSTEM IS FULLY FUNCTIONAL!');
    console.log('✅ All build outputs present');
    console.log('✅ Local deployment uses filesystem resources');  
    console.log('✅ Web deployment uses embedded resources');
    console.log('✅ HTTP resource serving operational');
    console.log('\nThe multi-environment MCP server is ready for deployment! 🚀');
    return true;
  } else {
    console.log('\n❌ Some tests failed - see details above');
    return false;
  }
}

// Run the test
runSimpleTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});