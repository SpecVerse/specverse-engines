import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { conventionsModule } from '../extensions/conventions/index.js';
import { ConventionDefinitionProcessor } from '../extensions/conventions/conventions/convention-definition-processor.js';
import { loadManifest, validateManifest } from '../_shared/manifest.js';
import type { ProcessorContext } from '@specverse/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const moduleDir = resolve(__dirname, '../extensions/conventions');
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
  Email: {
    baseType: 'String',
    description: 'Email address type',
    implies: {
      format: 'email',
      validation: 'RFC 5322',
    },
    when_modified_by: {
      verified: { adds: ['verification_token', 'verified_at'] },
      unique: { adds: ['unique_index'] },
    },
  },
  Money: {
    baseType: 'Decimal',
    implies: {
      precision: 2,
      currency: 'USD',
    },
    appliesTo: ['models'],
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Conventions Entity Module', () => {

  // --------------------------------------------------------------------------
  // Module Metadata
  // --------------------------------------------------------------------------

  describe('module metadata', () => {
    it('should have correct name', () => {
      expect(conventionsModule.name).toBe('conventions');
    });

    it('should be an extension entity', () => {
      expect(conventionsModule.type).toBe('extension');
    });

    it('should have version 0.1.0', () => {
      expect(conventionsModule.version).toBe('0.1.0');
    });

    it('should depend on models', () => {
      expect(conventionsModule.dependsOn).toEqual(['models']);
    });

    it('should have a convention processor', () => {
      expect(conventionsModule.conventionProcessor).toBeDefined();
      expect(conventionsModule.conventionProcessor!.process).toBeInstanceOf(Function);
    });
  });

  // --------------------------------------------------------------------------
  // Convention Processor
  // --------------------------------------------------------------------------

  describe('convention processor', () => {
    it('should process convention definitions into ConventionDefinitionSpec array', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should extract the first convention name', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(result[0].name).toBe('Email');
    });

    it('should extract baseType', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(result[0].baseType).toBe('String');
    });

    it('should extract description', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(result[0].description).toBe('Email address type');
    });

    it('should extract implies', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(result[0].implies).toBeDefined();
      expect(result[0].implies!['format']).toBe('email');
      expect(result[0].implies!['validation']).toBe('RFC 5322');
    });

    it('should extract when_modified_by', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(result[0].when_modified_by).toBeDefined();
      expect(result[0].when_modified_by!['verified']).toBeDefined();
      expect(result[0].when_modified_by!['verified'].adds).toEqual(['verification_token', 'verified_at']);
      expect(result[0].when_modified_by!['unique']).toBeDefined();
      expect(result[0].when_modified_by!['unique'].adds).toEqual(['unique_index']);
    });

    it('should extract the second convention', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(result[1].name).toBe('Money');
      expect(result[1].baseType).toBe('Decimal');
    });

    it('should extract appliesTo', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(result[1].appliesTo).toBeDefined();
      expect(result[1].appliesTo).toContain('models');
    });

    it('should extract Money implies', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(testInput, context);
      expect(result[1].implies).toBeDefined();
      expect(result[1].implies!['precision']).toBe(2);
      expect(result[1].implies!['currency']).toBe('USD');
    });

    it('should return empty array for empty input', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process({}, context);
      expect(result).toEqual([]);
    });

    it('should return empty array for null input', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process(null, context);
      expect(result).toEqual([]);
    });

    it('should warn on missing baseType', () => {
      const context = createContext();
      conventionsModule.conventionProcessor!.process({
        Broken: { implies: { format: 'test' } },
      }, context);
      expect(context.warnings.some((w: string) => w.includes('baseType'))).toBe(true);
    });

    it('should skip invalid definitions', () => {
      const context = createContext();
      const result = conventionsModule.conventionProcessor!.process({
        Valid: { baseType: 'String' },
        Invalid: 'not an object',
      }, context);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Valid');
    });
  });

  // --------------------------------------------------------------------------
  // Direct Processor Usage
  // --------------------------------------------------------------------------

  describe('ConventionDefinitionProcessor direct usage', () => {
    it('should be instantiable with a context', () => {
      const context = createContext();
      const processor = new ConventionDefinitionProcessor(context);
      expect(processor).toBeDefined();
    });

    it('should process input identically to module processor', () => {
      const context1 = createContext();
      const processor = new ConventionDefinitionProcessor(context1);
      const directResult = processor.process(testInput);

      const context2 = createContext();
      const moduleResult = conventionsModule.conventionProcessor!.process(testInput, context2);

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
      expect(manifest.name).toBe(conventionsModule.name);
      expect(manifest.type).toBe(conventionsModule.type);
      expect(manifest.version).toBe(conventionsModule.version);
      expect(manifest.depends_on).toEqual(conventionsModule.dependsOn);
    });
  });

  // --------------------------------------------------------------------------
  // Schema
  // --------------------------------------------------------------------------

  describe('schema', () => {
    it('should have a schema directory', () => {
      const schemaDir = resolve(moduleDir, 'schema');
      expect(existsSync(schemaDir)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Documentation References
  // --------------------------------------------------------------------------

  describe('documentation references', () => {
    it('should declare documentation references', () => {
      expect(conventionsModule.docs).toBeDefined();
      expect(conventionsModule.docs!.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['example', 'guide', 'reference', 'architecture'];
      for (const doc of conventionsModule.docs!) {
        expect(validCategories).toContain(doc.category);
      }
    });

    for (const doc of conventionsModule.docs || []) {
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
      expect(conventionsModule.tests).toBeDefined();
      expect(conventionsModule.tests!.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['unit', 'integration', 'example-spec', 'parity'];
      for (const test of conventionsModule.tests!) {
        expect(validCategories).toContain(test.category);
      }
    });

    for (const test of conventionsModule.tests || []) {
      if (test.path === 'src/entities/__tests__/conventions-entity.test.ts') {
        it(`should reference self: "${test.title}" (skip existence check)`, () => {
          expect(test.path).toBe('src/entities/__tests__/conventions-entity.test.ts');
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
      expect(conventionsModule.conventionProcessor).toBeDefined();
    });

    it('should have inference rules facet', () => {
      expect(conventionsModule.inferenceRules).toBeDefined();
    });

    it('should have generators facet', () => {
      expect(conventionsModule.generators).toBeDefined();
    });

    it('should have docs facet', () => {
      expect(conventionsModule.docs).toBeDefined();
    });

    it('should have tests facet', () => {
      expect(conventionsModule.tests).toBeDefined();
    });

    it('should have diagram plugins defined', () => {
      expect(conventionsModule.diagramPlugins).toBeDefined();
    });
  });
});
