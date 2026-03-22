/**
 * Integration tests for ManifestPlugin with UnifiedDiagramGenerator
 */

import { describe, it, expect } from 'vitest';
import { UnifiedDiagramGenerator } from '../../core/UnifiedDiagramGenerator.js';
import { ManifestPlugin } from '../../plugins/manifest/ManifestPlugin.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

describe('Manifest Integration', () => {
  const mockASTWithManifests: SpecVerseAST = {
    components: [
      {
        name: 'ECommerceApp',
        version: '1.0.0',
        models: [
          {
            name: 'Product',
            attributes: [{ name: 'id', type: 'UUID', required: true }],
            relationships: [],
            lifecycles: [],
            behaviors: {
              addToCart: { publishes: ['ProductAddedToCart'] }
            }
          }
        ],
        controllers: [],
        services: [],
        views: [],
        events: []
      }
    ],
    deployments: [],
    manifests: {
      ECommerceNextJS: {
        specVersion: '3.2.0',
        name: 'ECommerceNextJS',
        version: '1.0.0',
        description: 'Next.js implementation',
        component: {
          componentSource: './components/ECommerceApp.specly',
          componentVersion: '^3.1.0'
        },
        implementationTypes: {
          Frontend: {
            technology: 'NextJS',
            framework: 'React',
            version: '14.0.0'
          },
          Backend: {
            technology: 'NodeJS',
            framework: 'NestJS',
            version: '10.0.0'
          },
          Database: {
            technology: 'PostgreSQL',
            version: '15.0'
          },
          Cache: {
            technology: 'Redis',
            version: '7.0'
          }
        },
        behaviorMappings: {
          'Product.addToCart': {
            implementation: 'Frontend.addToCartAction',
            route: '/api/cart/add'
          }
        },
        capabilityMappings: {
          'storage': {
            implementation: 'Database',
            implementationType: 'PostgreSQL'
          },
          'caching': {
            implementation: 'Cache',
            implementationType: 'Redis'
          },
          'api': {
            implementation: 'Backend',
            implementationType: 'NestJS'
          }
        }
      }
    }
  } as any;

  describe('Generator Integration', () => {
    it('should register and use ManifestPlugin', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      expect(generator.isTypeSupported('manifest-mapping')).toBe(true);
      expect(generator.isTypeSupported('technology-stack')).toBe(true);
      expect(generator.isTypeSupported('capability-bindings')).toBe(true);
    });

    it('should generate manifest mapping through generator', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'manifest-mapping');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph LR');
      expect(diagram).toContain('ECommerceApp');
      expect(diagram).toContain('ECommerceNextJS');
    });

    it('should generate technology stack through generator', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'technology-stack');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph TB');
      expect(diagram).toContain('NextJS');
      expect(diagram).toContain('PostgreSQL');
    });

    it('should generate capability bindings through generator', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'capability-bindings');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph LR');
      expect(diagram).toContain('storage');
      expect(diagram).toContain('caching');
    });

    it('should validate before generation', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const result = generator.validate(mockASTWithManifests, 'manifest-mapping');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply custom theme', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'presentation'
      });

      const diagram = generator.generate(mockASTWithManifests, 'technology-stack');

      expect(diagram).toBeDefined();
    });

    it('should get plugin metadata', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const metadata = generator.getMetadata();
      const manifestMetadata = metadata.find(m => m.type === 'manifest-mapping');

      expect(manifestMetadata).toBeDefined();
      expect(manifestMetadata?.plugin).toBe('manifest-plugin');
      expect(manifestMetadata?.description).toContain('manifest');
    });

    it('should get default options', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const options = generator.getOptionsForType('manifest-mapping');

      expect(options).toBeDefined();
      expect(options?.includeImplementationTypes).toBe(true);
      expect(options?.includeCapabilityMappings).toBe(true);
    });
  });

  describe('Multi-Plugin Support', () => {
    it('should work alongside other plugins', async () => {
      const { EventFlowPlugin } = await import('../../plugins/event-flow/EventFlowPlugin.js');
      const { ERDiagramPlugin } = await import('../../plugins/er-diagram/ERDiagramPlugin.js');

      const generator = new UnifiedDiagramGenerator({
        plugins: [
          new ManifestPlugin(),
          new EventFlowPlugin(),
          new ERDiagramPlugin()
        ],
        theme: 'default'
      });

      const types = generator.getAvailableTypes();

      expect(types).toContain('manifest-mapping');
      expect(types).toContain('technology-stack');
      expect(types).toContain('capability-bindings');
      expect(types).toContain('event-flow-layered');
      expect(types).toContain('er-diagram');
    });
  });

  describe('Manifest Mapping Features', () => {
    it('should show 3-layer architecture', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'manifest-mapping');

      expect(diagram).toContain('COMPONENTS');
      expect(diagram).toContain('MANIFESTS');
      expect(diagram).toContain('IMPLEMENTATION');
    });

    it('should show component → manifest relationship', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'manifest-mapping');

      expect(diagram).toContain('specifies');
    });

    it('should show manifest → implementation relationship', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'manifest-mapping');

      expect(diagram).toContain('implements');
    });

    it('should include implementation details', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'manifest-mapping');

      expect(diagram).toContain('NextJS');
      expect(diagram).toContain('React');
    });
  });

  describe('Technology Stack Features', () => {
    it('should categorize frontend technologies', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'technology-stack');

      expect(diagram).toContain('FRONTEND');
      expect(diagram).toContain('NextJS');
    });

    it('should categorize backend technologies', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'technology-stack');

      expect(diagram).toContain('BACKEND');
      expect(diagram).toContain('NestJS');
    });

    it('should categorize database technologies', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'technology-stack');

      expect(diagram).toContain('DATABASE');
      expect(diagram).toContain('PostgreSQL');
    });

    it('should categorize infrastructure technologies', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'technology-stack');

      expect(diagram).toContain('Redis');
    });

    it('should include version information', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'technology-stack');

      expect(diagram).toContain('14.0.0');
      expect(diagram).toContain('15.0');
    });
  });

  describe('Capability Bindings Features', () => {
    it('should show storage capability', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'capability-bindings');

      expect(diagram).toContain('storage');
    });

    it('should show caching capability', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'capability-bindings');

      expect(diagram).toContain('caching');
    });

    it('should show api capability', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'capability-bindings');

      expect(diagram).toContain('api');
    });

    it('should show binding relationships', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'capability-bindings');

      expect(diagram).toContain('binds to');
    });

    it('should count implementations per capability', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockASTWithManifests, 'capability-bindings');

      expect(diagram).toContain('impl');
    });
  });

  describe('Edge Cases', () => {
    it('should handle AST without manifests', () => {
      const astWithoutManifests: SpecVerseAST = {
        components: [
          {
            name: 'SimpleApp',
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

      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      expect(() => generator.generate(astWithoutManifests, 'manifest-mapping')).not.toThrow();
    });

    it('should handle manifest without implementation types', () => {
      const astMinimal: any = {
        components: [],
        deployments: [],
        manifests: {
          MinimalManifest: {
            name: 'MinimalManifest',
            version: '1.0.0'
          }
        }
      };

      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      expect(() => generator.generate(astMinimal, 'technology-stack')).not.toThrow();
    });

    it('should handle manifest without capability mappings', () => {
      const astMinimal: any = {
        components: [],
        deployments: [],
        manifests: {
          MinimalManifest: {
            name: 'MinimalManifest',
            version: '1.0.0'
          }
        }
      };

      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      expect(() => generator.generate(astMinimal, 'capability-bindings')).not.toThrow();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should visualize full-stack application', () => {
      const fullStackAST: any = {
        components: [
          {
            name: 'FullStackApp',
            version: '1.0.0',
            models: [],
            controllers: [],
            services: [],
            views: [],
            events: []
          }
        ],
        deployments: [],
        manifests: {
          FullStackManifest: {
            name: 'FullStackManifest',
            version: '1.0.0',
            component: {
              componentSource: './components/FullStackApp.specly',
              componentVersion: '^3.1.0'
            },
            implementationTypes: {
              Frontend: { technology: 'React', version: '18.0.0' },
              Backend: { technology: 'Python', framework: 'Django', version: '4.2.0' },
              Database: { technology: 'PostgreSQL', version: '15.0' },
              Cache: { technology: 'Redis', version: '7.0' },
              MessageQueue: { technology: 'RabbitMQ', version: '3.12.0' }
            },
            capabilityMappings: {
              'ui': { implementation: 'Frontend' },
              'api': { implementation: 'Backend' },
              'storage': { implementation: 'Database' },
              'caching': { implementation: 'Cache' },
              'messaging': { implementation: 'MessageQueue' }
            }
          }
        }
      };

      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(fullStackAST, 'manifest-mapping');

      expect(diagram).toContain('FullStackApp');
      expect(diagram).toContain('FullStackManifest');
      expect(diagram).toContain('React');
      expect(diagram).toContain('Django');
    });

    it('should visualize microservices architecture', () => {
      const microservicesAST: any = {
        components: [],
        deployments: [],
        manifests: {
          MicroservicesManifest: {
            name: 'MicroservicesManifest',
            version: '1.0.0',
            implementationTypes: {
              OrderService: { technology: 'NodeJS', framework: 'Express' },
              PaymentService: { technology: 'NodeJS', framework: 'Fastify' },
              UserService: { technology: 'Python', framework: 'Flask' },
              APIGateway: { technology: 'Kong' }
            },
            capabilityMappings: {
              'orders': { implementation: 'OrderService' },
              'payments': { implementation: 'PaymentService' },
              'users': { implementation: 'UserService' },
              'gateway': { implementation: 'APIGateway' }
            }
          }
        }
      };

      const generator = new UnifiedDiagramGenerator({
        plugins: [new ManifestPlugin()],
        theme: 'default'
      });

      const stackDiagram = generator.generate(microservicesAST, 'technology-stack');

      expect(stackDiagram).toContain('Express');
      expect(stackDiagram).toContain('Fastify');
      expect(stackDiagram).toContain('Flask');
    });
  });
});
