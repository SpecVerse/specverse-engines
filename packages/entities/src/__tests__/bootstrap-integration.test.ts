import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  bootstrapEntityModules,
  getCoreModuleNames,
  getExtensionModuleNames,
  getEntityRegistry,
  resetEntityRegistry,
  type EntityModule,
} from '../index.js';
import { loadManifest } from '../_shared/manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const entitiesDir = resolve(__dirname, '..');

beforeEach(() => {
  resetEntityRegistry();
});

describe('Entity Module Bootstrap & Integration', () => {

  // --------------------------------------------------------------------------
  // Bootstrap
  // --------------------------------------------------------------------------

  describe('bootstrap', () => {
    it('should register all core + extension modules', () => {
      const registry = bootstrapEntityModules();
      const coreCount = getCoreModuleNames().length;
      const extCount = getExtensionModuleNames().length;
      expect(registry.size).toBe(coreCount + extCount);
    });

    it('should be idempotent', () => {
      bootstrapEntityModules();
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const coreCount = getCoreModuleNames().length;
      const extCount = getExtensionModuleNames().length;
      expect(registry.size).toBe(coreCount + extCount);
    });

    it('should register all expected modules', () => {
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const allNames = [...getCoreModuleNames(), ...getExtensionModuleNames()];
      for (const name of allNames) {
        expect(registry.hasModule(name), `Missing module: ${name}`).toBe(true);
      }
    });

    it('should return the registry instance', () => {
      const registry = bootstrapEntityModules();
      expect(registry).toBe(getEntityRegistry());
    });
  });

  // --------------------------------------------------------------------------
  // Core Module Names
  // --------------------------------------------------------------------------

  describe('core module names', () => {
    it('should list all 6 core module names', () => {
      const names = getCoreModuleNames();
      expect(names).toHaveLength(6);
      expect(names).toContain('models');
      expect(names).toContain('controllers');
      expect(names).toContain('services');
      expect(names).toContain('events');
      expect(names).toContain('views');
      expect(names).toContain('deployments');
    });

    it('should list all extension module names', () => {
      const names = getExtensionModuleNames();
      expect(names.length).toBeGreaterThanOrEqual(3);
      expect(names).toContain('commands');
      expect(names).toContain('measures');
      expect(names).toContain('conventions');
      expect(names).toContain('promotions');
    });

    it('should match registered modules after bootstrap', () => {
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const names = getCoreModuleNames();
      for (const name of names) {
        expect(registry.hasModule(name)).toBe(true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Dependency Order
  // --------------------------------------------------------------------------

  describe('dependency order', () => {
    it('should resolve dependency order without errors', () => {
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const ordered = registry.getInDependencyOrder();
      expect(ordered).toHaveLength(getCoreModuleNames().length + getExtensionModuleNames().length);
    });

    it('should place models first (no dependencies)', () => {
      bootstrapEntityModules();
      const ordered = getEntityRegistry().getInDependencyOrder();
      expect(ordered[0].name).toBe('models');
    });

    it('should place deployments last (depends on all)', () => {
      bootstrapEntityModules();
      const ordered = getEntityRegistry().getInDependencyOrder();
      expect(ordered[ordered.length - 1].name).toBe('deployments');
    });
  });

  // --------------------------------------------------------------------------
  // Registry Facet Aggregation
  // --------------------------------------------------------------------------

  describe('facet aggregation after bootstrap', () => {
    it('should aggregate convention processors from all modules', () => {
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const processors = registry.getConventionProcessors();
      const allModuleNames = [...getCoreModuleNames(), ...getExtensionModuleNames()];
      expect(processors.size).toBe(allModuleNames.length);
      for (const name of allModuleNames) {
        expect(processors.has(name), `Missing processor: ${name}`).toBe(true);
      }
    });

    it('should aggregate inference rules from all modules', () => {
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const rules = registry.getAllInferenceRules();
      // models: 7, events: 7, views: 17, deployments: 6 = 37 (controllers + services have 0)
      expect(rules.length).toBeGreaterThanOrEqual(30);
    });

    it('should aggregate generators from all modules', () => {
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const generators = registry.getAllGenerators();
      // models: 4, controllers: 1, services: 1, events: 2, views: 1, deployments: 1 = 10
      expect(generators.length).toBeGreaterThanOrEqual(8);
    });

    it('should aggregate diagram plugins from all modules', () => {
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const plugins = registry.getAllDiagramPlugins();
      // models: 2 (er, class), controllers: 1 (architecture), services: 1 (architecture),
      // events: 1 (event-flow), deployments: 2 (deployment, manifest) = 7+
      expect(plugins.length).toBeGreaterThanOrEqual(5);
    });
  });

  // --------------------------------------------------------------------------
  // Module Completeness
  // --------------------------------------------------------------------------

  describe('all modules have required metadata', () => {
    it('should all have name, type, and version', () => {
      bootstrapEntityModules();
      const modules = getEntityRegistry().getAllModules();
      for (const mod of modules) {
        expect(mod.name).toBeTruthy();
        expect(['core', 'extension']).toContain(mod.type);
        expect(mod.version).toBeTruthy();
      }
    });

    it('should all have convention processors', () => {
      bootstrapEntityModules();
      const modules = getEntityRegistry().getAllModules();
      for (const mod of modules) {
        expect(mod.conventionProcessor, `${mod.name} missing conventionProcessor`).toBeDefined();
      }
    });

    it('should all have docs and tests references', () => {
      bootstrapEntityModules();
      const modules = getEntityRegistry().getAllModules();
      for (const mod of modules) {
        expect(mod.docs, `${mod.name} missing docs`).toBeDefined();
        expect(mod.docs!.length, `${mod.name} has no docs`).toBeGreaterThan(0);
        expect(mod.tests, `${mod.name} missing tests`).toBeDefined();
        expect(mod.tests!.length, `${mod.name} has no tests`).toBeGreaterThan(0);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Manifest ↔ Registry Consistency (all modules)
  // --------------------------------------------------------------------------

  describe('manifest-registry consistency', () => {
    // Derive module names from registry — no hardcoded list
    bootstrapEntityModules();
    const moduleNames = getEntityRegistry().getInDependencyOrder().map(m => m.name);

    for (const moduleName of moduleNames) {
      it(`should have consistent manifest for ${moduleName}`, () => {
        bootstrapEntityModules();
        const mod = getEntityRegistry().getModule(moduleName)!;
        const subdir = mod.type === 'core' ? 'core' : 'extensions';
        const manifestPath = resolve(entitiesDir, `${subdir}/${moduleName}/module.yaml`);

        if (!existsSync(manifestPath)) {
          // Skip if manifest doesn't exist yet
          return;
        }

        const manifest = loadManifest(manifestPath);

        expect(manifest.name).toBe(mod.name);
        expect(manifest.type).toBe(mod.type);
        expect(manifest.version).toBe(mod.version);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Convention Processor End-to-End
  // --------------------------------------------------------------------------

  describe('convention processor end-to-end via registry', () => {
    it('should process a basic model through the registry', () => {
      bootstrapEntityModules();
      const processors = getEntityRegistry().getConventionProcessors();
      const modelProcessor = processors.get('models')!;

      const input = {
        User: {
          attributes: {
            name: 'String required',
            email: 'Email required unique',
          },
        },
      };

      const context = { warnings: [] as string[] };
      const result = modelProcessor.process(input, context);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('User');
    });

    it('should process controllers through the registry', () => {
      bootstrapEntityModules();
      const processors = getEntityRegistry().getConventionProcessors();
      const controllerProcessor = processors.get('controllers')!;

      const input = {
        UserController: {
          model: 'User',
          cured: {
            create: {},
            retrieve: {},
          },
        },
      };

      const context = { warnings: [] as string[] };
      const result = controllerProcessor.process(input, context);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('UserController');
      expect(result[0].cured).toBeDefined();
    });

    it('should process services through the registry', () => {
      bootstrapEntityModules();
      const processors = getEntityRegistry().getConventionProcessors();
      const serviceProcessor = processors.get('services')!;

      const input = {
        UserService: {
          description: 'User management service',
          operations: {
            validateEmail: { returns: 'Boolean' },
          },
        },
      };

      const context = { warnings: [] as string[] };
      const result = serviceProcessor.process(input, context);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('UserService');
    });

    it('should process events through the registry', () => {
      bootstrapEntityModules();
      const processors = getEntityRegistry().getConventionProcessors();
      const eventProcessor = processors.get('events')!;

      const input = {
        UserCreated: {
          attributes: {
            userId: 'ID required',
          },
        },
      };

      const context = { warnings: [] as string[] };
      const result = eventProcessor.process(input, context);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('UserCreated');
    });

    it('should process views through the registry', () => {
      bootstrapEntityModules();
      const processors = getEntityRegistry().getConventionProcessors();
      const viewProcessor = processors.get('views')!;

      const input = {
        UserListView: {
          type: 'list',
          model: 'User',
          layout: 'list',
        },
      };

      const context = { warnings: [] as string[] };
      const result = viewProcessor.process(input, context);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('UserListView');
    });

    it('should process deployments through the registry', () => {
      bootstrapEntityModules();
      const processors = getEntityRegistry().getConventionProcessors();
      const deploymentProcessor = processors.get('deployments')!;

      const input = {
        production: {
          environment: 'production',
          instances: {},
        },
      };

      const context = { warnings: [] as string[] };
      const result = deploymentProcessor.process(input, context);
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('production');
    });
  });

  // --------------------------------------------------------------------------
  // Public API Exports
  // --------------------------------------------------------------------------

  describe('public API exports', () => {
    it('should export all core modules from barrel', async () => {
      const api = await import('../index.js');

      expect(api.EntityRegistry).toBeDefined();
      expect(api.getEntityRegistry).toBeDefined();
      expect(api.resetEntityRegistry).toBeDefined();
      expect(api.bootstrapEntityModules).toBeDefined();
      expect(api.getCoreModuleNames).toBeDefined();
      expect(api.getExtensionModuleNames).toBeDefined();
      expect(api.loadManifest).toBeDefined();
      expect(api.validateManifest).toBeDefined();

      // All 6 core modules
      expect(api.modelsModule).toBeDefined();
      expect(api.controllersModule).toBeDefined();
      expect(api.servicesModule).toBeDefined();
      expect(api.eventsModule).toBeDefined();
      expect(api.viewsModule).toBeDefined();
      expect(api.deploymentsModule).toBeDefined();

      // All 3 extension modules
      expect(api.commandsModule).toBeDefined();
      expect(api.measuresModule).toBeDefined();
      expect(api.conventionsModule).toBeDefined();
    });
  });
});
