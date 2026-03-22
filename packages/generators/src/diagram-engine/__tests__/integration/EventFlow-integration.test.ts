/**
 * Integration tests for EventFlowPlugin with UnifiedDiagramGenerator
 */

import { describe, it, expect } from 'vitest';
import { UnifiedDiagramGenerator } from '../../core/UnifiedDiagramGenerator.js';
import { EventFlowPlugin } from '../../plugins/event-flow/EventFlowPlugin.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

describe('EventFlow Integration', () => {
  const mockAST: SpecVerseAST = {
    components: [
      {
        name: 'ECommerce',
        version: '1.0.0',
        models: [
          {
            name: 'Order',
            attributes: [{ name: 'id', type: 'UUID', required: true }],
            relationships: [],
            lifecycles: [],
            behaviors: {
              place: {
                publishes: ['OrderPlaced']
              },
              confirm: {
                publishes: ['OrderConfirmed']
              }
            }
          },
          {
            name: 'Payment',
            attributes: [{ name: 'id', type: 'UUID', required: true }],
            relationships: [],
            lifecycles: [],
            behaviors: {
              process: {
                publishes: ['PaymentProcessed']
              }
            }
          }
        ],
        controllers: [
          {
            name: 'OrderController',
            model: 'Order',
            cured: {
              create: {
                publishes: ['OrderCreated']
              }
            },
            actions: {
              checkout: {
                publishes: ['CheckoutInitiated']
              }
            },
            subscriptions: {
              events: ['PaymentProcessed', 'OrderConfirmed']
            }
          }
        ],
        services: [
          {
            name: 'InventoryService',
            operations: {
              reserve: {
                publishes: ['InventoryReserved']
              }
            },
            subscriptions: {
              events: ['OrderPlaced', 'OrderCreated']
            }
          },
          {
            name: 'EmailService',
            operations: {
              send: {
                publishes: []
              }
            },
            subscriptions: {
              events: ['OrderPlaced', 'OrderCreated', 'PaymentProcessed']
            }
          }
        ],
        views: [
          {
            name: 'OrderDashboard',
            components: ['orderList', 'orderDetails'],
            subscriptions: {
              events: ['OrderCreated', 'OrderConfirmed']
            }
          }
        ],
        events: []
      }
    ],
    deployments: []
  };

  describe('Generator Integration', () => {
    it('should register and use EventFlowPlugin', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      expect(generator.isTypeSupported('event-flow-layered')).toBe(true);
      expect(generator.isTypeSupported('event-flow-sequence')).toBe(true);
      expect(generator.isTypeSupported('event-flow-swimlane')).toBe(true);
    });

    it('should generate layered event flow through generator', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-layered');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph TD');
      expect(diagram).toContain('Order');
      expect(diagram).toContain('OrderController');
      expect(diagram).toContain('InventoryService');
    });

    it('should show 5-layer architecture', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-layered');

      // Dynamic layer architecture - check for key components
      expect(diagram).toContain('MODELS');
      expect(diagram).toContain('EVENTS'); // Dynamic event layers
      expect(diagram).toContain('CONTROLLERS'); // Can be in multiple layers
      expect(diagram).toContain('SERVICES'); // Can be in multiple layers
      expect(diagram).toContain('VIEWS');
    });

    it('should show dual event bus (domain + app events)', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-layered');

      // Should have event layers (dynamic numbering)
      expect(diagram).toContain('EVENTS');
      // Check for actual events (domain and app) by their colors
      expect(diagram).toContain('#fff3e0'); // Domain event color (orange)
      expect(diagram).toContain('#ffe0b2'); // App event color (lighter orange)
    });

    it('should show publish/subscribe relationships', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-layered');

      expect(diagram).toContain('publishes');
      expect(diagram).toContain('subscribes');
    });

    it('should validate before generation', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const result = generator.validate(mockAST, 'event-flow-layered');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate sequence diagram', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-sequence');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('sequenceDiagram');
    });

    it('should generate swimlane diagram', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-swimlane');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph LR');
    });

    it('should apply custom theme', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'presentation'
      });

      const diagram = generator.generate(mockAST, 'event-flow-layered');

      expect(diagram).toBeDefined();
    });

    it('should get plugin metadata', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const metadata = generator.getMetadata();
      const eventFlowMetadata = metadata.find(m => m.type === 'event-flow-layered');

      expect(eventFlowMetadata).toBeDefined();
      expect(eventFlowMetadata?.plugin).toBe('event-flow-plugin');
      expect(eventFlowMetadata?.description).toContain('Event-driven');
    });

    it('should get default options', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const options = generator.getOptionsForType('event-flow-layered');

      expect(options).toBeDefined();
      expect(options?.includeEvents).toBe(true);
      expect(options?.includeSubscribers).toBe(true);
    });
  });

  describe('Multi-Plugin Support', () => {
    it('should work alongside other plugins', async () => {
      const { ERDiagramPlugin } = await import('../../plugins/er-diagram/ERDiagramPlugin.js');
      const { DeploymentPlugin } = await import('../../plugins/deployment/DeploymentPlugin.js');

      const generator = new UnifiedDiagramGenerator({
        plugins: [
          new EventFlowPlugin(),
          new ERDiagramPlugin(),
          new DeploymentPlugin()
        ],
        theme: 'default'
      });

      const types = generator.getAvailableTypes();

      expect(types).toContain('event-flow-layered');
      expect(types).toContain('event-flow-sequence');
      expect(types).toContain('event-flow-swimlane');
      expect(types).toContain('er-diagram');
      expect(types).toContain('deployment-topology');
    });
  });

  describe('Complex Event Flows', () => {
    it('should handle complex event-driven architecture', () => {
      const complexAST: SpecVerseAST = {
        components: [
          {
            name: 'ComplexSystem',
            version: '1.0.0',
            models: [
              {
                name: 'Account',
                attributes: [],
                relationships: [],
                lifecycles: [],
                behaviors: {
                  activate: { publishes: ['AccountActivated'] },
                  suspend: { publishes: ['AccountSuspended'] },
                  close: { publishes: ['AccountClosed'] }
                }
              }
            ],
            controllers: [
              {
                name: 'AccountController',
                model: 'Account',
                cured: {
                  create: { publishes: ['AccountCreated'] },
                  update: { publishes: ['AccountUpdated'] },
                  delete: { publishes: ['AccountDeleted'] }
                },
                actions: {},
                subscriptions: {
                  events: ['AccountActivated', 'AccountClosed']
                }
              }
            ],
            services: [
              {
                name: 'BillingService',
                operations: {
                  charge: { publishes: ['PaymentCharged'] },
                  refund: { publishes: ['PaymentRefunded'] }
                },
                subscriptions: {
                  events: ['AccountActivated', 'AccountCreated']
                }
              },
              {
                name: 'AuditService',
                operations: {
                  log: { publishes: [] }
                },
                subscriptions: {
                  events: ['AccountCreated', 'AccountUpdated', 'AccountDeleted', 'AccountActivated']
                }
              }
            ],
            views: [
              {
                name: 'AccountDashboard',
                components: [],
                subscriptions: {
                  events: ['AccountCreated', 'AccountUpdated']
                }
              }
            ],
            events: []
          }
        ],
        deployments: []
      };

      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(complexAST, 'event-flow-layered');

      expect(diagram).toContain('Account');
      expect(diagram).toContain('AccountController');
      expect(diagram).toContain('BillingService');
      expect(diagram).toContain('AuditService');
      expect(diagram).toContain('AccountDashboard');
    });

    it('should handle multiple models with events', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-layered');

      // Multiple models
      expect(diagram).toContain('Order');
      expect(diagram).toContain('Payment');
    });

    it('should handle multiple services subscribing to same event', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-layered');

      // Both InventoryService and EmailService subscribe to OrderPlaced
      expect(diagram).toContain('InventoryService');
      expect(diagram).toContain('EmailService');
    });

    it('should show feedback loops (events flowing back to controllers)', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'event-flow-layered');

      // OrderController subscribes to PaymentProcessed (feedback loop)
      expect(diagram).toContain('OrderController');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should visualize microservices event bus', () => {
      const microservicesAST: SpecVerseAST = {
        components: [
          {
            name: 'Microservices',
            version: '1.0.0',
            models: [],
            controllers: [],
            services: [
              {
                name: 'OrderService',
                operations: {
                  create: { publishes: ['OrderCreated'] }
                },
                subscriptions: { events: ['PaymentCompleted'] }
              },
              {
                name: 'PaymentService',
                operations: {
                  process: { publishes: ['PaymentCompleted'] }
                },
                subscriptions: { events: ['OrderCreated'] }
              },
              {
                name: 'ShippingService',
                operations: {
                  ship: { publishes: ['OrderShipped'] }
                },
                subscriptions: { events: ['OrderCreated', 'PaymentCompleted'] }
              }
            ],
            views: [],
            events: []
          }
        ],
        deployments: []
      };

      const generator = new UnifiedDiagramGenerator({
        plugins: [new EventFlowPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(microservicesAST, 'event-flow-layered');

      expect(diagram).toContain('OrderService');
      expect(diagram).toContain('PaymentService');
      expect(diagram).toContain('ShippingService');
    });
  });
});
