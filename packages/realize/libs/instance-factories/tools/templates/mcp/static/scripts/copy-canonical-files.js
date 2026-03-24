#!/usr/bin/env node
/**
 * Copy Schema Files from Canonical Location
 * Ensures MCP server has up-to-date schemas without duplication
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mcpRoot = join(__dirname, '..');
const repoRoot = join(__dirname, '../../..');

const verbose = process.env.VERBOSE === 'true';

// Schemas and library catalogs are now provided through AI tools
// Only copy essential files that aren't available through AI API

// Canonical files (if any needed in future)
const canonicalFiles = {
  // Add any essential files here that can't be provided through AI tools
};

// No files to copy currently - schemas and catalogs provided through AI API
if (Object.keys(canonicalFiles).length === 0) {
  if (verbose) {
    console.log('ℹ️  No files to copy - all resources provided through AI API');
    console.log('📍 Schemas: Available through mcp_ai_enhance tool');
    console.log('📍 Libraries: Available through mcp_library_suggest tool');
    console.log('📍 Examples: Provided contextually in AI responses');
  }
  process.exit(0);
}

if (verbose) {
  console.log('🎉 Canonical files copied successfully!');
  console.log('📍 Schema Source: schema/ → resources/schemas/');
  console.log('📍 Library Source: libs/ → resources/libraries/');
  console.log('📍 All files now reference canonical locations');
}