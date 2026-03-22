import type { EntityGenerator } from '../../../_shared/types.js';

export const controllerGenerators: EntityGenerator[] = [
  {
    name: 'fastify-routes',
    capability: 'api.rest',
    factoryPath: 'libs/instance-factories/controllers/fastify.yaml',
  },
];
