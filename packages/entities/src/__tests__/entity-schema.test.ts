import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, '../../');

function loadSchema(path: string): any {
  return JSON.parse(readFileSync(resolve(projectRoot, path), 'utf8'));
}

describe('Entity Schema Extraction', () => {

  // --------------------------------------------------------------------------
  // Shared Primitives
  // --------------------------------------------------------------------------

  describe('primitives.schema.json', () => {
    const primitives = loadSchema('src/_shared/schema/primitives.schema.json');
    const monolith = loadSchema('schema/SPECVERSE-SCHEMA.json');

    it('should have valid JSON Schema metadata', () => {
      expect(primitives.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
      expect(primitives.$id).toContain('primitives');
      expect(primitives.title).toBeDefined();
    });

    it('should contain shared definitions', () => {
      const expectedDefs = [
        'NamespaceString',
        'SemanticVersion',
        'TypeReference',
        'AttributesSection',
        'ExecutableProperties',
        'SubscriptionsPattern',
        'CapabilityList',
      ];
      for (const def of expectedDefs) {
        expect(primitives.$defs).toHaveProperty(def);
      }
    });

    it('should match monolith definitions exactly', () => {
      for (const [key, value] of Object.entries(primitives.$defs as Record<string, any>)) {
        expect(
          JSON.stringify(value),
          `$def "${key}" differs from monolith`
        ).toBe(JSON.stringify(monolith.$defs[key]));
      }
    });
  });

  // --------------------------------------------------------------------------
  // Models Schema
  // --------------------------------------------------------------------------

  describe('models.schema.json', () => {
    const models = loadSchema('src/core/models/schema/models.schema.json');
    const monolith = loadSchema('schema/SPECVERSE-SCHEMA.json');

    it('should have valid JSON Schema metadata', () => {
      expect(models.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
      expect(models.$id).toContain('models');
      expect(models.title).toBeDefined();
    });

    it('should contain model-specific definitions', () => {
      const expectedDefs = [
        'ModelsSection',
        'RelationshipsSection',
        'LifecyclesSection',
        'BehaviorsSection',
        'ProfileAttachmentSection',
        'ModelMetadataSpec',
        'PrimitivesSection',
        'PrimitiveDefinition',
      ];
      for (const def of expectedDefs) {
        expect(models.$defs).toHaveProperty(def);
      }
    });

    it('should match monolith definitions exactly', () => {
      for (const [key, value] of Object.entries(models.$defs as Record<string, any>)) {
        expect(
          JSON.stringify(value),
          `$def "${key}" differs from monolith`
        ).toBe(JSON.stringify(monolith.$defs[key]));
      }
    });

    it('should not duplicate shared definitions', () => {
      const primitives = loadSchema('src/_shared/schema/primitives.schema.json');
      const sharedKeys = Object.keys(primitives.$defs);
      const modelKeys = Object.keys(models.$defs);

      const overlap = modelKeys.filter(k => sharedKeys.includes(k));
      expect(overlap).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Coverage Tracking
  // --------------------------------------------------------------------------

  describe('extraction coverage', () => {
    const monolith = loadSchema('schema/SPECVERSE-SCHEMA.json');
    const primitives = loadSchema('src/_shared/schema/primitives.schema.json');
    const models = loadSchema('src/core/models/schema/models.schema.json');

    it('should have extracted at least the model and shared definitions', () => {
      const extracted = new Set([
        ...Object.keys(primitives.$defs),
        ...Object.keys(models.$defs),
      ]);
      const total = Object.keys(monolith.$defs).length;

      // We've extracted 15 of 59 defs (7 shared + 8 model)
      // Schema is composed from entity module fragments (59 = 56 original + 3 extension entities)
      expect(extracted.size).toBe(15);
      expect(total).toBe(59);
    });

    it('should have no key collisions between entity schemas', () => {
      const primKeys = new Set(Object.keys(primitives.$defs));
      const modelKeys = new Set(Object.keys(models.$defs));

      for (const key of modelKeys) {
        expect(primKeys.has(key)).toBe(false);
      }
    });
  });
});
