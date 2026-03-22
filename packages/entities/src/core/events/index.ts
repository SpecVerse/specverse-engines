import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { EventProcessor } from './conventions/event-processor.js';
import { eventInferenceRules } from './inference/index.js';
import { eventGenerators } from './generators/index.js';
import { eventDocs } from './docs/index.js';
import { eventTests } from './tests/index.js';
import type { ProcessorContext } from '@specverse/types';
import type { EventSpec } from '@specverse/types';

export { EventProcessor } from './conventions/event-processor.js';
export { eventInferenceRules, loadEventRules } from './inference/index.js';
export { eventGenerators } from './generators/index.js';
export { eventDocs } from './docs/index.js';
export { eventTests } from './tests/index.js';

function createEventConventionProcessor(): EntityConventionProcessor<any, EventSpec[]> {
  return {
    process(input: any, context: ProcessorContext): EventSpec[] {
      const processor = new EventProcessor(context);
      return processor.process(input);
    }
  };
}

export const eventsModule: EntityModule = {
  name: 'events',
  type: 'core',
  version: '3.5.1',
  dependsOn: ['models', 'services'],
  conventionProcessor: createEventConventionProcessor(),
  inferenceRules: eventInferenceRules,
  generators: eventGenerators,
  diagramPlugins: [
    { type: 'event-flow', variants: ['layered', 'sequence', 'swimlane'] },
  ],
  docs: eventDocs,
  tests: eventTests,
};

export default eventsModule;
