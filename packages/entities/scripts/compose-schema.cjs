#!/usr/bin/env node
// Compose the unified JSON Schema from entity module fragments.
//
// Discovers schema fragments from core and extension entity modules,
// merges their $defs into a single flat namespace, and writes the
// composed schema.
//
// Usage:
//   node compose-schema.cjs                        # output to stdout
//   node compose-schema.cjs -o schema/OUT.json     # output to file
//   node compose-schema.cjs -o schema/OUT.json --entities-src /path/to/src

const fs = require('fs');
const path = require('path');

// ── Resolve entity source directory ─────────────────────────────────────────

const args = process.argv.slice(2);
const outputIdx = args.indexOf('-o');
const outputPath = outputIdx !== -1 ? path.resolve(args[outputIdx + 1]) : null;
const entitiesSrcIdx = args.indexOf('--entities-src');

let ENTITIES;
if (entitiesSrcIdx !== -1) {
  ENTITIES = path.resolve(args[entitiesSrcIdx + 1]);
} else {
  // Default: src/ relative to this script (inside entities package)
  ENTITIES = path.resolve(__dirname, '..', 'src');
}

const verbose = process.env.VERBOSE === 'true';

if (!fs.existsSync(ENTITIES)) {
  console.error(`Entity source directory not found: ${ENTITIES}`);
  process.exit(1);
}

// ── Schema composition ──────────────────────────────────────────────────────

// Load root structure (everything except $defs)
const structure = JSON.parse(
  fs.readFileSync(path.join(ENTITIES, '_shared', 'schema', 'root-structure.json'), 'utf8')
);

const mergedDefs = {};
let fragmentCount = 0;

function loadFragment(filePath) {
  const fragment = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!fragment.$defs) return;
  for (const [key, value] of Object.entries(fragment.$defs)) {
    if (mergedDefs[key]) {
      if (JSON.stringify(mergedDefs[key]) !== JSON.stringify(value)) {
        console.error(`Conflicting $defs for "${key}" in ${path.relative(ENTITIES, filePath)}`);
        process.exit(1);
      }
      if (verbose) console.log(`  (duplicate, identical) ${key}`);
    } else {
      mergedDefs[key] = value;
      if (verbose) console.log(`  ${key} <- ${path.relative(ENTITIES, filePath)}`);
    }
  }
  fragmentCount++;
}

// 1. Shared primitives first
loadFragment(path.join(ENTITIES, '_shared', 'schema', 'primitives.schema.json'));

// 2. Root container defs
loadFragment(path.join(ENTITIES, '_shared', 'schema', 'root.schema.json'));

// 3. Core entity schemas — auto-discovered
const coreDir = path.join(ENTITIES, 'core');
if (fs.existsSync(coreDir)) {
  for (const entity of fs.readdirSync(coreDir).sort()) {
    const schemaPath = path.join(coreDir, entity, 'schema', `${entity}.schema.json`);
    if (fs.existsSync(schemaPath)) loadFragment(schemaPath);
  }
}

// 4. Extension entity schemas — auto-discovered
const extDir = path.join(ENTITIES, 'extensions');
if (fs.existsSync(extDir)) {
  for (const entity of fs.readdirSync(extDir).sort()) {
    const schemaPath = path.join(extDir, entity, 'schema', `${entity}.schema.json`);
    if (fs.existsSync(schemaPath)) loadFragment(schemaPath);
  }
}

// 5. Manifests and instance factory defs
loadFragment(path.join(ENTITIES, '_shared', 'schema', 'manifests.schema.json'));
loadFragment(path.join(ENTITIES, '_shared', 'schema', 'instance-factories.schema.json'));

// Compose final schema
const composed = { ...structure, $defs: mergedDefs };
const json = JSON.stringify(composed, null, 2) + '\n';

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, json);
  console.log(`\u2713 Composed schema from ${fragmentCount} fragments (${Object.keys(mergedDefs).length} $defs) -> ${outputPath}`);
} else {
  process.stdout.write(json);
}
