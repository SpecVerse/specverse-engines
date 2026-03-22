/**
 * SpecVerse v3.1 Parser - Public API
 * 
 * Unified parser architecture with backward compatibility
 * Simple, powerful YAML + conventions parser with optional imports
 */

// Export unified parser
export { 
  UnifiedSpecVerseParser
} from './unified-parser.js';

// Export types from unified parser
export type { 
  ParseOptions,
  ParseResult, 
  ResolvedImportInfo,
  ValidationError,
  ComponentTypeInfo
} from './unified-parser.js';

// Export all types from unified parser
export { ConventionProcessor } from './convention-processor.js';
export type {
  SpecVerseAST,
  AttributeSpec,
  RelationshipSpec,
  LifecycleSpec,
  ExecutablePropertiesSpec,
  SubscriptionSpec,
  CuredOperationsSpec,
  ModelSpec,
  ControllerSpec,
  ServiceSpec,
  ViewSpec,
  EventSpec,
  ManifestSpec
} from './types/ast.js';

// Re-export for convenience
import fs from 'fs';
import { UnifiedSpecVerseParser } from './unified-parser.js';

/**
 * Parse a SpecVerse YAML file
 */
export function parseSpecVerseFile(filePath: string, schemaPath: string) {
  const yamlContent = fs.readFileSync(filePath, 'utf8');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  
  const parser = new UnifiedSpecVerseParser(schema);
  return parser.parse(yamlContent);
}

/**
 * Parse SpecVerse YAML content with embedded schema
 */
export function parseSpecVerse(yamlContent: string, schema: any) {
  const parser = new UnifiedSpecVerseParser(schema);
  return parser.parse(yamlContent);
}

// ============================================================================
// Engine adapter — implements SpecVerseEngine for discovery via EngineRegistry
// ============================================================================

import type { ParserEngine, EngineInfo, ParseResult, ParseOptions } from '@specverse/types';

class SpecVerseParserEngine implements ParserEngine {
  name = 'parser';
  version = '3.5.2';
  capabilities = ['parse', 'validate', 'convention-processing', 'import-resolution'];

  private parser: UnifiedSpecVerseParser | null = null;
  private initialized = false;

  async initialize(config?: { schema?: any }): Promise<void> {
    this.parser = new UnifiedSpecVerseParser(config?.schema || {});
    this.initialized = true;
  }

  getInfo(): EngineInfo {
    return { name: this.name, version: this.version, capabilities: this.capabilities };
  }

  parseContent(content: string, filename?: string): ParseResult {
    if (!this.parser) throw new Error('Parser not initialized. Call initialize() first.');
    return this.parser.parseContent(content, filename);
  }

  async parseFileWithImports(filePath: string, options?: ParseOptions): Promise<ParseResult> {
    if (!this.parser) throw new Error('Parser not initialized. Call initialize() first.');
    return this.parser.parseFileWithImports(filePath, options);
  }
}

/** Singleton engine instance for EngineRegistry discovery */
export const engine = new SpecVerseParserEngine();
export default engine;