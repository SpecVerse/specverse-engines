/**
 * EventEmitter Publisher Generator
 *
 * Generates event publishers for EventEmitter
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate event publisher
 */
export default function generateEventPublisher(context: TemplateContext): string {
  const { event, spec } = context;

  if (!event) {
    throw new Error('Event is required in template context');
  }

  const eventName = event.name;
  const publisherName = `${eventName}Publisher`;

  return `/**
 * ${publisherName}
 * Publisher for ${eventName} events
 * ${event.description || ''}
 */

import { eventBus, EventName } from '../eventBus.js';

export interface ${eventName}Payload {
${generatePayloadInterface(event)}
}

/**
 * ${publisherName} class
 */
export class ${publisherName} {
  /**
   * Publish ${eventName} event
   */
  public async publish(payload: ${eventName}Payload): Promise<void> {
    try {
      // Validate payload
      this.validate(payload);

      // Add timestamp if not present
      const enrichedPayload = {
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
      };

      // Publish event
      eventBus.publish(EventName.${eventName}, enrichedPayload);

      console.log(\`[${publisherName}] Published event\`, enrichedPayload);
    } catch (error) {
      console.error(\`[${publisherName}] Failed to publish event\`, error);
      throw error;
    }
  }

  /**
   * Validate event payload
   */
  private validate(payload: ${eventName}Payload): void {
    // TODO: Add validation logic
${generateValidation(event)}
  }
}

// Export singleton instance
export const ${eventName.toLowerCase()}Publisher = new ${publisherName}();
export default ${eventName.toLowerCase()}Publisher;
`;
}

/**
 * Generate payload interface from event attributes
 */
function generatePayloadInterface(event: any): string {
  const attributes = event.attributes || {};
  const fields: string[] = [];

  for (const [name, config] of Object.entries(attributes)) {
    const attr: any = config;
    const type = attr.type || 'String';
    let tsType = 'string';

    // Map SpecVerse types to TypeScript types
    if (type === 'Integer' || type === 'Number') tsType = 'number';
    if (type === 'Boolean') tsType = 'boolean';
    if (type === 'DateTime') tsType = 'string'; // ISO string
    if (type === 'UUID') tsType = 'string';

    const optional = attr.required ? '' : '?';
    fields.push(`  ${name}${optional}: ${tsType};`);
  }

  return fields.join('\n') || '  // No attributes defined';
}

/**
 * Generate validation logic
 */
function generateValidation(event: any): string {
  const attributes = event.attributes || {};
  const validations: string[] = [];

  for (const [name, config] of Object.entries(attributes)) {
    const attr: any = config;
    if (attr.required) {
      validations.push(`    if (!payload.${name}) throw new Error('${name} is required');`);
    }
  }

  return validations.join('\n') || '    // No validation rules';
}
