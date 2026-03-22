/**
 * Integration tests for ERDiagramPlugin with UnifiedDiagramGenerator
 */

import { describe, it, expect } from 'vitest';
import { UnifiedDiagramGenerator } from '../../core/UnifiedDiagramGenerator.js';
import { ERDiagramPlugin } from '../../plugins/er-diagram/ERDiagramPlugin.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

describe('ERDiagram Integration', () => {
  const mockAST: SpecVerseAST = {
    components: [
      {
        name: 'BlogSystem',
        version: '1.0.0',
        models: [
          {
            name: 'Author',
            attributes: [
              { name: 'id', type: 'UUID', required: true, unique: true },
              { name: 'name', type: 'String', required: true },
              { name: 'email', type: 'Email', required: true, unique: true }
            ],
            relationships: [
              { type: 'hasMany', target: 'Article', foreignKey: 'authorId' }
            ],
            lifecycles: [],
            behaviors: {}
          },
          {
            name: 'Article',
            attributes: [
              { name: 'id', type: 'UUID', required: true, unique: true },
              { name: 'title', type: 'String', required: true },
              { name: 'content', type: 'Text', required: true },
              { name: 'publishedAt', type: 'DateTime', required: false },
              { name: 'authorId', type: 'UUID', required: true }
            ],
            relationships: [
              { type: 'belongsTo', target: 'Author', foreignKey: 'authorId' },
              { type: 'manyToMany', target: 'Category', through: 'ArticleCategory' }
            ],
            lifecycles: [],
            behaviors: {}
          },
          {
            name: 'Category',
            attributes: [
              { name: 'id', type: 'UUID', required: true, unique: true },
              { name: 'name', type: 'String', required: true, unique: true },
              { name: 'slug', type: 'String', required: true, unique: true }
            ],
            relationships: [
              { type: 'manyToMany', target: 'Article', through: 'ArticleCategory' }
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

  describe('Generator Integration', () => {
    it('should register and use ERDiagramPlugin', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      expect(generator.isTypeSupported('er-diagram')).toBe(true);
      expect(generator.isTypeSupported('profile-attachment')).toBe(true);
    });

    it('should generate ER diagram through generator', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'er-diagram');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('erDiagram');
      expect(diagram).toContain('Author');
      expect(diagram).toContain('Article');
      expect(diagram).toContain('Category');
    });

    it('should include entity attributes', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'er-diagram', {
        includeAttributes: true
      });

      expect(diagram).toContain('Author {');
      expect(diagram).toContain('uuid id');
      expect(diagram).toContain('string name');
      expect(diagram).toContain('string email');
    });

    it('should include relationships with correct cardinality', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(mockAST, 'er-diagram', {
        includeRelationships: true
      });

      // hasMany: ||--o{ (canonical side, belongsTo is deduplicated)
      expect(diagram).toContain('Author ||--o{ Article');

      // belongsTo is NOT shown because it's the inverse of hasMany (deduplicated)
      // Previously this would show both: 'Author ||--o{ Article' AND 'Article }o--|| Author'
      // Now only the canonical side (hasMany) is shown
      expect(diagram).not.toContain('Article }o--|| Author');

      // manyToMany: }o--o{ (symmetric, only shown once)
      expect(diagram).toContain('Article }o--o{ Category');
      // The inverse manyToMany is deduplicated
      expect(diagram).not.toContain('Category }o--o{ Article');
    });

    it('should validate before generation', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      const result = generator.validate(mockAST, 'er-diagram');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle profile attachment diagrams', () => {
      const profileAST: SpecVerseAST = {
        components: [
          {
            name: 'UserProfiles',
            version: '1.0.0',
            models: [
              {
                name: 'User',
                attributes: [
                  { name: 'id', type: 'UUID', required: true },
                  { name: 'email', type: 'Email', required: true }
                ],
                relationships: [],
                lifecycles: [],
                behaviors: {}
              },
              {
                name: 'AdminProfile',
                attributes: [
                  { name: 'accessLevel', type: 'String', required: true }
                ],
                relationships: [
                  { type: 'attachesTo', target: 'User' }
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

      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      const diagram = generator.generate(profileAST, 'profile-attachment');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('graph LR');
      expect(diagram).toContain('User');
      expect(diagram).toContain('AdminProfile');
      expect(diagram).toContain('attaches to');
    });

    it('should apply custom theme', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'dark-mode'
      });

      const diagram = generator.generate(mockAST, 'er-diagram');

      expect(diagram).toBeDefined();
      expect(diagram).toContain('erDiagram');
    });

    it('should get plugin metadata', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      const metadata = generator.getMetadata();
      const erMetadata = metadata.find(m => m.type === 'er-diagram');

      expect(erMetadata).toBeDefined();
      expect(erMetadata?.plugin).toBe('er-diagram-plugin');
      expect(erMetadata?.description).toContain('Entity-Relationship');
    });

    it('should get default options for ER diagrams', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      const options = generator.getOptionsForType('er-diagram');

      expect(options).toBeDefined();
      expect(options?.includeAttributes).toBe(true);
      expect(options?.includeRelationships).toBe(true);
    });
  });

  describe('Multi-Plugin Support', () => {
    it('should work alongside other plugins', () => {
      const generator = new UnifiedDiagramGenerator({
        plugins: [new ERDiagramPlugin()],
        theme: 'default'
      });

      const types = generator.getAvailableTypes();

      expect(types).toContain('er-diagram');
      expect(types).toContain('profile-attachment');
    });
  });
});
