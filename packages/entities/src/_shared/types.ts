/**
 * Entity Module Framework - Core Types
 *
 * Re-exports from @specverse/types for backward compatibility.
 * The canonical definitions now live in @specverse/types/entity-module.ts
 * to break the parser ↔ entities circular dependency.
 */

export type {
  ProcessorContext,
  EntityConventionProcessor,
  EntityInferenceRule,
  EntityGenerator,
  EntityDiagramPlugin,
  EntityDocReference,
  EntityTestReference,
  EntityBehaviourSpec,
  EntityModule,
  EntityRegistryInterface,
} from '@specverse/types';
