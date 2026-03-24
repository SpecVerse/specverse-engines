/**
 * EventEmitter Subscriber Generator
 *
 * Generates event subscribers for EventEmitter
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate event subscriber
 */
export default function generateEventSubscriber(context: TemplateContext): string {
  const { event, service, spec } = context;

  if (!event) {
    throw new Error('Event is required in template context');
  }

  const eventName = event.name;
  const subscriberName = `${eventName}Subscriber`;

  return `/**
 * ${subscriberName}
 * Subscriber for ${eventName} events
 * ${event.description || ''}
 */

import { eventBus, EventName, type ${eventName}Payload } from '../eventBus.js';

/**
 * ${subscriberName} class
 */
export class ${subscriberName} {
  private unsubscribe?: () => void;

  /**
   * Start listening for ${eventName} events
   */
  public start(): void {
    console.log(\`[${subscriberName}] Starting subscriber\`);

    this.unsubscribe = eventBus.subscribe<${eventName}Payload>(
      EventName.${eventName},
      this.handleEvent.bind(this)
    );
  }

  /**
   * Stop listening for ${eventName} events
   */
  public stop(): void {
    if (this.unsubscribe) {
      console.log(\`[${subscriberName}] Stopping subscriber\`);
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  /**
   * Handle ${eventName} event
   */
  private async handleEvent(payload: ${eventName}Payload): Promise<void> {
    try {
      console.log(\`[${subscriberName}] Received event\`, payload);

      // Process event
      await this.processEvent(payload);

      console.log(\`[${subscriberName}] Event processed successfully\`);
    } catch (error) {
      console.error(\`[${subscriberName}] Failed to process event\`, error);
      // TODO: Add error handling (dead letter queue, retry logic, etc.)
    }
  }

  /**
   * Process ${eventName} event
   */
  private async processEvent(payload: ${eventName}Payload): Promise<void> {
    // TODO: Implement event processing logic
    ${generateProcessingLogic(event)}
  }
}

// Export singleton instance
export const ${eventName.toLowerCase()}Subscriber = new ${subscriberName}();
export default ${eventName.toLowerCase()}Subscriber;
`;
}

/**
 * Generate processing logic placeholder
 */
function generateProcessingLogic(event: any): string {
  return `
    // Example: Update database, send notifications, trigger workflows, etc.
    console.log('Processing ${event.name} event:', payload);

    // Add your business logic here
  `;
}
