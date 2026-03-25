/**
 * Runtime Schema Composition
 *
 * Composes the unified SpecVerse schema from entity module fragments at runtime.
 * Used by the app demo engine and other runtime contexts where the pre-composed
 * schema file may not be available.
 *
 * Falls back gracefully — returns null if entity module schema fragments
 * aren't available, so callers can fall back to loading from file.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Compose the unified schema from entity module fragments at runtime.
 * Returns the composed schema object, or null if fragments aren't available.
 */
export function composeSchemaFromRegistry(): any | null {
  try {
    // Resolve the entities source directory
    const entitiesDir = resolve(dirname(resolveThisFile()), '..');

    // Load root structure (the oneOf envelope)
    const structurePath = resolve(entitiesDir, '_shared', 'schema', 'root-structure.json');
    if (!existsSync(structurePath)) return null;
    const structure = JSON.parse(readFileSync(structurePath, 'utf8'));

    // Collect all $defs from fragment files
    const mergedDefs: Record<string, any> = {};

    function loadFragment(filePath: string) {
      if (!existsSync(filePath)) return;
      const fragment = JSON.parse(readFileSync(filePath, 'utf8'));
      if (fragment.$defs) {
        for (const [key, value] of Object.entries(fragment.$defs)) {
          mergedDefs[key] = value;
        }
      }
    }

    // Load in the same order as the build-time compose script
    const sharedDir = resolve(entitiesDir, '_shared', 'schema');
    loadFragment(resolve(sharedDir, 'primitives.schema.json'));
    loadFragment(resolve(sharedDir, 'root.schema.json'));

    // Auto-discover core entity schemas
    const coreDir = resolve(entitiesDir, 'core');
    if (existsSync(coreDir)) {
      for (const entity of readdirSync(coreDir).sort()) {
        loadFragment(resolve(coreDir, entity, 'schema', `${entity}.schema.json`));
      }
    }

    // Auto-discover extension entity schemas
    const extDir = resolve(entitiesDir, 'extensions');
    if (existsSync(extDir)) {
      for (const entity of readdirSync(extDir).sort()) {
        loadFragment(resolve(extDir, entity, 'schema', `${entity}.schema.json`));
      }
    }

    loadFragment(resolve(sharedDir, 'manifests.schema.json'));
    loadFragment(resolve(sharedDir, 'instance-factories.schema.json'));

    if (Object.keys(mergedDefs).length === 0) return null;

    return {
      ...structure,
      $defs: mergedDefs,
    };
  } catch (error) {
    console.warn(`Schema composition failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const __composeRuntimeDir = dirname(fileURLToPath(import.meta.url));

function resolveThisFile(): string {
  return resolve(__composeRuntimeDir, 'compose-runtime.js');
}
