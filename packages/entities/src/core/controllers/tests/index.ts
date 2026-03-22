import type { EntityTestReference } from '../../../_shared/types.js';

export const controllerTests: EntityTestReference[] = [
  {
    title: 'Controllers Test Spec',
    category: 'example-spec',
    path: 'tests/04-controllers.specly',
    description: 'Controller definitions and CURED operations',
  },
  {
    title: 'Convention Processor Tests',
    category: 'parity',
    path: 'src/entities/__tests__/controllers-entity.test.ts',
    description: 'Controller entity module parity and integration tests',
  },
];
