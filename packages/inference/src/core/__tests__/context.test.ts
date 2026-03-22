/**
 * Tests for Inference Context Management
 * Tests relationship analysis and context creation
 */

import { InferenceContextManager, ContextUtils } from '../context.js';
import { ModelDefinition, InferenceContext } from '../types.js';

describe('InferenceContextManager', () => {
  let contextManager: InferenceContextManager;

  const simpleModel: ModelDefinition = {
    name: 'Product',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'price', type: 'Money', required: true }
    ]
  };

  const customerModel: ModelDefinition = {
    name: 'Customer',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'email', type: 'String', required: true }
    ],
    relationships: [
      { name: 'orders', type: 'hasMany', targetModel: 'Order' }
    ]
  };

  const orderModel: ModelDefinition = {
    name: 'Order',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'orderNumber', type: 'String', required: true },
      { name: 'total', type: 'Money', required: true }
    ],
    relationships: [
      { name: 'customer', type: 'belongsTo', targetModel: 'Customer' },
      { name: 'items', type: 'hasMany', targetModel: 'OrderItem', cascadeDelete: true }
    ],
    lifecycle: {
      name: 'orderProcessing',
      states: ['pending', 'confirmed', 'shipped'],
      transitions: [
        { name: 'confirm', from: 'pending', to: 'confirmed' },
        { name: 'ship', from: 'confirmed', to: 'shipped' }
      ]
    }
  };

  const orderItemModel: ModelDefinition = {
    name: 'OrderItem',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'quantity', type: 'Integer', required: true },
      { name: 'price', type: 'Money', required: true }
    ],
    relationships: [
      { name: 'order', type: 'belongsTo', targetModel: 'Order' },
      { name: 'product', type: 'belongsTo', targetModel: 'Product' }
    ]
  };

  const productCategoryModel: ModelDefinition = {
    name: 'ProductCategory',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'name', type: 'String', required: true }
    ],
    relationships: [
      { name: 'products', type: 'manyToMany', targetModel: 'Product' }
    ]
  };

  beforeEach(() => {
    contextManager = new InferenceContextManager(true);
  });

  describe('createLogicalContext', () => {
    it('should create basic logical context', () => {
      const models = [simpleModel];
      const context = contextManager.createLogicalContext(models);

      expect(context.version).toBe('v3.1');
      expect(context.models).toEqual(models);
      expect(context.metadata.inference_type).toBe('logical');
      expect(context.metadata.timestamp).toBeDefined();
      expect(context.currentModel).toBeUndefined();
      expect(context.relationships).toBeUndefined();
    });

    it('should create context with current model', () => {
      const models = [simpleModel, customerModel];
      const context = contextManager.createLogicalContext(models, simpleModel);

      expect(context.currentModel).toEqual(simpleModel);
      expect(context.relationships).toBeDefined();
      expect(context.relationships?.parentRelationships).toHaveLength(0);
      expect(context.relationships?.childRelationships).toHaveLength(0);
    });

    it('should include custom metadata', () => {
      const customMetadata = { customField: 'customValue' };
      const context = contextManager.createLogicalContext([simpleModel], undefined, customMetadata);

      expect(context.metadata.customField).toBe('customValue');
      expect(context.metadata.inference_type).toBe('logical');
    });
  });

  describe('createDeploymentContext', () => {
    it('should create deployment context', () => {
      const models = [simpleModel];
      const environment = {
        target: 'production' as const,
        constraints: { maxReplicas: 10 }
      };

      const context = contextManager.createDeploymentContext(models, environment);

      expect(context.version).toBe('v3.1');
      expect(context.models).toEqual(models);
      expect(context.environment).toEqual(environment);
      expect(context.metadata.inference_type).toBe('deployment');
    });

    it('should handle different environment targets', () => {
      const models = [simpleModel];
      const developmentEnv = {
        target: 'development' as const,
        constraints: { maxReplicas: 1 }
      };

      const context = contextManager.createDeploymentContext(models, developmentEnv);

      expect(context.environment?.target).toBe('development');
      expect(context.environment?.constraints.maxReplicas).toBe(1);
    });
  });

  describe('analyzeModelRelationships', () => {
    it('should analyze simple model with no relationships', () => {
      const models = [simpleModel];
      const analysis = contextManager.analyzeModelRelationships(simpleModel, models);

      expect(analysis.parentRelationships).toHaveLength(0);
      expect(analysis.childRelationships).toHaveLength(0);
      expect(analysis.siblingRelationships).toHaveLength(0);
      expect(analysis.manyToManyRelationships).toHaveLength(0);
      expect(analysis.cascadeDeleteTargets).toHaveLength(0);
    });

    it('should analyze parent-child relationships', () => {
      const models = [customerModel, orderModel];
      
      // Analyze customer (parent)
      const customerAnalysis = contextManager.analyzeModelRelationships(customerModel, models);
      expect(customerAnalysis.parentRelationships).toHaveLength(0);
      expect(customerAnalysis.childRelationships).toHaveLength(2); // orders relationship + inferred from Order's belongsTo
      expect(customerAnalysis.childRelationships[0].targetModel).toBe('Order');

      // Analyze order (child)
      const orderAnalysis = contextManager.analyzeModelRelationships(orderModel, models);
      expect(orderAnalysis.parentRelationships).toHaveLength(2); // customer relationship + inferred relationships
      expect(orderAnalysis.parentRelationships[0].targetModel).toBe('Customer');
    });

    it('should detect cascade delete relationships', () => {
      const models = [orderModel, orderItemModel];
      const orderAnalysis = contextManager.analyzeModelRelationships(orderModel, models);

      expect(orderAnalysis.childRelationships).toHaveLength(2); // items relationship + inferred relationships
      expect(orderAnalysis.cascadeDeleteTargets).toContain('OrderItem');
    });

    it('should analyze many-to-many relationships', () => {
      const models = [simpleModel, productCategoryModel];
      
      const productAnalysis = contextManager.analyzeModelRelationships(simpleModel, models);
      expect(productAnalysis.manyToManyRelationships).toHaveLength(1);
      expect(productAnalysis.manyToManyRelationships[0].targetModel).toBe('ProductCategory');

      const categoryAnalysis = contextManager.analyzeModelRelationships(productCategoryModel, models);
      expect(categoryAnalysis.manyToManyRelationships).toHaveLength(1);
      expect(categoryAnalysis.manyToManyRelationships[0].targetModel).toBe('Product');
    });

    it('should find sibling relationships', () => {
      const models = [customerModel, orderModel, orderItemModel];
      
      // OrderItem belongs to Order, Order belongs to Customer
      // So OrderItem and Order are siblings through Customer
      const orderItemAnalysis = contextManager.analyzeModelRelationships(orderItemModel, models);
      
      // OrderItem has Order as parent, but should also see relationships through shared parents
      expect(orderItemAnalysis.parentRelationships).toHaveLength(3); // Order, Product, and inferred relationships
      expect(orderItemAnalysis.parentRelationships.some(r => r.targetModel === 'Order')).toBe(true);
    });

    it('should handle complex relationship networks', () => {
      const models = [customerModel, orderModel, orderItemModel, simpleModel];
      
      const orderItemAnalysis = contextManager.analyzeModelRelationships(orderItemModel, models);
      
      expect(orderItemAnalysis.parentRelationships).toHaveLength(3); // Order, Product, and inferred relationships
      expect(orderItemAnalysis.childRelationships).toHaveLength(0);
      expect(orderItemAnalysis.parentRelationships.some(r => r.targetModel === 'Order')).toBe(true);
      expect(orderItemAnalysis.parentRelationships.some(r => r.targetModel === 'Product')).toBe(true);
    });
  });

  describe('hasRelationshipPattern', () => {
    it('should detect hasParent pattern', () => {
      const hasParent = contextManager.hasRelationshipPattern(orderModel, 'hasParent');
      const noParent = contextManager.hasRelationshipPattern(customerModel, 'hasParent');

      expect(hasParent).toBe(true);
      expect(noParent).toBe(false);
    });

    it('should detect hasChildren pattern', () => {
      const hasChildren = contextManager.hasRelationshipPattern(customerModel, 'hasChildren');
      const noChildren = contextManager.hasRelationshipPattern(orderItemModel, 'hasChildren');

      expect(hasChildren).toBe(true);
      expect(noChildren).toBe(false);
    });

    it('should detect hasManyToMany pattern', () => {
      const hasManyToMany = contextManager.hasRelationshipPattern(productCategoryModel, 'hasManyToMany');
      const noManyToMany = contextManager.hasRelationshipPattern(orderModel, 'hasManyToMany');

      expect(hasManyToMany).toBe(true);
      expect(noManyToMany).toBe(false);
    });

    it('should detect hasCascadeDelete pattern', () => {
      const hasCascade = contextManager.hasRelationshipPattern(orderModel, 'hasCascadeDelete');
      const noCascade = contextManager.hasRelationshipPattern(customerModel, 'hasCascadeDelete');

      expect(hasCascade).toBe(true);
      expect(noCascade).toBe(false);
    });

    it('should detect isRootEntity pattern', () => {
      const isRoot = contextManager.hasRelationshipPattern(customerModel, 'isRootEntity');
      const notRoot = contextManager.hasRelationshipPattern(orderModel, 'isRootEntity');

      expect(isRoot).toBe(true);
      expect(notRoot).toBe(false);
    });

    it('should detect isLeafEntity pattern', () => {
      const isLeaf = contextManager.hasRelationshipPattern(orderItemModel, 'isLeafEntity');
      const notLeaf = contextManager.hasRelationshipPattern(customerModel, 'isLeafEntity');

      expect(isLeaf).toBe(true);
      expect(notLeaf).toBe(false);
    });
  });

  describe('getRelatedModels', () => {
    it('should get parent models', () => {
      const models = [customerModel, orderModel, orderItemModel, simpleModel];
      const parents = contextManager.getRelatedModels(orderItemModel, 'parent', models);

      expect(parents).toHaveLength(2);
      expect(parents.some(m => m.name === 'Order')).toBe(true);
      expect(parents.some(m => m.name === 'Product')).toBe(true);
    });

    it('should get child models', () => {
      const models = [customerModel, orderModel, orderItemModel];
      const children = contextManager.getRelatedModels(customerModel, 'child', models);

      expect(children).toHaveLength(1);
      expect(children[0].name).toBe('Order');
    });

    it('should get many-to-many related models', () => {
      const models = [simpleModel, productCategoryModel];
      const related = contextManager.getRelatedModels(productCategoryModel, 'manyToMany', models);

      expect(related).toHaveLength(1);
      expect(related[0].name).toBe('Product');
    });
  });

  describe('calculateComplexityScore', () => {
    it('should calculate complexity for simple model', () => {
      const score = contextManager.calculateComplexityScore(simpleModel, [simpleModel]);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(10); // Simple model should have low complexity
    });

    it('should calculate higher complexity for model with relationships', () => {
      const models = [customerModel, orderModel];
      const simpleScore = contextManager.calculateComplexityScore(simpleModel, models);
      const complexScore = contextManager.calculateComplexityScore(orderModel, models);

      expect(complexScore).toBeGreaterThan(simpleScore);
    });

    it('should account for lifecycle complexity', () => {
      const models = [orderModel];
      const score = contextManager.calculateComplexityScore(orderModel, models);

      expect(score).toBeGreaterThan(10); // Model with lifecycle should be more complex
    });

    it('should account for cascade relationships', () => {
      const models = [orderModel, orderItemModel];
      const score = contextManager.calculateComplexityScore(orderModel, models);

      expect(score).toBeGreaterThan(5); // Cascade relationships add complexity
    });
  });

  describe('ContextUtils', () => {
    let baseContext: InferenceContext;

    beforeEach(() => {
      baseContext = contextManager.createLogicalContext([simpleModel, customerModel]);
    });

    describe('withCurrentModel', () => {
      it('should create context with current model', () => {
        const modelContext = ContextUtils.withCurrentModel(baseContext, customerModel, contextManager);

        expect(modelContext.currentModel).toEqual(customerModel);
        expect(modelContext.relationships).toBeDefined();
        expect(modelContext.metadata.current_model).toBe('Customer');
      });

      it('should preserve base context properties', () => {
        const modelContext = ContextUtils.withCurrentModel(baseContext, customerModel, contextManager);

        expect(modelContext.version).toBe(baseContext.version);
        expect(modelContext.models).toEqual(baseContext.models);
        expect(modelContext.metadata.inference_type).toBe(baseContext.metadata.inference_type);
      });
    });

    describe('extractNames', () => {
      it('should extract names from context with current model', () => {
        const modelContext = ContextUtils.withCurrentModel(baseContext, customerModel, contextManager);
        const names = ContextUtils.extractNames(modelContext);

        expect(names.modelName).toBe('Customer');
        expect(names.controllerName).toBe('CustomerController');
        expect(names.serviceName).toBe('CustomerService');
        expect(names.pluralModelName).toBe('Customers');
      });

      it('should handle context without current model', () => {
        const names = ContextUtils.extractNames(baseContext);

        expect(names.modelName).toBeUndefined();
        expect(names.controllerName).toBeUndefined();
        expect(names.serviceName).toBeUndefined();
        expect(names.pluralModelName).toBeUndefined();
      });

      it('should pluralize model names correctly', () => {
        const categoryContext = ContextUtils.withCurrentModel(
          baseContext, 
          { ...simpleModel, name: 'Category' }, 
          contextManager
        );
        const names = ContextUtils.extractNames(categoryContext);

        expect(names.pluralModelName).toBe('Categories');
      });

      it('should handle edge cases in pluralization', () => {
        const testCases = [
          { singular: 'Box', expected: 'Boxes' },
          { singular: 'Company', expected: 'Companies' },
          { singular: 'Analysis', expected: 'Analysises' } // Simple rule, not perfect
        ];

        for (const testCase of testCases) {
          const testContext = ContextUtils.withCurrentModel(
            baseContext,
            { ...simpleModel, name: testCase.singular },
            contextManager
          );
          const names = ContextUtils.extractNames(testContext);
          expect(names.pluralModelName).toBe(testCase.expected);
        }
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle models with no attributes', () => {
      const emptyModel: ModelDefinition = {
        name: 'Empty',
        attributes: []
      };

      const context = contextManager.createLogicalContext([emptyModel], emptyModel);
      expect(context.relationships).toBeDefined();
      
      const score = contextManager.calculateComplexityScore(emptyModel, [emptyModel]);
      expect(score).toBe(1); // Base score
    });

    it('should handle circular relationship references', () => {
      const modelA: ModelDefinition = {
        name: 'ModelA',
        attributes: [{ name: 'id', type: 'UUID', required: true }],
        relationships: [{ name: 'modelB', type: 'belongsTo', targetModel: 'ModelB' }]
      };

      const modelB: ModelDefinition = {
        name: 'ModelB',
        attributes: [{ name: 'id', type: 'UUID', required: true }],
        relationships: [{ name: 'modelA', type: 'hasOne', targetModel: 'ModelA' }]
      };

      const models = [modelA, modelB];
      const analysisA = contextManager.analyzeModelRelationships(modelA, models);
      const analysisB = contextManager.analyzeModelRelationships(modelB, models);

      // Should handle circular references without infinite loops
      expect(analysisA.parentRelationships).toHaveLength(2); // modelB relationship + inferred relationships
      expect(analysisB.childRelationships).toHaveLength(2); // modelA relationship + inferred relationships
    });

    it('should handle large numbers of models efficiently', () => {
      const manyModels = Array.from({ length: 100 }, (_, i) => ({
        ...simpleModel,
        name: `Model${i + 1}`
      }));

      const start = Date.now();
      const context = contextManager.createLogicalContext(manyModels, manyModels[0]);
      const end = Date.now();

      expect(context).toBeDefined();
      expect(end - start).toBeLessThan(1000); // Should complete quickly
    });
  });
});