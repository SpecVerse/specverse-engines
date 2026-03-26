/**
 * Models Entity — Documentation References
 *
 * Catalogs all documentation, examples, and guides that belong to
 * the models entity type. These references allow the entity registry
 * to surface relevant documentation for tooling, MCP server resources,
 * and developer experience features.
 */

import type { EntityDocReference } from '../../../_shared/types.js';

/**
 * Documentation references for the models entity.
 */
export const modelDocs: EntityDocReference[] = [
  // === Examples: Fundamentals ===
  {
    title: 'Basic Model',
    category: 'example',
    path: './examples/basic-model.specly',
    description: 'Core model syntax: attributes with convention shorthand, type inference',
  },
  {
    title: 'Model with Lifecycle',
    category: 'example',
    path: './examples/model-with-lifecycle.specly',
    description: 'State machines on models: states, transitions, guards',
  },
  {
    title: 'Model with Behaviors',
    category: 'example',
    path: './examples/model-with-behaviors.specly',
    description: 'Behaviors, parameters, contracts (pre/post/invariant)',
  },
  {
    title: 'Models with Relations',
    category: 'example',
    path: './examples/models-with-relations.specly',
    description: 'Relationships: hasMany, belongsTo, hasOne, manyToMany',
  },
  {
    title: 'Behaviors with Steps',
    category: 'example',
    path: './examples/behaviors-with-steps.specly',
    description: 'Multi-step behaviors with detailed action sequences',
  },

  // === Test Specifications ===
  {
    title: 'Models Test Spec',
    category: 'example',
    path: 'tests/03-models.specly',
    description: 'Comprehensive model test specification',
  },
  {
    title: 'Multi-Model Test Spec',
    category: 'example',
    path: 'tests/09-multi-models.specly',
    description: 'Multiple models with cross-model relationships',
  },

  // === Guides ===
  {
    title: 'YAML Conventions Guide',
    category: 'guide',
    path: 'docs/guides/yaml-conventions.md',
    description: 'Convention syntax reference including model attribute shorthand',
  },

  // === Architecture ===
  {
    title: 'Convention Processor Analysis',
    category: 'architecture',
    path: 'docs/design/convention-processor-analysis.md',
    description: 'Design analysis of the convention processing pipeline',
  },
];
