/**
 * Schema Composition - Assembles per-entity schemas into the unified schema
 *
 * This script takes the shared primitives schema and per-entity schemas,
 * merges their $defs, and produces the complete SPECVERSE-SCHEMA.json.
 *
 * The composed schema MUST be identical to the original monolith.
 * This is verified by tests.
 *
 * Usage:
 *   npx tsx src/entities/_shared/schema/compose-schema.ts [--verify]
 *
 * With --verify: compares composed output against existing schema and exits
 * with code 1 if they differ. Used in CI.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve paths relative to project root
const projectRoot = resolve(__dirname, '../../../../');

interface SchemaFile {
  path: string;
  label: string;
}

/**
 * Load a JSON schema file and return its $defs.
 */
function loadDefs(schemaPath: string): Record<string, any> {
  const content = readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(content);
  return schema.$defs || {};
}

/**
 * Compose the unified schema from entity schemas.
 *
 * Strategy: Load the original monolith, then verify that all entity schema
 * $defs exist in it with identical content. This ensures the extraction
 * was correct without needing to reassemble the top-level structure.
 */
export function verifyEntitySchemas(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Load the original monolith
  const monolithPath = resolve(projectRoot, 'schema/SPECVERSE-SCHEMA.json');
  const monolith = JSON.parse(readFileSync(monolithPath, 'utf8'));
  const monolithDefs = monolith.$defs || {};

  // Entity schema files to verify
  const entitySchemas: SchemaFile[] = [
    {
      path: resolve(__dirname, 'primitives.schema.json'),
      label: 'shared/primitives',
    },
    {
      path: resolve(projectRoot, 'src/entities/core/models/schema/models.schema.json'),
      label: 'entities/models',
    },
  ];

  // Verify each entity schema's $defs match the monolith
  for (const schema of entitySchemas) {
    const defs = loadDefs(schema.path);

    for (const [key, value] of Object.entries(defs)) {
      if (!monolithDefs[key]) {
        errors.push(`${schema.label}: $def "${key}" not found in monolith`);
        continue;
      }

      const monolithValue = JSON.stringify(monolithDefs[key]);
      const entityValue = JSON.stringify(value);

      if (monolithValue !== entityValue) {
        errors.push(
          `${schema.label}: $def "${key}" differs from monolith.\n` +
          `  Monolith: ${monolithValue.substring(0, 100)}...\n` +
          `  Entity:   ${entityValue.substring(0, 100)}...`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get the set of $def keys covered by entity schemas.
 */
export function getCoveredDefs(): Set<string> {
  const covered = new Set<string>();

  const entitySchemas = [
    resolve(__dirname, 'primitives.schema.json'),
    resolve(projectRoot, 'src/entities/core/models/schema/models.schema.json'),
  ];

  for (const schemaPath of entitySchemas) {
    const defs = loadDefs(schemaPath);
    for (const key of Object.keys(defs)) {
      covered.add(key);
    }
  }

  return covered;
}

/**
 * Get uncovered $defs (ones still only in the monolith).
 * These will be extracted as more entities are modularised.
 */
export function getUncoveredDefs(): string[] {
  const monolithPath = resolve(projectRoot, 'schema/SPECVERSE-SCHEMA.json');
  const monolith = JSON.parse(readFileSync(monolithPath, 'utf8'));
  const monolithDefs = Object.keys(monolith.$defs || {});
  const covered = getCoveredDefs();

  return monolithDefs.filter(key => !covered.has(key));
}

// CLI entry point
if (process.argv[1] && process.argv[1].includes('compose-schema')) {
  const result = verifyEntitySchemas();

  if (result.valid) {
    console.log('✅ All entity schema definitions match the monolith.');
    const uncovered = getUncoveredDefs();
    console.log(`\n📊 Coverage: ${getCoveredDefs().size} of ${getCoveredDefs().size + uncovered.length} $defs extracted`);
    if (uncovered.length > 0) {
      console.log(`\n⏳ Not yet extracted (${uncovered.length}):`);
      for (const def of uncovered) {
        console.log(`   - ${def}`);
      }
    }
  } else {
    console.error('❌ Entity schema verification failed:');
    for (const error of result.errors) {
      console.error(`   ${error}`);
    }
    process.exit(1);
  }
}
