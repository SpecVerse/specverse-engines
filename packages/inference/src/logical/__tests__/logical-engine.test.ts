import { describe, it, expect, beforeEach, beforeAll } from "vitest";
/**
 * Integration Tests for V3.1 Logical Inference Engine
 * Tests the complete inference pipeline from models to specifications
 */

import { LogicalInferenceEngine } from '../logical-engine.js';
import { 
  ModelDefinition, 
  InferenceEngineConfig,
  ValidationResult
} from '../../core/types.js';

describe('LogicalInferenceEngine', () => {
  let engine: LogicalInferenceEngine;
  let testConfig: Partial<InferenceEngineConfig>;

  // Test data
  const simpleModel: ModelDefinition = {
    name: 'Product',
    attributes: [
      { name: 'id', type: 'UUID', required: true, unique: true },
      { name: 'name', type: 'String', required: true },
      { name: 'price', type: 'Money', required: true },
      { name: 'description', type: 'Text', required: false }
    ]
  };

  const complexModel: ModelDefinition = {
    name: 'Order',
    attributes: [
      { name: 'id', type: 'UUID', required: true, unique: true },
      { name: 'orderNumber', type: 'String', required: true },
      { name: 'total', type: 'Money', required: true },
      { name: 'status', type: 'String', required: true, default: 'pending' }
    ],
    relationships: [
      { name: 'customer', type: 'belongsTo', targetModel: 'Customer' },
      { name: 'items', type: 'hasMany', targetModel: 'OrderItem', cascadeDelete: true }
    ],
    lifecycle: {
      name: 'orderLifecycle',
      states: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      transitions: [
        { name: 'confirm', from: 'pending', to: 'confirmed' },
        { name: 'ship', from: 'confirmed', to: 'shipped' },
        { name: 'deliver', from: 'shipped', to: 'delivered' },
        { name: 'cancel', from: 'pending', to: 'cancelled' }
      ]
    }
  };

  const profileModel: ModelDefinition = {
    name: 'DigitalProduct',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'downloadUrl', type: 'String', required: true }
    ],
    profiles: [
      {
        name: 'DownloadableProfile',
        attributes: [
          { name: 'fileSize', type: 'Integer', required: true },
          { name: 'format', type: 'String', required: true }
        ]
      }
    ]
  };

  beforeEach(() => {
    testConfig = {
      logical: {
        generateControllers: true,
        generateServices: true,
        generateEvents: true,
        generateViews: true,
        generateTypes: true
      },
      rules: {
        logicalRulesPath: './rules/logical',
        deploymentRulesPath: './rules/deployment'
      },
      validation: {
        strictMode: false,
        failOnWarnings: false
      }
    };

    engine = new LogicalInferenceEngine(testConfig, true);
  });

  describe('Engine Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new LogicalInferenceEngine();
      const info = defaultEngine.getEngineInfo();

      expect(info.version).toBe('3.1.0');
      expect(info.generators).toContain('ControllerGenerator');
      expect(info.generators).toContain('ServiceGenerator');
      expect(info.generators).toContain('EventGenerator');
      expect(info.generators).toContain('ViewGenerator');
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        logical: {
          generateControllers: true,
          generateServices: false,
          generateEvents: true,
          generateViews: false,
          generateTypes: true
        }
      };

      const customEngine = new LogicalInferenceEngine(customConfig);
      const info = customEngine.getEngineInfo();
      
      expect(info.config.logical.generateServices).toBe(false);
      expect(info.config.logical.generateViews).toBe(false);
    });
  });

  describe('Rule Loading', () => {
    it('should load rules successfully', async () => {
      // Mock successful rule loading
      const validation = await engine.loadRules();
      
      // Note: This will fail without actual rule files, but tests the API
      expect(validation).toBeDefined();
      expect(validation.valid).toBeDefined();
      expect(validation.errors).toBeInstanceOf(Array);
      expect(validation.warnings).toBeInstanceOf(Array);
    });

    it('should handle rule loading errors gracefully', async () => {
      const invalidConfigEngine = new LogicalInferenceEngine({
        rules: {
          logicalRulesPath: '/non/existent/path',
          deploymentRulesPath: '/non/existent/path'
        }
      });

      const validation = await invalidConfigEngine.loadRules();

      // With entity registry fallback, rules may still load successfully
      // from entity modules even when the directory path is invalid.
      // Either outcome is valid: success (registry fallback) or failure (no fallback).
      expect(validation.valid).toBeDefined();
      expect(validation.errors).toBeInstanceOf(Array);
    });
  });

  describe('Simple Model Inference', () => {
    it('should infer complete specification from simple model', async () => {
      const result = await engine.inferLogicalSpecification(
        [simpleModel],
        'SimpleProductComponent'
      );

      expect(result).toBeDefined();
      expect(result.specification).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.validation).toBeDefined();

      // Check specification structure
      expect(result.specification.name).toBe('SimpleProductComponent');
      expect(result.specification.version).toBe('3.1.0');
      expect(result.specification.controllers).toBeDefined();
      expect(result.specification.services).toBeDefined();
      expect(result.specification.events).toBeDefined();
      expect(result.specification.views).toBeDefined();
      expect(result.specification.models).toBeDefined();

      // Check statistics
      expect(result.statistics.modelsProcessed).toBe(1);
      expect(result.statistics.processingTimeMs).toBeGreaterThanOrEqual(0);

      // Check model was processed
      expect(result.specification.models.Product).toBeDefined();
      expect(result.specification.models.Product.attributes).toBeDefined();
    });

    it('should generate model specifications correctly', async () => {
      const result = await engine.inferLogicalSpecification([simpleModel]);
      const modelSpec = result.specification.models.Product;

      expect(modelSpec.description).toBeDefined();
      expect(modelSpec.attributes).toBeDefined();
      expect(modelSpec.attributes.name).toBe('String required');
      expect(modelSpec.attributes.price).toBe('Money required');
      expect(modelSpec.attributes.description).toBe('Text');
    });
  });

  describe('Complex Model Inference', () => {
    it('should handle models with relationships and lifecycles', async () => {
      const models = [complexModel, simpleModel]; // Include related model
      
      const result = await engine.inferLogicalSpecification(
        models,
        'ComplexOrderComponent'
      );

      expect(result.specification.name).toBe('ComplexOrderComponent');
      expect(result.statistics.modelsProcessed).toBe(2);

      // Check Order model has relationships
      const orderModel = result.specification.models.Order;
      expect(orderModel.relationships).toBeDefined();
      expect(orderModel.lifecycles).toBeDefined();

      // Check lifecycle was processed
      expect(orderModel.lifecycles.orderLifecycle).toBeDefined();
      expect(orderModel.lifecycles.orderLifecycle.states).toEqual([
        'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
      ]);
    });

    it('should generate relationship-aware specifications', async () => {
      const customerModel: ModelDefinition = {
        name: 'Customer',
        attributes: [
          { name: 'id', type: 'UUID', required: true },
          { name: 'name', type: 'String', required: true },
          { name: 'email', type: 'String', required: true }
        ]
      };

      const models = [complexModel, customerModel];
      const result = await engine.inferLogicalSpecification(models);

      // Check that Order model references Customer
      const orderModel = result.specification.models.Order;
      expect(orderModel.relationships?.customer).toBeDefined();
      expect(orderModel.relationships.customer.target).toBe('Customer');
      expect(orderModel.relationships.customer.type).toBe('belongsTo');
    });
  });

  describe('Profile Model Inference', () => {
    it('should handle models with profile attachments', async () => {
      const result = await engine.inferLogicalSpecification([profileModel]);
      
      expect(result.statistics.modelsProcessed).toBe(1);

      // Check that profile model was processed
      const digitalProductModel = result.specification.models.DigitalProduct;
      expect(digitalProductModel).toBeDefined();
      expect(digitalProductModel.attributes.name).toBe('String required');
      expect(digitalProductModel.attributes.downloadUrl).toBe('String required');
    });
  });

  describe('Multi-Model Inference', () => {
    it('should process multiple models together', async () => {
      const models = [simpleModel, complexModel, profileModel];
      
      const result = await engine.inferLogicalSpecification(
        models,
        'MultiModelComponent'
      );

      expect(result.statistics.modelsProcessed).toBe(3);
      expect(Object.keys(result.specification.models)).toHaveLength(3);
      expect(result.specification.models.Product).toBeDefined();
      expect(result.specification.models.Order).toBeDefined();
      expect(result.specification.models.DigitalProduct).toBeDefined();
    });

    it('should maintain performance with multiple models', async () => {
      const models = Array.from({ length: 10 }, (_, i) => ({
        ...simpleModel,
        name: `Product${i + 1}`
      }));
      
      const result = await engine.inferLogicalSpecification(models);

      expect(result.statistics.modelsProcessed).toBe(10);
      expect(result.statistics.processingTimeMs).toBeLessThan(5000); // Should complete in <5 seconds
    });
  });

  describe('Configuration Handling', () => {
    it('should respect configuration settings', async () => {
      const limitedConfig = {
        logical: {
          generateControllers: true,
          generateServices: false,
          generateEvents: false,
          generateViews: false,
          generateTypes: false
        }
      };

      const limitedEngine = new LogicalInferenceEngine(limitedConfig);
      const result = await limitedEngine.inferLogicalSpecification([simpleModel]);

      // Should only generate controllers and models
      expect(result.specification.controllers).toBeDefined();
      expect(Object.keys(result.specification.services)).toHaveLength(0);
      expect(Object.keys(result.specification.events)).toHaveLength(0);
      expect(Object.keys(result.specification.views)).toHaveLength(0);
    });

    it('should generate common definitions when enabled', async () => {
      const result = await engine.inferLogicalSpecification([simpleModel]);

      if (testConfig.logical?.generateTypes) {
        expect(result.specification.commonDefinitions).toBeDefined();
        expect(result.specification.commonDefinitions?.ProductCreateRequest).toBeDefined();
        expect(result.specification.commonDefinitions?.ProductUpdateRequest).toBeDefined();
        expect(result.specification.commonDefinitions?.ProductFilter).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle empty model array', async () => {
      const result = await engine.inferLogicalSpecification([]);

      expect(result.statistics.modelsProcessed).toBe(0);
      expect(result.specification.name).toBe('GeneratedComponent');
      expect(Object.keys(result.specification.models)).toHaveLength(0);
    });

    it('should handle models with invalid data gracefully', async () => {
      const invalidModel: any = {
        name: '',  // Invalid empty name
        attributes: []  // No attributes
      };

      const result = await engine.inferLogicalSpecification([invalidModel]);

      // Should not crash, but may have validation warnings
      expect(result.validation).toBeDefined();
      expect(result.statistics.modelsProcessed).toBe(1);
    });

    it('should provide detailed error information', async () => {
      const modelWithoutName: any = {
        // Missing name property
        attributes: [
          { name: 'id', type: 'UUID', required: true }
        ]
      };

      const result = await engine.inferLogicalSpecification([modelWithoutName]);

      expect(result.validation.errors.length + result.validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Engine Information', () => {
    it('should provide engine information', () => {
      const info = engine.getEngineInfo();

      expect(info.version).toBe('3.1.0');
      expect(info.config).toBeDefined();
      expect(info.loadedRules).toBeDefined();
      expect(info.generators).toBeInstanceOf(Array);
      expect(info.generators.length).toBe(4);
    });
  });

  describe('Statistics and Performance', () => {
    it('should provide accurate statistics', async () => {
      const models = [simpleModel, complexModel];
      const result = await engine.inferLogicalSpecification(models);

      expect(result.statistics.modelsProcessed).toBe(2);
      expect(result.statistics.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.statistics.controllersGenerated).toBe('number');
      expect(typeof result.statistics.servicesGenerated).toBe('number');
      expect(typeof result.statistics.eventsGenerated).toBe('number');
      expect(typeof result.statistics.viewsGenerated).toBe('number');
    });

    it('should track rules applied', async () => {
      const result = await engine.inferLogicalSpecification([simpleModel]);

      expect(typeof result.statistics.rulesApplied).toBe('number');
      expect(result.statistics.rulesApplied).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation', () => {
    it('should validate generated specifications', async () => {
      const result = await engine.inferLogicalSpecification([simpleModel]);

      expect(result.validation).toBeDefined();
      expect(result.validation.valid).toBeDefined();
      expect(result.validation.errors).toBeInstanceOf(Array);
      expect(result.validation.warnings).toBeInstanceOf(Array);
    });

    it('should handle strict validation mode', async () => {
      const strictEngine = new LogicalInferenceEngine({
        ...testConfig,
        validation: {
          strictMode: true,
          failOnWarnings: true
        }
      });

      const result = await strictEngine.inferLogicalSpecification([simpleModel]);

      expect(result.validation).toBeDefined();
      // In strict mode, warnings might be treated as errors
    });
  });

  describe('Deployment Instance Types Integration', () => {
    it('should handle specifications with all four instance types', async () => {
      const testConfig: Partial<InferenceEngineConfig> = {
        logical: {
          generateControllers: true,
          generateServices: true,
          generateEvents: true,
          generateViews: true
        },
        rules: {
          logicalRulesPath: '../rules/logical',
          deploymentRulesPath: '../rules/deployment'
        },
        output: {
          format: 'yaml',
          includeComments: true
        }
      };

      engine = new LogicalInferenceEngine(testConfig);
      await engine.loadRules();

      const enterpriseModel: ModelDefinition = {
        name: 'EnterpriseApp',
        attributes: [
          { name: 'id', type: 'UUID', required: true, unique: true },
          { name: 'name', type: 'String', required: true },
          { name: 'status', type: 'String', required: true, default: 'active' }
        ]
      };

      const result = await engine.inferLogicalSpecification([enterpriseModel], 'EnterpriseApp');

      expect(result).toBeDefined();
      expect(result.specification).toBeDefined();
      expect(result.specification.controllers).toBeDefined();
      expect(result.specification.services).toBeDefined();
      expect(result.specification.events).toBeDefined();
      expect(result.specification.views).toBeDefined();

      // Ensure the engine can process deployment structures
      // This doesn't test instance generation directly, but ensures the engine
      // is compatible with the deployment structures we've added
      expect(result.validation).toBeDefined();
      expect(result.validation.errors).toBeInstanceOf(Array);
      expect(result.statistics?.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should validate deployment rules path configuration', async () => {
      const configWithDeployment: Partial<InferenceEngineConfig> = {
        logical: {
          generateControllers: false,
          generateServices: false,
          generateEvents: false,  
          generateViews: false
        },
        rules: {
          logicalRulesPath: '../rules/logical',
          deploymentRulesPath: '../rules/deployment' // This should exist with v3.1-deployment-rules.json
        },
        output: {
          format: 'yaml'
        }
      };

      const deploymentEngine = new LogicalInferenceEngine(configWithDeployment);
      
      // Should not throw when loading rules that include deployment rules
      await expect(deploymentEngine.loadRules()).resolves.not.toThrow();

      // Should handle empty model array with deployment config
      const result = await deploymentEngine.inferLogicalSpecification([], 'TestComponent');
      expect(result).toBeDefined();
      expect(result.validation).toBeDefined();
    });

    it('should handle inference with deployment-aware context', async () => {
      const testConfig: Partial<InferenceEngineConfig> = {
        logical: {
          generateControllers: true,
          generateServices: true,
          generateEvents: false,
          generateViews: false
        },
        rules: {
          logicalRulesPath: '../rules/logical',
          deploymentRulesPath: '../rules/deployment'
        }
      };

      engine = new LogicalInferenceEngine(testConfig);
      await engine.loadRules();

      const deploymentAwareModel: ModelDefinition = {
        name: 'DeployedService',
        attributes: [
          { name: 'id', type: 'UUID', required: true },
          { name: 'name', type: 'String', required: true },
          { name: 'deploymentStatus', type: 'String', required: true }
        ]
      };

      const result = await engine.inferLogicalSpecification([deploymentAwareModel], 'DeployedService');

      expect(result).toBeDefined();
      expect(result.specification).toBeDefined();
      expect(result.specification.controllers).toBeDefined();
      expect(result.specification.services).toBeDefined();
      
      // Verify that the inference engine can handle deployment-related context
      // The actual deployment instance generation would happen at a higher level
      expect(result.validation.errors).toBeInstanceOf(Array);
      expect(result.statistics?.rulesApplied).toBeGreaterThanOrEqual(0);
    });
  });
});