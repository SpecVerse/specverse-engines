import type { EntityTestReference } from '../../../_shared/types.js';

export const serviceTests: EntityTestReference[] = [
  {
    title: 'Services Test Spec',
    category: 'example-spec',
    path: 'tests/05-services.specly',
    description: 'Service definitions and operations',
  },
  {
    title: 'Services Entity Tests',
    category: 'parity',
    path: 'src/entities/__tests__/services-entity.test.ts',
    description: 'Service entity module parity and integration tests',
  },
];
