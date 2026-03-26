/**
 * Views Entity — Documentation References
 *
 * Catalogs all documentation, examples, and guides that belong to
 * the views entity type. These references allow the entity registry
 * to surface relevant documentation for tooling, MCP server resources,
 * and developer experience features.
 */

import type { EntityDocReference } from '../../../_shared/types.js';

/**
 * Documentation references for the views entity.
 */
export const viewDocs: EntityDocReference[] = [
  // === Examples: Architecture ===
  {
    title: 'Views and Components',
    category: 'example',
    path: './examples/views-and-components.specly',
    description: 'View definitions with UI components, subscriptions, and layout',
  },

  // === Examples: View Inference ===
  {
    title: 'Automatic CRUD Views',
    category: 'example',
    path: './examples/automatic-crud-views.specly',
    description: 'Level 1: Automatic CRUD view generation from models',
  },
  {
    title: 'Specialist Dashboard',
    category: 'example',
    path: './examples/specialist-dashboard.specly',
    description: 'Specialist dashboard view type with metrics and charts',
  },
  {
    title: 'Explicit Override',
    category: 'example',
    path: './examples/explicit-override.specly',
    description: 'Explicit view definitions override inferred views',
  },
  {
    title: 'All Specialist Types',
    category: 'example',
    path: './examples/all-specialist-types.specly',
    description: 'Comprehensive demonstration of all specialist view types',
  },
  {
    title: 'Test View Generation',
    category: 'example',
    path: './examples/test-view-generation.specly',
    description: 'Test specification for view inference validation',
  },
];
