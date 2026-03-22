/**
 * EventFlowPlugin - Event-driven architecture visualization
 *
 * Supports:
 * - event-flow-layered: 5-layer architecture with dual event bus
 * - event-flow-sequence: Temporal event sequences
 * - event-flow-swimlane: Parallel event flows
 */

import { BaseDiagramPlugin } from '../../core/BaseDiagramPlugin.js';
import {
  DiagramType,
  DiagramContext,
  MermaidDiagram,
  ValidationResult
} from '../../types/index.js';
import { SpecVerseAST, ModelSpec, ControllerSpec, ServiceSpec } from '@specverse/types';

export class EventFlowPlugin extends BaseDiagramPlugin {
  name = 'event-flow-plugin';
  version = '1.0.0';
  description = 'Event-driven architecture visualization with dual event bus pattern';
  supportedTypes: DiagramType[] = ['event-flow-layered', 'event-flow-sequence', 'event-flow-swimlane'];

  /**
   * Generate diagram based on type
   */
  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    this.validateType(type);

    switch (type) {
      case 'event-flow-layered':
        return this.generateLayeredEventFlow(context);
      case 'event-flow-sequence':
        return this.generateSequenceEventFlow(context);
      case 'event-flow-swimlane':
        return this.generateSwimlaneEventFlow(context);
      default:
        throw new Error(`Unsupported diagram type: ${type}`);
    }
  }

  /**
   * Validate AST for event flow diagram generation
   */
  validate(ast: SpecVerseAST): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for event publishers
    const allModels = ast.components.flatMap(c => c.models);
    const allControllers = ast.components.flatMap(c => c.controllers);
    const allServices = ast.components.flatMap(c => c.services);

    const modelsWithEvents = allModels.filter(m =>
      Object.values(m.behaviors).some((b: any) => b.publishes && b.publishes.length > 0)
    );

    const controllersWithEvents = allControllers.filter(c =>
      (c.cured && Object.values(c.cured).some((op: any) => op?.publishes && op.publishes.length > 0)) ||
      (c.actions && Object.values(c.actions).some((action: any) => action?.publishes && action.publishes.length > 0))
    );

    const servicesWithEvents = allServices.filter(s =>
      s.operations && Object.values(s.operations).some((op: any) => op?.publishes && op.publishes.length > 0)
    );

    if (modelsWithEvents.length === 0 && controllersWithEvents.length === 0 && servicesWithEvents.length === 0) {
      warnings.push('No event publishers found - event flow diagrams will be minimal');
    }

    // Check for event subscribers
    const hasSubscribers = allControllers.some(c => c.subscriptions?.events?.length > 0) ||
                          allServices.some(s => s.subscriptions?.events?.length > 0);

    if (!hasSubscribers) {
      warnings.push('No event subscribers found - consider adding event subscriptions');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate layered event flow diagram with topological sorting
   */
  private generateLayeredEventFlow(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'TD');
    diagram.title = context.options.title || 'Event Flow Architecture';

    const allModels = context.getAllModels();
    const allControllers = context.getAllControllers();
    const allServices = context.getAllServices();
    const allViews = context.getAllViews();

    // Perform topological sort to determine component layers
    const { layers: componentLayers, allEventNames } = this.computeComponentLayers(allModels, allControllers, allServices, allViews);

    // Collect domain events (from models)
    const domainEvents = new Set<string>();
    allModels.forEach(model => {
      Object.values(model.behaviors).forEach((behavior: any) => {
        if (behavior.publishes) {
          behavior.publishes.forEach((event: string) => domainEvents.add(event));
        }
      });
    });

    // Collect application events (from controllers/services)
    const appEvents = new Set<string>();
    allControllers.forEach(controller => {
      if (controller.cured) {
        Object.values(controller.cured).forEach((op: any) => {
          if (op?.publishes) {
            op.publishes.forEach((event: string) => appEvents.add(event));
          }
        });
      }
      if (controller.actions) {
        Object.values(controller.actions).forEach((action: any) => {
          if (action?.publishes) {
            action.publishes.forEach((event: string) => appEvents.add(event));
          }
        });
      }
    });

    allServices.forEach(service => {
      if (service.operations) {
        Object.values(service.operations).forEach((op: any) => {
          if (op?.publishes) {
            op.publishes.forEach((event: string) => appEvents.add(event));
          }
        });
      }
    });

    // LAYER 1: Models
    const modelNodes: string[] = [];
    allModels.forEach(model => {
      const publishedEvents = Object.values(model.behaviors)
        .flatMap((b: any) => b.publishes || []);

      if (publishedEvents.length > 0) {
        modelNodes.push(model.name);
        const node = {
          id: model.name,
          label: `${model.name}\n↑ ${publishedEvents.length} events`,
          type: 'model' as const,
          color: context.theme.colors.model,
          shape: 'rounded' as const
        };
        diagram.nodes.push(node);
        context.nodes.set(model.name, node);
      }
    });

    if (modelNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'models_layer',
        label: '📦 LAYER 1: MODELS (Data & Business Logic)',
        nodes: modelNodes,
        direction: 'LR'
      });
    }

    // Collect and organize events by computed layer
    const eventsByLayer = new Map<number, string[]>();

    // Determine which events are domain events (for coloring)
    const domainEventSet = new Set(domainEvents);

    allEventNames.forEach(eventName => {
      const layer = componentLayers.get(eventName) || 1;
      if (!eventsByLayer.has(layer)) {
        eventsByLayer.set(layer, []);
      }
      eventsByLayer.get(layer)!.push(eventName);

      const isDomain = domainEventSet.has(eventName);
      const node = {
        id: eventName,
        label: eventName,
        type: 'event' as const,
        color: isDomain ? context.theme.colors.domainEvent : context.theme.colors.appEvent,
        shape: 'hexagon' as const
      };
      diagram.nodes.push(node);
      context.nodes.set(eventName, node);
    });

    // LAYER 3+: Controllers & Services (organized by computed layers)
    const layeredComponents = new Map<number, { controllers: string[], services: string[] }>();

    allControllers.forEach(controller => {
      const layer = componentLayers.get(controller.name) || 2; // Default to layer 2

      if (!layeredComponents.has(layer)) {
        layeredComponents.set(layer, { controllers: [], services: [] });
      }
      layeredComponents.get(layer)!.controllers.push(controller.name);

      const publishes = this.getControllerPublishedEvents(controller);
      const subscribes = controller.subscriptions?.events || [];

      // Simplified label - just name and key info
      let label = `${controller.name}`;
      if (publishes.length > 0) label += `\n↑ ${publishes.length} events`;
      if (subscribes.length > 0) label += `\n↓ ${subscribes.length} events`;

      const node = {
        id: controller.name,
        label: label.trim(),
        type: 'controller' as const,
        color: context.theme.colors.controller,
        shape: 'rounded' as const
      };
      diagram.nodes.push(node);
      context.nodes.set(controller.name, node);
    });

    allServices.forEach(service => {
      const layer = componentLayers.get(service.name) || 2; // Default to layer 2

      if (!layeredComponents.has(layer)) {
        layeredComponents.set(layer, { controllers: [], services: [] });
      }
      layeredComponents.get(layer)!.services.push(service.name);

      const publishes = this.getServicePublishedEvents(service);
      const subscribes = service.subscriptions?.events || [];

      // Simplified label - just name and key info
      let label = `${service.name}`;
      if (publishes.length > 0) label += `\n↑ ${publishes.length} events`;
      if (subscribes.length > 0) label += `\n↓ ${subscribes.length} events`;

      const node = {
        id: service.name,
        label: label.trim(),
        type: 'service' as const,
        color: context.theme.colors.service,
        shape: 'rounded' as const
      };
      diagram.nodes.push(node);
      context.nodes.set(service.name, node);
    });

    // Create subgraphs for each layer with controllers/services
    const sortedLayers = Array.from(layeredComponents.keys()).sort((a, b) => a - b);
    sortedLayers.forEach(layerNum => {
      const components = layeredComponents.get(layerNum)!;
      const layerLabel = layerNum + 2; // Offset by 2 since models=1, domain events=2

      if (components.controllers.length > 0) {
        diagram.subgraphs.push({
          id: `layer${layerLabel}_controllers`,
          label: `⚙️ LAYER ${layerLabel}A: CONTROLLERS`,
          nodes: components.controllers,
          direction: 'LR'
        });
      }

      if (components.services.length > 0) {
        diagram.subgraphs.push({
          id: `layer${layerLabel}_services`,
          label: `⚙️ LAYER ${layerLabel}B: SERVICES`,
          nodes: components.services,
          direction: 'LR'
        });
      }
    });

    // Create event layer subgraphs
    const sortedEventLayers = Array.from(eventsByLayer.keys()).sort((a, b) => a - b);
    sortedEventLayers.forEach(layerNum => {
      const events = eventsByLayer.get(layerNum)!;
      const layerLabel = layerNum + 2; // Offset by 2 since models=1

      diagram.subgraphs.push({
        id: `layer${layerLabel}_events`,
        label: `🔔 LAYER ${layerLabel}: EVENTS`,
        nodes: events,
        direction: 'LR'
      });
    });

    // LAYER 5: Views
    const viewNodes: string[] = [];
    allViews.forEach(view => {
      viewNodes.push(view.name);

      const subscribes = view.subscriptions?.events || [];
      let label = `${view.name}`;
      if (subscribes.length > 0) label += `\n↓ ${subscribes.length} events`;

      const node = {
        id: view.name,
        label: label.trim(),
        type: 'view' as const,
        color: context.theme.colors.view,
        shape: 'rounded' as const
      };
      diagram.nodes.push(node);
      context.nodes.set(view.name, node);
    });

    if (viewNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'views_layer',
        label: '🖥️ LAYER 5: VIEWS (User Interface)',
        nodes: viewNodes,
        direction: 'LR'
      });
    }

    // Add edges: Models → Domain Events
    allModels.forEach(model => {
      Object.values(model.behaviors).forEach((behavior: any) => {
        if (behavior.publishes) {
          behavior.publishes.forEach((event: string) => {
            diagram.edges.push({
              from: model.name,
              to: event,
              label: 'publishes',
              type: 'solid',
              arrow: 'single'
            });
          });
        }
      });
    });

    // Add edges: Domain Events → Controllers/Services
    domainEvents.forEach(eventName => {
      [...allControllers, ...allServices].forEach(subscriber => {
        if (subscriber.subscriptions?.events?.includes(eventName)) {
          diagram.edges.push({
            from: eventName,
            to: subscriber.name,
            label: 'subscribes',
            type: 'dashed',
            arrow: 'single'
          });
        }
      });
    });

    // Add edges: Controllers/Services → App Events
    allControllers.forEach(controller => {
      this.getControllerPublishedEvents(controller).forEach(event => {
        diagram.edges.push({
          from: controller.name,
          to: event,
          label: 'publishes',
          type: 'solid',
          arrow: 'single'
        });
      });
    });

    allServices.forEach(service => {
      this.getServicePublishedEvents(service).forEach(event => {
        diagram.edges.push({
          from: service.name,
          to: event,
          label: 'publishes',
          type: 'solid',
          arrow: 'single'
        });
      });
    });

    // Add edges: App Events → Controllers/Services (feedback loops)
    appEvents.forEach(eventName => {
      [...allControllers, ...allServices].forEach(subscriber => {
        if (subscriber.subscriptions?.events?.includes(eventName)) {
          diagram.edges.push({
            from: eventName,
            to: subscriber.name,
            label: 'subscribes',
            type: 'dashed',
            arrow: 'single'
          });
        }
      });
    });

    // Add edges: App Events → Views
    appEvents.forEach(eventName => {
      allViews.forEach(view => {
        if (view.subscriptions?.events?.includes(eventName)) {
          diagram.edges.push({
            from: eventName,
            to: view.name,
            label: 'subscribes',
            type: 'dashed',
            arrow: 'single'
          });
        }
      });
    });

    return diagram;
  }

  /**
   * Generate sequence diagram for event flows
   */
  private generateSequenceEventFlow(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('sequenceDiagram');
    diagram.title = context.options.title || 'Event Flow Sequence';

    const allControllers = context.getAllControllers();
    const allServices = context.getAllServices();
    const allEvents = context.getAllEvents();

    // Build event flow graph: event -> publishers and subscribers
    interface EventFlow {
      eventName: string;
      publishers: Array<{ name: string; type: 'controller' | 'service'; operation: string }>;
      subscribers: Array<{ name: string; type: 'controller' | 'service'; }>;
      nextEvents: string[]; // Events published by subscribers
    }

    const eventFlows = new Map<string, EventFlow>();

    // Collect all events with their publishers
    allEvents.forEach(event => {
      const eventFlow: EventFlow = {
        eventName: event.name,
        publishers: [],
        subscribers: [],
        nextEvents: []
      };

      // Find publishers in controllers
      allControllers.forEach(controller => {
        if (controller.cured) {
          Object.entries(controller.cured).forEach(([opName, op]: [string, any]) => {
            if (op?.publishes && op.publishes.includes(event.name)) {
              eventFlow.publishers.push({
                name: controller.name,
                type: 'controller',
                operation: opName
              });
            }
          });
        }

        if (controller.actions) {
          Object.entries(controller.actions).forEach(([actionName, action]: [string, any]) => {
            if (action?.publishes && action.publishes.includes(event.name)) {
              eventFlow.publishers.push({
                name: controller.name,
                type: 'controller',
                operation: actionName
              });
            }
          });
        }

        // Find subscribers
        if (controller.subscriptions?.events?.includes(event.name)) {
          eventFlow.subscribers.push({
            name: controller.name,
            type: 'controller'
          });
        }
      });

      // Find publishers and subscribers in services
      allServices.forEach(service => {
        if (service.operations) {
          Object.entries(service.operations).forEach(([opName, op]: [string, any]) => {
            if (op?.publishes && op.publishes.includes(event.name)) {
              eventFlow.publishers.push({
                name: service.name,
                type: 'service',
                operation: opName
              });
            }
          });
        }

        if (service.subscriptions?.events?.includes(event.name)) {
          eventFlow.subscribers.push({
            name: service.name,
            type: 'service'
          });
        }
      });

      // Find what events subscribers publish (for chaining)
      eventFlow.subscribers.forEach(subscriber => {
        const component = [...allControllers, ...allServices].find(c => c.name === subscriber.name);
        if (component) {
          if ('operations' in component && component.operations) {
            // Service
            Object.values(component.operations).forEach((op: any) => {
              if (op?.publishes) {
                eventFlow.nextEvents.push(...op.publishes);
              }
            });
          } else {
            // Controller
            const controller = component as ControllerSpec;
            if (controller.cured) {
              Object.values(controller.cured).forEach((op: any) => {
                if (op?.publishes) {
                  eventFlow.nextEvents.push(...op.publishes);
                }
              });
            }
            if (controller.actions) {
              Object.values(controller.actions).forEach((action: any) => {
                if (action?.publishes) {
                  eventFlow.nextEvents.push(...action.publishes);
                }
              });
            }
          }
        }
      });

      eventFlow.nextEvents = [...new Set(eventFlow.nextEvents)];
      eventFlows.set(event.name, eventFlow);
    });

    // Build sequence diagram
    // Add participants
    const participants = new Set<string>();
    eventFlows.forEach(flow => {
      flow.publishers.forEach(p => participants.add(p.name));
      flow.subscribers.forEach(s => participants.add(s.name));
    });

    // Add participant declarations with aliases
    const participantAliases = new Map<string, string>();
    Array.from(participants).forEach(name => {
      const alias = name.substring(0, 2).toUpperCase();
      participantAliases.set(name, alias);

      diagram.sequences = diagram.sequences || [];
      diagram.sequences.push({
        type: 'participant',
        participant: alias,
        label: name
      });
    });

    // Find event chains (starting from events with publishers but no dependencies)
    const processedEvents = new Set<string>();

    const buildSequence = (eventName: string, depth: number = 0) => {
      if (depth > 10 || processedEvents.has(eventName)) return; // Prevent infinite loops
      processedEvents.add(eventName);

      const flow = eventFlows.get(eventName);
      if (!flow) return;

      // For each publisher -> subscriber chain
      flow.publishers.forEach(publisher => {
        flow.subscribers.forEach(subscriber => {
          const fromAlias = participantAliases.get(publisher.name);
          const toAlias = participantAliases.get(subscriber.name);

          if (fromAlias && toAlias) {
            diagram.sequences = diagram.sequences || [];
            diagram.sequences.push({
              type: 'message',
              from: fromAlias,
              to: toAlias,
              message: eventName,
              activate: true
            });

            // Process next events from this subscriber
            flow.nextEvents.forEach(nextEvent => {
              buildSequence(nextEvent, depth + 1);
            });
          }
        });
      });
    };

    // Start with events that have publishers (entry points)
    eventFlows.forEach((flow, eventName) => {
      if (flow.publishers.length > 0 && !processedEvents.has(eventName)) {
        buildSequence(eventName);
      }
    });

    // If no sequences were built, add a note
    if (!diagram.sequences || diagram.sequences.filter(s => s.type === 'message').length === 0) {
      diagram.sequences = diagram.sequences || [];
      diagram.sequences.push({
        type: 'note',
        placement: 'over',
        participants: Array.from(participants).slice(0, 1).map(p => participantAliases.get(p) || p),
        message: 'No event flow sequences detected'
      });
    }

    return diagram;
  }

  /**
   * Generate swimlane diagram for parallel event flows
   *
   * Creates horizontal swimlanes for each component (controller/service)
   * with events flowing across swimlanes showing parallel processing
   */
  private generateSwimlaneEventFlow(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'LR');
    diagram.title = context.options.title || 'Event Flow Swimlanes';

    const allControllers = context.getAllControllers();
    const allServices = context.getAllServices();
    const allEvents = context.getAllEvents();

    // Build component swimlanes
    interface ComponentSwimlane {
      name: string;
      type: 'controller' | 'service';
      operations: string[];
      publishedEvents: string[];
      subscribedEvents: string[];
    }

    const swimlanes = new Map<string, ComponentSwimlane>();

    // Process controllers
    allControllers.forEach(controller => {
      const operations: string[] = [];
      const publishedEvents = new Set<string>();
      const subscribedEvents = new Set<string>();

      if (controller.cured) {
        Object.entries(controller.cured).forEach(([opName, op]: [string, any]) => {
          operations.push(opName);
          if (op?.publishes) {
            op.publishes.forEach((e: string) => publishedEvents.add(e));
          }
        });
      }

      if (controller.actions) {
        Object.entries(controller.actions).forEach(([actionName, action]: [string, any]) => {
          operations.push(actionName);
          if (action?.publishes) {
            action.publishes.forEach((e: string) => publishedEvents.add(e));
          }
        });
      }

      if (controller.subscriptions?.events) {
        controller.subscriptions.events.forEach((e: string) => subscribedEvents.add(e));
      }

      swimlanes.set(controller.name, {
        name: controller.name,
        type: 'controller',
        operations,
        publishedEvents: Array.from(publishedEvents),
        subscribedEvents: Array.from(subscribedEvents)
      });
    });

    // Process services
    allServices.forEach(service => {
      const operations: string[] = [];
      const publishedEvents = new Set<string>();
      const subscribedEvents = new Set<string>();

      if (service.operations) {
        Object.entries(service.operations).forEach(([opName, op]: [string, any]) => {
          operations.push(opName);
          if (op?.publishes) {
            op.publishes.forEach((e: string) => publishedEvents.add(e));
          }
        });
      }

      if (service.subscriptions?.events) {
        service.subscriptions.events.forEach((e: string) => subscribedEvents.add(e));
      }

      swimlanes.set(service.name, {
        name: service.name,
        type: 'service',
        operations,
        publishedEvents: Array.from(publishedEvents),
        subscribedEvents: Array.from(subscribedEvents)
      });
    });

    // Create swimlane subgraphs
    swimlanes.forEach((swimlane, componentName) => {
      const swimlaneNodes: string[] = [];

      // Add component entry node
      const entryNodeId = `${componentName}_entry`;
      swimlaneNodes.push(entryNodeId);
      const entryNode = {
        id: entryNodeId,
        label: `${componentName}\n${swimlane.type}`,
        type: (swimlane.type === 'controller' ? 'controller' : 'service') as 'controller' | 'service',
        color: swimlane.type === 'controller' ? context.theme.colors.controller : context.theme.colors.service,
        shape: 'rounded'
      };
      diagram.nodes.push(entryNode);
      context.nodes.set(entryNodeId, entryNode);  // Add to context for rendering

      // Add operation nodes within swimlane
      swimlane.operations.forEach(operation => {
        const opNodeId = `${componentName}_${operation}`;
        swimlaneNodes.push(opNodeId);
        const opNode = {
          id: opNodeId,
          label: operation,
          type: 'component' as const,  // Use 'component' type for operation nodes
          color: '#E8F5E9',
          shape: 'rounded'
        };
        diagram.nodes.push(opNode);
        context.nodes.set(opNodeId, opNode);  // Add to context for rendering

        // Connect entry to operations
        diagram.edges.push({
          from: entryNodeId,
          to: opNodeId,
          label: '',
          type: 'solid',
          arrow: 'single'
        });
      });

      // Create subgraph for this swimlane
      diagram.subgraphs.push({
        id: `swimlane_${componentName}`,
        label: `${componentName} (${swimlane.type})`,
        nodes: swimlaneNodes,
        direction: 'TB'
      });
    });

    // Add event nodes between swimlanes
    const eventNodes = new Map<string, string>();
    allEvents.forEach(event => {
      const eventNodeId = `event_${event.name}`;
      eventNodes.set(event.name, eventNodeId);

      diagram.nodes.push({
        id: eventNodeId,
        label: event.name,
        type: 'event',
        color: context.theme.colors.appEvent,
        shape: 'hexagon'
      });
    });

    // Connect swimlanes via events
    swimlanes.forEach((swimlane, componentName) => {
      // Add edges from operations to published events
      swimlane.publishedEvents.forEach(eventName => {
        const eventNodeId = eventNodes.get(eventName);
        if (eventNodeId) {
          // Find which operations publish this event
          swimlane.operations.forEach(operation => {
            const opNodeId = `${componentName}_${operation}`;

            // Check if this operation publishes the event
            const component = [...allControllers, ...allServices].find(c => c.name === componentName);
            if (component) {
              let publishes = false;

              if ('operations' in component && component.operations) {
                const op = component.operations[operation];
                if (op?.publishes && op.publishes.includes(eventName)) {
                  publishes = true;
                }
              } else {
                const controller = component as ControllerSpec;
                if (controller.cured?.[operation]?.publishes?.includes(eventName)) {
                  publishes = true;
                }
                if (controller.actions?.[operation]?.publishes?.includes(eventName)) {
                  publishes = true;
                }
              }

              if (publishes) {
                diagram.edges.push({
                  from: opNodeId,
                  to: eventNodeId,
                  label: 'publishes',
                  type: 'solid',
                  arrow: 'single'
                });
              }
            }
          });
        }
      });

      // Add edges from subscribed events to component
      swimlane.subscribedEvents.forEach(eventName => {
        const eventNodeId = eventNodes.get(eventName);
        if (eventNodeId) {
          const entryNodeId = `${componentName}_entry`;
          diagram.edges.push({
            from: eventNodeId,
            to: entryNodeId,
            label: 'subscribes',
            type: 'dashed',
            arrow: 'single'
          });
        }
      });
    });

    return diagram;
  }

  /**
   * Helper: Get event publishers from models
   */
  private getEventPublishers(models: ModelSpec[], eventName: string): string[] {
    const publishers: string[] = [];

    models.forEach(model => {
      Object.entries(model.behaviors).forEach(([behaviorName, behavior]: [string, any]) => {
        if (behavior.publishes && behavior.publishes.includes(eventName)) {
          publishers.push(`${model.name}.${behaviorName}`);
        }
      });
    });

    return publishers;
  }

  /**
   * Helper: Get events published by controller
   */
  private getControllerPublishedEvents(controller: ControllerSpec): string[] {
    const events: string[] = [];

    if (controller.cured) {
      Object.values(controller.cured).forEach((op: any) => {
        if (op?.publishes) {
          events.push(...op.publishes);
        }
      });
    }

    if (controller.actions) {
      Object.values(controller.actions).forEach((action: any) => {
        if (action?.publishes) {
          events.push(...action.publishes);
        }
      });
    }

    return [...new Set(events)];
  }

  /**
   * Helper: Get events published by service
   */
  private getServicePublishedEvents(service: ServiceSpec): string[] {
    const events: string[] = [];

    if (service.operations) {
      Object.values(service.operations).forEach((op: any) => {
        if (op?.publishes) {
          events.push(...op.publishes);
        }
      });
    }

    return [...new Set(events)];
  }

  /**
   * Helper: Get app event publishers
   */
  private getAppEventPublishers(controllers: ControllerSpec[], services: ServiceSpec[], eventName: string): string[] {
    const publishers: string[] = [];

    controllers.forEach(controller => {
      if (controller.cured) {
        Object.entries(controller.cured).forEach(([opName, op]: [string, any]) => {
          if (op?.publishes && op.publishes.includes(eventName)) {
            publishers.push(`${controller.name}.${opName}`);
          }
        });
      }

      if (controller.actions) {
        Object.entries(controller.actions).forEach(([actionName, action]: [string, any]) => {
          if (action?.publishes && action.publishes.includes(eventName)) {
            publishers.push(`${controller.name}.${actionName}`);
          }
        });
      }
    });

    services.forEach(service => {
      if (service.operations) {
        Object.entries(service.operations).forEach(([opName, op]: [string, any]) => {
          if (op?.publishes && op.publishes.includes(eventName)) {
            publishers.push(`${service.name}.${opName}`);
          }
        });
      }
    });

    return publishers;
  }

  /**
   * Get default options for event flow diagrams
   */
  getDefaultOptions() {
    return {
      includeEvents: true,
      includeSubscribers: true,
      title: 'Event Flow Architecture'
    };
  }

  /**
   * Compute component layers using topological sort
   * Returns a map of component name -> layer number
   */
  private computeComponentLayers(
    models: ModelSpec[],
    controllers: ControllerSpec[],
    services: ServiceSpec[],
    views: any[]
  ): { layers: Map<string, number>, allEventNames: Set<string> } {
    const layers = new Map<string, number>();
    const graph = new Map<string, Set<string>>(); // component -> components it depends on
    const reverseGraph = new Map<string, Set<string>>(); // component -> components that depend on it

    // Collect all events first
    const allEventNames = new Set<string>();

    models.forEach(model => {
      Object.values(model.behaviors).forEach((behavior: any) => {
        if (behavior.publishes) {
          behavior.publishes.forEach((event: string) => allEventNames.add(event));
        }
      });
    });

    controllers.forEach(controller => {
      const events = this.getControllerPublishedEvents(controller);
      events.forEach(event => allEventNames.add(event));
      if (controller.subscriptions?.events) {
        controller.subscriptions.events.forEach((event: string) => allEventNames.add(event));
      }
    });

    services.forEach(service => {
      const events = this.getServicePublishedEvents(service);
      events.forEach(event => allEventNames.add(event));
      if (service.subscriptions?.events) {
        service.subscriptions.events.forEach((event: string) => allEventNames.add(event));
      }
    });

    views.forEach(view => {
      if (view.subscriptions?.events) {
        view.subscriptions.events.forEach((event: string) => allEventNames.add(event));
      }
    });

    const allComponents = [
      ...models.map(m => ({ name: m.name, type: 'model' as const, spec: m })),
      ...controllers.map(c => ({ name: c.name, type: 'controller' as const, spec: c })),
      ...services.map(s => ({ name: s.name, type: 'service' as const, spec: s })),
      ...views.map(v => ({ name: v.name, type: 'view' as const, spec: v })),
      // Add events as nodes - just use event names directly
      ...Array.from(allEventNames).map(e => ({ name: e, type: 'event' as const, spec: null }))
    ];

    // Initialize graph
    allComponents.forEach(comp => {
      graph.set(comp.name, new Set());
      reverseGraph.set(comp.name, new Set());
    });

    // Build dependency graph based on event flow
    // Publisher -> Event -> Subscriber creates two edges:
    // 1. Event depends on Publisher
    // 2. Subscriber depends on Event

    // Process publishers: event depends on publisher
    models.forEach(model => {
      Object.values(model.behaviors).forEach((behavior: any) => {
        if (behavior.publishes) {
          behavior.publishes.forEach((event: string) => {
            // Event depends on model
            graph.get(event)!.add(model.name);
            reverseGraph.get(model.name)!.add(event);
          });
        }
      });
    });

    controllers.forEach(controller => {
      const events = this.getControllerPublishedEvents(controller);
      events.forEach(event => {
        // Event depends on controller
        graph.get(event)!.add(controller.name);
        reverseGraph.get(controller.name)!.add(event);
      });
    });

    services.forEach(service => {
      const events = this.getServicePublishedEvents(service);
      events.forEach(event => {
        // Event depends on service
        graph.get(event)!.add(service.name);
        reverseGraph.get(service.name)!.add(event);
      });
    });

    // Process subscribers: subscriber depends on event
    controllers.forEach(controller => {
      if (controller.subscriptions?.events) {
        controller.subscriptions.events.forEach(event => {
          // Controller depends on event
          graph.get(controller.name)!.add(event);
          reverseGraph.get(event)!.add(controller.name);
        });
      }
    });

    services.forEach(service => {
      if (service.subscriptions?.events) {
        service.subscriptions.events.forEach(event => {
          // Service depends on event
          graph.get(service.name)!.add(event);
          reverseGraph.get(event)!.add(service.name);
        });
      }
    });

    views.forEach(view => {
      if (view.subscriptions?.events) {
        view.subscriptions.events.forEach((event: string) => {
          // View depends on event
          graph.get(view.name)!.add(event);
          reverseGraph.get(event)!.add(view.name);
        });
      }
    });

    // Use longest-path layering for better separation
    // This assigns each node to a layer based on the longest path from any root node

    // First, find all root nodes (nodes with no dependencies)
    const rootNodes: string[] = [];
    allComponents.forEach(comp => {
      if (graph.get(comp.name)!.size === 0) {
        rootNodes.push(comp.name);
      }
    });

    // Compute longest path from any root using dynamic programming
    const longestPath = new Map<string, number>();
    const visited = new Set<string>();

    const computeLongestPath = (node: string): number => {
      if (longestPath.has(node)) {
        return longestPath.get(node)!;
      }

      if (visited.has(node)) {
        // Cycle detected - return 0 to break cycle
        return 0;
      }

      visited.add(node);

      const dependencies = graph.get(node)!;
      if (dependencies.size === 0) {
        // Root node
        longestPath.set(node, 0);
        visited.delete(node);
        return 0;
      }

      // Find max path through any dependency
      let maxPath = 0;
      dependencies.forEach(dep => {
        const depPath = computeLongestPath(dep);
        maxPath = Math.max(maxPath, depPath + 1);
      });

      longestPath.set(node, maxPath);
      visited.delete(node);
      return maxPath;
    };

    // Compute longest path for all nodes
    allComponents.forEach(comp => {
      computeLongestPath(comp.name);
    });

    // Assign layers based on longest path
    allComponents.forEach(comp => {
      layers.set(comp.name, longestPath.get(comp.name) || 0);
    });

    return { layers, allEventNames };
  }
}
