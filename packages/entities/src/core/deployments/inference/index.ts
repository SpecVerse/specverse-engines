/**
 * Deployments Entity — Inference Rules
 *
 * Deployments have their own inference rules that auto-generate logical
 * deployment configurations from component definitions. The deployment
 * inference engine generates:
 * - Controller instances from component controllers
 * - Service instances from component services
 * - View instances grouped by interface type
 * - Communication channels (global bus + domain-specific buses)
 * - Minimal deployment configurations
 *
 * The rule JSON file here is the source of truth. The build system
 * composes it into dist/inference-engine/rules/deployment/ via
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
 * Works in both ESM and CJS contexts (see models/inference/index.ts for details).
 */
function resolveRulesDir(): string {
  if (typeof __dirname !== 'undefined') return __dirname;
  const url: string = new Function('return import.meta.url')();
  return dirname(fileURLToPath(url));
}

/**
 * Inference rule metadata for the deployments entity.
 *
 * These describe what rules exist and what they generate.
 * Priority matches the rule JSON files.
 */
export const deploymentInferenceRules: EntityInferenceRule[] = [
  // Instance generation rules (component → deployment instances)
  {
    id: 'deployments:controller_instances',
    description: 'Generate controller instances from component controllers',
    triggeredBy: 'controllers',
    generates: ['deployments'],
    priority: 100,
  },
  {
    id: 'deployments:service_instances',
    description: 'Generate service instances from component services',
    triggeredBy: 'services',
    generates: ['deployments'],
    priority: 90,
  },
  {
    id: 'deployments:view_instances',
    description: 'Generate view instances grouped by interface type',
    triggeredBy: 'views',
    generates: ['deployments'],
    priority: 80,
  },

  // Channel generation rules (component → communication channels)
  {
    id: 'deployments:main_communication_bus',
    description: 'Generate main communication bus for all component capabilities',
    triggeredBy: 'models',
    generates: ['deployments'],
    priority: 100,
  },
  {
    id: 'deployments:domain_communication_buses',
    description: 'Generate domain-specific communication buses for complex components',
    triggeredBy: 'models',
    generates: ['deployments'],
    priority: 90,
  },

  // Deployment generation rules (instances + channels → deployment config)
  {
    id: 'deployments:minimal_deployment',
    description: 'Generate minimal deployment configuration for component',
    triggeredBy: 'models',
    generates: ['deployments'],
    priority: 100,
  },
];

/**
 * Load the raw deployment rules JSON for use by the inference engine.
 */
export function loadDeploymentRules(): any {
  const dir = resolveRulesDir();
  return JSON.parse(readFileSync(resolve(dir, 'v3.1-deployment-rules.json'), 'utf8'));
}
