import type { EntityInferenceRule } from '../../../_shared/types.js';

// Commands don't trigger or receive inference rules yet.
// Future: model → CLI scaffold, service → CLI adapter
export const commandInferenceRules: EntityInferenceRule[] = [];
