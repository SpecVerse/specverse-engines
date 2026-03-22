import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { measuresModule } from '../extensions/measures/index.js';
import { MeasureProcessor } from '../extensions/measures/conventions/measure-processor.js';
import { loadManifest, validateManifest } from '../_shared/manifest.js';
import type { ProcessorContext } from '@specverse/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const moduleDir = resolve(__dirname, '../extensions/measures');
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

// ============================================================================
// Test Data
// ============================================================================

const testInput = {
  revenue: {
    description: 'Total completed order revenue',
    source: 'Order',
    aggregation: 'sum',
    field: 'totalAmount',
    filter: 'status = completed',
    dimensions: ['time', 'region'],
  },
  activeUsers: {
    source: 'User',
    aggregation: 'count',
    filter: 'lastLogin > 30d',
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Measures Entity Module', () => {

  // --------------------------------------------------------------------------
  // Module Metadata
  // --------------------------------------------------------------------------

  describe('module metadata', () => {
    it('should have correct name', () => {
      expect(measuresModule.name).toBe('measures');
    });

    it('should be an extension entity', () => {
      expect(measuresModule.type).toBe('extension');
    });

    it('should have version 0.1.0', () => {
      expect(measuresModule.version).toBe('0.1.0');
    });

    it('should depend on models', () => {
      expect(measuresModule.dependsOn).toEqual(['models']);
    });

    it('should have a convention processor', () => {
      expect(measuresModule.conventionProcessor).toBeDefined();
      expect(measuresModule.conventionProcessor!.process).toBeInstanceOf(Function);
    });
  });

  // --------------------------------------------------------------------------
  // Convention Processor
  // --------------------------------------------------------------------------

  describe('convention processor', () => {
    it('should process measure definitions into MeasureSpec array', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should extract the first measure name', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(result[0].name).toBe('revenue');
    });

    it('should extract source model', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(result[0].source).toBe('Order');
    });

    it('should extract aggregation type', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(result[0].aggregation).toBe('sum');
    });

    it('should extract field', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(result[0].field).toBe('totalAmount');
    });

    it('should extract description', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(result[0].description).toBe('Total completed order revenue');
    });

    it('should extract filter', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(result[0].filter).toBe('status = completed');
    });

    it('should extract dimensions', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(result[0].dimensions).toBeDefined();
      expect(result[0].dimensions).toHaveLength(2);
      expect(result[0].dimensions).toContain('time');
      expect(result[0].dimensions).toContain('region');
    });

    it('should extract the second measure', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(testInput, context);
      expect(result[1].name).toBe('activeUsers');
      expect(result[1].source).toBe('User');
      expect(result[1].aggregation).toBe('count');
    });

    it('should return empty array for empty input', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process({}, context);
      expect(result).toEqual([]);
    });

    it('should return empty array for null input', () => {
      const context = createContext();
      const result = measuresModule.conventionProcessor!.process(null, context);
      expect(result).toEqual([]);
    });

    it('should warn on missing source', () => {
      const context = createContext();
      measuresModule.conventionProcessor!.process({
        broken: { aggregation: 'count' },
      }, context);
      expect(context.warnings.some((w: string) => w.includes('source'))).toBe(true);
    });

    it('should warn on missing aggregation', () => {
      const context = createContext();
      measuresModule.conventionProcessor!.process({
        broken: { source: 'Order' },
      }, context);
      expect(context.warnings.some((w: string) => w.includes('aggregation'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Direct Processor Usage
  // --------------------------------------------------------------------------

  describe('MeasureProcessor direct usage', () => {
    it('should be instantiable with a context', () => {
      const context = createContext();
      const processor = new MeasureProcessor(context);
      expect(processor).toBeDefined();
    });

    it('should process input identically to module processor', () => {
      const context1 = createContext();
      const processor = new MeasureProcessor(context1);
      const directResult = processor.process(testInput);

      const context2 = createContext();
      const moduleResult = measuresModule.conventionProcessor!.process(testInput, context2);

      expect(JSON.stringify(directResult)).toBe(JSON.stringify(moduleResult));
    });
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
      expect(manifest.name).toBe(measuresModule.name);
      expect(manifest.type).toBe(measuresModule.type);
      expect(manifest.version).toBe(measuresModule.version);
      expect(manifest.depends_on).toEqual(measuresModule.dependsOn);
    });
  });

  // --------------------------------------------------------------------------
  // Schema
  // --------------------------------------------------------------------------

  describe('schema', () => {
    it('should have a schema file', () => {
      const schemaDir = resolve(moduleDir, 'schema');
      expect(existsSync(schemaDir)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Documentation References
  // --------------------------------------------------------------------------

  describe('documentation references', () => {
    it('should declare documentation references', () => {
      expect(measuresModule.docs).toBeDefined();
      expect(measuresModule.docs!.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['example', 'guide', 'reference', 'architecture'];
      for (const doc of measuresModule.docs!) {
        expect(validCategories).toContain(doc.category);
      }
    });

    for (const doc of measuresModule.docs || []) {
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
      expect(measuresModule.tests).toBeDefined();
      expect(measuresModule.tests!.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['unit', 'integration', 'example-spec', 'parity'];
      for (const test of measuresModule.tests!) {
        expect(validCategories).toContain(test.category);
      }
    });

    for (const test of measuresModule.tests || []) {
      if (test.path === 'src/entities/__tests__/measures-entity.test.ts') {
        it(`should reference self: "${test.title}" (skip existence check)`, () => {
          expect(test.path).toBe('src/entities/__tests__/measures-entity.test.ts');
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
  // Module Integration
  // --------------------------------------------------------------------------

  describe('module integration', () => {
    it('should have convention processor facet', () => {
      expect(measuresModule.conventionProcessor).toBeDefined();
    });

    it('should have inference rules facet', () => {
      expect(measuresModule.inferenceRules).toBeDefined();
    });

    it('should have generators facet', () => {
      expect(measuresModule.generators).toBeDefined();
    });

    it('should have docs facet', () => {
      expect(measuresModule.docs).toBeDefined();
    });

    it('should have tests facet', () => {
      expect(measuresModule.tests).toBeDefined();
    });

    it('should have diagram plugins defined', () => {
      expect(measuresModule.diagramPlugins).toBeDefined();
    });
  });
});
