/**
 * Deployments Entity Module
 *
 * Deployments define logical instance configurations with capability-based
 * architecture. They map component definitions (controllers, services, views)
 * to deployment instances with scaling, communication channels, and
 * infrastructure concerns (storage, security, infrastructure, monitoring).
 *
 * This module packages the deployment convention processor, schema, and metadata
 * as a self-contained entity module that can be discovered by the entity registry.
 */

import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { DeploymentProcessor } from './conventions/deployment-processor.js';
import { deploymentInferenceRules } from './inference/index.js';
import { deploymentGenerators } from './generators/index.js';
import { deploymentDocs } from './docs/index.js';
import { deploymentTests } from './tests/index.js';
import type { ProcessorContext } from '@specverse/types';
import type { DeploymentSpec } from '@specverse/types';

// Re-export processor for direct use
export { DeploymentProcessor } from './conventions/deployment-processor.js';

// Re-export inference rules and loaders
export { deploymentInferenceRules, loadDeploymentRules } from './inference/index.js';

// Re-export generator metadata
export { deploymentGenerators } from './generators/index.js';

// Re-export documentation and test references
export { deploymentDocs } from './docs/index.js';
export { deploymentTests } from './tests/index.js';

/**
 * Wraps the DeploymentProcessor as an EntityConventionProcessor.
 *
 * The DeploymentProcessor needs a ProcessorContext (for warnings).
 * This wrapper creates a fresh DeploymentProcessor for each call,
 * matching how the ConventionProcessor currently works.
 */
function createDeploymentConventionProcessor(): EntityConventionProcessor<any, DeploymentSpec[]> {
  return {
    process(input: any, context: ProcessorContext): DeploymentSpec[] {
      const processor = new DeploymentProcessor(context);
      return processor.process(input);
    }
  };
}

/**
 * The deployments entity module definition.
 */
export const deploymentsModule: EntityModule = {
  name: 'deployments',
  type: 'core',
  version: '3.5.1',
  dependsOn: ['models', 'controllers', 'services', 'events', 'views'],

  conventionProcessor: createDeploymentConventionProcessor(),

  inferenceRules: deploymentInferenceRules,

  generators: deploymentGenerators,

  diagramPlugins: [
    { type: 'deployment', variants: ['topology', 'capability-flow'] },
    { type: 'manifest' },
  ],

  docs: deploymentDocs,

  tests: deploymentTests,
};

export default deploymentsModule;
