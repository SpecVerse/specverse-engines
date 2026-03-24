import { describe, it, expect, beforeEach, beforeAll } from "vitest";
/**
 * Tests for V3.1 Rule Engine Core
 */

import { RuleEngine } from '../rule-engine.js';
import { 
  InferenceRule, 
  InferenceContext, 
  ModelDefinition, 
  ControllerSpec 
} from '../types.js';

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine<ModelDefinition, ControllerSpec>;
  let mockContext: InferenceContext;
  let mockModel: ModelDefinition;

  beforeEach(() => {
    ruleEngine = new RuleEngine<ModelDefinition, ControllerSpec>(true);
    
    mockModel = {
      name: 'Product',
      attributes: [
        { name: 'id', type: 'UUID', required: true },
        { name: 'name', type: 'String', required: true },
        { name: 'price', type: 'Money', required: true }
      ]
    };

    mockContext = {
      version: 'v3.1',
      models: [mockModel],
      currentModel: mockModel,
      metadata: {}
    };
  });

  describe('loadRules', () => {
    it('should load valid rules successfully', () => {
      const rules: InferenceRule<ModelDefinition, ControllerSpec>[] = [
        {
          name: 'test_rule',
          pattern: 'TestPattern',
          priority: 100,
          template: {
            type: 'json',
            content: '{"name": "{{modelName}}Controller"}'
          }
        }
      ];

      const validation = ruleEngine.loadRules('controllers', rules);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject rules with missing required fields', () => {
      const invalidRules: any[] = [
        {
          // Missing name, pattern, template
          priority: 100
        }
      ];

      const validation = ruleEngine.loadRules('controllers', invalidRules);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should sort rules by priority', () => {
      const rules: InferenceRule<ModelDefinition, ControllerSpec>[] = [
        {
          name: 'low_priority',
          pattern: 'Test',
          priority: 50,
          template: { type: 'json', content: '{}' }
        },
        {
          name: 'high_priority',
          pattern: 'Test',
          priority: 150,
          template: { type: 'json', content: '{}' }
        },
        {
          name: 'medium_priority',
          pattern: 'Test',
          priority: 100,
          template: { type: 'json', content: '{}' }
        }
      ];

      ruleEngine.loadRules('controllers', rules);
      const loadedRules = ruleEngine.getAllRules().get('controllers') || [];
      
      expect(loadedRules[0].name).toBe('high_priority');
      expect(loadedRules[1].name).toBe('medium_priority');
      expect(loadedRules[2].name).toBe('low_priority');
    });
  });

  describe('findMatches', () => {
    beforeEach(() => {
      const rules: InferenceRule<ModelDefinition, ControllerSpec>[] = [
        {
          name: 'always_match',
          pattern: 'AlwaysMatch',
          priority: 100,
          template: { type: 'json', content: '{"matched": true}' }
        },
        {
          name: 'conditional_match',
          pattern: 'ConditionalMatch',
          condition: 'model.name === "Product"',
          priority: 90,
          template: { type: 'json', content: '{"conditional": true}' }
        },
        {
          name: 'never_match',
          pattern: 'NeverMatch',
          condition: 'model.name === "NonExistent"',
          priority: 80,
          template: { type: 'json', content: '{"never": true}' }
        }
      ];

      ruleEngine.loadRules('controllers', rules);
    });

    it('should find all matching rules', () => {
      const matches = ruleEngine.findMatches('controllers', mockModel, mockContext);
      
      expect(matches).toHaveLength(2);
      expect(matches[0].name).toBe('always_match');
      expect(matches[1].name).toBe('conditional_match');
    });

    it('should return empty array for non-existent category', () => {
      const matches = ruleEngine.findMatches('nonexistent', mockModel, mockContext);
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('apply', () => {
    it('should apply JSON template successfully', () => {
      const rule: InferenceRule<ModelDefinition, ControllerSpec> = {
        name: 'json_template',
        pattern: 'JsonTemplate',
        priority: 100,
        template: {
          type: 'json',
          content: '{"name": "{{modelName}}Controller", "model": "{{modelName}}"}'
        }
      };

      const result = ruleEngine.apply(rule, mockModel, mockContext);
      
      expect(result).toEqual({
        name: 'ProductController',
        model: 'Product'
      });
    });

    it('should handle template application errors gracefully', () => {
      const rule: InferenceRule<ModelDefinition, ControllerSpec> = {
        name: 'invalid_template',
        pattern: 'InvalidTemplate',
        priority: 100,
        template: {
          type: 'json',
          content: 'invalid json {'
        }
      };

      expect(() => {
        ruleEngine.apply(rule, mockModel, mockContext);
      }).toThrow();
    });
  });

  describe('condition evaluation', () => {
    it('should evaluate simple conditions correctly', () => {
      const rules: InferenceRule<ModelDefinition, ControllerSpec>[] = [
        {
          name: 'name_condition',
          pattern: 'NameCondition',
          condition: 'model.name === "Product"',
          priority: 100,
          template: { type: 'json', content: '{"match": true}' }
        }
      ];

      ruleEngine.loadRules('controllers', rules);
      const matches = ruleEngine.findMatches('controllers', mockModel, mockContext);
      
      expect(matches).toHaveLength(1);
    });

    it('should handle helper function conditions', () => {
      const modelWithRelationships: ModelDefinition = {
        ...mockModel,
        relationships: [
          { name: 'category', type: 'belongsTo', targetModel: 'Category' }
        ]
      };

      const contextWithRelationships: InferenceContext = {
        ...mockContext,
        currentModel: modelWithRelationships,
        relationships: {
          parentRelationships: [
            { name: 'category', type: 'belongsTo', targetModel: 'Category' }
          ],
          childRelationships: [],
          siblingRelationships: [],
          manyToManyRelationships: [],
          cascadeDeleteTargets: []
        }
      };

      const rules: InferenceRule<ModelDefinition, ControllerSpec>[] = [
        {
          name: 'has_parent',
          pattern: 'HasParent',
          condition: 'hasParentRelationship()',
          priority: 100,
          template: { type: 'json', content: '{"hasParent": true}' }
        }
      ];

      ruleEngine.loadRules('controllers', rules);
      const matches = ruleEngine.findMatches('controllers', modelWithRelationships, contextWithRelationships);
      
      expect(matches).toHaveLength(1);
    });

    it('should cache condition evaluation results', () => {
      const rule: InferenceRule<ModelDefinition, ControllerSpec> = {
        name: 'cached_condition',
        pattern: 'CachedCondition',
        condition: 'model.name === "Product"',
        priority: 100,
        template: { type: 'json', content: '{}' }
      };

      ruleEngine.loadRules('controllers', [rule]);

      // First evaluation
      const matches1 = ruleEngine.findMatches('controllers', mockModel, mockContext);
      expect(matches1).toHaveLength(1);

      // Second evaluation (should use cache)
      const matches2 = ruleEngine.findMatches('controllers', mockModel, mockContext);
      expect(matches2).toHaveLength(1);
    });
  });

  describe('clearRules', () => {
    it('should clear all loaded rules', () => {
      const rules: InferenceRule<ModelDefinition, ControllerSpec>[] = [
        {
          name: 'test_rule',
          pattern: 'TestPattern',
          priority: 100,
          template: { type: 'json', content: '{}' }
        }
      ];

      ruleEngine.loadRules('controllers', rules);
      expect(ruleEngine.getAllRules().size).toBe(1);

      ruleEngine.clearRules();
      expect(ruleEngine.getAllRules().size).toBe(0);
    });
  });
});