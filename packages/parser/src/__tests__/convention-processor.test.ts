/**
 * SpecVerse v3.0 Convention Processor Tests
 * 
 * Tests for all convention parsing patterns and grammar fixes
 */

import { describe, it, expect } from 'vitest';
import { ConventionProcessor } from '../convention-processor.js';

describe('ConventionProcessor', () => {
  const processor = new ConventionProcessor();

  describe('processPrimitives', () => {
    it('should process basic primitive type', () => {
      const primitives = processor.processPrimitives({
        ProductCode: 'String'
      });
      
      expect(primitives).toHaveLength(1);
      expect(primitives[0]).toEqual({
        name: 'ProductCode',
        baseType: 'String',
        description: 'Custom type: ProductCode',
        validation: {},
        typeAlias: true
      });
    });

    it('should process primitive with pattern validation', () => {
      const primitives = processor.processPrimitives({
        ProductCode: "String pattern='^[A-Z]{3}-\\d{4}$'"
      });
      
      expect(primitives).toHaveLength(1);
      expect(primitives[0]).toEqual({
        name: 'ProductCode',
        baseType: 'String',
        description: 'Custom type: ProductCode',
        validation: {
          pattern: "^[A-Z]{3}-\\d{4}$"
        },
        typeAlias: true
      });
    });

    it('should process primitive with enum values', () => {
      const primitives = processor.processPrimitives({
        Status: "String values=['active', 'inactive', 'pending']"
      });
      
      expect(primitives).toHaveLength(1);
      expect(primitives[0]).toEqual({
        name: 'Status',
        baseType: 'String',
        description: 'Custom type: Status',
        validation: {
          values: ['active', 'inactive', 'pending']
        },
        typeAlias: true
      });
    });

    it('should process primitive with numeric constraints', () => {
      const primitives = processor.processPrimitives({
        Age: 'Integer min=0 max=150'
      });
      
      expect(primitives).toHaveLength(1);
      expect(primitives[0]).toEqual({
        name: 'Age',
        baseType: 'Integer',
        description: 'Custom type: Age',
        validation: {
          min: 0,
          max: 150
        },
        typeAlias: true
      });
    });

    it('should process primitive with custom description', () => {
      const primitives = processor.processPrimitives({
        Email: "String description='Email address' pattern='^[^@]+@[^@]+\\.[^@]+$'"
      });
      
      expect(primitives).toHaveLength(1);
      expect(primitives[0]).toEqual({
        name: 'Email',
        baseType: 'String',
        description: 'Email address',
        validation: {
          pattern: "^[^@]+@[^@]+\\.[^@]+$"
        },
        typeAlias: true
      });
    });

    it('should process primitive with required and unique modifiers', () => {
      const primitives = processor.processPrimitives({
        UserId: 'String required unique'
      });
      
      expect(primitives).toHaveLength(1);
      expect(primitives[0]).toEqual({
        name: 'UserId',
        baseType: 'String',
        description: 'Custom type: UserId',
        required: true,
        unique: true,
        validation: {},
        typeAlias: true
      });
    });

    it('should process primitive with format validation', () => {
      const primitives = processor.processPrimitives({
        UUID: 'String format=uuid'
      });
      
      expect(primitives).toHaveLength(1);
      expect(primitives[0]).toEqual({
        name: 'UUID',
        baseType: 'String',
        description: 'Custom type: UUID',
        validation: {
          format: 'uuid'
        },
        typeAlias: true
      });
    });

    it('should process multiple primitives', () => {
      const primitives = processor.processPrimitives({
        ProductCode: "String pattern='^[A-Z]{3}-\\d{4}$'",
        Status: "String values=['active', 'inactive']",
        Email: 'String format=email'
      });
      
      expect(primitives).toHaveLength(3);
      expect(primitives.map(p => p.name)).toEqual(['ProductCode', 'Status', 'Email']);
      expect(primitives[0].validation.pattern).toBe("^[A-Z]{3}-\\d{4}$");
      expect(primitives[1].validation.values).toEqual(['active', 'inactive']);
      expect(primitives[2].validation.format).toBe('email');
    });

    it('should handle already expanded primitive definition', () => {
      const primitives = processor.processPrimitives({
        CustomType: {
          name: 'CustomType',
          baseType: 'String',
          description: 'Already expanded',
          typeAlias: true,
          validation: {
            pattern: '^test$'
          }
        }
      });
      
      expect(primitives).toHaveLength(1);
      expect(primitives[0]).toEqual({
        name: 'CustomType',
        baseType: 'String',
        description: 'Already expanded',
        typeAlias: true,
        validation: {
          pattern: '^test$'
        }
      });
    });
  });

  describe('parsePrimitiveConvention', () => {
    it('should parse complex convention string correctly', () => {
      // This tests the smartSplit functionality
      const result = processor.parsePrimitiveConvention(
        'ComplexType', 
        "String pattern='^[A-Z]+$' values=['ONE', 'TWO', 'THREE'] description='Complex type' required unique"
      );
      
      expect(result).toEqual({
        name: 'ComplexType',
        baseType: 'String',
        description: 'Complex type',
        required: true,
        unique: true,
        validation: {
          pattern: "^[A-Z]+$",
          values: ['ONE', 'TWO', 'THREE']
        },
        typeAlias: true
      });
    });

    it('should handle empty validation arrays', () => {
      const result = processor.parsePrimitiveConvention('EmptyValues', "String values=[]");
      
      expect(result.validation.values).toEqual([]);
    });

    it('should handle single value in array', () => {
      const result = processor.parsePrimitiveConvention('Single', "String values=['only']");

      expect(result.validation.values).toEqual(['only']);
    });
  });

  describe('Full Model Processing', () => {
    it('should process complete model with all features', () => {
      const yamlData = {
        components: {
          TestComponent: {
            version: '1.0.0',
            models: {
              User: {
                description: 'User model with all features',
                attributes: {
                  id: 'UUID required unique auto=uuid4',
                  email: 'Email required unique verified',
                  name: 'String required min=2 max=100',
                  status: 'String required default=pending'
                },
                relationships: {
                  posts: 'hasMany Post cascade',
                  profile: 'hasOne UserProfile eager'
                },
                lifecycles: {
                  account: {
                    flow: 'pending -> active -> suspended'
                  },
                  verification: {
                    states: ['unverified', 'verified'],
                    transitions: {
                      verify: 'unverified -> verified'
                    }
                  }
                },
                behaviors: {
                  authenticate: {
                    description: 'Authenticate user',
                    parameters: {
                      password: 'String required min=8'
                    },
                    returns: 'AuthToken',
                    requires: ['user active'],
                    ensures: ['token issued']
                  }
                }
              }
            }
          }
        }
      };
      
      const result = processor.process(yamlData);
      
      expect(result.components).toHaveLength(1);
      const component = result.components[0];
      expect(component.models).toHaveLength(1);
      const user = component.models[0];
      
      expect(user.name).toBe('User');
      expect(user.attributes).toHaveLength(4);
      expect(user.relationships).toHaveLength(2);
      expect(user.lifecycles).toHaveLength(2);
      expect(user.behaviors.authenticate).toBeDefined();
      
      // Test specific attribute
      const emailAttr = user.attributes.find(a => a.name === 'email');
      expect(emailAttr?.type).toBe('Email');
      expect(emailAttr?.required).toBe(true);
      expect(emailAttr?.unique).toBe(true);
      expect(emailAttr?.verified).toBe(true);
      
      // Test lifecycle
      const accountLifecycle = user.lifecycles.find(lc => lc.name === 'account');
      expect(accountLifecycle?.type).toBe('shorthand');
      expect(accountLifecycle?.states).toEqual(['pending', 'active', 'suspended']);
      expect(accountLifecycle?.actions).toEqual(['to_active', 'to_suspended']);
    });
  });

  describe('Full Controller Processing - Issues 7 & 8 Fixes', () => {
    it('should process controller with CURED operations and subscriptions', () => {
      const yamlData = {
        components: {
          TestComponent: {
            version: '1.0.0',
            controllers: {
              UserController: {
                model: 'User',
                subscribes_to: {
                  PaymentProcessed: 'handlePayment',
                  OrderShipped: 'updateOrderHistory'
                },
                cured: {
                  create: {
                    parameters: {
                      userData: 'UserCreateRequest required'
                    },
                    returns: 'User',
                    publishes: ['UserCreated']
                  },
                  retrieve: {
                    parameters: {
                      id: 'UUID required'
                    },
                    returns: 'User'
                  },
                  retrieve_many: {
                    parameters: {
                      limit: 'Integer optional default=20'
                    },
                    returns: 'User[]'
                  },
                  evolve: {
                    parameters: {
                      id: 'UUID required',
                      lifecycle: 'String required',
                      action: 'String required'
                    },
                    returns: 'User'
                  }
                }
              }
            }
          }
        }
      };
      
      const result = processor.process(yamlData);
      
      expect(result.components).toHaveLength(1);
      const component = result.components[0];
      expect(component.controllers).toHaveLength(1);
      const controller = component.controllers[0];
      
      expect(controller.name).toBe('UserController');
      expect(controller.model).toBe('User'); // Issue 7 fix

      // Test subscriptions (Issue 1 fix)
      expect(controller.subscriptions.events).toEqual(['PaymentProcessed', 'OrderShipped']);
      expect(controller.subscriptions.handlers.PaymentProcessed).toBe('handlePayment');
      
      // Test CURED operations (Issue 8 fix)
      expect(controller.cured.create).toBeDefined();
      expect(controller.cured.retrieve).toBeDefined();
      expect(controller.cured.retrieve_many).toBeDefined(); // Dual retrieve
      expect(controller.cured.evolve).toBeDefined(); // Lifecycle evolve
      
      // Test evolve operation specifically
      const evolveOp = controller.cured.evolve!;
      expect(evolveOp.parameters.lifecycle.type).toBe('String');
      expect(evolveOp.parameters.action.type).toBe('String');
    });
  });
});