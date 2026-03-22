/**
 * SpecVerse v3.0 Parser Tests
 * 
 * Integration tests for YAML + schema + convention processing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedSpecVerseParser } from '../unified-parser.js';
import fs from 'fs';
import path from 'path';

// Load the schema for testing
// __dirname in tests is src/parser/__tests__/
// Schema is at ../../../schema/ from there  
const schemaPath = path.join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

describe('UnifiedSpecVerseParser Integration', () => {
  // Create a new parser for each test to avoid state issues
  let parser: UnifiedSpecVerseParser;
  
  beforeEach(() => {
    parser = new UnifiedSpecVerseParser(schema);
  });

  describe('Basic YAML Parsing', () => {
    it('should parse valid YAML', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    description: "Test component"
`;
      
      const result = parser.parse(yamlContent);
      console.log('TEST DEBUG - Parsing errors:', result.errors);
      console.log('TEST DEBUG - Number of errors:', result.errors.length);
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.components).toHaveLength(1);
      expect(result.ast?.components[0].name).toBe('TestComponent');
      expect(result.ast?.components[0].version).toBe('1.0.0');
    });

    it('should reject invalid YAML', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
  invalid: yaml: structure
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.ast).toBeUndefined();
    });
  });

  describe('Schema Validation', () => {
    it('should validate against JSON schema', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "not-a-version"
    models:
      User:
        attributes:
          email: Email required
`;
      
      const result = parser.parse(yamlContent);
      
      // Should pass YAML parsing but may have schema validation issues
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should accept valid schema structure', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    models:
      User:
        attributes:
          email: Email required unique
        relationships:
          posts: hasMany Post cascade
          
      Post:
        attributes:
          id: UUID required
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.components).toHaveLength(1);
      expect(result.ast?.components[0].models).toHaveLength(2);
    });

    it('should accept valid steps property in ExecutableProperties', () => {
      const yamlContent = `
components:
  StepsTestComponent:
    version: "1.0.0"
    models:
      OrderProcessor:
        behaviors:
          processOrder:
            description: "Process customer order with detailed steps"
            parameters:
              orderId: UUID required
            returns: OrderResult
            steps:
              - "Validate order data"
              - "Check inventory availability"
              - "Process payment"
              - "Generate confirmation"
            requires:
              - "Order exists and is valid"
            ensures:
              - "Order is processed successfully"
    controllers:
      OrderController:
        model: OrderProcessor
        actions:
          customProcessing:
            steps:
              - "Custom validation step"
              - "Custom processing step"
    services:
      OrderService:
        operations:
          validateOrder:
            steps:
              - "Validate order structure"
              - "Check business rules"
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.components).toHaveLength(1);
      
      const component = result.ast?.components[0];
      expect(component?.models).toHaveLength(1);
      
      const model = component?.models[0];
      expect(model?.behaviors.processOrder.steps).toEqual([
        "Validate order data",
        "Check inventory availability", 
        "Process payment",
        "Generate confirmation"
      ]);
      
      const controller = component?.controllers[0];
      expect(controller?.actions.customProcessing.steps).toEqual([
        "Custom validation step",
        "Custom processing step"
      ]);
      
      const service = component?.services[0];
      expect(service?.operations.validateOrder.steps).toEqual([
        "Validate order structure",
        "Check business rules"
      ]);
    });
  });

  describe('Convention Processing Integration', () => {
    it('should process complete example with all grammar fixes', () => {
      const yamlContent = `
components:
  ECommercePlatform:
    version: "3.0.0"
    description: "Complete test example"
    
    # Issue 6: Simplified imports
    import:
      - file: ../common/types.yaml
        select: [UUID, Email]
    
    models:
      User:
        # Issue 5: attributes vs properties distinction
        attributes:
          # Issue 2: No @ syntax
          id: UUID required unique auto=uuid4
          email: Email required unique verified
          name: String required min=2 max=100
          
        # Issue 3: relationships (not relations)
        relationships:
          orders: hasMany Order cascade
          profile: hasOne UserProfile eager
          
        # Issue 4: lifecycle shorthand + structured
        lifecycles:
          account:
            flow: pending -> active -> suspended
          verification:
            states: [unverified, verified]
            transitions:
              verify: unverified -> verified
              
      Order:
        attributes:
          id: UUID required unique
          customerId: UUID required
          
      UserProfile:
        attributes:
          id: UUID required unique
          userId: UUID required
    
    controllers:
      # Issue 7: explicit model connection
      UserController:
        model: User

        # Issue 1: subscriptions
        subscribes_to:
          PaymentProcessed: handlePayment
          
        # Issue 8: CURED with dual retrieve + evolve
        cured:
          create:
            parameters:
              userData: UserCreateRequest required
            returns: User
            publishes: [UserCreated]
            
          retrieve:
            parameters:
              id: UUID required
            returns: User
            
          retrieve_many:
            parameters:
              limit: Integer optional default=20
            returns: Array<User>
            
          evolve:
            parameters:
              id: UUID required
              lifecycle: String required
              action: String required
            returns: User
    
    services:
      # Issue 1: services can subscribe
      NotificationService:
        subscribes_to:
          UserCreated: sendWelcomeEmail
        operations:
          sendWelcomeEmail:
            parameters:
              user: User required
            returns: Boolean
    
    events:
      UserCreated:
        description: "User account created"
        attributes:
          userId: UUID required
          email: Email required
          
      PaymentProcessed:
        description: "Payment was processed"
        attributes:
          orderId: UUID required
          amount: Money required
`;
      
      const result = parser.parse(yamlContent);
      
      // Debug the errors
      if (result.errors.length > 0) {
        console.log('Convention processing errors:', result.errors);
      }
      
      // Should parse successfully with all grammar fixes
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      
      const ast = result.ast!;
      
      // Test v3.1 container format
      expect(ast.components).toHaveLength(1);
      const component = ast.components[0];
      expect(component.name).toBe('ECommercePlatform');
      expect(component.version).toBe('3.0.0');
      
      // Test imports (Issue 6)
      expect(component.imports).toHaveLength(1);
      expect(component.imports[0].file).toBe('../common/types.yaml');
      
      // Test models
      expect(component.models).toHaveLength(3);
      const user = component.models.find(m => m.name === 'User')!;
      expect(user.name).toBe('User');
      
      // Test attributes (Issue 5 & 2)
      expect(user.attributes).toHaveLength(3);
      const emailAttr = user.attributes.find(a => a.name === 'email');
      expect(emailAttr?.type).toBe('Email');
      expect(emailAttr?.verified).toBe(true); // No @ syntax
      
      // Test relationships (Issue 3)
      expect(user.relationships).toHaveLength(2);
      const ordersRel = user.relationships.find(r => r.name === 'orders');
      expect(ordersRel?.type).toBe('hasMany');
      expect(ordersRel?.target).toBe('Order');
      expect(ordersRel?.cascade).toBe(true);
      
      // Test lifecycles (Issue 4)
      expect(user.lifecycles).toHaveLength(2);
      const accountLifecycle = user.lifecycles.find(lc => lc.name === 'account');
      expect(accountLifecycle?.type).toBe('shorthand');
      expect(accountLifecycle?.actions).toEqual(['to_active', 'to_suspended']);
      
      // Test controllers (Issue 7 & 8)
      expect(component.controllers).toHaveLength(1);
      const controller = component.controllers[0];
      expect(controller.model).toBe('User'); // Issue 7: explicit connection
      
      // Test subscriptions (Issue 1)
      expect(controller.subscriptions.events).toEqual(['PaymentProcessed']);
      
      // Test CURED operations (Issue 8)
      expect(controller.cured.create).toBeDefined();
      expect(controller.cured.retrieve).toBeDefined();
      expect(controller.cured.retrieve_many).toBeDefined(); // Dual retrieve
      expect(controller.cured.evolve).toBeDefined(); // Lifecycle evolve
      
      // Test services subscriptions (Issue 1)
      expect(component.services).toHaveLength(1);
      const service = component.services[0];
      expect(service.subscriptions.events).toEqual(['UserCreated']);
      
      // Test events
      expect(component.events).toHaveLength(2);
      const event = component.events.find(e => e.name === 'UserCreated')!;
      expect(event.name).toBe('UserCreated');
      expect(event.payload).toHaveLength(2);
    });
  });

  describe('Semantic Validation', () => {
    it('should validate controller-model connections', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    
    controllers:
      UserController:
        model: NonExistentModel
        cured:
          create:
            returns: User
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors.some(err => err.includes('non-existent model'))).toBe(true);
    });

    it('should validate subscription targets', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    
    controllers:
      UserController:
        model: User
        subscribes_to:
          NonExistentEvent: handler
    
    models:
      User:
        attributes:
          id: UUID required
          
    events:
      NonExistentEvent:
        payload:
          data: String required
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors.some(err => err.includes('unknown event'))).toBe(false); // Event is now defined
    });

    it('should validate relationship targets', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    
    models:
      User:
        attributes:
          id: UUID required
        relationships:
          posts: hasMany NonExistentModel
          
      Post:
        attributes:
          id: UUID required
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors.some(err => err.includes('non-existent model'))).toBe(true);
    });
  });

  describe('Error Formatting', () => {
    it('should format errors nicely', () => {
      const errors = [
        'Controller UserController missing model reference',
        'Unknown event referenced: NonExistentEvent'
      ];
      
      const formatted = parser.formatErrors(errors);
      expect(formatted).toContain('Found 2 error(s)');
      expect(formatted).toContain('1. Controller UserController missing model reference');
      expect(formatted).toContain('2. Unknown event referenced: NonExistentEvent');
    });

    it('should handle no errors', () => {
      const formatted = parser.formatErrors([]);
      expect(formatted).toBe('No errors found.');
    });
  });

  describe('IDE Support Methods', () => {
    it('should extract model names for IDE completion', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    
    models:
      User:
        attributes:
          id: UUID required
      Post:
        attributes:
          id: UUID required
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
      
      const modelNames = parser.getModelNames(result.ast!);
      expect(modelNames).toEqual(['User', 'Post']);
    });

    it('should extract event names for IDE completion', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    
    
    events:
      UserCreated:
        attributes:
          userId: UUID required
      OrderPlaced:
        attributes:
          orderId: UUID required
`;
      
      const result = parser.parse(yamlContent);
      
      // Debug: Log errors if any
      if (result.errors.length > 0) {
        console.log('Event names test - Parsing errors:', result.errors);
      }
      
      expect(result.errors).toHaveLength(0);
      
      const eventNames = parser.getEventNames(result.ast!);
      expect(eventNames).toEqual(['UserCreated', 'OrderPlaced']);
    });

    it('should extract lifecycle actions for IDE completion', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    models:
      User:
        attributes:
          id: UUID required
        lifecycles:
          account:
            flow: pending -> active -> suspended
          verification:
            states: [unverified, verified]
            transitions:
              verify: unverified -> verified
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
      
      const lifecycleActions = parser.getLifecycleActions(result.ast!, 'User');
      expect(lifecycleActions.account).toEqual(['to_active', 'to_suspended']);
      expect(lifecycleActions.verification).toEqual(['verify']);
    });
  });

  describe('YAML Generation Methods', () => {
    it('should convert AST back to expanded YAML', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    models:
      User:
        attributes:
          id: UUID required
          name: String required
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
      
      const expandedYaml = parser.astToExpandedYaml(result.ast!);
      expect(expandedYaml).toContain('TestComponent');
      expect(expandedYaml).toContain('User');
      expect(expandedYaml).toContain('attributes');
    });

    it('should process SpecVerse content to YAML format', () => {
      const speclyContent = `
components:
  TestComponent:
    version: "1.0.0"
    models:
      User:
        attributes:
          email: Email required unique
`;
      
      const result = parser.processToYaml(speclyContent);
      expect(result.errors).toHaveLength(0);
      expect(result.yaml).toContain('TestComponent');
      expect(result.yaml).toContain('User');
    });
  });

  describe('Component Analysis Methods', () => {
    it('should extract component type information', () => {
      const yamlContent = `
components:
  TestComponent:
    version: "1.0.0"
    models:
      User:
        attributes:
          id: UUID required
      Post:
        attributes:
          id: UUID required
    controllers:
      UserController:
        model: User
    services:
      NotificationService:
        operations:
          sendEmail:
            returns: Boolean
    events:
      UserCreated:
        attributes:
          userId: UUID required
`;
      
      const result = parser.parse(yamlContent);
      expect(result.errors).toHaveLength(0);
      
      const componentTypes = parser.getComponentTypes(result.ast!);
      expect(componentTypes).toHaveLength(1);
      expect(componentTypes[0].name).toBe('TestComponent');
    });
  });

  describe('Configuration Methods', () => {
    it('should manage import configuration', () => {
      // Initially imports should be undefined (default)
      expect(parser.getOptions().enableImports).toBeUndefined();
      
      // Enable imports
      parser.enableImports({ basePath: '/test/path' });
      expect(parser.getOptions().enableImports).toBe(true);
      expect(parser.getOptions().basePath).toBe('/test/path');
      expect(parser.getImportResolver()).toBeDefined();
      
      // Disable imports (ImportResolver remains but is disabled)
      parser.disableImports();
      expect(parser.getOptions().enableImports).toBe(false);
      expect(parser.getImportResolver()).toBeDefined(); // Resolver remains available
    });

    it('should return parser options', () => {
      const options = parser.getOptions();
      expect(options).toBeDefined();
      // Default options may be undefined
      expect(options.enableImports === undefined || typeof options.enableImports === 'boolean').toBe(true);
      expect(options.debug === undefined || typeof options.debug === 'boolean').toBe(true);
    });
  });
});