import type { EntityTestReference } from '../../../_shared/types.js';

export const eventTests: EntityTestReference[] = [
  {
    title: 'Events Test Spec',
    category: 'example-spec',
    path: 'tests/06-events.specly',
    description: 'Event definitions and payload validation',
  },
  {
    title: 'EventFlow Plugin Tests',
    category: 'unit',
    path: 'src/diagram-engine/__tests__/plugins/EventFlowPlugin.test.ts',
    description: 'Event flow diagram generation',
  },
  {
    title: 'Events Entity Tests',
    category: 'parity',
    path: 'src/entities/__tests__/events-entity.test.ts',
    description: 'Event entity module parity and integration tests',
  },
];
