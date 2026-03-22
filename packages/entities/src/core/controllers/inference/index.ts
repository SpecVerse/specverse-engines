import type { EntityInferenceRule } from '../../../_shared/types.js';

// Controller inference rules are triggered by models and live in the models entity module.
// Controllers themselves do not trigger any inference rules.
export const controllerInferenceRules: EntityInferenceRule[] = [];
