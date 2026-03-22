/**
 * Tests for DeploymentPlugin
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeploymentPlugin } from '../../plugins/deployment/DeploymentPlugin.js';
import { DiagramContext } from '../../core/DiagramContext.js';
import { styleManager } from '../../core/StyleManager.js';
import { MermaidRenderer } from '../../renderers/MermaidRenderer.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

describe('DeploymentPlugin', () => {
  let plugin: DeploymentPlugin;
  let renderer: MermaidRenderer;
  let mockAST: any;

  beforeEach(() => {
    plugin = new DeploymentPlugin();
    renderer = new MermaidRenderer();

    // Create mock AST with deployment information
    mockAST = {
      components: [
        {
          name: 'BlogSystem',
          version: '1.0.0',
          models: [],
          controllers: [],
          services: [],
          views: [],
          events: []
        }
      ],
      deployments: {
        production: {
          environment: 'production',
          instances: {
            communications: {
              eventBus: {
                type: 'pubsub',
                namespace: 'global',
                capabilities: ['event.publish', 'event.subscribe', 'event.filter']
              }
            },
            controllers: {
              articleController: {
                component: 'BlogSystem',
                namespace: 'api',
                scale: 3,
                advertises: ['article.crud'],
                uses: ['storage.database', 'event.publish']
              },
              authController: {
                component: 'BlogSystem',
                namespace: 'api',
                scale: 2,
                advertises: ['auth.login',  'auth.register'],
                uses: ['storage.sessions', 'event.publish']
              }
            },
            services: {
              notificationService: {
                component: 'BlogSystem',
                namespace: 'workers',
                scale: 2,
                advertises: ['notifications.send'],
                uses: ['event.subscribe', 'smtp.send']
              }
            },
            views: {
              webApp: {
                component: 'BlogSystem',
                namespace: 'frontend',
                scale: 5,
                uses: ['article.crud', 'auth.login']
              }
            }
          }
        }
      }
    } as any;
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('deployment-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toContain('Deployment');
    });

    it('should support correct diagram types', () => {
      expect(plugin.supportedTypes).toContain('deployment-topology');
      expect(plugin.supportedTypes).toContain('capability-flow');
    });

    it('should provide default options', () => {
      const options = plugin.getDefaultOptions();
      expect(options.includeCapabilities).toBe(true);
      expect(options.includeScaling).toBe(true);
      expect(options.title).toBe('Deployment Topology');
    });
  });

  describe('Validation', () => {
    it('should validate AST with deployments', () => {
      const result = plugin.validate(mockAST);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with no deployments', () => {
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

      const result = plugin.validate(emptyAST);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('No deployments found');
    });

    it('should warn about empty deployments', () => {
      const emptyDeploymentAST = {
        components: mockAST.components,
        deployments: {
          production: {
            environment: 'production',
            instances: {}
          }
        }
      };

      const result = plugin.validate(emptyDeploymentAST);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('No instances found');
    });
  });

  describe('Deployment Topology Diagram', () => {
    it('should generate deployment topology diagram', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      expect(diagram.type).toBe('graph');
      expect(diagram.direction).toBe('TB');
      expect(diagram.nodes.length).toBeGreaterThan(0);
      expect(diagram.subgraphs.length).toBeGreaterThan(0);
    });

    it('should include communication channels', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const commSubgraph = diagram.subgraphs.find(s => s.id === 'communication_channels');
      expect(commSubgraph).toBeDefined();
      expect(commSubgraph?.nodes).toContain('eventBus');

      const eventBusNode = diagram.nodes.find(n => n.id === 'eventBus');
      expect(eventBusNode).toBeDefined();
      expect(eventBusNode?.label).toContain('pubsub');
      expect(eventBusNode?.label).toContain('3 capabilities');
    });

    it('should include controller instances', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const controllerSubgraph = diagram.subgraphs.find(s => s.id === 'controller_instances');
      expect(controllerSubgraph).toBeDefined();
      expect(controllerSubgraph?.nodes).toContain('articleController');
      expect(controllerSubgraph?.nodes).toContain('authController');

      const articleNode = diagram.nodes.find(n => n.id === 'articleController');
      expect(articleNode).toBeDefined();
      expect(articleNode?.label).toContain('🎮');
      expect(articleNode?.label).toContain('scale: 3');
    });

    it('should include service instances', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const serviceSubgraph = diagram.subgraphs.find(s => s.id === 'service_instances');
      expect(serviceSubgraph).toBeDefined();
      expect(serviceSubgraph?.nodes).toContain('notificationService');

      const serviceNode = diagram.nodes.find(n => n.id === 'notificationService');
      expect(serviceNode).toBeDefined();
      expect(serviceNode?.label).toContain('⚙️');
      expect(serviceNode?.label).toContain('scale: 2');
    });

    it('should include view instances', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const viewSubgraph = diagram.subgraphs.find(s => s.id === 'view_instances');
      expect(viewSubgraph).toBeDefined();
      expect(viewSubgraph?.nodes).toContain('webApp');

      const viewNode = diagram.nodes.find(n => n.id === 'webApp');
      expect(viewNode).toBeDefined();
      expect(viewNode?.label).toContain('👁️');
      expect(viewNode?.label).toContain('scale: 5');
    });

    it('should show capability details when requested', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, { includeCapabilities: true }, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      // Should have advertises node
      const advertises = diagram.nodes.find(n => n.id === 'articleController_adv');
      expect(advertises).toBeDefined();
      expect(advertises?.label).toContain('Advertises');
      expect(advertises?.label).toContain('article.crud');

      // Should have uses node
      const uses = diagram.nodes.find(n => n.id === 'articleController_use');
      expect(uses).toBeDefined();
      expect(uses?.label).toContain('Uses');
      expect(uses?.label).toContain('storage.database');
    });

    it('should hide capability details when not requested', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, { includeCapabilities: false }, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const advertises = diagram.nodes.find(n => n.id === 'articleController_adv');
      expect(advertises).toBeUndefined();
    });

    it('should include communication edges', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const commEdges = diagram.edges.filter(e => e.label === 'communicates via');
      expect(commEdges.length).toBeGreaterThan(0);

      const articleComm = commEdges.find(e => e.from === 'articleController' && e.to === 'eventBus');
      expect(articleComm).toBeDefined();
    });

    it('should handle empty deployments gracefully', () => {
      const emptyAST = {
        components: mockAST.components,
        deployments: {}
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(emptyAST, {}, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      expect(diagram.nodes.length).toBe(1);
      expect(diagram.nodes[0].id).toBe('NoDeployments');
      expect(diagram.nodes[0].label).toContain('No Deployment');
    });
  });

  describe('Capability Flow Diagram', () => {
    it('should generate capability flow diagram', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'capability-flow');

      expect(diagram.type).toBe('graph');
      expect(diagram.direction).toBe('LR');
      expect(diagram.nodes.length).toBeGreaterThan(0);
    });

    it('should separate providers and consumers', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'capability-flow');

      const providerSubgraph = diagram.subgraphs.find(s => s.id === 'providers');
      const consumerSubgraph = diagram.subgraphs.find(s => s.id === 'consumers');

      expect(providerSubgraph).toBeDefined();
      expect(consumerSubgraph).toBeDefined();
    });

    it('should show capability flows between instances', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'capability-flow');

      // articleController advertises article.crud, webApp uses it
      const flowEdge = diagram.edges.find(e =>
        e.from === 'articleController' &&
        e.to === 'webApp' &&
        e.label === 'article.crud'
      );

      expect(flowEdge).toBeDefined();
    });

    it('should handle multiple capabilities', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'capability-flow');

      // authController advertises auth.login, webApp uses it
      const authFlow = diagram.edges.find(e =>
        e.from === 'authController' &&
        e.to === 'webApp' &&
        e.label === 'auth.login'
      );

      expect(authFlow).toBeDefined();
    });

    it('should not create self-referencing edges', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'capability-flow');

      const selfEdges = diagram.edges.filter(e => e.from === e.to);
      expect(selfEdges).toHaveLength(0);
    });
  });

  describe('Theme Support', () => {
    it('should use theme colors for instances', () => {
      const theme = styleManager.getTheme('dark-mode');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const controllerNode = diagram.nodes.find(n => n.type === 'controller');
      expect(controllerNode?.color).toBe(theme.colors.controller);

      const serviceNode = diagram.nodes.find(n => n.type === 'service');
      expect(serviceNode?.color).toBe(theme.colors.service);
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

  describe('Complex Scenarios', () => {
    it('should handle string advertises value', () => {
      const singleAdvertiseAST = {
        components: mockAST.components,
        deployments: {
          dev: {
            environment: 'development',
            instances: {
              controllers: {
                simpleController: {
                  component: 'Test',
                  advertises: 'single.capability',
                  uses: []
                }
              }
            }
          }
        }
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(singleAdvertiseAST, { includeCapabilities: true }, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const advNode = diagram.nodes.find(n => n.id === 'simpleController_adv');
      expect(advNode).toBeDefined();
      expect(advNode?.label).toContain('single.capability');
    });

    it('should handle instances with many capabilities', () => {
      const manyCapabilitiesAST = {
        components: mockAST.components,
        deployments: {
          staging: {
            environment: 'staging',
            instances: {
              services: {
                megaService: {
                  component: 'Test',
                  advertises: ['cap1', 'cap2', 'cap3', 'cap4', 'cap5'],
                  uses: ['dep1', 'dep2', 'dep3', 'dep4']
                }
              }
            }
          }
        }
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(manyCapabilitiesAST, { includeCapabilities: true }, theme);

      const diagram = plugin.generate(context, 'deployment-topology');

      const advNode = diagram.nodes.find(n => n.id === 'megaService_adv');
      expect(advNode).toBeDefined();
      expect(advNode?.label).toContain('+3 more'); // Shows top 2 + more indicator
    });
  });
});
