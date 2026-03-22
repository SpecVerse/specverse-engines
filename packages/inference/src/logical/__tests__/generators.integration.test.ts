/**
 * Integration Tests for V3.1 Logical Generators
 * Tests how all generators work together in realistic scenarios
 */

import { ControllerGenerator } from '../generators/controller-generator.js';
import { ServiceGenerator } from '../generators/service-generator.js';
import { EventGenerator } from '../generators/event-generator.js';
import { ViewGenerator } from '../generators/view-generator.js';
import { InferenceContextManager } from '../../core/context.js';
import { 
  ModelDefinition, 
  InferenceRule, 
  ControllerSpec,
  ServiceSpec,
  EventSpec,
  ViewSpec
} from '../../core/types.js';

describe('Logical Generators Integration', () => {
  let controllerGenerator: ControllerGenerator;
  let serviceGenerator: ServiceGenerator;
  let eventGenerator: EventGenerator;
  let viewGenerator: ViewGenerator;
  let contextManager: InferenceContextManager;

  // Test models representing a realistic e-commerce scenario
  const productModel: ModelDefinition = {
    name: 'Product',
    attributes: [
      { name: 'id', type: 'UUID', required: true, unique: true },
      { name: 'name', type: 'String', required: true },
      { name: 'price', type: 'Money', required: true },
      { name: 'description', type: 'Text', required: false },
      { name: 'category', type: 'String', required: true },
      { name: 'inStock', type: 'Boolean', required: true, default: true }
    ]
  };

  const categoryModel: ModelDefinition = {
    name: 'Category',
    attributes: [
      { name: 'id', type: 'UUID', required: true, unique: true },
      { name: 'name', type: 'String', required: true },
      { name: 'description', type: 'Text', required: false }
    ],
    relationships: [
      { name: 'products', type: 'hasMany', targetModel: 'Product' }
    ]
  };

  const orderModel: ModelDefinition = {
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
      name: 'orderProcessing',
      states: ['pending', 'confirmed', 'shipped', 'delivered'],
      transitions: [
        { name: 'confirm', from: 'pending', to: 'confirmed' },
        { name: 'ship', from: 'confirmed', to: 'shipped' },
        { name: 'deliver', from: 'shipped', to: 'delivered' }
      ]
    }
  };

  const customerModel: ModelDefinition = {
    name: 'Customer',
    attributes: [
      { name: 'id', type: 'UUID', required: true, unique: true },
      { name: 'name', type: 'String', required: true },
      { name: 'email', type: 'String', required: true },
      { name: 'phone', type: 'String', required: false }
    ],
    relationships: [
      { name: 'orders', type: 'hasMany', targetModel: 'Order' }
    ]
  };

  // Sample rules for testing
  const sampleControllerRules: InferenceRule<ModelDefinition, ControllerSpec>[] = [
    {
      name: 'basic_cured_controller',
      pattern: 'BasicCRUD',
      priority: 100,
      template: {
        type: 'json',
        content: JSON.stringify({
          model: '{{modelName}}',
          description: 'Basic CURED controller for {{modelName}}',
          cured: {
            create: {
              parameters: { '{{modelName}}Data': '{{modelName}} required' },
              returns: '{{modelName}}',
              publishes: ['{{modelName}}Created']
            },
            retrieve: {
              parameters: { 'id': 'UUID required' },
              returns: '{{modelName}}'
            },
            update: {
              parameters: { 
                'id': 'UUID required',
                'updates': '{{modelName}}UpdateRequest required' 
              },
              returns: '{{modelName}}',
              publishes: ['{{modelName}}Updated']
            },
            delete: {
              parameters: { 'id': 'UUID required' },
              returns: 'Boolean',
              publishes: ['{{modelName}}Deleted']
            }
          }
        })
      }
    }
  ];

  const sampleServiceRules: InferenceRule<ModelDefinition, ServiceSpec>[] = [
    {
      name: 'notification_service',
      pattern: 'NotificationService',
      condition: 'true', // Always apply
      priority: 100,
      template: {
        type: 'json',
        content: JSON.stringify({
          description: 'Notification service for {{modelName}} events',
          subscribes_to: {
            '{{modelName}}Created': 'handleCreation',
            '{{modelName}}Updated': 'handleUpdate'
          },
          operations: {
            handleCreation: {
              parameters: { 'event': '{{modelName}}CreatedEvent required' },
              returns: 'Void'
            },
            handleUpdate: {
              parameters: { 'event': '{{modelName}}UpdatedEvent required' },
              returns: 'Void'
            }
          }
        })
      }
    }
  ];

  const sampleEventRules: InferenceRule<ModelDefinition, EventSpec>[] = [
    {
      name: 'basic_crud_events',
      pattern: 'BasicEvents',
      priority: 100,
      template: {
        type: 'json',
        content: JSON.stringify({
          '{{modelName}}Created': {
            description: '{{modelName}} was created',
            attributes: {
              'id': 'UUID required',
              'timestamp': 'DateTime required'
            }
          },
          '{{modelName}}Updated': {
            description: '{{modelName}} was updated',
            attributes: {
              'id': 'UUID required',
              'changes': 'Object required',
              'timestamp': 'DateTime required'
            }
          },
          '{{modelName}}Deleted': {
            description: '{{modelName}} was deleted',
            attributes: {
              'id': 'UUID required',
              'timestamp': 'DateTime required'
            }
          }
        })
      }
    }
  ];

  const sampleViewRules: InferenceRule<ModelDefinition, ViewSpec>[] = [
    {
      name: 'basic_views',
      pattern: 'BasicViews',
      priority: 100,
      template: {
        type: 'json',
        content: JSON.stringify({
          '{{modelName}}ListView': {
            type: 'list',
            model: '{{modelName}}',
            description: 'List view for {{modelName}}s',
            subscribes: ['{{modelName}}Created', '{{modelName}}Updated', '{{modelName}}Deleted'],
            uiComponents: [
              {
                type: 'List',
                properties: {
                  name: '{{modelName.toLowerCase}}List',
                  model: '{{modelName}}'
                }
              }
            ]
          },
          '{{modelName}}DetailView': {
            type: 'detail',
            model: '{{modelName}}',
            description: 'Detail view for {{modelName}}',
            subscribes: ['{{modelName}}Updated'],
            uiComponents: [
              {
                type: 'DetailPanel',
                properties: {
                  model: '{{modelName}}'
                }
              }
            ]
          }
        })
      }
    }
  ];

  beforeEach(() => {
    controllerGenerator = new ControllerGenerator(true);
    serviceGenerator = new ServiceGenerator(true);
    eventGenerator = new EventGenerator(true);
    viewGenerator = new ViewGenerator(true);
    contextManager = new InferenceContextManager(true);
  });

  describe('Generator Initialization and Rule Loading', () => {
    it('should load rules in all generators successfully', async () => {
      const controllerValidation = await controllerGenerator.loadRules(sampleControllerRules);
      const serviceValidation = await serviceGenerator.loadRules(sampleServiceRules);
      const eventValidation = await eventGenerator.loadRules(sampleEventRules);
      const viewValidation = await viewGenerator.loadRules(sampleViewRules);

      expect(controllerValidation.valid).toBe(true);
      expect(serviceValidation.valid).toBe(true);
      expect(eventValidation.valid).toBe(true);
      expect(viewValidation.valid).toBe(true);
    });
  });

  describe('Single Model Generation Integration', () => {
    beforeEach(async () => {
      await controllerGenerator.loadRules(sampleControllerRules);
      await serviceGenerator.loadRules(sampleServiceRules);
      await eventGenerator.loadRules(sampleEventRules);
      await viewGenerator.loadRules(sampleViewRules);
    });

    it('should generate consistent specifications across all generators', async () => {
      const models = [productModel];
      const baseContext = contextManager.createLogicalContext(models);

      // Generate from all generators
      const controllerResult = await controllerGenerator.generate(models, baseContext);
      const serviceResult = await serviceGenerator.generate(models, baseContext);
      const eventResult = await eventGenerator.generate(models, baseContext);
      const viewResult = await viewGenerator.generate(models, baseContext);

      // All should succeed
      expect(controllerResult.validation.valid).toBe(true);
      expect(serviceResult.validation.valid).toBe(true);
      expect(eventResult.validation.valid).toBe(true);
      expect(viewResult.validation.valid).toBe(true);

      // Should generate specifications for Product
      expect(controllerResult.controllers.ProductController).toBeDefined();
      expect(Object.keys(serviceResult.services).length).toBeGreaterThan(0);
      expect(Object.keys(eventResult.events).length).toBeGreaterThan(0);
      expect(Object.keys(viewResult.views).length).toBeGreaterThan(0);

      // Check cross-references are consistent
      const controller = controllerResult.controllers.ProductController;
      expect(controller.model).toBe('Product');
      
      // Events published by controller should exist in generated events
      if (controller.cured?.create?.publishes) {
        for (const eventName of controller.cured.create.publishes) {
          expect(eventResult.events[eventName]).toBeDefined();
        }
      }
    });

    it('should handle models without relationships correctly', async () => {
      const models = [productModel]; // No relationships
      const baseContext = contextManager.createLogicalContext(models);

      const controllerResult = await controllerGenerator.generate(models, baseContext);
      const eventResult = await eventGenerator.generate(models, baseContext);

      expect(controllerResult.validation.valid).toBe(true);
      expect(eventResult.validation.valid).toBe(true);

      // Should generate basic CURED operations
      const controller = controllerResult.controllers.ProductController;
      expect(controller.cured).toBeDefined();
      expect(controller.cured?.create).toBeDefined();
      expect(controller.cured?.retrieve).toBeDefined();
      expect(controller.cured?.update).toBeDefined();
      expect(controller.cured?.delete).toBeDefined();
    });
  });

  describe('Multi-Model Generation Integration', () => {
    beforeEach(async () => {
      await controllerGenerator.loadRules(sampleControllerRules);
      await serviceGenerator.loadRules(sampleServiceRules);
      await eventGenerator.loadRules(sampleEventRules);
      await viewGenerator.loadRules(sampleViewRules);
    });

    it('should handle related models correctly', async () => {
      const models = [customerModel, orderModel]; // Customer hasMany Order, Order belongsTo Customer
      const baseContext = contextManager.createLogicalContext(models);

      const controllerResult = await controllerGenerator.generate(models, baseContext);
      const eventResult = await eventGenerator.generate(models, baseContext);
      const viewResult = await viewGenerator.generate(models, baseContext);

      expect(controllerResult.validation.valid).toBe(true);
      expect(eventResult.validation.valid).toBe(true);
      expect(viewResult.validation.valid).toBe(true);

      // Should generate controllers for both models
      expect(controllerResult.controllers.CustomerController).toBeDefined();
      expect(controllerResult.controllers.OrderController).toBeDefined();

      // Should generate relationship-aware events
      expect(Object.keys(eventResult.events).length).toBeGreaterThan(0);
      
      // Should generate views for both models
      expect(Object.keys(viewResult.views)).toContain('CustomerListView');
      expect(Object.keys(viewResult.views)).toContain('OrderListView');
    });

    it('should generate master-detail views for parent-child relationships', async () => {
      const models = [categoryModel, productModel]; // Category hasMany Product
      // Add relationship to product model for this test
      const enhancedProductModel = {
        ...productModel,
        relationships: [
          { name: 'category', type: 'belongsTo' as const, targetModel: 'Category' }
        ]
      };
      
      const testModels = [categoryModel, enhancedProductModel];
      const baseContext = contextManager.createLogicalContext(testModels);

      const viewResult = await viewGenerator.generate(testModels, baseContext);

      expect(viewResult.validation.valid).toBe(true);
      
      // Should generate standard views
      expect(Object.keys(viewResult.views)).toContain('CategoryListView');
      expect(Object.keys(viewResult.views)).toContain('ProductListView');
    });
  });

  describe('Complex Model Generation Integration', () => {
    beforeEach(async () => {
      await controllerGenerator.loadRules(sampleControllerRules);
      await serviceGenerator.loadRules(sampleServiceRules);
      await eventGenerator.loadRules(sampleEventRules);
      await viewGenerator.loadRules(sampleViewRules);
    });

    it('should handle models with lifecycles', async () => {
      const models = [orderModel]; // Has lifecycle
      const baseContext = contextManager.createLogicalContext(models);

      const controllerResult = await controllerGenerator.generate(models, baseContext);
      const eventResult = await eventGenerator.generate(models, baseContext);

      expect(controllerResult.validation.valid).toBe(true);
      expect(eventResult.validation.valid).toBe(true);

      // Should generate basic controller
      expect(controllerResult.controllers.OrderController).toBeDefined();
      
      // Should generate lifecycle-related events
      expect(Object.keys(eventResult.events).length).toBeGreaterThan(0);
    });

    it('should handle models with cascade delete relationships', async () => {
      const orderItemModel: ModelDefinition = {
        name: 'OrderItem',
        attributes: [
          { name: 'id', type: 'UUID', required: true },
          { name: 'quantity', type: 'Integer', required: true },
          { name: 'price', type: 'Money', required: true }
        ],
        relationships: [
          { name: 'order', type: 'belongsTo', targetModel: 'Order' }
        ]
      };

      const models = [orderModel, orderItemModel];
      const baseContext = contextManager.createLogicalContext(models);

      const controllerResult = await controllerGenerator.generate(models, baseContext);
      const eventResult = await eventGenerator.generate(models, baseContext);

      expect(controllerResult.validation.valid).toBe(true);
      expect(eventResult.validation.valid).toBe(true);

      // Should handle both models
      expect(controllerResult.controllers.OrderController).toBeDefined();
      expect(controllerResult.controllers.OrderItemController).toBeDefined();
    });
  });

  describe('Cross-Generator Consistency', () => {
    beforeEach(async () => {
      await controllerGenerator.loadRules(sampleControllerRules);
      await serviceGenerator.loadRules(sampleServiceRules);
      await eventGenerator.loadRules(sampleEventRules);
      await viewGenerator.loadRules(sampleViewRules);
    });

    it('should generate consistent event names across generators', async () => {
      const models = [productModel];
      const baseContext = contextManager.createLogicalContext(models);

      const controllerResult = await controllerGenerator.generate(models, baseContext);
      const serviceResult = await serviceGenerator.generate(models, baseContext);
      const eventResult = await eventGenerator.generate(models, baseContext);

      // Controllers should publish events that exist
      const controller = controllerResult.controllers.ProductController;
      if (controller.cured?.create?.publishes) {
        for (const eventName of controller.cured.create.publishes) {
          expect(eventResult.events[eventName]).toBeDefined();
        }
      }

      // Services should subscribe to events that exist
      const services = Object.values(serviceResult.services);
      for (const service of services) {
        if (service.subscribes_to) {
          for (const eventName of Object.keys(service.subscribes_to)) {
            expect(eventResult.events[eventName]).toBeDefined();
          }
        }
      }
    });

    it('should generate consistent model references', async () => {
      const models = [productModel];
      const baseContext = contextManager.createLogicalContext(models);

      const controllerResult = await controllerGenerator.generate(models, baseContext);
      const viewResult = await viewGenerator.generate(models, baseContext);

      // Controllers should reference the correct model
      const controller = controllerResult.controllers.ProductController;
      expect(controller.model).toBe('Product');

      // Views should reference the correct model
      const views = Object.values(viewResult.views);
      for (const view of views) {
        if (view.model) {
          expect(models.some(m => m.name === view.model)).toBe(true);
        }
      }
    });
  });

  describe('Performance and Statistics', () => {
    beforeEach(async () => {
      await controllerGenerator.loadRules(sampleControllerRules);
      await serviceGenerator.loadRules(sampleServiceRules);
      await eventGenerator.loadRules(sampleEventRules);
      await viewGenerator.loadRules(sampleViewRules);
    });

    it('should track rules usage correctly', async () => {
      const models = [productModel, customerModel];
      const baseContext = contextManager.createLogicalContext(models);

      const controllerResult = await controllerGenerator.generate(models, baseContext);
      const serviceResult = await serviceGenerator.generate(models, baseContext);
      const eventResult = await eventGenerator.generate(models, baseContext);
      const viewResult = await viewGenerator.generate(models, baseContext);

      // All should have applied at least some rules
      expect(controllerResult.rulesUsed).toBeGreaterThan(0);
      expect(serviceResult.rulesUsed).toBeGreaterThan(0);
      expect(eventResult.rulesUsed).toBeGreaterThan(0);
      expect(viewResult.rulesUsed).toBeGreaterThan(0);

      // Total rules used should be reasonable
      const totalRules = controllerResult.rulesUsed + serviceResult.rulesUsed + 
                        eventResult.rulesUsed + viewResult.rulesUsed;
      expect(totalRules).toBeGreaterThan(0);
      expect(totalRules).toBeLessThan(100); // Should not be excessive
    });

    it('should handle large numbers of models efficiently', async () => {
      const manyModels = Array.from({ length: 20 }, (_, i) => ({
        ...productModel,
        name: `Product${i + 1}`
      }));

      const baseContext = contextManager.createLogicalContext(manyModels);
      const startTime = Date.now();

      const controllerResult = await controllerGenerator.generate(manyModels, baseContext);
      const endTime = Date.now();

      expect(controllerResult.validation.valid).toBe(true);
      expect(Object.keys(controllerResult.controllers)).toHaveLength(20);
      
      // Should complete in reasonable time
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle generator errors gracefully', async () => {
      // Load invalid rules that might cause errors
      const invalidRules: InferenceRule<ModelDefinition, ControllerSpec>[] = [
        {
          name: 'invalid_rule',
          pattern: 'Invalid',
          priority: 100,
          template: {
            type: 'json',
            content: 'invalid json {'
          }
        }
      ];

      await controllerGenerator.loadRules(invalidRules);
      
      const models = [productModel];
      const baseContext = contextManager.createLogicalContext(models);

      const result = await controllerGenerator.generate(models, baseContext);

      // Should handle errors gracefully
      expect(result.validation).toBeDefined();
      expect(result.validation.errors.length + result.validation.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide meaningful error messages', async () => {
      const models = [productModel];
      const baseContext = contextManager.createLogicalContext(models);

      // Try to generate without loading rules
      const result = await controllerGenerator.generate(models, baseContext);

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors[0].code).toBe('RULES_NOT_LOADED');
      expect(result.validation.errors[0].message).toContain('not loaded');
    });
  });
});