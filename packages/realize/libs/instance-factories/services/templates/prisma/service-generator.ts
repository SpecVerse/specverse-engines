/**
 * Prisma Service Generator
 *
 * Generates abstract business logic services
 * Services are NOT tied to specific models but can interact with multiple models
 */

import type { TemplateContext } from '@specverse/engine-realize';
import { generateBehaviorBody, type BehaviorContext, type BehaviorMetadata, type OperationMetadata } from './behavior-generator.js';

/**
 * Generate Prisma service
 */
export default function generatePrismaService(context: TemplateContext): string {
  const { service, spec } = context;

  if (!service) {
    throw new Error('Service is required in template context');
  }

  const serviceName = service.name;
  const hasEvents = (service.publishes && service.publishes.length > 0) ||
                    (service.subscribes && service.subscribes.length > 0);

  return `/**
 * ${serviceName}
 * Abstract business logic service
 * ${service.description || ''}
 */

import { PrismaClient } from '@prisma/client';
${hasEvents ? `import { eventBus, EventName } from '../events/eventBus.js';` : ''}

const prisma = new PrismaClient();

/**
 * ${serviceName} class
 */
export class ${serviceName} {
  ${generateConstructor(service)}
  ${generateOperations(service)}
  ${generateEventSubscriptions(service)}
}

// Export singleton instance
export const ${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)} = new ${serviceName}();
export default ${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)};
`;
}

/**
 * Generate constructor with event subscriptions
 */
function generateConstructor(service: any): string {
  const hasSubscriptions = service.subscribes && service.subscribes.length > 0;

  if (!hasSubscriptions) {
    return '';
  }

  return `
  private unsubscribers: Array<() => void> = [];

  constructor() {
    // Subscribe to events
    this.setupEventSubscriptions();
  }

  /**
   * Setup event subscriptions
   */
  private setupEventSubscriptions(): void {
    ${service.subscribes.map((eventName: string) => `
    // Subscribe to ${eventName}
    const unsubscribe${eventName} = eventBus.subscribe(
      EventName.${eventName},
      this.on${eventName}.bind(this)
    );
    this.unsubscribers.push(unsubscribe${eventName});
    `).join('\n')}
  }

  /**
   * Cleanup subscriptions
   */
  public destroy(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
`;
}

/**
 * Generate service operations
 */
function generateOperations(service: any): string {
  if (!service.operations ||
      (Array.isArray(service.operations) && service.operations.length === 0) ||
      (!Array.isArray(service.operations) && Object.keys(service.operations).length === 0)) {
    return `
  /**
   * Execute service logic
   */
  public async execute(params: any): Promise<any> {
    // TODO: Implement service logic
    throw new Error('Service logic not implemented');
  }
`;
  }

  // Normalize: array of operations (with .name) or object entries
  const entries: [string, any][] = Array.isArray(service.operations)
    ? service.operations.map((op: any) => [op.name, op])
    : Object.entries(service.operations);

  const operations: string[] = [];

  entries.forEach(([operationName, operation]) => {
    operations.push(generateOperation(operationName, operation, service));
  });

  return operations.join('\n');
}

/**
 * Generate individual operation
 */
function generateOperation(operationName: string, operation: any, service: any): string {
  const params = generateOperationParams(operation);
  const hasPublish = service.publishes && service.publishes.length > 0;

  return `
  /**
   * ${operationName}
   * ${operation.description || ''}
   */
  public async ${operationName}(${params}): Promise<any> {
    try {
      ${generateOperationLogic(operation, service)}

      ${hasPublish ? `
      // Publish event (example)
      // eventBus.publish(EventName.SomeEvent, {
      //   operation: '${operationName}',
      //   timestamp: new Date().toISOString()
      // });
      ` : ''}

      // Return result
      return { success: true };
    } catch (error) {
      console.error(\`[${service.name}] ${operationName} failed:\`, error);
      throw error;
    }
  }
`;
}

/**
 * Generate operation parameters
 */
function generateOperationParams(operation: any): string {
  if (!operation.parameters || Object.keys(operation.parameters).length === 0) {
    return 'params: any = {}';
  }

  const params = Object.entries(operation.parameters).map(([name, param]: [string, any]) => {
    const optional = !param.required;
    return `${name}${optional ? '?' : ''}: ${mapTypeToTypeScript(param.type)}`;
  });

  return params.join(', ');
}

/**
 * Generate operation logic from behavioral metadata (L3 generation).
 * Falls back to placeholder if no behavioral data available.
 */
function generateOperationLogic(operation: any, service: any): string {
  // Check for behavioral metadata (from AI-optimized spec)
  const impl = operation.implementation;
  const meta = operation.metadata;

  if (impl && (impl.preconditions?.length || impl.postconditions?.length || impl.steps?.length || impl.transactional)) {
    // L3: Generate from behavioral specification
    const modelName = inferModelFromServiceName(service.name);
    const context: BehaviorContext = {
      modelName,
      serviceName: service.name,
      operationName: operation.name || 'execute',
      prismaModel: modelName
    };

    const behavior: BehaviorMetadata = {
      preconditions: impl.preconditions || [],
      postconditions: impl.postconditions || [],
      sideEffects: impl.sideEffects || [],
      steps: impl.steps || [],
      transactional: impl.transactional || false
    };

    const opMeta: OperationMetadata = {
      async: meta?.async ?? true,
      cacheable: meta?.cacheable ?? false,
      idempotent: meta?.idempotent ?? false
    };

    return generateBehaviorBody(behavior, opMeta, context);
  }

  // Fallback: placeholder
  if (operation.description) {
    return `// ${operation.description}`;
  }
  return `// TODO: Implement operation logic`;
}

/**
 * Infer model name from service name.
 * "SpecificationRelationshipService" -> "Specification"
 * "ModelRelationshipService" -> "Model"
 */
function inferModelFromServiceName(serviceName: string): string {
  return serviceName
    .replace(/RelationshipService$/, '')
    .replace(/Service$/, '') || 'Entity';
}

/**
 * Generate event subscription handlers
 */
function generateEventSubscriptions(service: any): string {
  if (!service.subscribes || service.subscribes.length === 0) {
    return '';
  }

  const handlers: string[] = [];

  service.subscribes.forEach((eventName: string) => {
    handlers.push(`
  /**
   * Handle ${eventName} event
   */
  private async on${eventName}(payload: any): Promise<void> {
    try {
      console.log(\`[${service.name}] Received ${eventName} event\`, payload);

      // TODO: Implement event handling logic
      ${generateEventHandlerLogic(eventName, service)}

      console.log(\`[${service.name}] ${eventName} event processed successfully\`);
    } catch (error) {
      console.error(\`[${service.name}] Failed to process ${eventName} event\`, error);
      // TODO: Add error handling (retry, dead letter queue, etc.)
    }
  }`);
  });

  return handlers.join('\n');
}

/**
 * Generate event handler logic placeholder
 */
function generateEventHandlerLogic(eventName: string, service: any): string {
  return `
      // Example: Update related records
      // await prisma.someModel.update({
      //   where: { id: payload.id },
      //   data: { ... }
      // });

      // Example: Trigger workflows
      // await this.triggerWorkflow(payload);

      // Example: Publish follow-up events
      // eventBus.publish(EventName.AnotherEvent, {
      //   original: payload,
      //   processed: true
      // });
  `;
}

/**
 * Map SpecVerse types to TypeScript types
 */
function mapTypeToTypeScript(type: string): string {
  const typeMap: Record<string, string> = {
    String: 'string',
    Integer: 'number',
    Float: 'number',
    Boolean: 'boolean',
    Date: 'Date',
    DateTime: 'Date',
    UUID: 'string',
    JSON: 'any',
    Array: 'any[]',
    Object: 'Record<string, any>'
  };

  return typeMap[type] || 'any';
}
