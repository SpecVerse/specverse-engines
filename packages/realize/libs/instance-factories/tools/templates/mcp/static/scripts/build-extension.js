#!/usr/bin/env node
/**
 * Build Script for Extension Deployment
 * Builds hybrid mode for VSCode extension integration
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const verbose = process.env.VERBOSE === 'true';
if (verbose) console.log('🔨 Building for EXTENSION deployment...');

// Clean and create directories
const distDir = join(rootDir, 'dist', 'extension');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Build TypeScript for CommonJS (VSCode compatibility)
if (verbose) console.log('📦 Compiling TypeScript for CommonJS...');
execSync('npx tsc --outDir dist/extension --module node16 --target es2020 --moduleResolution node16', {
  cwd: rootDir,
  stdio: 'inherit'
});

// Copy resources for hybrid access
if (verbose) console.log('📁 Copying resources...');
const resourcesDir = join(rootDir, 'resources');
if (existsSync(resourcesDir)) {
  execSync(`cp -r resources dist/extension/`, { cwd: rootDir, stdio: 'inherit' });
}

// Create extension-specific wrapper
if (verbose) console.log('🔌 Creating extension wrapper...');
const extensionWrapper = `/**
 * VSCode Extension Wrapper for SpecVerse MCP Server
 * Provides hybrid capabilities for extension environment
 */

const { SpecVerseCleanMCPServer } = require('./server/mcp-server.js');
const path = require('path');

class VSCodeExtensionMCPServer {
  constructor(extensionPath) {
    this.extensionPath = extensionPath;
    this.config = {
      mode: 'extension',
      logging: true,
      resources_path: path.join(extensionPath, 'resources'),
      features: {
        orchestrator: this.detectOrchestrator(),
        fileSystemResources: true,
        embeddedResources: true
      }
    };
    
    this.server = new SpecVerseCleanMCPServer(this.config);
  }

  detectOrchestrator() {
    // Check if orchestrator is available in parent SpecVerse installation
    try {
      const orchestratorPath = path.resolve(this.extensionPath, '../../../src/orchestrator');
      require.resolve(orchestratorPath);
      return true;
    } catch (error) {
      if (verbose) console.log('Orchestrator not detected, using embedded resources only');
      return false;
    }
  }

  async start() {
    return this.server.start();
  }

  getController() {
    return this.server.getController();
  }
}

module.exports = { VSCodeExtensionMCPServer };
`;

writeFileSync(join(distDir, 'extension-wrapper.js'), extensionWrapper);

// Create extension configuration
if (verbose) console.log('⚙️  Creating extension configuration...');
const extensionConfig = `{
  "mode": "extension",
  "features": {
    "orchestrator": "conditional",
    "fileSystemResources": true,
    "embeddedResources": true,
    "hybridMode": true
  },
  "resourcesPath": "./resources",
  "vscode": {
    "activationEvents": [
      "onLanguage:specverse",
      "workspaceContains:**/*.specly"
    ],
    "capabilities": [
      "mcp-server",
      "resource-provider",
      "tool-provider"
    ]
  }
}`;

writeFileSync(join(distDir, 'config.json'), extensionConfig);

// Create package.json for extension
const extensionPackage = {
  name: 'specverse-mcp-extension',
  version: '1.0.0',
  description: 'SpecVerse MCP Server for VSCode Extension',
  main: 'extension-wrapper.js',
  engines: {
    node: '>=16.0.0',
    vscode: '^1.80.0'
  },
  dependencies: {
    '@modelcontextprotocol/sdk': '^1.17.4',
    'yaml': '^2.8.1',
    'zod': '^3.25.76'
  }
};

writeFileSync(join(distDir, 'package.json'), JSON.stringify(extensionPackage, null, 2));

if (verbose) console.log('✅ Extension build complete!');
if (verbose) console.log('📍 Output: dist/extension/');
if (verbose) console.log('🔌 VSCode integration ready');
if (verbose) console.log('🚀 Use extension-wrapper.js in VSCode extension');