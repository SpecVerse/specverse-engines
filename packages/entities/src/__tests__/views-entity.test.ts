import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { viewsModule } from '../core/views/index.js';
import { viewInferenceRules, loadViewRules, loadSpecialistViewRules, loadSpecialistViews, loadViewComponentInference } from '../core/views/inference/index.js';
import { viewGenerators } from '../core/views/generators/index.js';
import { viewDocs } from '../core/views/docs/index.js';
import { viewTests } from '../core/views/tests/index.js';
import { loadManifest, validateManifest } from '../_shared/manifest.js';

// Also import original processor for parity test
import { ViewProcessor as OriginalProcessor } from '../core/views/conventions/view-processor.js';
import { ViewProcessor as EntityProcessor } from '../core/views/conventions/view-processor.js';
import type { ProcessorContext } from '@specverse/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const moduleDir = resolve(__dirname, '../core/views');
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

// Sample view input for parity testing
const testInput = {
  UserListView: {
    type: 'list',
    model: 'User',
    layout: 'list',
    description: 'Display all users',
  },
  UserFormView: {
    type: 'form',
    model: 'User',
    layout: 'form',
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Views Entity Module', () => {

  // --------------------------------------------------------------------------
  // Module Metadata
  // --------------------------------------------------------------------------

  describe('module metadata', () => {
    it('should have correct name', () => {
      expect(viewsModule.name).toBe('views');
    });

    it('should be a core entity', () => {
      expect(viewsModule.type).toBe('core');
    });

    it('should depend on models and controllers', () => {
      expect(viewsModule.dependsOn).toEqual(['models', 'controllers']);
    });

    it('should have a version', () => {
      expect(viewsModule.version).toBeTruthy();
    });

    it('should have a convention processor', () => {
      expect(viewsModule.conventionProcessor).toBeDefined();
      expect(viewsModule.conventionProcessor!.process).toBeInstanceOf(Function);
    });
  });

  // --------------------------------------------------------------------------
  // Convention Processor Parity
  // --------------------------------------------------------------------------

  describe('parity with original ViewProcessor', () => {
    it('should produce identical output for view input', () => {
      // Run through entity module processor
      const entityContext = createContext();
      const entityResult = viewsModule.conventionProcessor!.process(
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
      const entityResult = viewsModule.conventionProcessor!.process({}, entityContext);

      const originalContext = createContext();
      const originalProcessor = new OriginalProcessor(originalContext);
      const originalResult = originalProcessor.process({});

      expect(JSON.stringify(entityResult)).toBe(JSON.stringify(originalResult));
    });
  });

  // --------------------------------------------------------------------------
  // Inference Rules
  // --------------------------------------------------------------------------

  describe('inference rules', () => {
    it('should have 17 view inference rules', () => {
      expect(viewInferenceRules).toHaveLength(17);
    });

    it('should all have unique IDs', () => {
      const ids = viewInferenceRules.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should all generate views', () => {
      for (const rule of viewInferenceRules) {
        expect(rule.generates).toContain('views');
      }
    });

    it('should include specialist view types', () => {
      const specialists = viewInferenceRules.filter(r => r.id.startsWith('views:specialist_'));
      expect(specialists.length).toBeGreaterThanOrEqual(10);
    });

    it('should load view rules JSON without error', () => {
      const rules = loadViewRules();
      expect(rules).toBeDefined();
    });

    it('should load specialist view rules JSON without error', () => {
      const rules = loadSpecialistViewRules();
      expect(rules).toBeDefined();
    });

    it('should load specialist views JSON without error', () => {
      const views = loadSpecialistViews();
      expect(views).toBeDefined();
    });

    it('should load view component inference JSON without error', () => {
      const components = loadViewComponentInference();
      expect(components).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Generators
  // --------------------------------------------------------------------------

  describe('generator metadata', () => {
    it('should declare generators', () => {
      expect(viewGenerators.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have names', () => {
      for (const gen of viewGenerators) {
        expect(gen.name).toBeTruthy();
      }
    });

    it('should all have factory paths', () => {
      for (const gen of viewGenerators) {
        expect(gen.factoryPath).toBeTruthy();
      }
    });

    it('should be included in the views module', () => {
      expect(viewsModule.generators).toBeDefined();
      expect(viewsModule.generators).toBe(viewGenerators);
    });
  });

  // --------------------------------------------------------------------------
  // Documentation References
  // --------------------------------------------------------------------------

  describe('documentation references', () => {
    it('should declare documentation references', () => {
      expect(viewDocs.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['example', 'guide', 'reference', 'architecture'];
      for (const doc of viewDocs) {
        expect(validCategories).toContain(doc.category);
      }
    });

    for (const doc of viewDocs) {
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
      expect(viewTests.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['unit', 'integration', 'example-spec', 'parity'];
      for (const test of viewTests) {
        expect(validCategories).toContain(test.category);
      }
    });

    for (const test of viewTests) {
      // Skip self-reference (this file is being created)
      if (test.path === 'src/entities/__tests__/views-entity.test.ts') {
        it(`should reference self: "${test.title}" (skip existence check)`, () => {
          expect(test.path).toBe('src/entities/__tests__/views-entity.test.ts');
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
      expect(manifest.name).toBe(viewsModule.name);
      expect(manifest.type).toBe(viewsModule.type);
      expect(manifest.version).toBe(viewsModule.version);
      expect(manifest.depends_on).toEqual(viewsModule.dependsOn);
    });
  });

  // --------------------------------------------------------------------------
  // Module Integration
  // --------------------------------------------------------------------------

  describe('module integration', () => {
    it('should have convention processor facet', () => {
      expect(viewsModule.conventionProcessor).toBeDefined();
    });

    it('should have inference rules facet', () => {
      expect(viewsModule.inferenceRules).toBeDefined();
      expect(viewsModule.inferenceRules).toBe(viewInferenceRules);
    });

    it('should have generators facet', () => {
      expect(viewsModule.generators).toBeDefined();
    });

    it('should have docs facet', () => {
      expect(viewsModule.docs).toBeDefined();
      expect(viewsModule.docs).toBe(viewDocs);
    });

    it('should have tests facet', () => {
      expect(viewsModule.tests).toBeDefined();
      expect(viewsModule.tests).toBe(viewTests);
    });

    it('should have diagram plugins defined', () => {
      expect(viewsModule.diagramPlugins).toBeDefined();
    });
  });
});
