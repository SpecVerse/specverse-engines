/**
 * EventEmitter Bus Generator
 *
 * Generates in-memory event bus using EventEmitter3
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate EventEmitter bus singleton
 */
export default function generateEventBus(context: TemplateContext): string {
  const { spec } = context;

  const events = spec.events ? Object.keys(spec.events) : [];

  return `/**
 * Event Bus
 * In-memory event bus using EventEmitter3
 * Generated from SpecVerse specification
 */

import EventEmitter from 'eventemitter3';

// Event type definitions
${events.map(event => `export type ${event}Payload = any; // TODO: Define payload type`).join('\n')}

// Event names enum
export enum EventName {
${events.map(event => `  ${event} = '${event}',`).join('\n')}
}

/**
 * Event Bus Singleton
 */
class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100); // Configure max listeners
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish an event
   */
  public publish<T = any>(event: EventName | string, payload: T): void {
    console.log(\`[EventBus] Publishing event: \${event}\`, payload);
    this.emit(event, payload);
  }

  /**
   * Subscribe to an event
   */
  public subscribe<T = any>(
    event: EventName | string,
    handler: (payload: T) => void | Promise<void>
  ): () => void {
    console.log(\`[EventBus] Subscribing to event: \${event}\`);
    this.on(event, handler);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Subscribe to an event (one-time)
   */
  public subscribeOnce<T = any>(
    event: EventName | string,
    handler: (payload: T) => void | Promise<void>
  ): void {
    this.once(event, handler);
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
export default eventBus;
`;
}
