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