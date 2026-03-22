/**
 * Entity Module Framework — Core Types
 *
 * Defines interfaces for entity modules, convention processors, inference rules,
 * generators, diagram plugins, and the entity registry.
 *
 * Moved from entities/_shared/types.ts to break the parser ↔ entities cycle.
 * Both parser and entities now import these from @specverse/types.
 */

import type { ProcessorContext } from './processor.js';

// Convention Processor Interface
export interface EntityConventionProcessor<TInput = any, TOutput = any> {
  process(input: TInput, context: ProcessorContext, ...args: any[]): TOutput;
}

// Inference Rule Interface
export interface EntityInferenceRule {
  id: string;
  description: string;
  triggeredBy: string;
  generates?: string[];
  priority?: number;
}

// Generator Interface
export interface EntityGenerator {
  name: string;
  capability?: string;
  factoryPath?: string;
}

// Diagram Plugin Interface
export interface EntityDiagramPlugin {
  type: string;
  variants?: string[];
}

// Documentation Reference
export interface EntityDocReference {
  title: string;
  category: 'example' | 'guide' | 'reference' | 'architecture';
  path: string;
  description?: string;
}

// Test Reference
export interface EntityTestReference {
  title: string;
  category: 'unit' | 'integration' | 'example-spec' | 'parity';
  path: string;
  description?: string;
}

// Behavioural Specification
export interface EntityBehaviourSpec {
  invariantsPath: string;
  rulesPath: string;
  invariantsModule: string;
  rulesModule: string;
  invariantCount: number;
  ruleCount: number;
}

// Entity Module Interface
export interface EntityModule {
  name: string;
  type: 'core' | 'extension';
  version: string;
  dependsOn: string[];
  schema?: object;
  conventionProcessor?: EntityConventionProcessor;
  inferenceRules?: EntityInferenceRule[];
  generators?: EntityGenerator[];
  diagramPlugins?: EntityDiagramPlugin[];
  behaviourSpec?: EntityBehaviourSpec;
  docs?: EntityDocReference[];
  tests?: EntityTestReference[];
}

// Entity Registry Interface
export interface EntityRegistryInterface {
  register(module: EntityModule): void;
  getModule(name: string): EntityModule | undefined;
  getAllModules(): EntityModule[];
  getInDependencyOrder(): EntityModule[];
  getConventionProcessors(): Map<string, EntityConventionProcessor>;
  getAllInferenceRules(): EntityInferenceRule[];
  getAllGenerators(): EntityGenerator[];
  getAllDiagramPlugins(): EntityDiagramPlugin[];
  hasModule(name: string): boolean;
}
