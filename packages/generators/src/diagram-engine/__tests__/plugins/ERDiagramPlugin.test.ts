/**
 * Tests for ERDiagramPlugin
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ERDiagramPlugin } from '../../plugins/er-diagram/ERDiagramPlugin.js';
import { DiagramContext } from '../../core/DiagramContext.js';
import { styleManager } from '../../core/StyleManager.js';
import { MermaidRenderer } from '../../renderers/MermaidRenderer.js';
import { SpecVerseAST, AttributeSpec, RelationshipSpec } from '../../../parser/convention-processor.js';

// Helper to create AttributeSpec for tests
const attr = (name: string, type: string, required: boolean, unique: boolean = false): AttributeSpec => ({
  name,
  type,
  required,
  unique
});

// Helper to create RelationshipSpec for tests
const rel = (name: string, type: RelationshipSpec['type'], target: string, extra?: Partial<RelationshipSpec>): RelationshipSpec => ({
  name,
  type,
  target,
  ...extra
});

describe('ERDiagramPlugin', () => {
  let plugin: ERDiagramPlugin;
  let mockAST: SpecVerseAST;
  let renderer: MermaidRenderer;

  beforeEach(() => {
    plugin = new ERDiagramPlugin();
    renderer = new MermaidRenderer();

    // Create mock AST with models and relationships
    mockAST = {
      components: [
        {
          name: 'TestComponent',
          namespace: 'TestComponent',
          version: '1.0.0',
          imports: [],
          exports: {},
          primitives: [],
          models: [
            {
              name: 'User',
              attributes: [
                attr('id', 'UUID', true, true),
                attr('email', 'Email', true, true),
                attr('name', 'String', true, false)
              ],
              relationships: [
                rel('posts', 'hasMany', 'Post'),
                rel('profile', 'hasOne', 'Profile')
              ],
              lifecycles: [],
              behaviors: {}
            },
            {
              name: 'Post',
              attributes: [
                attr('id', 'UUID', true, true),
                attr('title', 'String', true, false),
                attr('content', 'Text', true, false),
                attr('userId', 'UUID', true, false)
              ],
              relationships: [
                rel('user', 'belongsTo', 'User'),
                rel('tags', 'manyToMany', 'Tag', { through: 'PostTag' })
              ],
              lifecycles: [],
              behaviors: {}
            },
            {
              name: 'Profile',
              attributes: [
                attr('id', 'UUID', true, true),
                attr('bio', 'Text', false, false),
                attr('userId', 'UUID', true, false)
              ],
              relationships: [
                rel('user', 'belongsTo', 'User')
              ],
              lifecycles: [],
              behaviors: {}
            },
            {
              name: 'Tag',
              attributes: [
                attr('id', 'UUID', true, true),
                attr('name', 'String', true, true)
              ],
              relationships: [
                rel('posts', 'manyToMany', 'Post', { through: 'PostTag' })
              ],
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
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('er-diagram-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toContain('Entity-Relationship');
    });

    it('should support correct diagram types', () => {
      expect(plugin.supportedTypes).toContain('er-diagram');
      expect(plugin.supportedTypes).toContain('profile-attachment');
    });

    it('should provide default options', () => {
      const options = plugin.getDefaultOptions();
      expect(options.includeAttributes).toBe(true);
      expect(options.includeRelationships).toBe(true);
      expect(options.title).toBe('Entity-Relationship Diagram');
    });
  });

  describe('Validation', () => {
    it('should validate AST with models', () => {
      const result = plugin.validate(mockAST);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with no models', () => {
      const emptyAST: SpecVerseAST = {
        components: [
          {
            name: 'Empty',
            namespace: 'Empty',
            version: '1.0.0',
            imports: [],
            exports: {},
            primitives: [],
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
      expect(result.errors[0]).toContain('No models found');
    });

    it('should warn about circular relationships', () => {
      const circularAST: SpecVerseAST = {
        components: [
          {
            name: 'Circular',
            namespace: 'Circular',
            version: '1.0.0',
            imports: [],
            exports: {},
            primitives: [],
            models: [
              {
                name: 'A',
                attributes: [],
                relationships: [rel('bs', 'hasMany', 'B')],
                lifecycles: [],
                behaviors: {}
              },
              {
                name: 'B',
                attributes: [],
                relationships: [rel('as', 'hasMany', 'A')],
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

      const result = plugin.validate(circularAST);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('ER Diagram Generation', () => {
    it('should generate basic ER diagram', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, { includeAttributes: true }, theme);

      const diagram = plugin.generate(context, 'er-diagram');

      expect(diagram.type).toBe('erDiagram');
      expect(diagram.nodes.length).toBeGreaterThan(0);
      expect(diagram.relations).toBeDefined();
    });

    it('should include attributes when requested', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, { includeAttributes: true }, theme);

      const diagram = plugin.generate(context, 'er-diagram');
      const mermaid = renderer.renderERDiagram(diagram, context);

      expect(mermaid).toContain('User {');
      expect(mermaid).toContain('uuid id');
      expect(mermaid).toContain('string email');
    });

    it('should include relationships when requested', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, { includeRelationships: true }, theme);

      const diagram = plugin.generate(context, 'er-diagram');

      expect(diagram.relations?.length).toBeGreaterThan(0);
    });

    it('should handle hasMany relationships', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'er-diagram');
      const mermaid = renderer.renderERDiagram(diagram, context);

      expect(mermaid).toContain('User ||--o{ Post');
    });

    it('should deduplicate belongsTo relationships (inverse of hasMany)', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'er-diagram');
      const mermaid = renderer.renderERDiagram(diagram, context);

      // The belongsTo relationship is the inverse of hasMany and should be deduplicated
      // Only the canonical side (hasMany: User ||--o{ Post) is shown
      expect(mermaid).not.toContain('Post }o--|| User');

      // Verify the canonical side IS present
      expect(mermaid).toContain('User ||--o{ Post');
    });

    it('should handle manyToMany relationships', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'er-diagram');
      const mermaid = renderer.renderERDiagram(diagram, context);

      // manyToMany relationships are symmetric and shown once
      // The relationship appears alphabetically first: Post before Tag
      expect(mermaid).toContain('Post }o--o{ Tag');

      // The inverse is deduplicated
      expect(mermaid).not.toContain('Tag }o--o{ Post');
    });
  });

  describe('Profile Attachment Diagram', () => {
    it('should generate profile attachment diagram', () => {
      const profileAST: SpecVerseAST = {
        components: [
          {
            name: 'Profiles',
            namespace: 'Profiles',
            version: '1.0.0',
            imports: [],
            exports: {},
            primitives: [],
            models: [
              {
                name: 'User',
                attributes: [attr('email', 'Email', true, false)],
                relationships: [],
                lifecycles: [],
                behaviors: {}
              },
              {
                name: 'AdminProfile',
                attributes: [attr('permissions', 'JSON', true, false)],
                relationships: [{ name: 'user', type: 'attachesTo' as any, target: 'User' }],
                lifecycles: [],
                behaviors: {}
              },
              {
                name: 'CustomerProfile',
                attributes: [attr('preferences', 'JSON', true, false)],
                relationships: [{ name: 'user', type: 'attachesTo' as any, target: 'User' }],
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
      const context = new DiagramContext(profileAST, {}, theme);

      const diagram = plugin.generate(context, 'profile-attachment');

      expect(diagram.type).toBe('graph');
      expect(diagram.direction).toBe('LR');
      expect(diagram.subgraphs.length).toBe(2);
      expect(diagram.edges.length).toBe(2);
    });

    it('should show core and profile models in separate subgraphs', () => {
      const profileAST: SpecVerseAST = {
        components: [
          {
            name: 'Profiles',
            namespace: 'Profiles',
            version: '1.0.0',
            imports: [],
            exports: {},
            primitives: [],
            models: [
              {
                name: 'Product',
                attributes: [],
                relationships: [],
                lifecycles: [],
                behaviors: {}
              },
              {
                name: 'DigitalProductProfile',
                attributes: [],
                relationships: [{ name: 'product', type: 'attachesTo' as any, target: 'Product' }],
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
      const context = new DiagramContext(profileAST, {}, theme);

      const diagram = plugin.generate(context, 'profile-attachment');

      const coreSubgraph = diagram.subgraphs.find(s => s.id === 'core_models');
      const profileSubgraph = diagram.subgraphs.find(s => s.id === 'profiles');

      expect(coreSubgraph).toBeDefined();
      expect(profileSubgraph).toBeDefined();
      expect(coreSubgraph?.nodes).toContain('Product');
      expect(profileSubgraph?.nodes).toContain('DigitalProductProfile');
    });

    it('should use hexagon shape for profiles', () => {
      const profileAST: SpecVerseAST = {
        components: [
          {
            name: 'Profiles',
            namespace: 'Profiles',
            version: '1.0.0',
            imports: [],
            exports: {},
            primitives: [],
            models: [
              {
                name: 'Account',
                attributes: [],
                relationships: [],
                lifecycles: [],
                behaviors: {}
              },
              {
                name: 'PremiumProfile',
                attributes: [],
                relationships: [{ name: 'account', type: 'attachesTo' as any, target: 'Account' }],
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
      const context = new DiagramContext(profileAST, {}, theme);

      const diagram = plugin.generate(context, 'profile-attachment');

      const profileNode = diagram.nodes.find(n => n.id === 'PremiumProfile');
      expect(profileNode?.shape).toBe('hexagon');
      expect(profileNode?.type).toBe('profile');
    });
  });

  describe('Theme Support', () => {
    it('should use theme colors', () => {
      const theme = styleManager.getTheme('dark-mode');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'er-diagram');

      const modelNode = diagram.nodes.find(n => n.type === 'model');
      expect(modelNode?.color).toBe(theme.colors.model);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported diagram type', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      expect(() => {
        plugin.generate(context, 'event-flow-layered' as any);
      }).toThrow();
    });
  });
});
