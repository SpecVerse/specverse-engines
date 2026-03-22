/**
 * Views Entity — Test References
 *
 * Catalogs all test files that validate the views entity type.
 * Includes example spec files used for validation and parity tests
 * that verify the entity module matches the original implementation.
 *
 * These references allow the entity registry to report test coverage
 * and support tooling that needs to discover entity-specific tests.
 */

import type { EntityTestReference } from '../../../_shared/types.js';

/**
 * Test references for the views entity.
 */
export const viewTests: EntityTestReference[] = [
  // === Example Spec Files (used as test fixtures) ===
  {
    title: 'Views Array Test Spec',
    category: 'example-spec',
    path: 'tests/07-views-array.specly',
    description: 'View definitions using array-based uiComponents format',
  },
  {
    title: 'Views Indentation Test Spec',
    category: 'example-spec',
    path: 'tests/08-views-indentation.specly',
    description: 'View definitions with various indentation patterns',
  },

  // === Entity Module Tests ===
  {
    title: 'Views Entity Module Tests',
    category: 'parity',
    path: 'src/entities/__tests__/views-entity.test.ts',
    description: 'Parity tests: entity module processor vs original ViewProcessor',
  },
];
