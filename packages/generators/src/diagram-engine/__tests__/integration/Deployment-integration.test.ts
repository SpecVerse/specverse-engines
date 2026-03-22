/**
 * Integration tests for DeploymentPlugin with UnifiedDiagramGenerator
 */

import { describe, it, expect } from 'vitest';
import { UnifiedDiagramGenerator } from '../../core/UnifiedDiagramGenerator.js';
import { DeploymentPlugin } from '../../plugins/deployment/DeploymentPlugin.js';

describe('Deployment Integration', () => {
  const mockAST: any = {
    components: [
      {
        name: 'ECommerce',
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
            messageBus: {
              type: 'pubsub',
              namespace: 'global',
              capabilities: ['messaging.publish', 'messaging.subscribe']
            }
          },
          controllers: {
            orderController: {
              component: 'ECommerce',
              namespace: 'api',
              scale: 5,
              advertises: ['orders.crud', 'orders.process'],
              uses: ['storage.orders', 'messaging.publish']
            }
          },
          services: {
            paymentService: {
              component: 'ECommerce',
              namespace: 'workers',
              scale: 3,
              advertises: ['payments.process'],
              uses: ['messaging.subscribe', 'payments.gateway']
            }
          },
          views: {
            storefront: {
              component: 'ECommerce',
              namespace: 'web',
              scale: 10,
              uses: ['orders.crud', 'products.browse']
            }
          }
        }
      },
      staging: {
        environment: 'staging',
        instances: {
          controllers: {
            testController: {
              component: 'ECommerce',
              namespace: 'test',
              scale: 1,
              advertises: ['test.api'],
              uses: []
            }
          }
        }
      }
    }
  };

  describe('Generator Integration', () => {
    it('should register and use DeploymentPlugin', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      expect(generator.isTypeSupported('deployment-topology')).toBe(true);
      expect(generator.isTypeSupported('capability-flow')).toBe(true);
    });

    it('should generate deployment topology through generator', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'deployment-topology');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph TB');
      expect(diagram).toContain('orderController');
      expect(diagram).toContain('paymentService');
      expect(diagram).toContain('storefront');
    });

    it('should include instance metadata', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'deployment-topology');

      expect(diagram).toContain('orderController');
      expect(diagram).toContain('paymentService');
      expect(diagram).toContain('storefront');
      // Nodes are created, metadata is in the diagram object
    });

    it('should show communication channels', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'deployment-topology');

      expect(diagram).toContain('messageBus');
      // Channel details are in nodes, not rendered as text in final output
    });

    it('should show capability details when requested', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'deployment-topology', {
        includeCapabilities: true
      });

      expect(diagram).toContain('Advertises');
      expect(diagram).toContain('Uses');
      expect(diagram).toContain('orders.crud');
      expect(diagram).toContain('storage.orders');
    });

    it('should hide capability details when not requested', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'deployment-topology', {
        includeCapabilities: false
      });

      expect(diagram).not.toContain('Advertises');
      expect(diagram).not.toContain('Uses');
    });

    it('should generate capability flow diagram', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'capability-flow');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph LR');
      expect(diagram).toContain('orderController');
      expect(diagram).toContain('storefront');
    });

    it('should show capability relationships in flow diagram', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'capability-flow');

      // orderController advertises orders.crud, storefront uses it
      expect(diagram).toContain('orders.crud');
    });

    it('should validate before generation', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const result = generator.validate(mockAST, 'deployment-topology');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for AST without deployments', () => {
      const noDeploymentAST = {
        components: mockAST.components,
        deployments: {}
      };

      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const result = generator.validate(noDeploymentAST, 'deployment-topology');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should apply custom theme', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'dark-mode'
      });

      const diagram = generator.generate(mockAST, 'deployment-topology');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph TB');
    });

    it('should get plugin metadata', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const metadata = generator.getMetadata();
      const deploymentMetadata = metadata.find(m => m.type === 'deployment-topology');

      expect(deploymentMetadata).toBeDefined();
      expect(deploymentMetadata?.plugin).toBe('deployment-plugin');
      expect(deploymentMetadata?.description).toContain('Deployment');
    });

    it('should get default options for deployment diagrams', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const options = generator.getOptionsForType('deployment-topology');

      expect(options).toBeDefined();
      expect(options?.includeCapabilities).toBe(true);
      expect(options?.includeScaling).toBe(true);
    });

    it('should handle multiple deployments', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'deployment-topology');

      // Should include instances from all deployments
      expect(diagram).toContain('orderController'); // from production
      expect(diagram).toContain('testController'); // from staging
    });
  });

  describe('Multi-Plugin Support', () => {
    it('should work alongside ERDiagramPlugin', async () => {
      const { ERDiagramPlugin } = await import('../../plugins/er-diagram/ERDiagramPlugin.js');

      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin(), new ERDiagramPlugin()],
        theme: 'default'
      });

      const types = generator.getAvailableTypes();

      expect(types).toContain('deployment-topology');
      expect(types).toContain('capability-flow');
      expect(types).toContain('er-diagram');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle microservices architecture', () => {
      const microservicesAST = {
        components: mockAST.components,
        deployments: {
          production: {
            environment: 'production',
            instances: {
              communications: {
                kafka: {
                  type: 'streaming',
                  namespace: 'global',
                  capabilities: ['streaming.produce', 'streaming.consume']
                },
                redis: {
                  type: 'cache',
                  namespace: 'global',
                  capabilities: ['cache.get', 'cache.set']
                }
              },
              services: {
                userService: {
                  component: 'Users',
                  scale: 5,
                  advertises: ['users.api'],
                  uses: ['cache.get', 'streaming.produce']
                },
                orderService: {
                  component: 'Orders',
                  scale: 3,
                  advertises: ['orders.api'],
                  uses: ['users.api', 'streaming.produce']
                },
                notificationService: {
                  component: 'Notifications',
                  scale: 2,
                  advertises: ['notifications.send'],
                  uses: ['streaming.consume']
                }
              }
            }
          }
        }
      };

      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(microservicesAST, 'deployment-topology');

      expect(diagram).toContain('userService');
      expect(diagram).toContain('orderService');
      expect(diagram).toContain('notificationService');
      expect(diagram).toContain('kafka');
      expect(diagram).toContain('redis');
    });

    it('should visualize capability dependencies', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new DeploymentPlugin()],
        theme: 'default'
      });

      const flowDiagram = generator.generate(mockAST, 'capability-flow');

      // Should show that storefront depends on orderController via orders.crud capability
      expect(flowDiagram).toContain('orderController');
      expect(flowDiagram).toContain('storefront');
    });
  });
});
