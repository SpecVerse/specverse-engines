/**
 * Unit tests for ManifestPlugin
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ManifestPlugin } from '../../plugins/manifest/ManifestPlugin.js';
import { DiagramContext } from '../../core/DiagramContext.js';
import { styleManager } from '../../core/StyleManager.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

describe('ManifestPlugin', () => {
  let plugin: ManifestPlugin;

  const mockASTWithManifests: SpecVerseAST = {
    components: [
      {
        name: 'BlogApp',
        version: '1.0.0',
        models: [
          {
            name: 'Article',
            attributes: [{ name: 'id', type: 'UUID', required: true }],
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
    deployments: [],
    manifests: {
      BlogAppNextJS: {
        specVersion: '3.2.0',
        name: 'BlogAppNextJS',
        version: '1.0.0',
        description: 'Next.js implementation of BlogApp',
        component: {
          componentSource: './components/BlogApp.specly',
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
            framework: 'Express',
            version: '4.18.0'
          },
          Database: {
            technology: 'PostgreSQL',
            version: '15.0'
          }
        },
        behaviorMappings: {
          'Article.publish': {
            implementation: 'Frontend.publishArticleAction',
            route: '/api/articles/publish'
          }
        },
        capabilityMappings: {
          'storage': {
            implementation: 'Database',
            implementationType: 'PostgreSQL'
          },
          'api': {
            implementation: 'Backend',
            implementationType: 'Express'
          }
        }
      }
    }
  } as any;

  beforeEach(() => {
    plugin = new ManifestPlugin();
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('manifest-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toContain('manifest');
    });

    it('should support manifest diagram types', () => {
      expect(plugin.supportedTypes).toContain('manifest-mapping');
      expect(plugin.supportedTypes).toContain('technology-stack');
      expect(plugin.supportedTypes).toContain('capability-bindings');
      expect(plugin.supportedTypes).toHaveLength(3);
    });

    it('should validate supported types', () => {
      const theme = styleManager.getTheme('default');
      const emptyContext = new DiagramContext({ components: [], deployments: [] }, {}, theme);

      expect(() => plugin.generate(emptyContext, 'manifest-mapping')).not.toThrow();
      expect(() => plugin.generate(emptyContext, 'technology-stack')).not.toThrow();
      expect(() => plugin.generate(emptyContext, 'capability-bindings')).not.toThrow();
    });

    it('should reject unsupported types', () => {
      expect(() => plugin.generate({} as any, 'unsupported-type' as any)).toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate AST with manifests', () => {
      const result = plugin.validate(mockASTWithManifests);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when no manifests found', () => {
      const astWithoutManifests: SpecVerseAST = {
        components: [],
        deployments: []
      };

      const result = plugin.validate(astWithoutManifests);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('No manifests'))).toBe(true);
    });

    it('should warn when no implementation types', () => {
      const astWithoutImplTypes: any = {
        components: [],
        deployments: [],
        manifests: {
          TestManifest: {
            name: 'TestManifest',
            version: '1.0.0'
          }
        }
      };

      const result = plugin.validate(astWithoutImplTypes);

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('implementation types'))).toBe(true);
    });

    it('should warn when no capability mappings', () => {
      const astWithoutCapabilities: any = {
        components: [],
        deployments: [],
        manifests: {
          TestManifest: {
            name: 'TestManifest',
            version: '1.0.0',
            implementationTypes: {
              Frontend: { technology: 'React' }
            }
          }
        }
      };

      const result = plugin.validate(astWithoutCapabilities);

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('capability mappings'))).toBe(true);
    });
  });

  describe('Manifest Mapping Diagram', () => {
    it('should generate basic manifest mapping', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'manifest-mapping');

      expect(diagram).toBeDefined();
      expect(diagram.type).toBe('graph');
      expect(diagram.direction).toBe('LR');
      expect(diagram.title).toBe('Manifest Mapping');
    });

    it('should include component layer', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'manifest-mapping');

      const componentsLayer = diagram.subgraphs.find(s => s.id === 'components_layer');
      expect(componentsLayer).toBeDefined();
      expect(componentsLayer?.label).toContain('COMPONENTS');
      expect(componentsLayer?.nodes).toContain('BlogApp');
    });

    it('should include manifest layer', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'manifest-mapping');

      const manifestsLayer = diagram.subgraphs.find(s => s.id === 'manifests_layer');
      expect(manifestsLayer).toBeDefined();
      expect(manifestsLayer?.label).toContain('MANIFESTS');
      expect(manifestsLayer?.nodes).toContain('manifest_BlogAppNextJS');
    });

    it('should include implementation layer', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'manifest-mapping');

      const implementationLayer = diagram.subgraphs.find(s => s.id === 'implementation_layer');
      expect(implementationLayer).toBeDefined();
      expect(implementationLayer?.label).toContain('IMPLEMENTATION');
    });

    it('should show component → manifest edges', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'manifest-mapping');

      const specifyEdge = diagram.edges.find(e =>
        e.from === 'BlogApp' &&
        e.to === 'manifest_BlogAppNextJS' &&
        e.label === 'specifies'
      );

      expect(specifyEdge).toBeDefined();
    });

    it('should show manifest → implementation edges', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'manifest-mapping');

      const implementEdges = diagram.edges.filter(e =>
        e.from === 'manifest_BlogAppNextJS' &&
        e.label === 'implements'
      );

      expect(implementEdges.length).toBeGreaterThan(0);
    });

    it('should include implementation type details', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'manifest-mapping');

      const frontendNode = diagram.nodes.find(n => n.id === 'impl_BlogAppNextJS_Frontend');
      expect(frontendNode).toBeDefined();
      expect(frontendNode?.label).toContain('NextJS');
      expect(frontendNode?.label).toContain('React');
    });
  });

  describe('Technology Stack Diagram', () => {
    it('should generate technology stack', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'technology-stack');

      expect(diagram).toBeDefined();
      expect(diagram.type).toBe('graph');
      expect(diagram.direction).toBe('TB');
      expect(diagram.title).toBe('Technology Stack');
    });

    it('should categorize technologies', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'technology-stack');

      const frontendLayer = diagram.subgraphs.find(s => s.id === 'frontend_layer');
      expect(frontendLayer).toBeDefined();
      expect(frontendLayer?.label).toContain('FRONTEND');

      const backendLayer = diagram.subgraphs.find(s => s.id === 'backend_layer');
      expect(backendLayer).toBeDefined();
      expect(backendLayer?.label).toContain('BACKEND');

      const databaseLayer = diagram.subgraphs.find(s => s.id === 'database_layer');
      expect(databaseLayer).toBeDefined();
      expect(databaseLayer?.label).toContain('DATABASE');
    });

    it('should include technology details', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'technology-stack');

      const nextjsNode = diagram.nodes.find(n => n.label?.includes('NextJS'));
      expect(nextjsNode).toBeDefined();
      expect(nextjsNode?.label).toContain('React');
      expect(nextjsNode?.label).toContain('14.0.0');
    });

    it('should use category-specific colors', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'technology-stack');

      const nodes = diagram.nodes;
      expect(nodes.every(n => n.color)).toBe(true);
    });

    it('should include category icons', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'technology-stack');

      const frontendLayer = diagram.subgraphs.find(s => s.id === 'frontend_layer');
      expect(frontendLayer?.label).toMatch(/🎨/);

      const backendLayer = diagram.subgraphs.find(s => s.id === 'backend_layer');
      expect(backendLayer?.label).toMatch(/⚙️/);

      const databaseLayer = diagram.subgraphs.find(s => s.id === 'database_layer');
      expect(databaseLayer?.label).toMatch(/🗄️/);
    });
  });

  describe('Capability Bindings Diagram', () => {
    it('should generate capability bindings', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'capability-bindings');

      expect(diagram).toBeDefined();
      expect(diagram.type).toBe('graph');
      expect(diagram.direction).toBe('LR');
      expect(diagram.title).toBe('Capability Bindings');
    });

    it('should include capability nodes', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'capability-bindings');

      const storageNode = diagram.nodes.find(n => n.id === 'cap_storage');
      expect(storageNode).toBeDefined();
      expect(storageNode?.type).toBe('capability');

      const apiNode = diagram.nodes.find(n => n.id === 'cap_api');
      expect(apiNode).toBeDefined();
      expect(apiNode?.type).toBe('capability');
    });

    it('should include implementation nodes', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'capability-bindings');

      const implNodes = diagram.nodes.filter(n => n.type === 'implementation');
      expect(implNodes.length).toBeGreaterThan(0);
    });

    it('should show capability → implementation edges', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'capability-bindings');

      const bindingEdges = diagram.edges.filter(e => e.label === 'binds to');
      expect(bindingEdges.length).toBeGreaterThan(0);
    });

    it('should count implementations per capability', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'capability-bindings');

      const storageNode = diagram.nodes.find(n => n.id === 'cap_storage');
      expect(storageNode?.label).toMatch(/\d+ impl/);
    });

    it('should include capabilities layer', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'capability-bindings');

      const capabilitiesLayer = diagram.subgraphs.find(s => s.id === 'capabilities_layer');
      expect(capabilitiesLayer).toBeDefined();
      expect(capabilitiesLayer?.label).toContain('CAPABILITIES');
    });
  });

  describe('Theme Support', () => {
    it('should apply default theme', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'manifest-mapping');

      expect(diagram.nodes.every(n => n.color)).toBe(true);
    });

    it('should apply dark mode theme', () => {
      const theme = styleManager.getTheme('dark-mode');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'technology-stack');

      expect(diagram.nodes.every(n => n.color)).toBe(true);
    });

    it('should apply presentation theme', () => {
      const theme = styleManager.getTheme('presentation');
      const context = new DiagramContext(mockASTWithManifests, {}, theme);

      const diagram = plugin.generate(context, 'capability-bindings');

      expect(diagram.nodes.every(n => n.color)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle manifest without component reference', () => {
      const astWithoutComponentRef: any = {
        components: [],
        deployments: [],
        manifests: {
          StandaloneManifest: {
            name: 'StandaloneManifest',
            version: '1.0.0',
            implementationTypes: {
              Frontend: { technology: 'React' }
            }
          }
        }
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(astWithoutComponentRef, {}, theme);

      expect(() => plugin.generate(context, 'manifest-mapping')).not.toThrow();
    });

    it('should handle manifest without implementation types', () => {
      const astWithoutImplTypes: any = {
        components: [],
        deployments: [],
        manifests: {
          MinimalManifest: {
            name: 'MinimalManifest',
            version: '1.0.0'
          }
        }
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(astWithoutImplTypes, {}, theme);

      const diagram = plugin.generate(context, 'technology-stack');
      expect(diagram.subgraphs).toHaveLength(0);
    });

    it('should handle manifest without capability mappings', () => {
      const astWithoutCapabilities: any = {
        components: [],
        deployments: [],
        manifests: {
          NoCapabilitiesManifest: {
            name: 'NoCapabilitiesManifest',
            version: '1.0.0'
          }
        }
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(astWithoutCapabilities, {}, theme);

      const diagram = plugin.generate(context, 'capability-bindings');
      expect(diagram.subgraphs).toHaveLength(0);
    });

    it('should handle empty AST', () => {
      const emptyAST: SpecVerseAST = {
        components: [],
        deployments: []
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(emptyAST, {}, theme);

      expect(() => plugin.generate(context, 'manifest-mapping')).not.toThrow();
    });
  });

  describe('Default Options', () => {
    it('should provide default options', () => {
      const options = plugin.getDefaultOptions();

      expect(options).toBeDefined();
      expect(options.includeImplementationTypes).toBe(true);
      expect(options.includeCapabilityMappings).toBe(true);
      expect(options.includeBehaviorMappings).toBe(true);
    });
  });
});
