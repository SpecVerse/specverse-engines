import type { EntityInferenceRule } from '../../../_shared/types.js';

// Promotion inference is handled by the PromotionGenerator in the inference engine,
// not via EntityInferenceRule (which is for JSON-based rule files).
// The PromotionGenerator plugs into the logical engine's generator registry.
export const promotionInferenceRules: EntityInferenceRule[] = [];
