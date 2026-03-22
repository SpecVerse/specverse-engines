import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { ServiceProcessor } from './conventions/service-processor.js';
import { serviceInferenceRules } from './inference/index.js';
import { serviceGenerators } from './generators/index.js';
import { serviceDocs } from './docs/index.js';
import { serviceTests } from './tests/index.js';
import type { ProcessorContext } from '@specverse/types';
import type { ServiceSpec } from '@specverse/types';

export { ServiceProcessor } from './conventions/service-processor.js';
export { serviceInferenceRules } from './inference/index.js';
export { serviceGenerators } from './generators/index.js';
export { serviceDocs } from './docs/index.js';
export { serviceTests } from './tests/index.js';

function createServiceConventionProcessor(): EntityConventionProcessor<any, ServiceSpec[]> {
  return {
    process(input: any, context: ProcessorContext): ServiceSpec[] {
      const processor = new ServiceProcessor(context);
      return processor.process(input);
    }
  };
}

export const servicesModule: EntityModule = {
  name: 'services',
  type: 'core',
  version: '3.5.1',
  dependsOn: ['models'],
  conventionProcessor: createServiceConventionProcessor(),
  inferenceRules: serviceInferenceRules,
  generators: serviceGenerators,
  diagramPlugins: [
    { type: 'architecture' },
  ],
  docs: serviceDocs,
  tests: serviceTests,
};

export default servicesModule;
