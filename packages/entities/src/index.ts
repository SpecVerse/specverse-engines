/**
 * Entity Module System - Public API
 *
 * Re-exports the entity framework types, registry, manifest loader,
 * bootstrap function, and core entity modules for use by subsystem
 * orchestrators and external consumers.
 */

// Core types
export type {
  EntityModule,
  EntityRegistryInterface,
  EntityConventionProcessor,
  EntityInferenceRule,
  EntityGenerator,
  EntityDiagramPlugin,
  EntityBehaviourSpec,
  EntityDocReference,
  EntityTestReference,
} from './_shared/types.js';

// Registry
export {
  EntityRegistry,
  getEntityRegistry,
  resetEntityRegistry,
} from './_registry.js';

// Manifest loader
export {
  loadManifest,
  validateManifest,
  type ModuleManifest,
  type ManifestFacets,
  type ManifestDiagram,
  type ManifestDelivery,
} from './_shared/manifest.js';

// Bootstrap
export {
  bootstrapEntityModules,
  getCoreModuleNames,
  getExtensionModuleNames,
} from './_bootstrap.js';

// Core entity modules
export { modelsModule } from './core/models/index.js';
export { controllersModule } from './core/controllers/index.js';
export { servicesModule } from './core/services/index.js';
export { eventsModule } from './core/events/index.js';
export { viewsModule } from './core/views/index.js';
export { deploymentsModule } from './core/deployments/index.js';

// Runtime schema composition
export { composeSchemaFromRegistry } from './_shared/schema/compose-runtime.js';

// Behavioural convention processor
export { BehaviouralConventionProcessor } from './_shared/behaviour/convention-processor.js';

// Extension entity modules
export { commandsModule } from './extensions/commands/index.js';
export { measuresModule } from './extensions/measures/index.js';
export { conventionsModule } from './extensions/conventions/index.js';
