import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { commandsModule } from '../extensions/commands/index.js';
import { CommandProcessor } from '../extensions/commands/conventions/command-processor.js';
import { loadManifest, validateManifest } from '../_shared/manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const moduleDir = resolve(__dirname, '../extensions/commands');
const manifestPath = resolve(moduleDir, 'module.yaml');

// ============================================================================
// Test Data
// ============================================================================

const testInput = {
  validate: {
    description: 'Validate a specification',
    arguments: {
      file: { type: 'FilePath', required: true, positional: true },
    },
    flags: {
      '--json': { type: 'Boolean', default: false },
      '--strict': { type: 'Boolean', default: false },
    },
    returns: 'ValidationResult',
    exitCodes: { 0: 'Valid', 1: 'Errors' },
    subcommands: {
      fix: { description: 'Auto-fix issues' },
    },
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Commands Entity Module', () => {

  // --------------------------------------------------------------------------
  // Module Metadata
  // --------------------------------------------------------------------------

  describe('module metadata', () => {
    it('should have correct name', () => {
      expect(commandsModule.name).toBe('commands');
    });

    it('should be an extension entity', () => {
      expect(commandsModule.type).toBe('extension');
    });

    it('should have version 0.1.0', () => {
      expect(commandsModule.version).toBe('0.1.0');
    });

    it('should depend on models', () => {
      expect(commandsModule.dependsOn).toEqual(['models']);
    });

    it('should have a convention processor', () => {
      expect(commandsModule.conventionProcessor).toBeDefined();
      expect(commandsModule.conventionProcessor!.process).toBeInstanceOf(Function);
    });
  });

  // --------------------------------------------------------------------------
  // Convention Processor
  // --------------------------------------------------------------------------

  describe('convention processor', () => {
    it('should process command definitions into CommandSpec array', () => {
      const result = commandsModule.conventionProcessor!.process(testInput);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should extract the command name', () => {
      const result = commandsModule.conventionProcessor!.process(testInput);
      expect(result[0].name).toBe('validate');
    });

    it('should extract description', () => {
      const result = commandsModule.conventionProcessor!.process(testInput);
      expect(result[0].description).toBe('Validate a specification');
    });

    it('should extract arguments', () => {
      const result = commandsModule.conventionProcessor!.process(testInput);
      expect(result[0].arguments).toBeDefined();
      expect(result[0].arguments!['file']).toBeDefined();
      expect(result[0].arguments!['file'].type).toBe('FilePath');
      expect(result[0].arguments!['file'].required).toBe(true);
      expect(result[0].arguments!['file'].positional).toBe(true);
    });

    it('should extract flags', () => {
      const result = commandsModule.conventionProcessor!.process(testInput);
      expect(result[0].flags).toBeDefined();
      expect(result[0].flags!['--json']).toBeDefined();
      expect(result[0].flags!['--json'].type).toBe('Boolean');
      expect(result[0].flags!['--json'].default).toBe(false);
      expect(result[0].flags!['--strict']).toBeDefined();
    });

    it('should extract returns type', () => {
      const result = commandsModule.conventionProcessor!.process(testInput);
      expect(result[0].returns).toBe('ValidationResult');
    });

    it('should extract exit codes', () => {
      const result = commandsModule.conventionProcessor!.process(testInput);
      expect(result[0].exitCodes).toBeDefined();
      expect(result[0].exitCodes![0]).toBe('Valid');
      expect(result[0].exitCodes![1]).toBe('Errors');
    });

    it('should extract subcommands', () => {
      const result = commandsModule.conventionProcessor!.process(testInput);
      expect(result[0].subcommands).toBeDefined();
      expect(result[0].subcommands!['fix']).toBeDefined();
      expect(result[0].subcommands!['fix'].description).toBe('Auto-fix issues');
    });

    it('should return empty array for empty input', () => {
      const result = commandsModule.conventionProcessor!.process({});
      expect(result).toEqual([]);
    });

    it('should handle multiple commands', () => {
      const multiInput = {
        validate: { description: 'Validate' },
        generate: { description: 'Generate' },
        deploy: { description: 'Deploy' },
      };
      const result = commandsModule.conventionProcessor!.process(multiInput);
      expect(result).toHaveLength(3);
      const names = result.map((r: any) => r.name);
      expect(names).toContain('validate');
      expect(names).toContain('generate');
      expect(names).toContain('deploy');
    });
  });

  // --------------------------------------------------------------------------
  // Direct Processor Usage
  // --------------------------------------------------------------------------

  describe('CommandProcessor direct usage', () => {
    it('should be instantiable with a context', () => {
      const context = { warnings: [] as string[], addWarning(msg: string) { this.warnings.push(msg); } };
      const processor = new CommandProcessor(context);
      expect(processor).toBeDefined();
    });

    it('should process input identically to module processor', () => {
      const context = { warnings: [] as string[], addWarning(msg: string) { this.warnings.push(msg); } };
      const processor = new CommandProcessor(context);
      const directResult = processor.process(testInput);
      const moduleResult = commandsModule.conventionProcessor!.process(testInput);
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
      expect(manifest.name).toBe(commandsModule.name);
      expect(manifest.type).toBe(commandsModule.type);
      expect(manifest.version).toBe(commandsModule.version);
      expect(manifest.depends_on).toEqual(commandsModule.dependsOn);
    });
  });

  // --------------------------------------------------------------------------
  // Schema
  // --------------------------------------------------------------------------

  describe('schema', () => {
    it('should have a schema file', () => {
      const schemaPath = resolve(moduleDir, 'schema', 'commands.schema.json');
      expect(existsSync(schemaPath)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Documentation References
  // --------------------------------------------------------------------------

  describe('documentation references', () => {
    it('should declare documentation references', () => {
      expect(commandsModule.docs).toBeDefined();
      expect(commandsModule.docs!.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['example', 'guide', 'reference', 'architecture'];
      for (const doc of commandsModule.docs!) {
        expect(validCategories).toContain(doc.category);
      }
    });

    for (const doc of commandsModule.docs || []) {
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
      expect(commandsModule.tests).toBeDefined();
      expect(commandsModule.tests!.length).toBeGreaterThanOrEqual(1);
    });

    it('should all have valid categories', () => {
      const validCategories = ['unit', 'integration', 'example-spec', 'parity'];
      for (const test of commandsModule.tests!) {
        expect(validCategories).toContain(test.category);
      }
    });

    for (const test of commandsModule.tests || []) {
      if (test.path === 'src/entities/__tests__/commands-entity.test.ts') {
        it(`should reference self: "${test.title}" (skip existence check)`, () => {
          expect(test.path).toBe('src/entities/__tests__/commands-entity.test.ts');
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
      expect(commandsModule.conventionProcessor).toBeDefined();
    });

    it('should have inference rules facet', () => {
      expect(commandsModule.inferenceRules).toBeDefined();
    });

    it('should have generators facet', () => {
      expect(commandsModule.generators).toBeDefined();
    });

    it('should have docs facet', () => {
      expect(commandsModule.docs).toBeDefined();
    });

    it('should have tests facet', () => {
      expect(commandsModule.tests).toBeDefined();
    });

    it('should have diagram plugins defined', () => {
      expect(commandsModule.diagramPlugins).toBeDefined();
    });
  });
});
