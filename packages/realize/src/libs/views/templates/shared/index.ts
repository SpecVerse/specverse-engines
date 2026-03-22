/**
 * Shared View Templates - Framework-Agnostic Components
 *
 * This module exports framework-agnostic component definitions and utilities
 * that can be used by both runtime renderers and code generators.
 *
 * NO REACT DEPENDENCIES - Safe to import from any environment
 */

// Component registries
export {
  ATOMIC_COMPONENTS_REGISTRY,
  AtomicComponentDefinition
} from './atomic-components-registry.js';

// Component metadata and patterns
export * from './component-metadata.js';

// Type definitions
export {
  ComponentAdapter,
  ComponentLibraryAdapter,
  ComponentMapping,
  RenderContext,
  renderProps,
  indent,
  wrapWithChildren
} from './adapter-types.js';

// Mappers
export * from './property-mapper.js';
export * from './syntax-mapper.js';

// Base generator utilities
export {
  BaseComponentGenerator,
  ViewSpec,
  StateDefinition,
  EventDefinition,
  UIComponent,
  RenderContext as GeneratorRenderContext,
  GeneratorConfig,
  extractComponentTypes,
  countComponents,
  validateNestingDepth
} from './base-generator.js';

// Composite view patterns (NEW - tech-independent patterns)
export * from './composite-pattern-types.js';
export {
  COMPOSITE_VIEW_PATTERNS,
  FORM_VIEW_PATTERN,
  LIST_VIEW_PATTERN,
  DETAIL_VIEW_PATTERN,
  DASHBOARD_VIEW_PATTERN,
  getPattern,
  getPatternsByCategory,
  getPatternsByTag,
  getPatternIds,
  hasPattern
} from './composite-patterns.js';

// Pattern validation
export {
  validatePattern,
  validatePatternRegistry,
  getValidationSummary
} from './pattern-validator.js';
