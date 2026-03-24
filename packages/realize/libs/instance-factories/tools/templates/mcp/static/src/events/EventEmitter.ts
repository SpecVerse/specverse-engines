/**
 * EventEmitter
 * Clean implementation for handling application events
 */

import type {
  ServerStartedEvent,
  ToolCalledEvent,
  ResourceRequestedEvent,
  ErrorOccurredEvent
} from '../types/index.js';

export type EventType = 'server-started' | 'tool-called' | 'resource-requested' | 'error-occurred' | 'orchestrator-initialized' | 'orchestrator-execution-completed' | 'orchestrator-execution-failed';

export interface OrchestratorInitializedEvent {
  type: 'orchestrator-initialized';
  capabilities: any;
}

export interface OrchestratorExecutionCompletedEvent {
  type: 'orchestrator-execution-completed';
  operation: string;
  executionTime: number;
  success: boolean;
}

export interface OrchestratorExecutionFailedEvent {
  type: 'orchestrator-execution-failed';
  operation: string;
  error: string;
  executionTime: number;
}

export type EventData = ServerStartedEvent | ToolCalledEvent | ResourceRequestedEvent | ErrorOccurredEvent | OrchestratorInitializedEvent | OrchestratorExecutionCompletedEvent | OrchestratorExecutionFailedEvent;

export type EventHandler<T = EventData> = (event: T) => void | Promise<void>;

export class EventEmitter {
  private listeners: Map<EventType, EventHandler[]> = new Map();

  on<T extends EventData>(eventType: EventType, handler: EventHandler<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler as EventHandler);
  }

  off<T extends EventData>(eventType: EventType, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  async emit(eventType: EventType, data: EventData): Promise<void> {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      const promises = handlers.map(handler => {
        try {
          const result = handler(data);
          return Promise.resolve(result);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.allSettled(promises);
    }
  }

  removeAllListeners(eventType?: EventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(eventType: EventType): number {
    return this.listeners.get(eventType)?.length || 0;
  }

  eventNames(): EventType[] {
    return Array.from(this.listeners.keys());
  }
}