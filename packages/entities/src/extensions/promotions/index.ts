import type { EntityModule, EntityConventionProcessor } from '../../_shared/types.js';
import { PromotionProcessor } from './conventions/promotion-processor.js';
import type { PromotionSpec } from './conventions/promotion-processor.js';
import { promotionInferenceRules } from './inference/index.js';
import { promotionGenerators } from './generators/index.js';
import { promotionDocs } from './docs/index.js';
import { promotionTests } from './tests/index.js';

export { PromotionProcessor, type PromotionSpec } from './conventions/promotion-processor.js';
export { promotionInferenceRules } from './inference/index.js';
export { promotionGenerators } from './generators/index.js';
export { promotionDocs } from './docs/index.js';
export { promotionTests } from './tests/index.js';

function createPromotionConventionProcessor(): EntityConventionProcessor<any, PromotionSpec[]> {
  return {
    process(input: any): PromotionSpec[] {
      const processor = new PromotionProcessor({ warnings: [], addWarning(msg: string) { this.warnings.push(msg); } });
      return processor.process(input);
    }
  };
}

export const promotionsModule: EntityModule = {
  name: 'promotions',
  type: 'extension',
  version: '0.1.0',
  dependsOn: ['models'],
  conventionProcessor: createPromotionConventionProcessor(),
  inferenceRules: promotionInferenceRules,
  generators: promotionGenerators,
  diagramPlugins: [],
  docs: promotionDocs,
  tests: promotionTests,
};

export default promotionsModule;
