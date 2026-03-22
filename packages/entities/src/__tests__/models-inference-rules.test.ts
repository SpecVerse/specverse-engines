import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { modelsModule } from '../core/models/index.js';
import { modelInferenceRules, loadControllerRules, loadServiceRules } from '../core/models/inference/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');

// ============================================================================
// Tests
// ============================================================================

describe('Models Entity Inference Rules', () => {

  // --------------------------------------------------------------------------
  // Rule Metadata
  // --------------------------------------------------------------------------

  describe('rule metadata', () => {
    it('should declare 7 inference rules', () => {
      expect(modelInferenceRules).toHaveLength(7);
    });

    it('should all be triggered by models', () => {
      for (const rule of modelInferenceRules) {
        expect(rule.triggeredBy).toBe('models');
      }
    });

    it('should generate controllers and services', () => {
      const controllerRules = modelInferenceRules.filter(
        r => r.generates?.includes('controllers')
      );
      const serviceRules = modelInferenceRules.filter(
        r => r.generates?.includes('services')
      );
      expect(controllerRules).toHaveLength(4);
      expect(serviceRules).toHaveLength(3);
    });

    it('should have unique IDs', () => {
      const ids = modelInferenceRules.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have IDs prefixed with models:', () => {
      for (const rule of modelInferenceRules) {
        expect(rule.id).toMatch(/^models:/);
      }
    });

    it('should all have descriptions', () => {
      for (const rule of modelInferenceRules) {
        expect(rule.description).toBeTruthy();
      }
    });

    it('should all have priority values', () => {
      for (const rule of modelInferenceRules) {
        expect(rule.priority).toBeDefined();
        expect(typeof rule.priority).toBe('number');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Module Integration
  // --------------------------------------------------------------------------

  describe('module integration', () => {
    it('should be included in the models module', () => {
      expect(modelsModule.inferenceRules).toBeDefined();
      expect(modelsModule.inferenceRules).toBe(modelInferenceRules);
    });
  });

  // --------------------------------------------------------------------------
  // Rule JSON Files
  // --------------------------------------------------------------------------

  describe('controller rules JSON', () => {
    it('should load successfully', () => {
      const rules = loadControllerRules();
      expect(rules).toBeDefined();
      expect(rules.version).toBe('v3.1');
      expect(rules.logical_inference).toBeDefined();
      expect(rules.logical_inference.controllers).toBeDefined();
    });

    it('should match the composed dist rule file', () => {
      const entityRules = loadControllerRules();
      const distRules = JSON.parse(
        readFileSync(
          resolve(projectRoot, 'dist/inference-engine/rules/logical/v3.1-controller-rules.json'),
          'utf8'
        )
      );
      expect(JSON.stringify(entityRules)).toBe(JSON.stringify(distRules));
    });

    it('should contain 4 controller rules', () => {
      const rules = loadControllerRules();
      expect(rules.logical_inference.controllers).toHaveLength(4);
    });

    it('should have rule names matching metadata', () => {
      const rules = loadControllerRules();
      const jsonNames = rules.logical_inference.controllers.map((r: any) => r.name);
      const metaIds = modelInferenceRules
        .filter(r => r.generates?.includes('controllers'))
        .map(r => r.id.replace('models:', ''));

      for (const name of jsonNames) {
        expect(metaIds).toContain(name);
      }
    });
  });

  describe('service rules JSON', () => {
    it('should load successfully', () => {
      const rules = loadServiceRules();
      expect(rules).toBeDefined();
      expect(rules.version).toBe('v3.1');
      expect(rules.logical_inference).toBeDefined();
      expect(rules.logical_inference.services).toBeDefined();
    });

    it('should match the composed dist rule file', () => {
      const entityRules = loadServiceRules();
      const distRules = JSON.parse(
        readFileSync(
          resolve(projectRoot, 'dist/inference-engine/rules/logical/v3.1-service-rules.json'),
          'utf8'
        )
      );
      expect(JSON.stringify(entityRules)).toBe(JSON.stringify(distRules));
    });

    it('should contain 5 service rules', () => {
      const rules = loadServiceRules();
      expect(rules.logical_inference.services).toHaveLength(5);
    });
  });

  // --------------------------------------------------------------------------
  // Consistency
  // --------------------------------------------------------------------------

  describe('consistency', () => {
    it('should have metadata for every active rule in JSON files', () => {
      const controllerRules = loadControllerRules();
      const serviceRules = loadServiceRules();

      // Get active rules (condition !== "false")
      const activeControllerRules = controllerRules.logical_inference.controllers
        .filter((r: any) => r.condition !== 'false')
        .map((r: any) => r.name);

      const activeServiceRules = serviceRules.logical_inference.services
        .filter((r: any) => r.condition !== 'false')
        .map((r: any) => r.name);

      const metaIds = modelInferenceRules.map(r => r.id.replace('models:', ''));

      for (const name of activeControllerRules) {
        expect(metaIds, `Active controller rule "${name}" missing from metadata`).toContain(name);
      }

      for (const name of activeServiceRules) {
        expect(metaIds, `Active service rule "${name}" missing from metadata`).toContain(name);
      }
    });
  });
});
