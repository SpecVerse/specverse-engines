/**
 * SpecVerse Test Helpers
 *
 * Utilities for entity module and engine tests.
 * Provides conditional test execution, fixture loading, and
 * standard test patterns.
 */

import { it, describe } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Re-export conditional test helpers
export const itIfQuint = globalThis.__TEST_ENV__?.hasQuint ? it : it.skip;
export const itIfExamples = globalThis.__TEST_ENV__?.hasExamples ? it : it.skip;

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
 * Resolve a path relative to specverse-lang (if available).
 * Returns null if specverse-lang is not present.
 */
export function langPath(...segments: string[]): string | null {
  const root = globalThis.__TEST_ENV__?.langRoot;
  if (!root) return null;
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

/**
 * Standard entity module test suite.
 * Automatically tests registration, schema, convention processor, and metadata.
 *
 * Usage:
 *   import { testEntityModule } from '../../test-helpers';
 *   testEntityModule(myModule);
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
        expect(module.conventionProcessor).toBeDefined();
        expect(typeof module.conventionProcessor.process).toBe('function');
      });
    }

    if (module.schema) {
      it('has a JSON Schema fragment', () => {
        expect(module.schema).toBeDefined();
        expect(module.schema.$defs || module.schema.properties).toBeDefined();
      });
    }

    if (module.inferenceRules) {
      it('declares inference rules', () => {
        expect(Array.isArray(module.inferenceRules)).toBe(true);
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

    if (module.docs) {
      describe('documentation references', () => {
        for (const doc of module.docs) {
          itIfExamples(`should have file for "${doc.title}"`, () => {
            const fullPath = langPath(doc.path);
            if (fullPath) {
              expect(existsSync(fullPath)).toBe(true);
            }
          });
        }
      });
    }

    if (module.tests) {
      describe('test references', () => {
        for (const test of module.tests) {
          itIfExamples(`should have file for "${test.title}"`, () => {
            const fullPath = langPath(test.path);
            if (fullPath) {
              expect(existsSync(fullPath)).toBe(true);
            }
          });
        }
      });
    }
  });
}

/**
 * Standard engine test suite.
 * Tests metadata, initialization, and capabilities.
 *
 * Usage:
 *   import { testEngine } from '../../test-helpers';
 *   testEngine(engine);
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
