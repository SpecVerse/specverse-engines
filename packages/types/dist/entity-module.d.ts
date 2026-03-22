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
export interface EntityConventionProcessor<TInput = any, TOutput = any> {
    process(input: TInput, context: ProcessorContext, ...args: any[]): TOutput;
}
export interface EntityInferenceRule {
    id: string;
    description: string;
    triggeredBy: string;
    generates?: string[];
    priority?: number;
}
export interface EntityGenerator {
    name: string;
    capability?: string;
    factoryPath?: string;
}
export interface EntityDiagramPlugin {
    type: string;
    variants?: string[];
}
export interface EntityDocReference {
    title: string;
    category: 'example' | 'guide' | 'reference' | 'architecture';
    path: string;
    description?: string;
}
export interface EntityTestReference {
    title: string;
    category: 'unit' | 'integration' | 'example-spec' | 'parity';
    path: string;
    description?: string;
}
export interface EntityBehaviourSpec {
    invariantsPath: string;
    rulesPath: string;
    invariantsModule: string;
    rulesModule: string;
    invariantCount: number;
    ruleCount: number;
}
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
//# sourceMappingURL=entity-module.d.ts.map