/**
 * SpecVerse Template Engines
 *
 * Template engines for generating code from implementation types.
 */

// TypeScript template engine
export {
  TypeScriptTemplateEngine,
  TemplateEngineError,
  type GeneratorFunction,
  type ValidatorFunction,
  type PostProcessorFunction
} from './typescript-engine.js';

// Engine registry
export {
  TemplateEngineRegistry,
  EngineNotFoundError,
  createDefaultRegistry,
  getGlobalRegistry,
  setGlobalRegistry,
  resetGlobalRegistry,
  type EngineRegistryConfig
} from './engine-registry.js';

// Code generator
export {
  CodeGenerator,
  createCodeGenerator,
  type GeneratedOutput,
  type CodeGenerationOptions
} from './code-generator.js';

// Re-export types for convenience
export type {
  TemplateEngine,
  CodeTemplate,
  TemplateContext,
  ValidationResult
} from '../types/index.js';
