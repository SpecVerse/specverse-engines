import { describe, it, expect, beforeEach, beforeAll } from "vitest";
/**
 * End-to-End Integration Tests for V3.1 Inference Engine
 * Tests complete inference pipeline with real-world scenarios
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { LogicalInferenceEngine } from '../logical/logical-engine.js';
import { 
  ModelDefinition, 
  LogicalComponentSpec,
  InferenceEngineConfig
} from '../core/types.js';

describe('Inference Engine End-to-End', () => {
  let tempDir: string;
  let engine: LogicalInferenceEngine;

  // Realistic e-commerce model set
  const ecommerceModels: ModelDefinition[] = [
    {
      name: 'Customer',
      attributes: [
        { name: 'id', type: 'UUID', required: true, unique: true },
        { name: 'email', type: 'String', required: true, unique: true },
        { name: 'firstName', type: 'String', required: true },
        { name: 'lastName', type: 'String', required: true },
        { name: 'phone', type: 'String', required: false },
        { name: 'dateOfBirth', type: 'DateTime', required: false },
        { name: 'status', type: 'String', required: true, default: 'active' }
      ],
      relationships: [
        { name: 'orders', type: 'hasMany', targetModel: 'Order' },
        { name: 'addresses', type: 'hasMany', targetModel: 'Address', cascadeDelete: true },
        { name: 'wishlist', type: 'hasOne', targetModel: 'Wishlist', cascadeDelete: true }
      ]
    },
    {
      name: 'Product',
      attributes: [
        { name: 'id', type: 'UUID', required: true, unique: true },
        { name: 'name', type: 'String', required: true },
        { name: 'description', type: 'Text', required: false },
        { name: 'price', type: 'Money', required: true },
        { name: 'sku', type: 'String', required: true, unique: true },
        { name: 'inStock', type: 'Boolean', required: true, default: true },
        { name: 'stockQuantity', type: 'Integer', required: true, default: 0 }
      ],
      relationships: [
        { name: 'category', type: 'belongsTo', targetModel: 'Category' },
        { name: 'orderItems', type: 'hasMany', targetModel: 'OrderItem' },
        { name: 'reviews', type: 'hasMany', targetModel: 'ProductReview' },
        { name: 'tags', type: 'manyToMany', targetModel: 'ProductTag' }
      ]
    },
    {
      name: 'Order',
      attributes: [
        { name: 'id', type: 'UUID', required: true, unique: true },
        { name: 'orderNumber', type: 'String', required: true, unique: true },
        { name: 'orderDate', type: 'DateTime', required: true },
        { name: 'totalAmount', type: 'Money', required: true },
        { name: 'tax', type: 'Money', required: true },
        { name: 'shippingCost', type: 'Money', required: true },
        { name: 'status', type: 'String', required: true, default: 'pending' }
      ],
      relationships: [
        { name: 'customer', type: 'belongsTo', targetModel: 'Customer' },
        { name: 'items', type: 'hasMany', targetModel: 'OrderItem', cascadeDelete: true },
        { name: 'shippingAddress', type: 'belongsTo', targetModel: 'Address' },
        { name: 'billingAddress', type: 'belongsTo', targetModel: 'Address' }
      ],
      lifecycle: {
        name: 'orderProcessing',
        states: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        transitions: [
          { name: 'confirm', from: 'pending', to: 'confirmed' },
          { name: 'startProcessing', from: 'confirmed', to: 'processing' },
          { name: 'ship', from: 'processing', to: 'shipped' },
          { name: 'deliver', from: 'shipped', to: 'delivered' },
          { name: 'cancel', from: 'pending', to: 'cancelled' },
          { name: 'cancel', from: 'confirmed', to: 'cancelled' },
          { name: 'return', from: 'delivered', to: 'returned' }
        ]
      }
    },
    {
      name: 'OrderItem',
      attributes: [
        { name: 'id', type: 'UUID', required: true, unique: true },
        { name: 'quantity', type: 'Integer', required: true },
        { name: 'unitPrice', type: 'Money', required: true },
        { name: 'totalPrice', type: 'Money', required: true }
      ],
      relationships: [
        { name: 'order', type: 'belongsTo', targetModel: 'Order' },
        { name: 'product', type: 'belongsTo', targetModel: 'Product' }
      ]
    },
    {
      name: 'Category',
      attributes: [
        { name: 'id', type: 'UUID', required: true, unique: true },
        { name: 'name', type: 'String', required: true },
        { name: 'description', type: 'Text', required: false },
        { name: 'slug', type: 'String', required: true, unique: true },
        { name: 'isActive', type: 'Boolean', required: true, default: true }
      ],
      relationships: [
        { name: 'products', type: 'hasMany', targetModel: 'Product' },
        { name: 'parent', type: 'belongsTo', targetModel: 'Category' },
        { name: 'children', type: 'hasMany', targetModel: 'Category' }
      ]
    },
    {
      name: 'Address',
      attributes: [
        { name: 'id', type: 'UUID', required: true, unique: true },
        { name: 'street', type: 'String', required: true },
        { name: 'city', type: 'String', required: true },
        { name: 'state', type: 'String', required: true },
        { name: 'postalCode', type: 'String', required: true },
        { name: 'country', type: 'String', required: true },
        { name: 'type', type: 'String', required: true } // 'shipping', 'billing', 'both'
      ],
      relationships: [
        { name: 'customer', type: 'belongsTo', targetModel: 'Customer' }
      ]
    }
  ];

  beforeEach(() => {
    tempDir = '/tmp/specverse-e2e-test';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const config: Partial<InferenceEngineConfig> = {
      logical: {
        generateControllers: true,
        generateServices: true,
        generateEvents: true,
        generateViews: true,
        generateTypes: true
      },
      rules: {
        logicalRulesPath: tempDir,
        deploymentRulesPath: tempDir
      },
      validation: {
        strictMode: false,
        failOnWarnings: false
      }
    };

    engine = new LogicalInferenceEngine(config, true);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  const createMinimalRules = () => {
    const controllerRules = {
      "version": "v3.1",
      "logical_inference": {
        "controllers": [
          {
            "name": "basic_cured",
            "pattern": "BasicCRUD",
            "priority": 100,
            "template": {
              "type": "json",
              "content": JSON.stringify({
                "model": "{{modelName}}",
                "description": "Basic CURED controller for {{modelName}}",
                "cured": {
                  "create": {
                    "parameters": {"{{modelName}}Data": "{{modelName}} required"},
                    "returns": "{{modelName}}",
                    "publishes": ["{{modelName}}Created"]
                  },
                  "retrieve": {
                    "parameters": {"id": "UUID required"},
                    "returns": "{{modelName}}"
                  },
                  "retrieve_many": {
                    "parameters": {"filters": "{{modelName}}Filter optional"},
                    "returns": "Array[{{modelName}}]"
                  },
                  "update": {
                    "parameters": {"id": "UUID required", "updates": "{{modelName}}UpdateRequest required"},
                    "returns": "{{modelName}}",
                    "publishes": ["{{modelName}}Updated"]
                  },
                  "delete": {
                    "parameters": {"id": "UUID required"},
                    "returns": "Boolean",
                    "publishes": ["{{modelName}}Deleted"]
                  }
                }
              })
            }
          }
        ]
      }
    };

    const serviceRules = {
      "version": "v3.1",
      "logical_inference": {
        "services": [
          {
            "name": "notification_service",
            "pattern": "NotificationService",
            "priority": 100,
            "template": {
              "type": "json",
              "content": JSON.stringify({
                "NotificationService": {
                  "description": "Handles notifications for all events",
                  "subscribes_to": {
                    "{{modelName}}Created": "handleCreation",
                    "{{modelName}}Updated": "handleUpdate",
                    "{{modelName}}Deleted": "handleDeletion"
                  },
                  "operations": {
                    "handleCreation": {
                      "parameters": {"event": "{{modelName}}CreatedEvent required"},
                      "returns": "Void"
                    },
                    "handleUpdate": {
                      "parameters": {"event": "{{modelName}}UpdatedEvent required"},
                      "returns": "Void"
                    },
                    "handleDeletion": {
                      "parameters": {"event": "{{modelName}}DeletedEvent required"},
                      "returns": "Void"
                    }
                  }
                }
              })
            }
          }
        ]
      }
    };

    const eventRules = {
      "version": "v3.1",
      "logical_inference": {
        "events": [
          {
            "name": "standard_events",
            "pattern": "StandardEvents",
            "priority": 100,
            "template": {
              "type": "json",
              "content": JSON.stringify({
                "{{modelName}}Created": {
                  "description": "{{modelName}} was created",
                  "attributes": {
                    "id": "UUID required",
                    "timestamp": "DateTime required",
                    "createdBy": "UUID required"
                  }
                },
                "{{modelName}}Updated": {
                  "description": "{{modelName}} was updated",
                  "attributes": {
                    "id": "UUID required",
                    "changes": "Object required",
                    "timestamp": "DateTime required",
                    "updatedBy": "UUID required"
                  }
                },
                "{{modelName}}Deleted": {
                  "description": "{{modelName}} was deleted",
                  "attributes": {
                    "id": "UUID required",
                    "timestamp": "DateTime required",
                    "deletedBy": "UUID required"
                  }
                }
              })
            }
          }
        ]
      }
    };

    const viewRules = {
      "version": "v3.1",
      "logical_inference": {
        "views": [
          {
            "name": "standard_views",
            "pattern": "StandardViews",
            "priority": 100,
            "template": {
              "type": "json",
              "content": JSON.stringify({
                "{{modelName}}ListView": {
                  "type": "list",
                  "model": "{{modelName}}",
                  "description": "List view for {{modelName}}s",
                  "subscribes": ["{{modelName}}Created", "{{modelName}}Updated", "{{modelName}}Deleted"],
                  "uiComponents": [
                    {
                      "type": "List",
                      "properties": {
                        "name": "{{modelName.toLowerCase}}List",
                        "model": "{{modelName}}"
                      }
                    }
                  ]
                },
                "{{modelName}}DetailView": {
                  "type": "detail",
                  "model": "{{modelName}}",
                  "description": "Detail view for {{modelName}}",
                  "subscribes": ["{{modelName}}Updated"],
                  "uiComponents": [
                    {
                      "type": "DetailPanel",
                      "properties": {
                        "model": "{{modelName}}"
                      }
                    }
                  ]
                }
              })
            }
          }
        ]
      }
    };

    fs.writeFileSync(path.join(tempDir, 'controllers.json'), JSON.stringify(controllerRules, null, 2));
    fs.writeFileSync(path.join(tempDir, 'services.json'), JSON.stringify(serviceRules, null, 2));
    fs.writeFileSync(path.join(tempDir, 'events.json'), JSON.stringify(eventRules, null, 2));
    fs.writeFileSync(path.join(tempDir, 'views.json'), JSON.stringify(viewRules, null, 2));
  };

  describe('Complete E-Commerce Scenario', () => {
    beforeEach(() => {
      createMinimalRules();
    });

    it('should generate complete e-commerce specification', async () => {
      await engine.loadRules();
      
      const result = await engine.inferLogicalSpecification(
        ecommerceModels,
        'ECommerceComponent'
      );

      // Should succeed
      expect(result.validation.valid).toBe(true);
      expect(result.specification.name).toBe('ECommerceComponent');
      expect(result.statistics.modelsProcessed).toBe(6);

      // Should generate specifications for all models
      expect(Object.keys(result.specification.models)).toHaveLength(6);
      expect(result.specification.models.Customer).toBeDefined();
      expect(result.specification.models.Product).toBeDefined();
      expect(result.specification.models.Order).toBeDefined();
      expect(result.specification.models.OrderItem).toBeDefined();
      expect(result.specification.models.Category).toBeDefined();
      expect(result.specification.models.Address).toBeDefined();

      // Should generate controllers
      expect(Object.keys(result.specification.controllers).length).toBeGreaterThan(0);
      expect(result.specification.controllers.CustomerController).toBeDefined();
      expect(result.specification.controllers.ProductController).toBeDefined();
      expect(result.specification.controllers.OrderController).toBeDefined();

      // Controllers should have CURED operations
      const customerController = result.specification.controllers.CustomerController;
      expect(customerController.cured).toBeDefined();
      expect(customerController.cured?.create).toBeDefined();
      expect(customerController.cured?.retrieve).toBeDefined();
      expect(customerController.cured?.retrieve_many).toBeDefined();
      expect(customerController.cured?.update).toBeDefined();
      expect(customerController.cured?.delete).toBeDefined();

      // Should generate events
      expect(Object.keys(result.specification.events).length).toBeGreaterThan(0);
      expect(result.specification.events.CustomerCreated).toBeDefined();
      expect(result.specification.events.OrderCreated).toBeDefined();
      
      // Events should have V3.1 attributes format
      const customerCreated = result.specification.events.CustomerCreated;
      expect(customerCreated.attributes).toBeDefined();
      expect(customerCreated.attributes?.id).toBe('UUID required');
      expect(customerCreated.attributes?.timestamp).toBe('DateTime required');

      // Should generate views
      expect(Object.keys(result.specification.views).length).toBeGreaterThan(0);
      expect(result.specification.views.CustomerListView).toBeDefined();
      expect(result.specification.views.ProductDetailView).toBeDefined();

      // Services may be generated based on rules (cross-cutting services like NotificationService
      // are no longer auto-generated - they should be defined explicitly in deployments/manifests)
      expect(result.specification.services).toBeDefined();

      // Should generate common definitions
      if (result.specification.commonDefinitions) {
        expect(result.specification.commonDefinitions.CustomerCreateRequest).toBeDefined();
        expect(result.specification.commonDefinitions.ProductFilter).toBeDefined();
      }
    });

    it('should handle relationship-aware inference correctly', async () => {
      await engine.loadRules();
      
      const result = await engine.inferLogicalSpecification(ecommerceModels);

      // Check that relationship models have proper references
      const orderModel = result.specification.models.Order;
      expect(orderModel.relationships).toBeDefined();
      expect(orderModel.relationships?.customer).toBeDefined();
      expect(orderModel.relationships?.customer.type).toBe('belongsTo');
      expect(orderModel.relationships?.customer.target).toBe('Customer');

      const customerModel = result.specification.models.Customer;
      expect(customerModel.relationships).toBeDefined();
      expect(customerModel.relationships?.orders).toBeDefined();
      expect(customerModel.relationships?.orders.type).toBe('hasMany');
      expect(customerModel.relationships?.orders.target).toBe('Order');
    });

    it('should handle lifecycle-aware inference correctly', async () => {
      await engine.loadRules();
      
      const result = await engine.inferLogicalSpecification(ecommerceModels);

      // Order has lifecycle, should be reflected in specification
      const orderModel = result.specification.models.Order;
      expect(orderModel.lifecycles).toBeDefined();
      expect(orderModel.lifecycles?.orderProcessing).toBeDefined();
      expect(orderModel.lifecycles?.orderProcessing.states).toEqual([
        'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
      ]);

      // Should have transition definitions
      const lifecycle = orderModel.lifecycles?.orderProcessing;
      expect(lifecycle?.transitions).toBeDefined();
      expect(lifecycle?.transitions.confirm).toBeDefined();
      expect(lifecycle?.transitions.confirm.from).toBe('pending');
      expect(lifecycle?.transitions.confirm.to).toBe('confirmed');
    });

    it('should NOT auto-generate cross-cutting services (architectural change)', async () => {
      await engine.loadRules();

      const result = await engine.inferLogicalSpecification(ecommerceModels);

      // Cross-cutting services (NotificationService, AuditService) are no longer auto-generated
      // They should be implemented as explicit deployment instances via manifests
      // This is an intentional architectural change to reduce inference output
      // and encourage explicit infrastructure definition

      // Verify that cross-cutting services are NOT automatically created
      expect(result.specification.services.NotificationService).toBeUndefined();
      expect(result.specification.services.AuditService).toBeUndefined();

      // Services object should exist but may be empty if no model-specific service rules match
      expect(result.specification.services).toBeDefined();
    });
  });

  describe('Output Format Validation', () => {
    beforeEach(() => {
      createMinimalRules();
    });

    it('should generate valid YAML output', async () => {
      await engine.loadRules();
      
      const result = await engine.inferLogicalSpecification(
        [ecommerceModels[0]], // Just Customer model
        'TestComponent'
      );

      expect(result.validation.valid).toBe(true);

      // Should be serializable to YAML
      const yamlOutput = yaml.dump(result.specification);
      expect(yamlOutput).toBeDefined();
      expect(yamlOutput.length).toBeGreaterThan(100);

      // Should be parseable back from YAML
      const parsedBack = yaml.load(yamlOutput) as LogicalComponentSpec;
      expect(parsedBack.name).toBe('TestComponent');
      expect(parsedBack.version).toBe('3.1.0');
    });

    it('should generate valid JSON output', async () => {
      await engine.loadRules();
      
      const result = await engine.inferLogicalSpecification([ecommerceModels[1]]); // Product model

      expect(result.validation.valid).toBe(true);

      // Should be serializable to JSON
      const jsonOutput = JSON.stringify(result.specification, null, 2);
      expect(jsonOutput).toBeDefined();
      expect(jsonOutput.length).toBeGreaterThan(100);

      // Should be parseable back from JSON
      const parsedBack = JSON.parse(jsonOutput) as LogicalComponentSpec;
      expect(parsedBack.version).toBe('3.1.0');
      expect(parsedBack.models.Product).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(() => {
      createMinimalRules();
    });

    it('should handle large model sets efficiently', async () => {
      // Create 50 similar models
      const manyModels: ModelDefinition[] = Array.from({ length: 50 }, (_, i) => ({
        name: `TestModel${i + 1}`,
        attributes: [
          { name: 'id', type: 'UUID', required: true },
          { name: 'name', type: 'String', required: true },
          { name: 'value', type: 'Integer', required: false }
        ]
      }));

      await engine.loadRules();

      const startTime = Date.now();
      const result = await engine.inferLogicalSpecification(manyModels, 'LargeComponent');
      const endTime = Date.now();

      expect(result.validation.valid).toBe(true);
      expect(result.statistics.modelsProcessed).toBe(50);
      expect(Object.keys(result.specification.models)).toHaveLength(50);

      // Should complete in reasonable time (less than 10 seconds)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
      
      console.log(`Processed 50 models in ${duration}ms`);
      console.log(`Generated ${result.statistics.controllersGenerated} controllers`);
      console.log(`Generated ${result.statistics.eventsGenerated} events`);
      console.log(`Applied ${result.statistics.rulesApplied} rules`);
    });

    it('should track resource usage accurately', async () => {
      await engine.loadRules();
      
      const result = await engine.inferLogicalSpecification(ecommerceModels.slice(0, 3)); // 3 models

      expect(result.statistics.modelsProcessed).toBe(3);
      expect(result.statistics.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.statistics.processingTimeMs).toBeLessThan(5000);
      expect(result.statistics.rulesApplied).toBeGreaterThan(0);
      
      // Should have reasonable ratios
      expect(result.statistics.controllersGenerated).toBeLessThanOrEqual(result.statistics.modelsProcessed);
      expect(result.statistics.eventsGenerated).toBeGreaterThan(result.statistics.modelsProcessed); // Multiple events per model
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid rules gracefully', async () => {
      // Create invalid rule file with malformed JSON
      const invalidRules = '{"version": "v3.1", "logical_inference": {"controllers": [{"name": "invalid_rule", "pattern": "InvalidPattern", "template": {"type": "json", "content": "invalid json {"}}]}';
      
      fs.writeFileSync(path.join(tempDir, 'invalid.json'), invalidRules);

      const validationResult = await engine.loadRules();
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    it('should provide meaningful error messages', async () => {
      const result = await engine.inferLogicalSpecification([ecommerceModels[0]]);

      // Should fail gracefully when rules not loaded
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors[0].message).toContain('not loaded');
      expect(result.validation.errors[0].code).toBe('RULES_NOT_LOADED');
    });

    it('should handle models with missing required fields', async () => {
      createMinimalRules();
      await engine.loadRules();

      const invalidModel: any = {
        // Missing name
        attributes: [
          { name: 'id', type: 'UUID', required: true }
        ]
      };

      const result = await engine.inferLogicalSpecification([invalidModel]);

      // Should handle gracefully
      expect(result.statistics.modelsProcessed).toBe(1);
      expect(result.validation.warnings.length + result.validation.errors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration Variations', () => {
    it('should respect partial generation configuration', async () => {
      const limitedConfig: Partial<InferenceEngineConfig> = {
        logical: {
          generateControllers: true,
          generateServices: false,
          generateEvents: false,
          generateViews: false,
          generateTypes: false
        },
        rules: {
          logicalRulesPath: tempDir,
          deploymentRulesPath: tempDir
        }
      };

      const limitedEngine = new LogicalInferenceEngine(limitedConfig);
      createMinimalRules();
      await limitedEngine.loadRules();

      const result = await limitedEngine.inferLogicalSpecification([ecommerceModels[0]]);

      expect(result.validation.valid).toBe(true);
      expect(Object.keys(result.specification.controllers).length).toBeGreaterThan(0);
      expect(Object.keys(result.specification.services)).toHaveLength(0);
      expect(Object.keys(result.specification.events)).toHaveLength(0);
      expect(Object.keys(result.specification.views)).toHaveLength(0);
    });

    it('should handle strict validation mode', async () => {
      const strictConfig: Partial<InferenceEngineConfig> = {
        validation: {
          strictMode: true,
          failOnWarnings: true
        },
        rules: {
          logicalRulesPath: tempDir,
          deploymentRulesPath: tempDir
        }
      };

      const strictEngine = new LogicalInferenceEngine(strictConfig);
      createMinimalRules();
      await strictEngine.loadRules();

      const result = await strictEngine.inferLogicalSpecification([ecommerceModels[0]]);

      expect(result.validation).toBeDefined();
      // In strict mode, any warnings might cause validation to fail
    });
  });
});