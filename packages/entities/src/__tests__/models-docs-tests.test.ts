import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { modelsModule } from '../core/models/index.js';
import { modelDocs } from '../core/models/docs/index.js';
import { modelTests } from '../core/models/tests/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');

describe('Models Entity Documentation & Tests', () => {

  // --------------------------------------------------------------------------
  // Documentation References
  // --------------------------------------------------------------------------

  describe('documentation metadata', () => {
    it('should declare documentation references', () => {
      expect(modelDocs.length).toBeGreaterThanOrEqual(9);
    });

    it('should all have titles', () => {
      for (const doc of modelDocs) {
        expect(doc.title).toBeTruthy();
      }
    });

    it('should all have valid categories', () => {
      const validCategories = ['example', 'guide', 'reference', 'architecture'];
      for (const doc of modelDocs) {
        expect(validCategories).toContain(doc.category);
      }
    });

    it('should all have paths', () => {
      for (const doc of modelDocs) {
        expect(doc.path).toBeTruthy();
      }
    });

    it('should include examples', () => {
      const examples = modelDocs.filter(d => d.category === 'example');
      expect(examples.length).toBeGreaterThanOrEqual(5);
    });

    it('should include guides', () => {
      const guides = modelDocs.filter(d => d.category === 'guide');
      expect(guides.length).toBeGreaterThanOrEqual(1);
    });

    it('should include architecture docs', () => {
      const arch = modelDocs.filter(d => d.category === 'architecture');
      expect(arch.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('documentation file existence', () => {
    for (const doc of modelDocs) {
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

  describe('test metadata', () => {
    it('should declare test references', () => {
      expect(modelTests.length).toBeGreaterThanOrEqual(15);
    });

    it('should all have titles', () => {
      for (const test of modelTests) {
        expect(test.title).toBeTruthy();
      }
    });

    it('should all have valid categories', () => {
      const validCategories = ['unit', 'integration', 'example-spec', 'parity'];
      for (const test of modelTests) {
        expect(validCategories).toContain(test.category);
      }
    });

    it('should all have paths', () => {
      for (const test of modelTests) {
        expect(test.path).toBeTruthy();
      }
    });

    it('should include unit tests', () => {
      const unit = modelTests.filter(t => t.category === 'unit');
      expect(unit.length).toBeGreaterThanOrEqual(3);
    });

    it('should include integration tests', () => {
      const integration = modelTests.filter(t => t.category === 'integration');
      expect(integration.length).toBeGreaterThanOrEqual(4);
    });

    it('should include parity tests', () => {
      const parity = modelTests.filter(t => t.category === 'parity');
      expect(parity.length).toBeGreaterThanOrEqual(1);
    });

    it('should include example specs', () => {
      const specs = modelTests.filter(t => t.category === 'example-spec');
      expect(specs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('test file existence', () => {
    for (const test of modelTests) {
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
  // Module Integration
  // --------------------------------------------------------------------------

  describe('module integration', () => {
    it('should include docs in the models module', () => {
      expect(modelsModule.docs).toBeDefined();
      expect(modelsModule.docs).toBe(modelDocs);
    });

    it('should include tests in the models module', () => {
      expect(modelsModule.tests).toBeDefined();
      expect(modelsModule.tests).toBe(modelTests);
    });
  });
});
