import type { EntityGenerator } from '../../../_shared/types.js';

export const serviceGenerators: EntityGenerator[] = [
  {
    name: 'prisma-services',
    capability: 'service.crud',
    factoryPath: 'libs/instance-factories/services/prisma-services.yaml',
  },
];
