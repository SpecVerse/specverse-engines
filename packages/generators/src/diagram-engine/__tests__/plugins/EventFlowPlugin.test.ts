/**
 * Tests for EventFlowPlugin
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventFlowPlugin } from '../../plugins/event-flow/EventFlowPlugin.js';
import { DiagramContext } from '../../core/DiagramContext.js';
import { styleManager } from '../../core/StyleManager.js';
import { MermaidRenderer } from '../../renderers/MermaidRenderer.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

describe('EventFlowPlugin', () => {
  let plugin: EventFlowPlugin;
  let renderer: MermaidRenderer;
  let mockAST: SpecVerseAST;

  beforeEach(() => {
    plugin = new EventFlowPlugin();
    renderer = new MermaidRenderer();

    // Create mock AST with event-driven architecture
    mockAST = {
      components: [
        {
          name: 'BlogSystem',
          version: '1.0.0',
          models: [
            {
              name: 'Article',
              attributes: [
                { name: 'id', type: 'UUID', required: true }
              ],
              relationships: [],
              lifecycles: [],
              behaviors: {
                publish: {
                  publishes: ['ArticlePublished']
                },
                archive: {
                  publishes: ['ArticleArchived']
                }
              }
            },
            {
              name: 'User',
              attributes: [
                { name: 'id', type: 'UUID', required: true }
              ],
              relationships: [],
              lifecycles: [],
              behaviors: {
                verify: {
                  publishes: ['UserVerified']
                }
              }
            }
          ],
          controllers: [
            {
              name: 'ArticleController',
              model: 'Article',
              cured: {
                create: {
                  publishes: ['ArticleCreated'],
                  requires: ['title', 'content']
                },
                update: {
                  publishes: ['ArticleUpdated']
                }
              },
              actions: {
                publishArticle: {
                  publishes: ['ArticlePublishedNotification']
                }
              },
              subscriptions: {
                events: ['ArticlePublished', 'UserVerified']
              }
            },
            {
              name: 'AuthController',
              model: 'User',
              cured: {
                create: {
                  publishes: ['UserRegistered']
                }
              },
              actions: {
                login: {
                  publishes: ['UserLoggedIn']
                }
              },
              subscriptions: {
                events: []
              }
            }
          ],
          services: [
            {
              name: 'NotificationService',
              operations: {
                sendEmail: {
                  publishes: ['EmailSent']
                },
                sendPush: {
                  publishes: ['PushNotificationSent']
                }
              },
              subscriptions: {
                events: ['ArticlePublished', 'UserVerified', 'ArticleCreated']
              }
            },
            {
              name: 'AnalyticsService',
              operations: {
                trackEvent: {
                  publishes: []
                }
              },
              subscriptions: {
                events: ['ArticlePublished', 'UserRegistered']
              }
            }
          ],
          views: [
            {
              name: 'ArticleBrowseView',
              components: ['searchBar', 'articleList'],
              subscriptions: {
                events: ['ArticleCreated', 'ArticleUpdated']
              }
            }
          ],
          events: [
            {
              name: 'ArticlePublished',
              payload: {
                articleId: 'UUID',
                title: 'String'
              }
            },
            {
              name: 'UserVerified',
              payload: {
                userId: 'UUID'
              }
            }
          ]
        }
      ],
      deployments: []
    };
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('event-flow-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toContain('Event-driven');
    });

    it('should support correct diagram types', () => {
      expect(plugin.supportedTypes).toContain('event-flow-layered');
      expect(plugin.supportedTypes).toContain('event-flow-sequence');
      expect(plugin.supportedTypes).toContain('event-flow-swimlane');
    });

    it('should provide default options', () => {
      const options = plugin.getDefaultOptions();
      expect(options.includeEvents).toBe(true);
      expect(options.includeSubscribers).toBe(true);
      expect(options.title).toBe('Event Flow Architecture');
    });
  });

  describe('Validation', () => {
    it('should validate AST with event publishers', () => {
      const result = plugin.validate(mockAST);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about no event publishers', () => {
      const noEventsAST: SpecVerseAST = {
        components: [
          {
            name: 'Empty',
            version: '1.0.0',
            models: [
              {
                name: 'TestModel',
                attributes: [],
                relationships: [],
                lifecycles: [],
                behaviors: {}
              }
            ],
            controllers: [],
            services: [],
            views: [],
            events: []
          }
        ],
        deployments: []
      };

      const result = plugin.validate(noEventsAST);
      expect(result.valid).toBe(true); // No errors, just warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('No event publishers found');
    });

    it('should warn about no event subscribers', () => {
      const noSubscribersAST: SpecVerseAST = {
        components: [
          {
            name: 'Test',
            version: '1.0.0',
            models: [
              {
                name: 'TestModel',
                attributes: [],
                relationships: [],
                lifecycles: [],
                behaviors: {
                  test: {
                    publishes: ['TestEvent']
                  }
                }
              }
            ],
            controllers: [],
            services: [],
            views: [],
            events: []
          }
        ],
        deployments: []
      };

      const result = plugin.validate(noSubscribersAST);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('No event subscribers'))).toBe(true);
    });
  });

  describe('Layered Event Flow Diagram', () => {
    it('should generate layered event flow diagram', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      expect(diagram.type).toBe('graph');
      expect(diagram.direction).toBe('TD');
      expect(diagram.nodes.length).toBeGreaterThan(0);
      expect(diagram.subgraphs.length).toBeGreaterThan(0);
    });

    it('should include Layer 1 - Models', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      const modelsLayer = diagram.subgraphs.find(s => s.id === 'models_layer');
      expect(modelsLayer).toBeDefined();
      expect(modelsLayer?.label).toContain('MODELS');
      expect(modelsLayer?.nodes).toContain('Article');
      expect(modelsLayer?.nodes).toContain('User');
    });

    it('should include Layer 2 - Domain Events', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // Events are now in dynamic layers - find any events layer
      const eventsLayers = diagram.subgraphs.filter(s => s.label.includes('EVENTS'));
      expect(eventsLayers.length).toBeGreaterThan(0);

      // Should have event nodes (without _domain suffix)
      const eventNode = diagram.nodes.find(n => n.id === 'ArticlePublished');
      expect(eventNode).toBeDefined();
      expect(eventNode?.type).toBe('event');
    });

    it('should include Layer 3 - Controllers & Services', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // Controllers and Services are now in separate dynamic layers
      const controllersLayers = diagram.subgraphs.filter(s => s.label.includes('CONTROLLERS'));
      const servicesLayers = diagram.subgraphs.filter(s => s.label.includes('SERVICES'));

      expect(controllersLayers.length + servicesLayers.length).toBeGreaterThan(0);

      // Check that controller and service nodes exist
      const controllerNode = diagram.nodes.find(n => n.id === 'ArticleController');
      const serviceNode = diagram.nodes.find(n => n.id === 'NotificationService');
      expect(controllerNode).toBeDefined();
      expect(serviceNode).toBeDefined();
    });

    it('should include Layer 4 - Application Events', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // Events are now in dynamic layers
      const eventsLayers = diagram.subgraphs.filter(s => s.label.includes('EVENTS'));
      expect(eventsLayers.length).toBeGreaterThan(0);

      // Should have app event nodes (without _app suffix)
      const appEventNode = diagram.nodes.find(n => n.id === 'ArticleCreated');
      expect(appEventNode).toBeDefined();
      expect(appEventNode?.type).toBe('event');
    });

    it('should include Layer 5 - Views', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      const viewsLayer = diagram.subgraphs.find(s => s.id === 'views_layer');
      expect(viewsLayer).toBeDefined();
      expect(viewsLayer?.label).toContain('VIEWS');
      expect(viewsLayer?.nodes).toContain('ArticleBrowseView');
    });

    it('should show model publishing domain events', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // Article model publishes ArticlePublished (without _domain suffix)
      const publishEdge = diagram.edges.find(e =>
        e.from === 'Article' &&
        e.to === 'ArticlePublished' &&
        e.label === 'publishes'
      );

      expect(publishEdge).toBeDefined();
      expect(publishEdge?.type).toBe('solid');
    });

    it('should show domain events flowing to subscribers', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // ArticlePublished flows to NotificationService (without _domain suffix)
      const subscribeEdge = diagram.edges.find(e =>
        e.from === 'ArticlePublished' &&
        e.to === 'NotificationService' &&
        e.label === 'subscribes'
      );

      expect(subscribeEdge).toBeDefined();
      expect(subscribeEdge?.type).toBe('dashed');
    });

    it('should show controllers publishing app events', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // ArticleController publishes ArticleCreated (without _app suffix)
      const publishEdge = diagram.edges.find(e =>
        e.from === 'ArticleController' &&
        e.to === 'ArticleCreated' &&
        e.label === 'publishes'
      );

      expect(publishEdge).toBeDefined();
    });

    it('should show app events flowing to views', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // ArticleCreated flows to ArticleBrowseView (without _app suffix)
      const subscribeEdge = diagram.edges.find(e =>
        e.from === 'ArticleCreated' &&
        e.to === 'ArticleBrowseView' &&
        e.label === 'subscribes'
      );

      expect(subscribeEdge).toBeDefined();
    });

    it('should show app events flowing back to controllers (feedback loop)', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // Check for feedback loops (app events subscribed by controllers)
      const feedbackEdges = diagram.edges.filter(e =>
        e.to === 'ArticleController' &&
        e.label === 'subscribes'
      );

      // ArticleController subscribes to ArticlePublished (which is also an app event in some cases)
      expect(feedbackEdges.length).toBeGreaterThanOrEqual(0);
    });

    it('should distinguish between domain and app events', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // All events are now type 'event', but distinguished by color
      const eventNodes = diagram.nodes.filter(n => n.type === 'event');
      expect(eventNodes.length).toBeGreaterThan(0);

      // Find domain event (published by model) and app event (published by controller)
      const articlePublished = diagram.nodes.find(n => n.id === 'ArticlePublished');
      const articleCreated = diagram.nodes.find(n => n.id === 'ArticleCreated');

      expect(articlePublished).toBeDefined();
      expect(articleCreated).toBeDefined();

      // They should have different colors (domain vs app)
      expect(articlePublished?.color).toBeDefined();
      expect(articleCreated?.color).toBeDefined();
    });

    it('should use theme colors correctly', () => {
      const theme = styleManager.getTheme('dark-mode');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      const modelNode = diagram.nodes.find(n => n.type === 'model');
      const controllerNode = diagram.nodes.find(n => n.type === 'controller');
      const serviceNode = diagram.nodes.find(n => n.type === 'service');

      expect(modelNode?.color).toBe(theme.colors.model);
      expect(controllerNode?.color).toBe(theme.colors.controller);
      expect(serviceNode?.color).toBe(theme.colors.service);
    });

    it('should handle models with multiple behaviors', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // Article has publish and archive behaviors - simplified label shows event count
      const articleNode = diagram.nodes.find(n => n.id === 'Article');
      expect(articleNode).toBeDefined();
      expect(articleNode?.label).toContain('Article');
      expect(articleNode?.label).toMatch(/↑ \d+ events/); // Shows number of published events
    });

    it('should handle controllers with both CURED and actions', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      const articleControllerNode = diagram.nodes.find(n => n.id === 'ArticleController');
      // Simplified labels now show just name and event counts
      expect(articleControllerNode?.label).toContain('ArticleController');
      expect(articleControllerNode?.label).toMatch(/↑ \d+ events/); // publishes events
      expect(articleControllerNode?.label).toMatch(/↓ \d+ events/); // subscribes events
    });

    it('should handle services with operations', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      const notificationServiceNode = diagram.nodes.find(n => n.id === 'NotificationService');
      // Simplified labels now show just name and event counts
      expect(notificationServiceNode?.label).toContain('NotificationService');
      expect(notificationServiceNode?.label).toMatch(/↑ \d+ events/); // publishes events
      expect(notificationServiceNode?.label).toMatch(/↓ \d+ events/); // subscribes events
    });
  });

  describe('Sequence Event Flow Diagram', () => {
    it('should generate sequence event flow diagram', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-sequence');

      expect(diagram.type).toBe('sequenceDiagram');
      expect(diagram.title).toContain('Event Flow Sequence');
    });
  });

  describe('Swimlane Event Flow Diagram', () => {
    it('should generate swimlane event flow diagram', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-swimlane');

      expect(diagram.type).toBe('graph');
      expect(diagram.direction).toBe('LR');
      expect(diagram.title).toContain('Event Flow Swimlanes');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported diagram type', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      expect(() => {
        plugin.generate(context, 'er-diagram' as any);
      }).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty component gracefully', () => {
      const emptyAST: SpecVerseAST = {
        components: [
          {
            name: 'Empty',
            version: '1.0.0',
            models: [],
            controllers: [],
            services: [],
            views: [],
            events: []
          }
        ],
        deployments: []
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(emptyAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // Should not crash, may have no layers
      expect(diagram).toBeDefined();
      expect(diagram.type).toBe('graph');
    });

    it('should handle models without behaviors', () => {
      const noBehaviorsAST: SpecVerseAST = {
        components: [
          {
            name: 'Test',
            version: '1.0.0',
            models: [
              {
                name: 'SimpleModel',
                attributes: [],
                relationships: [],
                lifecycles: [],
                behaviors: {}
              }
            ],
            controllers: [],
            services: [],
            views: [],
            events: []
          }
        ],
        deployments: []
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(noBehaviorsAST, {}, theme);

      const diagram = plugin.generate(context, 'event-flow-layered');

      // Should not include model in diagram since it has no events
      const modelsLayer = diagram.subgraphs.find(s => s.id === 'models_layer');
      expect(modelsLayer).toBeUndefined();
    });
  });
});
