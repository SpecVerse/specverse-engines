/**
 * View Instance Factories - Public API
 *
 * Exports all view generation and rendering components
 */

// Shared components
export {
  BaseComponentGenerator,
  ViewSpec,
  StateDefinition,
  EventDefinition,
  UIComponent,
  RenderContext,
  GeneratorConfig,
  extractComponentTypes,
  countComponents,
  validateNestingDepth
} from './templates/shared/base-generator.js';

export * from './templates/shared/property-mapper.js';
export * from './templates/shared/syntax-mapper.js';
export * from './templates/shared/component-metadata.js';
export {
  ATOMIC_COMPONENTS_REGISTRY,
  AtomicComponentDefinition
} from './templates/shared/atomic-components-registry.js';
export {
  ComponentAdapter,
  ComponentLibraryAdapter,
  ComponentMapping,
  renderProps,
  indent,
  wrapWithChildren
} from './templates/shared/adapter-types.js';

// React generator
export * from './templates/react/react-component-generator.js';

// Runtime renderer - exported from @specverse/lang/views/runtime instead
// (not compiled with libs because it has React dependencies)
// export * from './templates/runtime/runtime-view-renderer.js';

// Adapters registry (when we add adapters)
// export * from './adapters/index.js';
