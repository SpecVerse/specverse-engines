import type { EntityInferenceRule } from '../../../_shared/types.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Lazily resolve the directory containing the inference rule JSON files.
 * Works in both ESM and CJS contexts (see models/inference/index.ts for details).
 */
function resolveRulesDir(): string {
  if (typeof __dirname !== 'undefined') return __dirname;
  const url: string = new Function('return import.meta.url')();
  return dirname(fileURLToPath(url));
}

/**
 * Event inference rule metadata.
 *
 * These entries correspond 1-to-1 with the active rules defined in
 * v3.1-event-rules.json.  The inference engine uses the JSON file for
 * template expansion; these metadata records let the entity registry
 * advertise what the events module can generate and at what priority.
 */
export const eventInferenceRules: EntityInferenceRule[] = [
  {
    id: 'events:standard_crud_events',
    description: 'Standard CRUD events for all models',
    triggeredBy: 'models',
    generates: ['events'],
    priority: 100,
  },
  {
    id: 'events:relationship_events',
    description: 'Relationship-specific events for models with relationships',
    triggeredBy: 'models',
    generates: ['events'],
    priority: 90,
  },
  {
    id: 'events:lifecycle_events',
    description: 'Lifecycle transition events for models with state management',
    triggeredBy: 'models',
    generates: ['events'],
    priority: 85,
  },
  {
    id: 'events:validation_events',
    description: 'Validation-related events for models with validation requirements',
    triggeredBy: 'models',
    generates: ['events'],
    priority: 80,
  },
  {
    id: 'events:profile_events',
    description: 'Profile attachment events for models supporting profiles',
    triggeredBy: 'models',
    generates: ['events'],
    priority: 75,
  },
  {
    id: 'events:integration_events',
    description: 'External system integration events',
    triggeredBy: 'models',
    generates: ['events'],
    priority: 70,
  },
  {
    id: 'events:business_process_events',
    description: 'Business process events for complex models',
    triggeredBy: 'models',
    generates: ['events'],
    priority: 65,
  },
];

export function loadEventRules(): any {
  const dir = resolveRulesDir();
  return JSON.parse(
    readFileSync(resolve(dir, 'v3.1-event-rules.json'), 'utf8')
  );
}
