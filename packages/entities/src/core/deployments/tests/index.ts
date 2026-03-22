/**
 * Deployments Entity — Test References
 *
 * Catalogs all test files that validate the deployments entity type.
 * Includes unit tests, parity tests, integration tests, and
 * example spec files used for validation.
 *
 * These references allow the entity registry to report test coverage
 * and support tooling that needs to discover entity-specific tests.
 */

import type { EntityTestReference } from '../../../_shared/types.js';

/**
 * Test references for the deployments entity.
 */
export const deploymentTests: EntityTestReference[] = [
  // === Example Spec Files (used as test fixtures) ===
  {
    title: 'Minimal Deployment Test Spec',
    category: 'example-spec',
    path: 'tests/00-minimal-deployment.specly',
    description: 'Minimal deployment test specification for validation',
  },

  // === Integration Tests (exercising deployment parsing) ===
  {
    title: 'Comprehensive Deployment Tests',
    category: 'integration',
    path: 'src/parser/__tests__/comprehensive-deployment.test.ts',
    description: 'Comprehensive deployment parsing and validation tests',
  },

  // === Unit Tests (deployment diagram generation) ===
  {
    title: 'Deployment Diagram Plugin Tests',
    category: 'unit',
    path: 'src/diagram-engine/__tests__/plugins/DeploymentPlugin.test.ts',
    description: 'Deployment diagram generation from deployment definitions',
  },

  // === Entity Module Parity Tests ===
  {
    title: 'Deployments Entity Parity Tests',
    category: 'parity',
    path: 'src/entities/__tests__/deployments-entity.test.ts',
    description: 'Parity tests: entity module processor vs original processor',
  },
];
