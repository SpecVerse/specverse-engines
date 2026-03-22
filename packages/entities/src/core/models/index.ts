/**
 * Models Entity Module
 *
 * The foundational entity type in SpecVerse. Models define data structures
 * with attributes, relationships, lifecycles, behaviors, metadata, and profiles.
 *
 * This module packages the model convention processor, schema, and metadata
 * as a self-contained entity module that can be discovered by the entity registry.
 */

import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { ModelProcessor } from './conventions/model-processor.js';
import { modelInferenceRules } from './inference/index.js';
import { modelGenerators } from './generators/index.js';
import { modelDocs } from './docs/index.js';
import { modelTests } from './tests/index.js';
import type { ProcessorContext } from '@specverse/types';
import type { ModelSpec } from '@specverse/types';

// Re-export processors for direct use
export { ModelProcessor } from './conventions/model-processor.js';
export { RelationshipProcessor } from './conventions/relationship-processor.js';

// Re-export inference rules and loaders
export { modelInferenceRules, loadControllerRules, loadServiceRules } from './inference/index.js';

// Re-export generator metadata
export { modelGenerators } from './generators/index.js';

// Re-export documentation and test references
export { modelDocs } from './docs/index.js';
export { modelTests } from './tests/index.js';

/**
 * Wraps the ModelProcessor as an EntityConventionProcessor.
 *
 * The ModelProcessor needs a ProcessorContext (for warnings).
 * This wrapper creates a fresh ModelProcessor for each call,
 * matching how the ConventionProcessor currently works.
 */
function createModelConventionProcessor(): EntityConventionProcessor<any, ModelSpec[]> {
  return {
    process(input: any, context: ProcessorContext): ModelSpec[] {
      const processor = new ModelProcessor(context);
      return processor.process(input);
    }
  };
}

/**
 * The models entity module definition.
 */
export const modelsModule: EntityModule = {
  name: 'models',
  type: 'core',
  version: '3.5.1',
  dependsOn: [],

  conventionProcessor: createModelConventionProcessor(),

  inferenceRules: modelInferenceRules,

  generators: modelGenerators,

  diagramPlugins: [
    { type: 'er' },
    { type: 'class' },
  ],

  docs: modelDocs,

  tests: modelTests,
};

export default modelsModule;
