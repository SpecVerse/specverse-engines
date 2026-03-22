import { AbstractProcessor } from '@specverse/types';
import { ExecutableProcessor } from '../../../_shared/processors/ExecutableProcessor.js';
import { ControllerSpec, CuredOperationsSpec, ExecutablePropertiesSpec, SubscriptionSpec } from '@specverse/types';

export class ControllerProcessor extends AbstractProcessor<any, ControllerSpec[]> {
  private executableProcessor: ExecutableProcessor;

  constructor(context: any) {
    super(context);
    this.executableProcessor = new ExecutableProcessor(context);
  }

  process(controllersData: any): ControllerSpec[] {
    return Object.entries(controllersData).map(([controllerName, controllerDef]: [string, any]) => {
      const subscriptions = this.parseSubscriptions(controllerDef.subscribes_to);

      // Process CURED operations
      const cured: CuredOperationsSpec = {};
      if (controllerDef.cured) {
        for (const [operation, operationDef] of Object.entries(controllerDef.cured)) {
          // Special handling for 'validate' - it's not an ExecutableProperties (v3.3+)
          if (operation === 'validate') {
            cured[operation as keyof CuredOperationsSpec] = operationDef as any;
          } else {
            cured[operation as keyof CuredOperationsSpec] = this.executableProcessor.process(
              operationDef,
              `Controller ${controllerName}, CURED ${operation}`
            );
          }
        }
      }

      // Process custom actions
      const actions: { [name: string]: ExecutablePropertiesSpec } = {};
      if (controllerDef.actions) {
        for (const [actionName, actionDef] of Object.entries(controllerDef.actions)) {
          actions[actionName] = this.executableProcessor.process(
            actionDef,
            `Controller ${controllerName}, Action ${actionName}`
          );
        }
      }

      return {
        name: controllerName,
        model: controllerDef.model,
        path: controllerDef.path,
        description: controllerDef.description,
        subscriptions,
        cured,
        actions
      };
    });
  }

  private parseSubscriptions(subscriptions: any): SubscriptionSpec {
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
