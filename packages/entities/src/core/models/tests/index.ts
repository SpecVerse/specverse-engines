/**
 * Models Entity — Test References
 *
 * Catalogs all test files that validate the models entity type.
 * Includes unit tests, parity tests, integration tests, and
 * example spec files used for validation.
 *
 * These references allow the entity registry to report test coverage
 * and support tooling that needs to discover entity-specific tests.
 */

import type { EntityTestReference } from '../../../_shared/types.js';

/**
 * Test references for the models entity.
 */
export const modelTests: EntityTestReference[] = [
  // === Entity Module Tests (new, co-located) ===
  {
    title: 'Convention Processor Tests',
    category: 'parity',
    path: 'src/entities/__tests__/models-convention-processor.test.ts',
    description: 'Parity tests: entity module processor vs original processor, convention expansion',
  },
  {
    title: 'Inference Rules Tests',
    category: 'unit',
    path: 'src/entities/__tests__/models-inference-rules.test.ts',
    description: 'Rule metadata validation, JSON parity, metadata-JSON consistency',
  },
  {
    title: 'Generator Tests',
    category: 'unit',
    path: 'src/entities/__tests__/models-generators.test.ts',
    description: 'Generator metadata validation, factory file existence, module integration',
  },
  {
    title: 'Schema Tests',
    category: 'unit',
    path: 'src/entities/__tests__/entity-schema.test.ts',
    description: 'Schema extraction validation, monolith parity, coverage tracking',
  },

  // === Original Parser Tests (exercising model conventions) ===
  {
    title: 'Convention Processor Tests (Original)',
    category: 'integration',
    path: 'src/parser/__tests__/convention-processor.test.ts',
    description: 'Original convention processor tests including model attribute expansion',
  },
  {
    title: 'Parser Tests',
    category: 'integration',
    path: 'src/parser/__tests__/specverse-parser.test.ts',
    description: 'Full parser validation including model parsing and schema validation',
  },
  {
    title: 'Simple Example Tests',
    category: 'integration',
    path: 'src/parser/__tests__/simple-example.test.ts',
    description: 'Basic model parsing examples',
  },
  {
    title: 'Complete Example Tests',
    category: 'integration',
    path: 'src/parser/__tests__/complete-example.test.ts',
    description: 'Comprehensive model examples with all features',
  },

  // === Diagram Tests (model visualization) ===
  {
    title: 'ER Diagram Plugin Tests',
    category: 'unit',
    path: 'src/diagram-engine/__tests__/plugins/ERDiagramPlugin.test.ts',
    description: 'Entity-relationship diagram generation from model definitions',
  },
  {
    title: 'Lifecycle Plugin Tests',
    category: 'unit',
    path: 'src/diagram-engine/__tests__/plugins/LifecyclePlugin.test.ts',
    description: 'Lifecycle diagram generation from model state machines',
  },
  {
    title: 'ER Diagram Integration Tests',
    category: 'integration',
    path: 'src/diagram-engine/__tests__/integration/ERDiagram-integration.test.ts',
    description: 'End-to-end ER diagram generation with real model specs',
  },
  {
    title: 'Lifecycle Integration Tests',
    category: 'integration',
    path: 'src/diagram-engine/__tests__/integration/Lifecycle-integration.test.ts',
    description: 'End-to-end lifecycle diagram generation with real model specs',
  },

  // === Example Spec Files (used as test fixtures) ===
  {
    title: 'Models Test Spec',
    category: 'example-spec',
    path: 'tests/03-models.specly',
    description: 'Comprehensive model test specification',
  },
  {
    title: 'Multi-Model Test Spec',
    category: 'example-spec',
    path: 'tests/09-multi-models.specly',
    description: 'Multiple models with cross-model relationships',
  },
  {
    title: 'File Model Test Spec',
    category: 'example-spec',
    path: 'tests/file-model.specly',
    description: 'File-based model examples',
  },
];
