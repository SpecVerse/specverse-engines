/**
 * SpecVerse Test Helpers
 *
 * Utilities for entity module and engine tests.
 *
 * Key concept: CROSS-PACKAGE TEST RESOLUTION
 *
 * Tests within a single package use relative paths to their own fixtures.
 * Tests that span packages (e.g., inference loading entity grammar files)
 * use resolvePackage() to find other packages via workspace symlinks.
 *
 * This means:
 * - Single-package tests: `resolve(__dirname, '../fixtures/...')`
 * - Cross-package tests: `resolvePackage('engine-entities', 'src/core/models/...')`
 */

import { it, describe, expect } from 'vitest';
import { readFileSync, existsSync, realpathSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// Cross-Package Resolution
// ============================================================================

/**
 * Resolve a file path within another @specverse package.
 * Uses workspace node_modules symlinks to find the package root,
 * then resolves the relative path within it.
 *
 * @param packageName - Short name (e.g., 'engine-entities', 'engine-parser')
 * @param relativePath - Path within the package (e.g., 'src/core/models/behaviour/...')
 * @returns Absolute path to the file
 *
 * @example
 *   const grammar = resolvePackage('engine-entities', 'src/core/models/behaviour/conventions/grammar.yaml');
 *   const schema = resolvePackage('engine-parser', 'schema/SPECVERSE-SCHEMA.json');
 */
export function resolvePackage(packageName: string, relativePath: string): string {
  const enginesRoot = globalThis.__TEST_ENV__?.enginesRoot || resolve(__dirname);
  const symlink = resolve(enginesRoot, 'node_modules/@specverse', packageName);

  if (!existsSync(symlink)) {
    throw new Error(
      `Package @specverse/${packageName} not found in node_modules. ` +
      `Run 'npm install' in the specverse-engines root.`
    );
  }

  const pkgRoot = realpathSync(symlink);
  const fullPath = resolve(pkgRoot, relativePath);

  return fullPath;
}

/**
 * Resolve the root directory of another @specverse package.
 */
export function packageRoot(packageName: string): string {
  const enginesRoot = globalThis.__TEST_ENV__?.enginesRoot || resolve(__dirname);
  const symlink = resolve(enginesRoot, 'node_modules/@specverse', packageName);
  return realpathSync(symlink);
}

// ============================================================================
// Conditional Test Helpers
// ============================================================================

export const itIfQuint = globalThis.__TEST_ENV__?.hasQuint ? it : it.skip;
export const itIfExamples = globalThis.__TEST_ENV__?.hasExamples ? it : it.skip;

// ============================================================================
// Fixture Helpers
// ============================================================================

/**
 * Load the composed JSON schema for parser tests.
 */
export function loadSchema(): any {
  const path = globalThis.__TEST_ENV__?.schemaPath
    || resolve(__dirname, 'packages/parser/schema/SPECVERSE-SCHEMA.json');

  if (!existsSync(path)) {
    throw new Error(`Schema not found at ${path}. Run 'npm run build' in the parser package first.`);
  }

  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Resolve a path relative to the engines repo root.
 */
export function enginesPath(...segments: string[]): string {
  const root = globalThis.__TEST_ENV__?.enginesRoot || resolve(__dirname);
  return resolve(root, ...segments);
}

/**
 * Create a ProcessorContext for testing convention processors.
 */
export function createTestContext(): { warnings: string[]; addWarning: (msg: string) => void } {
  const warnings: string[] = [];
  return {
    warnings,
    addWarning(msg: string) { warnings.push(msg); },
  };
}

// ============================================================================
// Standard Test Suites (Auto-Generated Patterns)
// ============================================================================

/**
 * Standard entity module test suite.
 * Tests registration, metadata, and facet declarations.
 * Use this for any entity module to get baseline coverage.
 */
export function testEntityModule(module: any) {
  describe(`${module.name} entity module`, () => {
    it('has required metadata', () => {
      expect(module.name).toBeTruthy();
      expect(module.type).toMatch(/^(core|extension)$/);
      expect(module.version).toBeTruthy();
      expect(Array.isArray(module.dependsOn)).toBe(true);
    });

    if (module.conventionProcessor) {
      it('has a convention processor', () => {
        expect(typeof module.conventionProcessor.process).toBe('function');
      });
    }

    if (module.schema) {
      it('has a JSON Schema fragment', () => {
        expect(module.schema.$defs || module.schema.properties).toBeDefined();
      });
    }

    if (module.diagramPlugins) {
      it('declares diagram plugins', () => {
        expect(Array.isArray(module.diagramPlugins)).toBe(true);
        for (const plugin of module.diagramPlugins) {
          expect(plugin.type).toBeTruthy();
        }
      });
    }
  });
}

/**
 * Standard engine test suite.
 * Tests metadata, initialization, and capabilities.
 */
export function testEngine(engine: any) {
  describe(`${engine.name} engine`, () => {
    it('has correct metadata', () => {
      expect(engine.name).toBeTruthy();
      expect(engine.version).toBeTruthy();
      expect(Array.isArray(engine.capabilities)).toBe(true);
      expect(engine.capabilities.length).toBeGreaterThan(0);
    });

    it('has getInfo()', () => {
      const info = engine.getInfo();
      expect(info.name).toBe(engine.name);
      expect(info.version).toBe(engine.version);
    });

    it('has initialize()', () => {
      expect(typeof engine.initialize).toBe('function');
    });
  });
}
