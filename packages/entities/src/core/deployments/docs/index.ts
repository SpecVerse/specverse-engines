/**
 * Deployments Entity — Documentation References
 *
 * Catalogs all documentation, examples, and guides that belong to
 * the deployments entity type. These references allow the entity registry
 * to surface relevant documentation for tooling, MCP server resources,
 * and developer experience features.
 */

import type { EntityDocReference } from '../../../_shared/types.js';

/**
 * Documentation references for the deployments entity.
 */
export const deploymentDocs: EntityDocReference[] = [
  // === Examples: Deployment ===
  {
    title: 'Basic Deployment Intro',
    category: 'example',
    path: 'examples/06-deploy/06-01-basic-deployment-intro.specly',
    description: 'Introduction to deployment specifications: environments, instances, capabilities',
  },
  {
    title: 'Enhanced Deployment Example',
    category: 'example',
    path: 'examples/06-deploy/06-02-enhanced-deployment-example.specly',
    description: 'Advanced deployment with storage, security, infrastructure, and monitoring instances',
  },

  // === Test Specifications ===
  {
    title: 'Minimal Deployment Test Spec',
    category: 'example',
    path: 'tests/00-minimal-deployment.specly',
    description: 'Minimal deployment test specification for validation',
  },
];
