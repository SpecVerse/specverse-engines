# Communication Factory

Event-driven messaging infrastructure with publisher/subscriber generation.

## Definitions

| File | Description |
|------|-------------|
| `event-emitter.yaml` | In-memory event bus using EventEmitter3 (development/testing) |
| `rabbitmq-events.yaml` | RabbitMQ AMQP bus for production pub/sub messaging |

## Generated Output

### EventEmitter (`eventemitter/`)

| Generator | Output | Purpose |
|-----------|--------|---------|
| `bus-generator` | `src/events/eventBus.ts` | Singleton event bus with typed event names |
| `publisher-generator` | `src/events/publishers/{event}Publisher.ts` | Per-event publisher (one per spec event) |
| `subscriber-generator` | `src/events/subscribers/{event}Subscriber.ts` | Per-event subscriber with handler logic |

### RabbitMQ (`rabbitmq/` — defined, templates pending)

| Generator | Output | Purpose |
|-----------|--------|---------|
| `publisher-generator` | `src/events/publishers/{event}Publisher.ts` | AMQP publisher with confirms |
| `subscriber-generator` | `src/events/subscribers/{event}Subscriber.ts` | AMQP consumer with ack/nack |
| `connection-generator` | `src/events/connection.ts` | RabbitMQ connection management |

## Technology

- **EventEmitter**: eventemitter3 ^5.0.0 (zero-dependency, in-process)
- **RabbitMQ**: amqplib ^0.10.3 (topic exchange, durable queues, prefetch)

## Capabilities

| Provides | Requires |
|----------|----------|
| `messaging.pubsub` | (none) |
| `messaging.events` | |
| `messaging.inmemory` (EventEmitter) | |
| `messaging.queue` (RabbitMQ) | |

## Configuration

EventEmitter: `maxListeners: 100`, `captureRejections: true`
RabbitMQ: topic exchange, durable queues, prefetch 10, persistent messages, confirm-select
