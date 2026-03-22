/**
 * Models Entity — Inference Rules
 *
 * Models are the primary trigger for inference. When a model is defined,
 * the inference engine generates:
 * - Controllers (CURED operations) via controller rules
 * - Services (lifecycle management, relationships) via service rules
 * - Events (CRUD events, lifecycle events) via event rules (in events entity)
 *
 * The rule JSON files here are the source of truth. The build system
 * composes them into dist/inference-engine/rules/logical/ via
 * scripts/build-tools/compose-inference-rules.cjs.
 *
 * The EntityInferenceRule metadata declared here describes what rules exist.
 * The inference engine infrastructure (RuleEngine, generators) executes them.
 */

import type { EntityInferenceRule } from '../../../_shared/types.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Lazily resolve the directory containing the inference rule JSON files.
 * Uses CJS __dirname when available (e.g. when compiled by a sub-project
 * with module:"commonjs"), otherwise falls back to the ESM import.meta.url
 * pattern.  The indirection through Function() prevents the TypeScript
 * CJS emitter from choking on `import.meta.url` at parse time.
 */
function resolveRulesDir(): string {
  // CJS – __dirname is a global
  if (typeof __dirname !== 'undefined') return __dirname;
  // ESM – derive from import.meta.url (hidden behind Function to survive CJS compilation)
  const url: string = new Function('return import.meta.url')();
  return dirname(fileURLToPath(url));
}

/**
 * Inference rule metadata for the models entity.
 *
 * These describe what rules exist and what they generate.
 * Priority matches the rule JSON files.
 */
export const modelInferenceRules: EntityInferenceRule[] = [
  // Controller generation rules (model → controller)
  {
    id: 'models:cured_root_controller',
    description: 'Standard CURED controller for root entities (no parent relationships)',
    triggeredBy: 'models',
    generates: ['controllers'],
    priority: 100,
  },
  {
    id: 'models:cured_child_controller',
    description: 'CURED controller for child entities with parent-scoped operations',
    triggeredBy: 'models',
    generates: ['controllers'],
    priority: 90,
  },
  {
    id: 'models:many_to_many_controller_enhancement',
    description: 'Additional operations for models with many-to-many relationships',
    triggeredBy: 'models',
    generates: ['controllers'],
    priority: 80,
  },
  {
    id: 'models:profile_aware_controller',
    description: 'Additional operations for models with profile attachments',
    triggeredBy: 'models',
    generates: ['controllers'],
    priority: 75,
  },

  // Service generation rules (model → service)
  {
    id: 'models:integration_service',
    description: 'Handles external system integration for models requiring it',
    triggeredBy: 'models',
    generates: ['services'],
    priority: 85,
  },
  {
    id: 'models:lifecycle_service',
    description: 'Manages complex lifecycle transitions and state-dependent behavior',
    triggeredBy: 'models',
    generates: ['services'],
    priority: 80,
  },
  {
    id: 'models:relationship_service',
    description: 'Manages complex relationships and relationship integrity',
    triggeredBy: 'models',
    generates: ['services'],
    priority: 75,
  },
];

/**
 * Load the raw controller rules JSON for use by the inference engine.
 */
export function loadControllerRules(): any {
  const dir = resolveRulesDir();
  const path = resolve(dir, 'v3.1-controller-rules.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Load the raw service rules JSON for use by the inference engine.
 */
export function loadServiceRules(): any {
  const dir = resolveRulesDir();
  const path = resolve(dir, 'v3.1-service-rules.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}
