import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deploymentsModule } from '../core/deployments/index.js';
import { deploymentInferenceRules, loadDeploymentRules } from '../core/deployments/inference/index.js';
import { deploymentGenerators } from '../core/deployments/generators/index.js';
import { deploymentDocs } from '../core/deployments/docs/index.js';
import { deploymentTests } from '../core/deployments/tests/index.js';
import { loadManifest, validateManifest } from '../_shared/manifest.js';

// Also import original processor for parity test
import { DeploymentProcessor as OriginalProcessor } from '@specverse/engine-parser/processors/DeploymentProcessor.js';
import { DeploymentProcessor as EntityProcessor } from '../core/deployments/conventions/deployment-processor.js';
import type { ProcessorContext } from '@specverse/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const moduleDir = resolve(__dirname, '../core/deployments');
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

// Sample deployment input for parity testing
const testInput = {
  production: {
    environment: 'production',
    version: '1.0.0',
    description: 'Production deployment',
    instances: {
      controllers: {
        api: {
          component: 'AppComponent',
          scale: 3,
        },
      },
    },
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Deployments Entity Module', () => {

  // --------------------------------------------------------------------------
  // Module Metadata
  // --------------------------------------------------------------------------

  describe('module metadata', () => {
    it('should have correct name', () => {
      expect(deploymentsModule.name).toBe('deployments');
    });

    it('should be a core entity', () => {
      expect(deploymentsModule.type).toBe('core');
    });

    it('should depend on all other entity types', () => {
      expect(deploymentsModule.dependsOn).toEqual(['models', 'controllers', 'services', 'events', 'views']);
    });

    it('should have a version', () => {
      expect(deploymentsModule.version).toBeTruthy();
    });

    it('should have a convention processor', () => {
      expect(deploymentsModule.conventionProcessor).toBeDefined();
      expect(deploymentsModule.conventionProcessor!.process).toBeInstanceOf(Function);
    });
  });

  // --------------------------------------------------------------------------
  // Convention Processor Parity
  // --------------------------------------------------------------------------

  describe('parity with original DeploymentProcessor', () => {
    it('should produce identical output for deployment input', () => {
      // Run through entity module processor
      const entityContext = createContext();
      const entityResult = deploymentsModule.conventionProcessor!.process(
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
      const entityResult = deploymentsModule.conventionProcessor!.process({}, entityContext);

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
    it('should have 6 deployment inference rules', () => {
      expect(deploymentInferenceRules).toHaveLength(6);
    });

    it('should all have unique IDs', () => {
      const ids = deploymentInferenceRules.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should all generate deployments', () => {
      for (const rule of deploymentInferenceRules) {
        expect(rule.generates).toContain('deployments');
      }
    });

    it('should include instance generation rules', () => {
      const instanceRules = deploymentInferenceRules.filter(r =>
        r.id.includes('instances') || r.id.includes('deployment')
      );
      expect(instanceRules.length).toBeGreaterThanOrEqual(3);
    });

    it('should include channel generation rules', () => {
      const channelRules = deploymentInferenceRules.filter(r =>
        r.id.includes('communication')
      );
      expect(channelRules.length).toBeGreaterThanOrEqual(2);
    });

    it('should load deployment rules JSON without error', () => {
      const rules = loadDeploymentRules();
      expect(rules).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Generators
  // --------------------------------------------------------------------------

  describe('generator metadata', () => {
    it('should declare generators', () => {
      expect(deploymentGenerators.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have names', () => {
      for (const gen of deploymentGenerators) {
        expect(gen.name).toBeTruthy();
      }
    });

    it('should all have factory paths', () => {
      for (const gen of deploymentGenerators) {
        expect(gen.factoryPath).toBeTruthy();
      }
    });

    it('should be included in the deployments module', () => {
      expect(deploymentsModule.generators).toBeDefined();
      expect(deploymentsModule.generators).toBe(deploymentGenerators);
    });
  });

  // --------------------------------------------------------------------------
  // Documentation References
  // --------------------------------------------------------------------------

  describe('documentation references', () => {
    it('should declare documentation references', () => {
      expect(deploymentDocs.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['example', 'guide', 'reference', 'architecture'];
      for (const doc of deploymentDocs) {
        expect(validCategories).toContain(doc.category);
      }
    });

    for (const doc of deploymentDocs) {
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
      expect(deploymentTests.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['unit', 'integration', 'example-spec', 'parity'];
      for (const test of deploymentTests) {
        expect(validCategories).toContain(test.category);
      }
    });

    for (const test of deploymentTests) {
      // Skip self-reference (this file is being created)
      if (test.path === 'src/entities/__tests__/deployments-entity.test.ts') {
        it(`should reference self: "${test.title}" (skip existence check)`, () => {
          expect(test.path).toBe('src/entities/__tests__/deployments-entity.test.ts');
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
      expect(manifest.name).toBe(deploymentsModule.name);
      expect(manifest.type).toBe(deploymentsModule.type);
      expect(manifest.version).toBe(deploymentsModule.version);
      expect(manifest.depends_on).toEqual(deploymentsModule.dependsOn);
    });
  });

  // --------------------------------------------------------------------------
  // Module Integration
  // --------------------------------------------------------------------------

  describe('module integration', () => {
    it('should have convention processor facet', () => {
      expect(deploymentsModule.conventionProcessor).toBeDefined();
    });

    it('should have inference rules facet', () => {
      expect(deploymentsModule.inferenceRules).toBeDefined();
      expect(deploymentsModule.inferenceRules).toBe(deploymentInferenceRules);
    });

    it('should have generators facet', () => {
      expect(deploymentsModule.generators).toBeDefined();
    });

    it('should have docs facet', () => {
      expect(deploymentsModule.docs).toBeDefined();
      expect(deploymentsModule.docs).toBe(deploymentDocs);
    });

    it('should have tests facet', () => {
      expect(deploymentsModule.tests).toBeDefined();
      expect(deploymentsModule.tests).toBe(deploymentTests);
    });

    it('should have diagram plugins', () => {
      expect(deploymentsModule.diagramPlugins).toBeDefined();
      expect(deploymentsModule.diagramPlugins!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
