import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadManifest, validateManifest } from '../_shared/manifest.js';
import { modelsModule } from '../core/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const modelsDir = resolve(__dirname, '../core/models');
const manifestPath = resolve(modelsDir, 'module.yaml');

describe('Models Entity Module Manifest', () => {

  // --------------------------------------------------------------------------
  // Loading
  // --------------------------------------------------------------------------

  describe('manifest loading', () => {
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
  });

  // --------------------------------------------------------------------------
  // Metadata
  // --------------------------------------------------------------------------

  describe('metadata', () => {
    it('should have name "models"', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.name).toBe('models');
    });

    it('should be a core entity', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.type).toBe('core');
    });

    it('should have a version', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.version).toBeTruthy();
    });

    it('should have no dependencies', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.depends_on).toEqual([]);
    });

    it('should match the TypeScript module definition', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.name).toBe(modelsModule.name);
      expect(manifest.type).toBe(modelsModule.type);
      expect(manifest.version).toBe(modelsModule.version);
      expect(manifest.depends_on).toEqual(modelsModule.dependsOn);
    });
  });

  // --------------------------------------------------------------------------
  // Facets
  // --------------------------------------------------------------------------

  describe('facets', () => {
    it('should declare schema facet', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.facets.schema).toBeTruthy();
    });

    it('should declare conventions facet', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.facets.conventions).toBeDefined();
      expect(manifest.facets.conventions!.structural).toBeTruthy();
    });

    it('should declare inference facet', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.facets.inference).toBeDefined();
      expect(manifest.facets.inference!.entry).toBeTruthy();
      expect(manifest.facets.inference!.rules).toBeDefined();
      expect(manifest.facets.inference!.rules!.length).toBeGreaterThanOrEqual(2);
    });

    it('should declare generators facet', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.facets.generators).toBeTruthy();
    });

    it('should declare docs facet', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.facets.docs).toBeTruthy();
    });

    it('should declare tests facet', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.facets.tests).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Facet File Existence
  // --------------------------------------------------------------------------

  describe('facet file existence', () => {
    it('should have schema file', () => {
      const manifest = loadManifest(manifestPath);
      const schemaPath = resolve(modelsDir, manifest.facets.schema!);
      expect(existsSync(schemaPath), `Schema not found: ${manifest.facets.schema}`).toBe(true);
    });

    it('should have structural conventions file', () => {
      const manifest = loadManifest(manifestPath);
      const convPath = resolve(modelsDir, manifest.facets.conventions!.structural!);
      expect(existsSync(convPath), `Conventions not found: ${manifest.facets.conventions!.structural}`).toBe(true);
    });

    it('should have inference entry file', () => {
      const manifest = loadManifest(manifestPath);
      const infPath = resolve(modelsDir, manifest.facets.inference!.entry!);
      expect(existsSync(infPath), `Inference entry not found: ${manifest.facets.inference!.entry}`).toBe(true);
    });

    for (const ruleFile of ['inference/v3.1-controller-rules.json', 'inference/v3.1-service-rules.json']) {
      it(`should have inference rule file: ${ruleFile}`, () => {
        const fullPath = resolve(modelsDir, ruleFile);
        expect(existsSync(fullPath), `Rule file not found: ${ruleFile}`).toBe(true);
      });
    }

    it('should have generators file', () => {
      const manifest = loadManifest(manifestPath);
      const genPath = resolve(modelsDir, manifest.facets.generators!);
      expect(existsSync(genPath), `Generators not found: ${manifest.facets.generators}`).toBe(true);
    });

    it('should have docs file', () => {
      const manifest = loadManifest(manifestPath);
      const docsPath = resolve(modelsDir, manifest.facets.docs!);
      expect(existsSync(docsPath), `Docs not found: ${manifest.facets.docs}`).toBe(true);
    });

    it('should have tests file', () => {
      const manifest = loadManifest(manifestPath);
      const testsPath = resolve(modelsDir, manifest.facets.tests!);
      expect(existsSync(testsPath), `Tests not found: ${manifest.facets.tests}`).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Diagrams
  // --------------------------------------------------------------------------

  describe('diagrams', () => {
    it('should declare diagram plugins', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.diagrams).toBeDefined();
      expect(manifest.diagrams!.length).toBeGreaterThanOrEqual(2);
    });

    it('should include ER diagram', () => {
      const manifest = loadManifest(manifestPath);
      const er = manifest.diagrams!.find(d => d.type === 'er');
      expect(er).toBeDefined();
    });

    it('should include class diagram', () => {
      const manifest = loadManifest(manifestPath);
      const cls = manifest.diagrams!.find(d => d.type === 'class');
      expect(cls).toBeDefined();
    });

    it('should match TypeScript module diagram plugins', () => {
      const manifest = loadManifest(manifestPath);
      const manifestTypes = manifest.diagrams!.map(d => d.type).sort();
      const moduleTypes = modelsModule.diagramPlugins!.map(d => d.type).sort();
      expect(manifestTypes).toEqual(moduleTypes);
    });
  });

  // --------------------------------------------------------------------------
  // Delivery
  // --------------------------------------------------------------------------

  describe('delivery', () => {
    it('should declare delivery connections', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.delivery).toBeDefined();
    });

    it('should connect to parser', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.delivery!.parser).toBe(true);
    });

    it('should connect to inference', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.delivery!.inference).toBe(true);
    });

    it('should connect to realize', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.delivery!.realize).toBe(true);
    });

    it('should connect to CLI', () => {
      const manifest = loadManifest(manifestPath);
      expect(manifest.delivery!.cli).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Manifest Validation
  // --------------------------------------------------------------------------

  describe('validation', () => {
    it('should reject manifest without name', () => {
      const errors = validateManifest({ type: 'core', version: '1.0', depends_on: [], facets: {} } as any);
      expect(errors).toContain('Missing required field: name');
    });

    it('should reject manifest with invalid type', () => {
      const errors = validateManifest({ name: 'x', type: 'invalid' as any, version: '1.0', depends_on: [], facets: {} });
      expect(errors).toContain('Missing or invalid field: type (must be "core" or "extension")');
    });

    it('should reject manifest without version', () => {
      const errors = validateManifest({ name: 'x', type: 'core', depends_on: [], facets: {} } as any);
      expect(errors).toContain('Missing required field: version');
    });

    it('should reject manifest without facets', () => {
      const errors = validateManifest({ name: 'x', type: 'core', version: '1.0', depends_on: [] } as any);
      expect(errors).toContain('Missing required field: facets');
    });
  });
});
