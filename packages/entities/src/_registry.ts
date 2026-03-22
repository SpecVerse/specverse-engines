/**
 * Entity Registry - Discovery, Registration, and Access
 *
 * The central registry that manages all entity modules. Subsystem orchestrators
 * (parser, inference engine, realize, diagram engine) use this registry to find
 * entity-specific logic instead of importing it directly.
 *
 * Discovery order:
 * 1. Core entities from src/entities/core/
 * 2. Extension entities from src/entities/extensions/
 * 3. External entities from node_modules/@specverse/entity-* (future)
 */

import type {
  EntityModule,
  EntityRegistryInterface,
  EntityConventionProcessor,
  EntityInferenceRule,
  EntityGenerator,
  EntityDiagramPlugin,
} from './_shared/types.js';

export class EntityRegistry implements EntityRegistryInterface {
  private modules: Map<string, EntityModule> = new Map();
  private dependencyOrder: EntityModule[] | null = null;

  /**
   * Register an entity module.
   * @throws Error if a module with the same name is already registered
   * @throws Error if the module declares dependencies that aren't registered
   */
  register(module: EntityModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(
        `Entity module "${module.name}" is already registered. ` +
        `Each entity type must have a unique name.`
      );
    }

    // Validate dependencies exist (if any are declared)
    for (const dep of module.dependsOn) {
      if (!this.modules.has(dep)) {
        throw new Error(
          `Entity module "${module.name}" depends on "${dep}", ` +
          `which is not registered. Register dependencies first, ` +
          `or check the dependency name.`
        );
      }
    }

    this.modules.set(module.name, module);
    // Invalidate cached dependency order
    this.dependencyOrder = null;
  }

  getModule(name: string): EntityModule | undefined {
    return this.modules.get(name);
  }

  getAllModules(): EntityModule[] {
    return Array.from(this.modules.values());
  }

  hasModule(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Returns modules in topological order (dependencies before dependents).
   * Uses Kahn's algorithm for deterministic ordering.
   */
  getInDependencyOrder(): EntityModule[] {
    if (this.dependencyOrder) {
      return this.dependencyOrder;
    }

    const modules = this.getAllModules();
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize
    for (const mod of modules) {
      inDegree.set(mod.name, 0);
      adjacency.set(mod.name, []);
    }

    // Build graph
    for (const mod of modules) {
      for (const dep of mod.dependsOn) {
        if (adjacency.has(dep)) {
          adjacency.get(dep)!.push(mod.name);
          inDegree.set(mod.name, (inDegree.get(mod.name) || 0) + 1);
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }
    // Sort the initial queue for deterministic ordering
    queue.sort();

    const result: EntityModule[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const mod = this.modules.get(current)!;
      result.push(mod);

      const dependents = adjacency.get(current) || [];
      // Sort dependents for deterministic ordering
      dependents.sort();
      for (const dependent of dependents) {
        const newDegree = (inDegree.get(dependent) || 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    if (result.length !== modules.length) {
      const missing = modules
        .filter(m => !result.find(r => r.name === m.name))
        .map(m => m.name);
      throw new Error(
        `Circular dependency detected among entity modules: ${missing.join(', ')}. ` +
        `Check the dependsOn declarations.`
      );
    }

    this.dependencyOrder = result;
    return result;
  }

  getConventionProcessors(): Map<string, EntityConventionProcessor> {
    const processors = new Map<string, EntityConventionProcessor>();
    for (const mod of this.getInDependencyOrder()) {
      if (mod.conventionProcessor) {
        processors.set(mod.name, mod.conventionProcessor);
      }
    }
    return processors;
  }

  getAllInferenceRules(): EntityInferenceRule[] {
    const rules: EntityInferenceRule[] = [];
    for (const mod of this.getInDependencyOrder()) {
      if (mod.inferenceRules) {
        rules.push(...mod.inferenceRules);
      }
    }
    // Sort by priority (lower = earlier), stable sort preserves dependency order
    return rules.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  getAllGenerators(): EntityGenerator[] {
    const generators: EntityGenerator[] = [];
    for (const mod of this.getInDependencyOrder()) {
      if (mod.generators) {
        generators.push(...mod.generators);
      }
    }
    return generators;
  }

  getAllDiagramPlugins(): EntityDiagramPlugin[] {
    const plugins: EntityDiagramPlugin[] = [];
    for (const mod of this.getInDependencyOrder()) {
      if (mod.diagramPlugins) {
        plugins.push(...mod.diagramPlugins);
      }
    }
    return plugins;
  }

  /**
   * Clear all registered modules. Useful for testing.
   */
  clear(): void {
    this.modules.clear();
    this.dependencyOrder = null;
  }

  /**
   * Get count of registered modules.
   */
  get size(): number {
    return this.modules.size;
  }
}

// ============================================================================
// Singleton Registry Instance
// ============================================================================

/**
 * The global entity registry instance.
 * Subsystem orchestrators import this to discover entity modules.
 */
let globalRegistry: EntityRegistry | null = null;

/**
 * Get the global entity registry, creating it if needed.
 */
export function getEntityRegistry(): EntityRegistry {
  if (!globalRegistry) {
    globalRegistry = new EntityRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global entity registry. For testing only.
 */
export function resetEntityRegistry(): void {
  if (globalRegistry) {
    globalRegistry.clear();
  }
  globalRegistry = null;
}
