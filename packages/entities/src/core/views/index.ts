/**
 * Views Entity Module
 *
 * The UI layer entity type in SpecVerse. Views define user interface
 * specifications with types, models, subscriptions, UI components,
 * layouts, and properties.
 *
 * This module packages the view convention processor, schema, and metadata
 * as a self-contained entity module that can be discovered by the entity registry.
 */

import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { ViewProcessor } from './conventions/view-processor.js';
import { viewInferenceRules } from './inference/index.js';
import { viewGenerators } from './generators/index.js';
import { viewDocs } from './docs/index.js';
import { viewTests } from './tests/index.js';
import type { ProcessorContext } from '@specverse/types';
import type { ViewSpec } from '@specverse/types';

// Re-export processor for direct use
export { ViewProcessor } from './conventions/view-processor.js';

// Re-export inference rules and loaders
export {
  viewInferenceRules,
  loadViewRules,
  loadSpecialistViewRules,
  loadSpecialistViews,
  loadViewComponentInference,
} from './inference/index.js';

// Re-export generator metadata
export { viewGenerators } from './generators/index.js';

// Re-export documentation and test references
export { viewDocs } from './docs/index.js';
export { viewTests } from './tests/index.js';

/**
 * Wraps the ViewProcessor as an EntityConventionProcessor.
 *
 * The ViewProcessor needs a ProcessorContext (for warnings).
 * This wrapper creates a fresh ViewProcessor for each call,
 * matching how the ConventionProcessor currently works.
 */
function createViewConventionProcessor(): EntityConventionProcessor<any, ViewSpec[]> {
  return {
    process(input: any, context: ProcessorContext): ViewSpec[] {
      const processor = new ViewProcessor(context);
      return processor.process(input);
    }
  };
}

/**
 * The views entity module definition.
 */
export const viewsModule: EntityModule = {
  name: 'views',
  type: 'core',
  version: '3.5.1',
  dependsOn: ['models', 'controllers'],

  conventionProcessor: createViewConventionProcessor(),

  inferenceRules: viewInferenceRules,

  generators: viewGenerators,

  diagramPlugins: [],

  docs: viewDocs,

  tests: viewTests,
};

export default viewsModule;
