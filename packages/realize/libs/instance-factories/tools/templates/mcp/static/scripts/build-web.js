#!/usr/bin/env node
/**
 * Build Script for Web Deployment
 * Builds with embedded resources, no file system access
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const verbose = process.env.VERBOSE === 'true';
if (verbose) console.log('🔨 Building for WEB deployment...');

// Check if MCP SDK is available
try {
  execSync('npm list @modelcontextprotocol/sdk', { cwd: rootDir, stdio: 'ignore' });
} catch (error) {
  if (verbose) console.log('⚠️  MCP SDK not found, installing dependencies...');
  try {
    execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  } catch (installError) {
    console.error('❌ Failed to install MCP dependencies');
    process.exit(1);
  }
}

// Clean and create directories
const distDir = join(rootDir, 'dist', 'web');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Build TypeScript
if (verbose) console.log('📦 Compiling TypeScript...');
execSync('npx tsc --outDir dist/web', {
  cwd: rootDir,
  stdio: 'inherit'
});

// Embed resources into JavaScript
if (verbose) console.log('🗂️  Embedding resources...');
const resourcesDir = join(rootDir, 'resources');
const embeddedResources = {};

function embedDirectory(dir, prefix = '') {
  if (!existsSync(dir)) {
    console.warn(`⚠️  Resources directory not found: ${dir}`);
    return;
  }
  
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      embedDirectory(fullPath, `${prefix}${file}/`);
    } else {
      const key = `${prefix}${file}`;
      try {
        const content = readFileSync(fullPath, 'utf-8');
        embeddedResources[key] = {
          content,
          mimeType: getMimeType(file),
          size: content.length
        };
      } catch (error) {
        console.warn(`⚠️  Could not read file ${fullPath}: ${error.message}`);
      }
    }
  }
}

function getMimeType(filename) {
  const ext = extname(filename).toLowerCase();
  const mimeTypes = {
    '.json': 'application/json',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.md': 'text/markdown',
    '.js': 'application/javascript',
    '.txt': 'text/plain'
  };
  return mimeTypes[ext] || 'text/plain';
}

embedDirectory(resourcesDir);

// Create embedded resources module
const embeddedResourcesJs = `// Embedded Resources for Web Deployment
// Generated automatically - do not edit
export const EMBEDDED_RESOURCES = ${JSON.stringify(embeddedResources, null, 2)};

export function getEmbeddedResource(path) {
  return EMBEDDED_RESOURCES[path];
}

export function listEmbeddedResources() {
  return Object.keys(EMBEDDED_RESOURCES);
}
`;

writeFileSync(join(distDir, 'embedded-resources.js'), embeddedResourcesJs);

// Create web-specific configuration
if (verbose) console.log('⚙️  Creating web configuration...');
const webConfig = `{
  "mode": "web",
  "features": {
    "orchestrator": false,
    "fileSystemResources": false,
    "embeddedResources": true
  },
  "resourcesStrategy": "embedded",
  "embeddedResourcesCount": ${Object.keys(embeddedResources).length}
}`;

writeFileSync(join(distDir, 'config.json'), webConfig);

// Create deployment manifest
const manifest = {
  name: 'specverse-mcp-web',
  version: '1.0.0',
  mode: 'web',
  entryPoint: './server/mcp-server.js',
  resources: {
    strategy: 'embedded',
    count: Object.keys(embeddedResources).length,
    totalSize: Object.values(embeddedResources).reduce((sum, res) => sum + res.size, 0)
  },
  capabilities: [
    'resources',
    'tools',
    'prompts'
  ],
  deployment: {
    target: 'web-llm-terminal',
    requirements: {
      node: '>=18.0.0',
      memory: '128MB',
      network: 'required'
    }
  }
};

writeFileSync(join(distDir, 'deployment-manifest.json'), JSON.stringify(manifest, null, 2));

if (verbose) console.log('✅ Web build complete!');
if (verbose) console.log('📍 Output: dist/web/');
if (verbose) console.log('📊 Embedded resources:', Object.keys(embeddedResources).length);
if (verbose) console.log('💾 Total embedded size:', Object.values(embeddedResources).reduce((sum, res) => sum + res.size, 0), 'bytes');
if (verbose) console.log('🚀 Deploy to web-based LLM terminal');