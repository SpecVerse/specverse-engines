import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { servicesModule } from '../core/services/index.js';
import { serviceGenerators } from '../core/services/generators/index.js';
import { serviceDocs } from '../core/services/docs/index.js';
import { serviceTests } from '../core/services/tests/index.js';
import { loadManifest, validateManifest } from '../_shared/manifest.js';

// Also import original processor for parity test
import { ServiceProcessor as OriginalProcessor } from '@specverse/engine-parser/processors/ServiceProcessor.js';
import { ServiceProcessor as EntityProcessor } from '../core/services/conventions/service-processor.js';
import type { ProcessorContext } from '@specverse/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const moduleDir = resolve(__dirname, '../core/services');
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

// Sample service input for parity testing
const testInput = {
  PaymentService: {
    description: 'Payment processing',
    operations: {
      processPayment: {
        parameters: { amount: 'Decimal', currency: 'String' },
        returns: 'PaymentResult',
      },
    },
    subscribes_to: ['OrderCompleted'],
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Services Entity Module', () => {

  // --------------------------------------------------------------------------
  // Module Metadata
  // --------------------------------------------------------------------------

  describe('module metadata', () => {
    it('should have correct name', () => {
      expect(servicesModule.name).toBe('services');
    });

    it('should be a core entity', () => {
      expect(servicesModule.type).toBe('core');
    });

    it('should depend on models', () => {
      expect(servicesModule.dependsOn).toEqual(['models']);
    });

    it('should have a version', () => {
      expect(servicesModule.version).toBeTruthy();
    });

    it('should have a convention processor', () => {
      expect(servicesModule.conventionProcessor).toBeDefined();
      expect(servicesModule.conventionProcessor!.process).toBeInstanceOf(Function);
    });
  });

  // --------------------------------------------------------------------------
  // Convention Processor Parity
  // --------------------------------------------------------------------------

  describe('parity with original ServiceProcessor', () => {
    it('should produce identical output for service input', () => {
      // Run through entity module processor
      const entityContext = createContext();
      const entityResult = servicesModule.conventionProcessor!.process(
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
      const entityResult = servicesModule.conventionProcessor!.process({}, entityContext);

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
      expect(serviceGenerators.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have names', () => {
      for (const gen of serviceGenerators) {
        expect(gen.name).toBeTruthy();
      }
    });

    it('should all have factory paths', () => {
      for (const gen of serviceGenerators) {
        expect(gen.factoryPath).toBeTruthy();
      }
    });

    it('should be included in the services module', () => {
      expect(servicesModule.generators).toBeDefined();
      expect(servicesModule.generators).toBe(serviceGenerators);
    });
  });

  // --------------------------------------------------------------------------
  // Documentation References
  // --------------------------------------------------------------------------

  describe('documentation references', () => {
    it('should declare documentation references', () => {
      expect(serviceDocs.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['example', 'guide', 'reference', 'architecture'];
      for (const doc of serviceDocs) {
        expect(validCategories).toContain(doc.category);
      }
    });

    for (const doc of serviceDocs) {
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
      expect(serviceTests.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['unit', 'integration', 'example-spec', 'parity'];
      for (const test of serviceTests) {
        expect(validCategories).toContain(test.category);
      }
    });

    for (const test of serviceTests) {
      // Skip self-reference (this file is being created)
      if (test.path === 'src/entities/__tests__/services-entity.test.ts') {
        it(`should reference self: "${test.title}" (skip existence check)`, () => {
          expect(test.path).toBe('src/entities/__tests__/services-entity.test.ts');
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
      expect(manifest.name).toBe(servicesModule.name);
      expect(manifest.type).toBe(servicesModule.type);
      expect(manifest.version).toBe(servicesModule.version);
      expect(manifest.depends_on).toEqual(servicesModule.dependsOn);
    });
  });

  // --------------------------------------------------------------------------
  // Module Integration
  // --------------------------------------------------------------------------

  describe('module integration', () => {
    it('should have convention processor facet', () => {
      expect(servicesModule.conventionProcessor).toBeDefined();
    });

    it('should have generators facet', () => {
      expect(servicesModule.generators).toBeDefined();
    });

    it('should have docs facet', () => {
      expect(servicesModule.docs).toBeDefined();
      expect(servicesModule.docs).toBe(serviceDocs);
    });

    it('should have tests facet', () => {
      expect(servicesModule.tests).toBeDefined();
      expect(servicesModule.tests).toBe(serviceTests);
    });

    it('should have diagram plugins', () => {
      expect(servicesModule.diagramPlugins).toBeDefined();
      expect(servicesModule.diagramPlugins!.length).toBeGreaterThanOrEqual(1);
    });
  });
});
