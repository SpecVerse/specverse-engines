/**
 * AI-Optimized Spec Loader Utility
 *
 * Loads SpecVerse YAML files and generates AIOptimizedSpec using:
 * 1. UnifiedSpecVerseParser - Handles YAML parsing, imports, conventions
 * 2. AIViewGenerator - Generates optimized spec with inference
 *
 * This utility eliminates duplicate parsing logic across all generators.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { UnifiedSpecVerseParser } from '@specverse/engine-parser';
import { AIViewGenerator } from '@specverse/engine-generators';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load JSON schema
const getSchemaPath = (): string => {
  // Try multiple paths for schema location
  const possiblePaths = [
    resolve(process.cwd(), 'schema/SPECVERSE-SCHEMA.json'),
    resolve(__dirname, '../../../schema/SPECVERSE-SCHEMA.json'),
    resolve(__dirname, '../../schema/SPECVERSE-SCHEMA.json'),
  ];

  for (const path of possiblePaths) {
    try {
      if (existsSync(path)) {
        return path;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  return possiblePaths[0]; // Fallback to cwd
};

const schemaPath = getSchemaPath();
const schemaJson = JSON.parse(readFileSync(schemaPath, 'utf8'));

export interface LoadOptions {
  deployment?: string;
  instance?: string;
  manifest?: any;
}

export interface ComponentMetadata {
  name: string;
  version: string;
  description?: string;
  tags?: string[];
  deployment?: string;
  instance?: string;
  manifest?: any;
}

export interface AIOptimizedSpec {
  metadata: {
    component: string;
    version: string;
    description?: string;
    tags?: string[];
    deployment?: string;
    instance?: string;
    manifest?: any;
  };
  models: any[];
  controllers: any[];
  services: any[];
  events: any[];
  views?: any[];
  infrastructure?: any;
}

/**
 * Load and generate AIOptimizedSpec from a SpecVerse YAML file
 */
export function loadAIOptimizedSpec(yamlFile: string, options: LoadOptions = {}): AIOptimizedSpec {
  try {
    // 1. Read YAML file
    const yamlContent = readFileSync(yamlFile, 'utf8');

    // 2. Parse with UnifiedSpecVerseParser (handles imports, conventions, validation)
    const parser = new UnifiedSpecVerseParser(schemaJson);
    const result = parser.parse(yamlContent, 'specly');

    // Check for parse errors
    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors
        .map((err: any) => `  - ${err.message} (line ${err.line || '?'}, col ${err.column || '?'})`)
        .join('\n');

      throw new Error(`Parse errors in ${yamlFile}:\n${errorMessages}`);
    }

    // Check for warnings (non-fatal)
    if (result.warnings && result.warnings.length > 0) {
      console.warn(`⚠️  Warnings in ${yamlFile}:`);
      result.warnings.forEach((warn: any) => {
        console.warn(`  - ${warn.message}`);
      });
    }

    // 3. Generate AIOptimizedSpec (runs inference, expands CURED, etc.)
    const generator = new AIViewGenerator();
    const optimized = generator.generate(result.ast, options);

    return optimized as AIOptimizedSpec;

  } catch (error: any) {
    // Provide helpful error messages
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${yamlFile}`);
    }

    throw error;
  }
}

/**
 * Load AIOptimizedSpec with deployment filtering
 */
export function loadForDeployment(
  yamlFile: string,
  deploymentName: string,
  instanceName: string
): AIOptimizedSpec {
  return loadAIOptimizedSpec(yamlFile, {
    deployment: deploymentName,
    instance: instanceName
  });
}

/**
 * Load AIOptimizedSpec with manifest configuration
 */
export function loadWithManifest(yamlFile: string, manifestConfig: any): AIOptimizedSpec {
  return loadAIOptimizedSpec(yamlFile, {
    manifest: manifestConfig
  });
}

/**
 * Get component metadata from AIOptimizedSpec
 */
export function getComponentMetadata(spec: AIOptimizedSpec): ComponentMetadata {
  return {
    name: spec.metadata.component,
    version: spec.metadata.version,
    description: spec.metadata.description,
    tags: spec.metadata.tags,
    deployment: spec.metadata.deployment,
    instance: spec.metadata.instance,
    manifest: spec.metadata.manifest
  };
}

/**
 * Get all models from AIOptimizedSpec
 */
export function getModels(spec: AIOptimizedSpec): any[] {
  return spec.models || [];
}

/**
 * Get all controllers from AIOptimizedSpec
 */
export function getControllers(spec: AIOptimizedSpec): any[] {
  return spec.controllers || [];
}

/**
 * Get all services from AIOptimizedSpec
 */
export function getServices(spec: AIOptimizedSpec): any[] {
  return spec.services || [];
}

/**
 * Get all events from AIOptimizedSpec
 */
export function getEvents(spec: AIOptimizedSpec): any[] {
  return spec.events || [];
}

/**
 * Get infrastructure requirements from AIOptimizedSpec
 */
export function getInfrastructure(spec: AIOptimizedSpec): any {
  return spec.infrastructure || {};
}
