/**
 * Controllers Entity Module
 *
 * Controllers define API endpoints with CURED operations (Create, Update,
 * Retrieve, Retrieve_many, Validate, Evolve, Delete), custom actions,
 * and event subscriptions.
 *
 * This module packages the controller convention processor, schema, and metadata
 * as a self-contained entity module that can be discovered by the entity registry.
 */

import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { ControllerProcessor } from './conventions/controller-processor.js';
import { controllerInferenceRules } from './inference/index.js';
import { controllerGenerators } from './generators/index.js';
import { controllerDocs } from './docs/index.js';
import { controllerTests } from './tests/index.js';
import type { ProcessorContext } from '@specverse/types';
import type { ControllerSpec } from '@specverse/types';

// Re-export processor for direct use
export { ControllerProcessor } from './conventions/controller-processor.js';

// Re-export inference rules
export { controllerInferenceRules } from './inference/index.js';

// Re-export generator metadata
export { controllerGenerators } from './generators/index.js';

// Re-export documentation and test references
export { controllerDocs } from './docs/index.js';
export { controllerTests } from './tests/index.js';

/**
 * Wraps the ControllerProcessor as an EntityConventionProcessor.
 *
 * The ControllerProcessor needs a ProcessorContext (for warnings).
 * This wrapper creates a fresh ControllerProcessor for each call,
 * matching how the ConventionProcessor currently works.
 */
function createControllerConventionProcessor(): EntityConventionProcessor<any, ControllerSpec[]> {
  return {
    process(input: any, context: ProcessorContext): ControllerSpec[] {
      const processor = new ControllerProcessor(context);
      return processor.process(input);
    }
  };
}

/**
 * The controllers entity module definition.
 */
export const controllersModule: EntityModule = {
  name: 'controllers',
  type: 'core',
  version: '3.5.1',
  dependsOn: ['models'],

  conventionProcessor: createControllerConventionProcessor(),

  inferenceRules: controllerInferenceRules,

  generators: controllerGenerators,

  diagramPlugins: [
    { type: 'architecture' },
  ],

  docs: controllerDocs,

  tests: controllerTests,
};

export default controllersModule;
