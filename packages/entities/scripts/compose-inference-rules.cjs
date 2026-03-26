#!/usr/bin/env node
// Compose inference rules from entity modules into an output directory.
//
// Discovers entity modules with inference/ directories containing .json
// rule files. Copies them to the output, split by category:
//   deployment rules → {output}/deployment/
//   everything else  → {output}/logical/
//
// Usage:
//   node compose-inference-rules.cjs -o dist/inference-engine/rules
//   node compose-inference-rules.cjs -o /path/to/output --entities-src /path/to/src

const fs = require('fs');
const path = require('path');

// ── Resolve paths ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const outputIdx = args.indexOf('-o');
const entitiesSrcIdx = args.indexOf('--entities-src');

if (outputIdx === -1) {
  console.error('Usage: compose-inference-rules.cjs -o <output-dir>');
  process.exit(1);
}

const OUTPUT = path.resolve(args[outputIdx + 1]);
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

// ── Discovery and composition ───────────────────────────────────────────────

let totalCopied = 0;
const sources = [];

for (const category of ['core', 'extensions']) {
  const categoryDir = path.join(ENTITIES, category);
  if (!fs.existsSync(categoryDir)) continue;

  for (const entity of fs.readdirSync(categoryDir).sort()) {
    const inferenceDir = path.join(categoryDir, entity, 'inference');
    if (!fs.existsSync(inferenceDir)) continue;

    const jsonFiles = fs.readdirSync(inferenceDir).filter(f => f.endsWith('.json'));
    if (jsonFiles.length === 0) continue;

    // Deployment entity rules go to deployment/, everything else to logical/
    const target = entity === 'deployments' ? 'deployment' : 'logical';
    sources.push({ entity: `${category}/${entity}`, target, dir: inferenceDir, files: jsonFiles });
  }
}

for (const { entity, target, dir, files } of sources) {
  const destDir = path.join(OUTPUT, target);
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    fs.copyFileSync(path.join(dir, file), path.join(destDir, file));
    totalCopied++;
    if (verbose) {
      console.log(`  ${entity}/inference/${file} -> ${target}/${file}`);
    }
  }
}

console.log(`\u2713 Composed ${totalCopied} inference rule files from ${sources.length} entity modules -> ${OUTPUT}`);
