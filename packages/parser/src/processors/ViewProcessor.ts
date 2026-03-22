import { AbstractProcessor } from './AbstractProcessor.js';
import { ViewSpec, SubscriptionSpec } from '../types/ast.js';

export class ViewProcessor extends AbstractProcessor<any, ViewSpec[]> {
  process(viewsData: any): ViewSpec[] {
    return Object.entries(viewsData).map(([viewName, viewDef]: [string, any]) => {
      const subscriptions = this.parseSubscriptions(viewDef.subscribes_to);

      // Convert uiComponents arrays to objects for schema compliance
      let uiComponents: { [name: string]: any } = {};
      if (viewDef.uiComponents) {
        if (Array.isArray(viewDef.uiComponents)) {
          // Convert array format to object format
          viewDef.uiComponents.forEach((componentName: string) => {
            uiComponents[componentName] = { name: componentName };
          });
        } else if (typeof viewDef.uiComponents === 'object') {
          // Already an object, pass through
          uiComponents = viewDef.uiComponents;
        }
      }

      return {
        name: viewName,
        description: viewDef.description,
        type: viewDef.type,
        model: viewDef.model,
        tags: viewDef.tags,
        export: viewDef.export,
        layout: viewDef.layout,
        subscriptions,
        uiComponents,
        properties: viewDef.properties || {}
      };
    });
  }

  private parseSubscriptions(subscriptions: any): SubscriptionSpec {
    // Duplicated logic
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
