#!/usr/bin/env node
/**
 * Build Script for Local Deployment
 * Builds with full orchestrator integration and file system resources
 */

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const verbose = process.env.VERBOSE === 'true';
if (verbose) console.log('🔨 Building for LOCAL deployment...');

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
const distDir = join(rootDir, 'dist', 'local');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Build TypeScript
if (verbose) console.log('📦 Compiling TypeScript...');
execSync('npx tsc --outDir dist/local', {
  cwd: rootDir,
  stdio: 'inherit'
});

// Copy resources directory for file system access
if (verbose) console.log('📁 Copying resources...');
const resourcesDir = join(rootDir, 'resources');
if (existsSync(resourcesDir)) {
  execSync(`cp -r resources dist/local/`, { cwd: rootDir, stdio: 'inherit' });
}

// Create local-specific configuration
if (verbose) console.log('⚙️  Creating local configuration...');
const localConfig = `{
  "mode": "local",
  "features": {
    "orchestrator": true,
    "fileSystemResources": true,
    "embeddedResources": false
  },
  "resourcesPath": "./resources"
}`;

const configPath = join(distDir, 'config.json');
const fs = await import('fs/promises');
await fs.writeFile(configPath, localConfig);

// Make executable
execSync('chmod +x dist/local/server/mcp-server.js', { cwd: rootDir });

if (verbose) {
  if (verbose) console.log('✅ Local build complete!');
  if (verbose) console.log('📍 Output: dist/local/');
  if (verbose) console.log('🚀 Run with: node dist/local/server/mcp-server.js');
}