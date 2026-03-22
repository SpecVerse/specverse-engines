import { AbstractProcessor } from './AbstractProcessor.js';
import { ExecutableProcessor } from './ExecutableProcessor.js';
import { ServiceSpec, ExecutablePropertiesSpec, SubscriptionSpec } from '../types/ast.js';

export class ServiceProcessor extends AbstractProcessor<any, ServiceSpec[]> {
  private executableProcessor: ExecutableProcessor;

  constructor(context: any) {
    super(context);
    this.executableProcessor = new ExecutableProcessor(context);
  }

  process(servicesData: any): ServiceSpec[] {
    return Object.entries(servicesData).map(([serviceName, serviceDef]: [string, any]) => {
      const subscriptions = this.parseSubscriptions(serviceDef.subscribes_to);
      
      const operations: { [name: string]: ExecutablePropertiesSpec } = {};
      if (serviceDef.operations) {
        for (const [opName, opDef] of Object.entries(serviceDef.operations)) {
          operations[opName] = this.executableProcessor.process(
            opDef, 
            `Service ${serviceName}, Operation ${opName}`
          );
        }
      }
      
      return {
        name: serviceName,
        description: serviceDef.description,
        subscriptions,
        operations
      };
    });
  }

  private parseSubscriptions(subscriptions: any): SubscriptionSpec {
    // Duplicated logic - ideally this moves to a shared helper or base class
    // For now, keeping it here to isolate the processor
    if (!subscriptions) {
      return { events: [], handlers: {} };
    }
    
    if (Array.isArray(subscriptions)) {
      const events: string[] = [];
      const handlers: { [event: string]: string } = {};
      
      for (const item of subscriptions) {
        if (typeof item === 'string') {
          events.push(item);
        } else if (typeof item === 'object') {
          for (const [event, handler] of Object.entries(item)) {
            events.push(event);
            handlers[event] = handler as string;
          }
        }
      }
      
      return { events, handlers };
    } else if (typeof subscriptions === 'object') {
      const events = Object.keys(subscriptions);
      const handlers: { [event: string]: string } = {};
      
      for (const [event, handler] of Object.entries(subscriptions)) {
        handlers[event] = handler as string;
      }
      
      return { events, handlers };
    }
    
    return { events: [], handlers: {} };
  }
}
