import type { EntityGenerator } from '../../../_shared/types.js';

export const eventGenerators: EntityGenerator[] = [
  {
    name: 'event-emitter',
    capability: 'communication.events',
    factoryPath: 'libs/instance-factories/communication/event-emitter.yaml',
  },
  {
    name: 'rabbitmq-events',
    capability: 'communication.messaging',
    factoryPath: 'libs/instance-factories/communication/rabbitmq-events.yaml',
  },
];
