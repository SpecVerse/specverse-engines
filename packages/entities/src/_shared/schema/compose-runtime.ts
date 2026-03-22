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

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

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

    const coreEntities = ['models', 'controllers', 'services', 'events', 'views', 'deployments'];
    for (const entity of coreEntities) {
      loadFragment(resolve(entitiesDir, 'core', entity, 'schema', `${entity}.schema.json`));
    }

    const extEntities = ['commands', 'conventions', 'measures'];
    for (const entity of extEntities) {
      loadFragment(resolve(entitiesDir, 'extensions', entity, 'schema', `${entity}.schema.json`));
    }

    loadFragment(resolve(sharedDir, 'manifests.schema.json'));
    loadFragment(resolve(sharedDir, 'instance-factories.schema.json'));

    if (Object.keys(mergedDefs).length === 0) return null;

    return {
      ...structure,
      $defs: mergedDefs,
    };
  } catch {
    return null;
  }
}

function resolveThisFile(): string {
  if (typeof __dirname !== 'undefined') {
    return resolve(__dirname, 'compose-runtime.js');
  }
  // ESM context
  try {
    const url = new Function('return import.meta.url')();
    return url.startsWith('file://') ? url.slice(7) : url;
  } catch {
    return '';
  }
}
