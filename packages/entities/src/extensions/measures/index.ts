/**
 * Measures Extension Entity Module
 *
 * Measures define aggregation semantics — computed values over model fields
 * with dimensional breakdowns. They represent metrics, KPIs, and analytics
 * that can be realized as dbt models, Cube.js measures, SQL views, or
 * Looker dimensions.
 *
 * This is an extension entity type distributed via the registry.
 */

import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { MeasureProcessor } from './conventions/measure-processor.js';
import type { MeasureSpec } from './conventions/measure-processor.js';
import { measureInferenceRules } from './inference/index.js';
import { measureGenerators } from './generators/index.js';
import { measureDocs } from './docs/index.js';
import { measureTests } from './tests/index.js';
import type { ProcessorContext } from '@specverse/types';

// Re-export processor and types
export { MeasureProcessor, type MeasureSpec } from './conventions/measure-processor.js';

// Re-export inference rules
export { measureInferenceRules } from './inference/index.js';

// Re-export generator metadata
export { measureGenerators } from './generators/index.js';

// Re-export documentation and test references
export { measureDocs } from './docs/index.js';
export { measureTests } from './tests/index.js';

/**
 * Wraps the MeasureProcessor as an EntityConventionProcessor.
 *
 * Creates a fresh MeasureProcessor for each call, matching the
 * convention processor pattern used by core entity modules.
 */
function createMeasureConventionProcessor(): EntityConventionProcessor<any, MeasureSpec[]> {
  return {
    process(input: any, context: ProcessorContext): MeasureSpec[] {
      const processor = new MeasureProcessor(context);
      return processor.process(input);
    }
  };
}

/**
 * The measures entity module definition.
 */
export const measuresModule: EntityModule = {
  name: 'measures',
  type: 'extension',
  version: '0.1.0',
  dependsOn: ['models'],

  conventionProcessor: createMeasureConventionProcessor(),

  inferenceRules: measureInferenceRules,

  generators: measureGenerators,

  diagramPlugins: [],

  docs: measureDocs,

  tests: measureTests,
};

export default measuresModule;
