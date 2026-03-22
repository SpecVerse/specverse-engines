/**
 * SpecVerse Instance Factory Library
 *
 * Complete system for loading, managing, and resolving instance factories
 * from YAML definitions to resolved configurations for code generation.
 */

// Core library management
export {
  InstanceFactoryLibrary,
  createDefaultLibrary,
  type QueryOptions
} from './library.js';

// Loading instance factories
export {
  loadInstanceFactory,
  loadInstanceFactories,
  loadFromMultipleSources,
  type LoadOptions,
  type LoadResult,
  type ValidationError as LoadValidationError,
  type LoadManyResult
} from './loader.js';

// Validation
export {
  InstanceFactoryValidator,
  type CompatibilityResult,
  type DependencyResolutionResult
} from './validator.js';

// Resolution
export {
  InstanceFactoryResolver,
  ResolutionError,
  createResolver,
  type ResolverConfig,
  type ResolutionContext
} from './resolver.js';

// Re-export types from types module for convenience
export type {
  InstanceFactory,
  InstanceFactoryReference,
  CapabilityMapping,
  ResolvedImplementation,
  CodeTemplate,
  TechnologyStack,
  Capabilities,
  Dependencies,
  Dependency,
  CompatibilityRequirements,
  InstanceFactoryMetadata,
  TemplateContext,
  TemplateEngine,
  LibrarySource,
  LibraryConfig
} from '../types/index.js';
