import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { controllersModule } from '../core/controllers/index.js';
import { controllerGenerators } from '../core/controllers/generators/index.js';
import { controllerDocs } from '../core/controllers/docs/index.js';
import { controllerTests } from '../core/controllers/tests/index.js';
import { loadManifest, validateManifest } from '../_shared/manifest.js';

// Also import original processor for parity test
import { ControllerProcessor as OriginalProcessor } from '../core/controllers/conventions/controller-processor.js';
import { ControllerProcessor as EntityProcessor } from '../core/controllers/conventions/controller-processor.js';
import type { ProcessorContext } from '@specverse/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const moduleDir = resolve(__dirname, '../core/controllers');
const manifestPath = resolve(moduleDir, 'module.yaml');

// ============================================================================
// Test Helpers
// ============================================================================

function createContext(): ProcessorContext {
  return {
    warnings: [],
    addWarning(message: string) {
      this.warnings.push(message);
    },
  };
}

// Sample controller input for parity testing
const testInput = {
  UserController: {
    model: 'User',
    description: 'User management',
    cured: {
      create: { requires: 'valid user data' },
      retrieve: {},
      update: {},
      delete: {},
    },
    actions: {
      resetPassword: {
        parameters: { email: 'Email' },
        returns: 'Boolean',
      },
    },
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Controllers Entity Module', () => {

  // --------------------------------------------------------------------------
  // Module Metadata
  // --------------------------------------------------------------------------

  describe('module metadata', () => {
    it('should have correct name', () => {
      expect(controllersModule.name).toBe('controllers');
    });

    it('should be a core entity', () => {
      expect(controllersModule.type).toBe('core');
    });

    it('should depend on models', () => {
      expect(controllersModule.dependsOn).toEqual(['models']);
    });

    it('should have a version', () => {
      expect(controllersModule.version).toBeTruthy();
    });

    it('should have a convention processor', () => {
      expect(controllersModule.conventionProcessor).toBeDefined();
      expect(controllersModule.conventionProcessor!.process).toBeInstanceOf(Function);
    });
  });

  // --------------------------------------------------------------------------
  // Convention Processor Parity
  // --------------------------------------------------------------------------

  describe('parity with original ControllerProcessor', () => {
    it('should produce identical output for controller input', () => {
      // Run through entity module processor
      const entityContext = createContext();
      const entityResult = controllersModule.conventionProcessor!.process(
        testInput,
        entityContext
      );

      // Run through original processor
      const originalContext = createContext();
      const originalProcessor = new OriginalProcessor(originalContext);
      const originalResult = originalProcessor.process(testInput);

      // Compare results
      expect(
        JSON.stringify(entityResult),
        'Output differs between entity module and original processor'
      ).toBe(JSON.stringify(originalResult));

      // Compare warnings
      expect(entityContext.warnings).toEqual(originalContext.warnings);
    });

    it('should produce identical output for empty input', () => {
      const entityContext = createContext();
      const entityResult = controllersModule.conventionProcessor!.process({}, entityContext);

      const originalContext = createContext();
      const originalProcessor = new OriginalProcessor(originalContext);
      const originalResult = originalProcessor.process({});

      expect(JSON.stringify(entityResult)).toBe(JSON.stringify(originalResult));
    });
  });

  // --------------------------------------------------------------------------
  // Generators
  // --------------------------------------------------------------------------

  describe('generator metadata', () => {
    it('should declare generators', () => {
      expect(controllerGenerators.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have names', () => {
      for (const gen of controllerGenerators) {
        expect(gen.name).toBeTruthy();
      }
    });

    it('should all have factory paths', () => {
      for (const gen of controllerGenerators) {
        expect(gen.factoryPath).toBeTruthy();
      }
    });

    it('should be included in the controllers module', () => {
      expect(controllersModule.generators).toBeDefined();
      expect(controllersModule.generators).toBe(controllerGenerators);
    });
  });

  // --------------------------------------------------------------------------
  // Documentation References
  // --------------------------------------------------------------------------

  describe('documentation references', () => {
    it('should declare documentation references', () => {
      expect(controllerDocs.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['example', 'guide', 'reference', 'architecture'];
      for (const doc of controllerDocs) {
        expect(validCategories).toContain(doc.category);
      }
    });

    for (const doc of controllerDocs) {
      it(`should have file for "${doc.title}"`, () => {
        const fullPath = resolve(projectRoot, doc.path);
        expect(
          existsSync(fullPath),
          `Doc file not found: ${doc.path}`
        ).toBe(true);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Test References
  // --------------------------------------------------------------------------

  describe('test references', () => {
    it('should declare test references', () => {
      expect(controllerTests.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['unit', 'integration', 'example-spec', 'parity'];
      for (const test of controllerTests) {
        expect(validCategories).toContain(test.category);
      }
    });

    for (const test of controllerTests) {
      // Skip self-reference (this file is being created)
      if (test.path === 'src/entities/__tests__/controllers-entity.test.ts') {
        it(`should reference self: "${test.title}" (skip existence check)`, () => {
          expect(test.path).toBe('src/entities/__tests__/controllers-entity.test.ts');
        });
        continue;
      }
      it(`should have file for "${test.title}"`, () => {
        const fullPath = resolve(projectRoot, test.path);
        expect(
          existsSync(fullPath),
          `Test file not found: ${test.path}`
        ).toBe(true);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Manifest
  // --------------------------------------------------------------------------

  describe('manifest', () => {
    it('should have a module.yaml file', () => {
      expect(existsSync(manifestPath)).toBe(true);
    });

    it('should load without errors', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest).toBeDefined();
    });

    it('should pass validation', () => {
      const manifest = loadManifest(manifestPath);
      const errors = validateManifest(manifest);
      expect(errors).toEqual([]);
    });

    it('should match the TypeScript module definition', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.name).toBe(controllersModule.name);
      expect(manifest.type).toBe(controllersModule.type);
      expect(manifest.version).toBe(controllersModule.version);
      expect(manifest.depends_on).toEqual(controllersModule.dependsOn);
    });
  });

  // --------------------------------------------------------------------------
  // Module Integration
  // --------------------------------------------------------------------------

  describe('module integration', () => {
    it('should have convention processor facet', () => {
      expect(controllersModule.conventionProcessor).toBeDefined();
    });

    it('should have generators facet', () => {
      expect(controllersModule.generators).toBeDefined();
    });

    it('should have docs facet', () => {
      expect(controllersModule.docs).toBeDefined();
      expect(controllersModule.docs).toBe(controllerDocs);
    });

    it('should have tests facet', () => {
      expect(controllersModule.tests).toBeDefined();
      expect(controllersModule.tests).toBe(controllerTests);
    });

    it('should have diagram plugins', () => {
      expect(controllersModule.diagramPlugins).toBeDefined();
      expect(controllersModule.diagramPlugins!.length).toBeGreaterThanOrEqual(1);
    });
  });
});
