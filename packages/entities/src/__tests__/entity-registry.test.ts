import { describe, it, expect, beforeEach } from 'vitest';
import { EntityRegistry, resetEntityRegistry } from '../_registry.js';
import type { EntityModule, EntityConventionProcessor } from '../_shared/types.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createModule(overrides: Partial<EntityModule> & { name: string }): EntityModule {
  return {
    type: 'core',
    version: '3.5.1',
    dependsOn: [],
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('EntityRegistry', () => {
  let registry: EntityRegistry;

  beforeEach(() => {
    registry = new EntityRegistry();
  });

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  describe('register', () => {
    it('should register a module', () => {
      const mod = createModule({ name: 'models' });
      registry.register(mod);
      expect(registry.hasModule('models')).toBe(true);
      expect(registry.size).toBe(1);
    });

    it('should register multiple modules', () => {
      registry.register(createModule({ name: 'models' }));
      registry.register(createModule({ name: 'controllers', dependsOn: ['models'] }));
      expect(registry.size).toBe(2);
    });

    it('should throw on duplicate module name', () => {
      registry.register(createModule({ name: 'models' }));
      expect(() => {
        registry.register(createModule({ name: 'models' }));
      }).toThrow('already registered');
    });

    it('should throw when dependency is not registered', () => {
      expect(() => {
        registry.register(createModule({ name: 'controllers', dependsOn: ['models'] }));
      }).toThrow('depends on "models"');
    });

    it('should accept module with satisfied dependency', () => {
      registry.register(createModule({ name: 'models' }));
      expect(() => {
        registry.register(createModule({ name: 'controllers', dependsOn: ['models'] }));
      }).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Retrieval
  // --------------------------------------------------------------------------

  describe('getModule', () => {
    it('should return registered module', () => {
      const mod = createModule({ name: 'models' });
      registry.register(mod);
      expect(registry.getModule('models')).toBe(mod);
    });

    it('should return undefined for unregistered module', () => {
      expect(registry.getModule('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllModules', () => {
    it('should return all registered modules', () => {
      registry.register(createModule({ name: 'models' }));
      registry.register(createModule({ name: 'events', dependsOn: ['models'] }));
      const all = registry.getAllModules();
      expect(all).toHaveLength(2);
      expect(all.map(m => m.name)).toContain('models');
      expect(all.map(m => m.name)).toContain('events');
    });

    it('should return empty array when no modules registered', () => {
      expect(registry.getAllModules()).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Dependency Ordering
  // --------------------------------------------------------------------------

  describe('getInDependencyOrder', () => {
    it('should return modules with no deps in alphabetical order', () => {
      registry.register(createModule({ name: 'storage' }));
      registry.register(createModule({ name: 'models' }));
      const ordered = registry.getInDependencyOrder();
      expect(ordered.map(m => m.name)).toEqual(['models', 'storage']);
    });

    it('should return dependencies before dependents', () => {
      registry.register(createModule({ name: 'models' }));
      registry.register(createModule({ name: 'events', dependsOn: ['models'] }));
      registry.register(createModule({ name: 'services', dependsOn: ['models', 'events'] }));
      const ordered = registry.getInDependencyOrder();
      const names = ordered.map(m => m.name);

      expect(names.indexOf('models')).toBeLessThan(names.indexOf('events'));
      expect(names.indexOf('models')).toBeLessThan(names.indexOf('services'));
      expect(names.indexOf('events')).toBeLessThan(names.indexOf('services'));
    });

    it('should handle diamond dependencies', () => {
      registry.register(createModule({ name: 'models' }));
      registry.register(createModule({ name: 'events', dependsOn: ['models'] }));
      registry.register(createModule({ name: 'lifecycles', dependsOn: ['models'] }));
      registry.register(createModule({
        name: 'services',
        dependsOn: ['models', 'events', 'lifecycles'],
      }));
      const ordered = registry.getInDependencyOrder();
      const names = ordered.map(m => m.name);

      expect(names[0]).toBe('models');
      expect(names.indexOf('events')).toBeLessThan(names.indexOf('services'));
      expect(names.indexOf('lifecycles')).toBeLessThan(names.indexOf('services'));
    });

    it('should detect circular dependencies', () => {
      // We need to bypass the registration check to create a cycle
      // since register() validates deps exist.
      // Instead, test with a module that depends on itself through others.
      // Create modules without deps first, then modify.
      const modA = createModule({ name: 'a' });
      const modB = createModule({ name: 'b', dependsOn: ['a'] });

      registry.register(modA);
      registry.register(modB);

      // Now hack in a circular dep for testing
      (modA as any).dependsOn = ['b'];

      // Clear cache
      (registry as any).dependencyOrder = null;

      expect(() => registry.getInDependencyOrder()).toThrow('Circular dependency');
    });

    it('should cache dependency order', () => {
      registry.register(createModule({ name: 'models' }));
      const first = registry.getInDependencyOrder();
      const second = registry.getInDependencyOrder();
      expect(first).toBe(second); // Same reference = cached
    });

    it('should invalidate cache on new registration', () => {
      registry.register(createModule({ name: 'models' }));
      const first = registry.getInDependencyOrder();

      registry.register(createModule({ name: 'events', dependsOn: ['models'] }));
      const second = registry.getInDependencyOrder();

      expect(first).not.toBe(second);
      expect(second).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Facet Aggregation
  // --------------------------------------------------------------------------

  describe('getConventionProcessors', () => {
    it('should return processors from modules that have them', () => {
      const processor: EntityConventionProcessor = {
        process: (input: any) => input,
      };
      registry.register(createModule({ name: 'models', conventionProcessor: processor }));
      registry.register(createModule({ name: 'storage' })); // no processor

      const processors = registry.getConventionProcessors();
      expect(processors.size).toBe(1);
      expect(processors.has('models')).toBe(true);
      expect(processors.get('models')).toBe(processor);
    });

    it('should return empty map when no processors', () => {
      registry.register(createModule({ name: 'models' }));
      expect(registry.getConventionProcessors().size).toBe(0);
    });
  });

  describe('getAllInferenceRules', () => {
    it('should aggregate rules from all modules', () => {
      registry.register(createModule({
        name: 'models',
        inferenceRules: [
          { id: 'model-controller', description: 'Generate controller from model', triggeredBy: 'models' },
          { id: 'model-service', description: 'Generate service from model', triggeredBy: 'models' },
        ],
      }));
      registry.register(createModule({
        name: 'events',
        dependsOn: ['models'],
        inferenceRules: [
          { id: 'event-handler', description: 'Generate handler from event', triggeredBy: 'events' },
        ],
      }));

      const rules = registry.getAllInferenceRules();
      expect(rules).toHaveLength(3);
    });

    it('should sort rules by priority', () => {
      registry.register(createModule({
        name: 'models',
        inferenceRules: [
          { id: 'low-priority', description: 'Low', triggeredBy: 'models', priority: 200 },
          { id: 'high-priority', description: 'High', triggeredBy: 'models', priority: 10 },
        ],
      }));

      const rules = registry.getAllInferenceRules();
      expect(rules[0].id).toBe('high-priority');
      expect(rules[1].id).toBe('low-priority');
    });

    it('should default priority to 100', () => {
      registry.register(createModule({
        name: 'models',
        inferenceRules: [
          { id: 'explicit', description: 'Explicit', triggeredBy: 'models', priority: 50 },
          { id: 'default', description: 'Default', triggeredBy: 'models' }, // priority defaults to 100
        ],
      }));

      const rules = registry.getAllInferenceRules();
      expect(rules[0].id).toBe('explicit');
      expect(rules[1].id).toBe('default');
    });
  });

  describe('getAllGenerators', () => {
    it('should aggregate generators from all modules', () => {
      registry.register(createModule({
        name: 'models',
        generators: [
          { name: 'prisma', capability: 'storage.database' },
        ],
      }));
      registry.register(createModule({
        name: 'controllers',
        dependsOn: ['models'],
        generators: [
          { name: 'fastify-routes', capability: 'api.rest' },
        ],
      }));

      const generators = registry.getAllGenerators();
      expect(generators).toHaveLength(2);
      expect(generators.map(g => g.name)).toContain('prisma');
      expect(generators.map(g => g.name)).toContain('fastify-routes');
    });
  });

  describe('getAllDiagramPlugins', () => {
    it('should aggregate diagram plugins from all modules', () => {
      registry.register(createModule({
        name: 'models',
        diagramPlugins: [
          { type: 'er' },
          { type: 'class' },
        ],
      }));
      registry.register(createModule({
        name: 'events',
        dependsOn: ['models'],
        diagramPlugins: [
          { type: 'event-flow', variants: ['layered', 'sequence', 'swimlane'] },
        ],
      }));

      const plugins = registry.getAllDiagramPlugins();
      expect(plugins).toHaveLength(3);
    });
  });

  // --------------------------------------------------------------------------
  // Clear / Reset
  // --------------------------------------------------------------------------

  describe('clear', () => {
    it('should remove all modules', () => {
      registry.register(createModule({ name: 'models' }));
      registry.register(createModule({ name: 'events', dependsOn: ['models'] }));
      expect(registry.size).toBe(2);

      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.getAllModules()).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Core vs Extension
  // --------------------------------------------------------------------------

  describe('module types', () => {
    it('should support both core and extension modules', () => {
      registry.register(createModule({ name: 'models', type: 'core' }));
      registry.register(createModule({
        name: 'measures',
        type: 'extension',
        dependsOn: ['models'],
      }));

      const all = registry.getAllModules();
      expect(all.find(m => m.name === 'models')?.type).toBe('core');
      expect(all.find(m => m.name === 'measures')?.type).toBe('extension');
    });
  });

  // --------------------------------------------------------------------------
  // Full Registration Scenario
  // --------------------------------------------------------------------------

  describe('full scenario', () => {
    it('should handle the complete core entity dependency graph', () => {
      // Register in dependency order (as the real system would)
      registry.register(createModule({ name: 'models' }));
      registry.register(createModule({ name: 'storage' }));
      registry.register(createModule({ name: 'events', dependsOn: ['models'] }));
      registry.register(createModule({ name: 'lifecycles', dependsOn: ['models'] }));
      registry.register(createModule({ name: 'services', dependsOn: ['models', 'events'] }));
      registry.register(createModule({ name: 'controllers', dependsOn: ['models', 'services'] }));
      registry.register(createModule({
        name: 'views',
        dependsOn: ['models', 'controllers', 'services'],
      }));
      registry.register(createModule({
        name: 'deployments',
        dependsOn: ['models', 'controllers', 'services', 'views'],
      }));
      registry.register(createModule({
        name: 'manifests',
        dependsOn: ['deployments'],
      }));

      expect(registry.size).toBe(9);

      const ordered = registry.getInDependencyOrder();
      const names = ordered.map(m => m.name);

      // models and storage have no deps — should come first
      expect(names.indexOf('models')).toBeLessThan(names.indexOf('events'));
      expect(names.indexOf('models')).toBeLessThan(names.indexOf('lifecycles'));
      expect(names.indexOf('models')).toBeLessThan(names.indexOf('controllers'));
      expect(names.indexOf('events')).toBeLessThan(names.indexOf('services'));
      expect(names.indexOf('services')).toBeLessThan(names.indexOf('controllers'));
      expect(names.indexOf('controllers')).toBeLessThan(names.indexOf('views'));
      expect(names.indexOf('views')).toBeLessThan(names.indexOf('deployments'));
      expect(names.indexOf('deployments')).toBeLessThan(names.indexOf('manifests'));
    });
  });
});
