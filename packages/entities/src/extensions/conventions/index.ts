/**
 * Conventions Entity Module
 *
 * The meta-circular entity type that defines how conventions themselves work.
 * Convention definitions specify grammar rules for how shorthand syntax
 * expands into full definitions across all entity types.
 *
 * This is self-referential: the conventions entity type defines how
 * convention processing works, using the same module pattern as every
 * other entity type in SpecVerse.
 */

import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { ConventionDefinitionProcessor } from './conventions/convention-definition-processor.js';
import type { ConventionDefinitionSpec } from './conventions/convention-definition-processor.js';
import { conventionInferenceRules } from './inference/index.js';
import { conventionGenerators } from './generators/index.js';
import { conventionDocs } from './docs/index.js';
import { conventionTests } from './tests/index.js';
import type { ProcessorContext } from '@specverse/types';

// Re-export processor and types for direct use
export { ConventionDefinitionProcessor, type ConventionDefinitionSpec } from './conventions/convention-definition-processor.js';
export type { ModifierEffect } from './conventions/convention-definition-processor.js';

// Re-export facets
export { conventionInferenceRules } from './inference/index.js';
export { conventionGenerators } from './generators/index.js';
export { conventionDocs } from './docs/index.js';
export { conventionTests } from './tests/index.js';

/**
 * Wraps the ConventionDefinitionProcessor as an EntityConventionProcessor.
 *
 * Creates a fresh processor for each call, matching the pattern
 * established by the models entity module.
 */
function createConventionDefinitionProcessor(): EntityConventionProcessor<any, ConventionDefinitionSpec[]> {
  return {
    process(input: any, context: ProcessorContext): ConventionDefinitionSpec[] {
      const processor = new ConventionDefinitionProcessor(context);
      return processor.process(input);
    }
  };
}

/**
 * The conventions entity module definition.
 *
 * Meta-circular: this module defines how convention definitions are
 * parsed and processed, using the same EntityModule interface that
 * all entity types implement.
 */
export const conventionsModule: EntityModule = {
  name: 'conventions',
  type: 'extension',
  version: '0.1.0',
  dependsOn: ['models'],

  conventionProcessor: createConventionDefinitionProcessor(),

  inferenceRules: conventionInferenceRules,

  generators: conventionGenerators,

  diagramPlugins: [],

  docs: conventionDocs,

  tests: conventionTests,
};

export default conventionsModule;
