import { describe, it, expect } from 'vitest';
import { modelsModule } from '../core/models/index.js';
import { ModelProcessor as OriginalModelProcessor } from '@specverse/engine-parser/processors/ModelProcessor.js';
import type { ProcessorContext } from '@specverse/types';
import type { ModelSpec } from '@specverse/types';

// ============================================================================
// Test Helpers
// ============================================================================

function createContext(): ProcessorContext {
  return {
    warnings: [],
    addWarning(message: string) {
      this.warnings.push(message);
    },
  };
}

// Sample model definitions for testing
const basicModel = {
  User: {
    attributes: {
      name: 'String required',
      email: 'Email required unique verified',
      age: 'Integer min=0 max=150',
    },
    relationships: {
      posts: 'hasMany Post cascade',
      profile: 'hasOne Profile',
    },
  },
};

const modelWithLifecycle = {
  Order: {
    attributes: {
      total: 'Number required',
      notes: 'String',
    },
    lifecycles: {
      status: {
        flow: 'draft -> pending -> confirmed -> shipped -> delivered',
      },
    },
  },
};

const modelWithMetadata = {
  Document: {
    metadata: {
      id: 'uuid',
      audit: true,
      softDelete: true,
      version: true,
    },
    attributes: {
      title: 'String required',
      content: 'String',
    },
  },
};

const modelWithInheritance = {
  BaseEntity: {
    attributes: {
      name: 'String required',
      createdAt: 'DateTime',
    },
  },
  Employee: {
    extends: 'BaseEntity',
    attributes: {
      department: 'String required',
      salary: 'Number',
    },
  },
};

const modelWithBehaviors = {
  Account: {
    attributes: {
      balance: 'Number required',
    },
    behaviors: {
      deposit: {
        description: 'Add funds to account',
        parameters: {
          amount: 'Number required',
        },
        returns: 'Number',
        ensures: ['balance increases by amount'],
      },
    },
  },
};

const modelWithProfileAttachment = {
  Product: {
    attributes: {
      name: 'String required',
      price: 'Number required',
    },
    'profile-attachment': {
      profiles: ['DigitalProduct', 'PhysicalProduct'],
      priority: 1,
    },
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Models Entity Convention Processor', () => {

  describe('module definition', () => {
    it('should have correct module metadata', () => {
      expect(modelsModule.name).toBe('models');
      expect(modelsModule.type).toBe('core');
      expect(modelsModule.version).toBe('3.5.1');
      expect(modelsModule.dependsOn).toEqual([]);
    });

    it('should have a convention processor', () => {
      expect(modelsModule.conventionProcessor).toBeDefined();
      expect(modelsModule.conventionProcessor!.process).toBeInstanceOf(Function);
    });

    it('should have diagram plugins', () => {
      expect(modelsModule.diagramPlugins).toHaveLength(2);
      expect(modelsModule.diagramPlugins![0].type).toBe('er');
      expect(modelsModule.diagramPlugins![1].type).toBe('class');
    });
  });

  describe('parity with original ModelProcessor', () => {
    const testCases: [string, any][] = [
      ['basic model', basicModel],
      ['model with lifecycle', modelWithLifecycle],
      ['model with metadata', modelWithMetadata],
      ['model with inheritance', modelWithInheritance],
      ['model with behaviors', modelWithBehaviors],
      ['model with profile attachment', modelWithProfileAttachment],
    ];

    for (const [label, modelData] of testCases) {
      it(`should produce identical output for: ${label}`, () => {
        // Run through entity module processor
        const entityContext = createContext();
        const entityResult = modelsModule.conventionProcessor!.process(
          modelData,
          entityContext
        );

        // Run through original processor
        const originalContext = createContext();
        const originalProcessor = new OriginalModelProcessor(originalContext);
        const originalResult = originalProcessor.process(modelData);

        // Compare results
        expect(
          JSON.stringify(entityResult),
          `Output differs for: ${label}`
        ).toBe(JSON.stringify(originalResult));

        // Compare warnings
        expect(entityContext.warnings).toEqual(originalContext.warnings);
      });
    }
  });

  describe('convention expansion', () => {
    it('should expand string attributes into AttributeSpec', () => {
      const context = createContext();
      const result = modelsModule.conventionProcessor!.process(basicModel, context) as ModelSpec[];

      const user = result.find(m => m.name === 'User')!;
      expect(user.attributes).toHaveLength(3);

      const email = user.attributes.find(a => a.name === 'email')!;
      expect(email.type).toBe('Email');
      expect(email.required).toBe(true);
      expect(email.unique).toBe(true);
      expect(email.verified).toBe(true);
    });

    it('should expand string relationships into RelationshipSpec', () => {
      const context = createContext();
      const result = modelsModule.conventionProcessor!.process(basicModel, context) as ModelSpec[];

      const user = result.find(m => m.name === 'User')!;
      expect(user.relationships).toHaveLength(2);

      const posts = user.relationships.find(r => r.name === 'posts')!;
      expect(posts.type).toBe('hasMany');
      expect(posts.target).toBe('Post');
      expect(posts.cascade).toBe(true);
    });

    it('should expand lifecycle flow notation', () => {
      const context = createContext();
      const result = modelsModule.conventionProcessor!.process(modelWithLifecycle, context) as ModelSpec[];

      const order = result.find(m => m.name === 'Order')!;
      expect(order.lifecycles).toHaveLength(1);
      expect(order.lifecycles[0].states).toEqual([
        'draft', 'pending', 'confirmed', 'shipped', 'delivered',
      ]);
      expect(order.lifecycles[0].type).toBe('shorthand');
    });

    it('should expand metadata into synthetic attributes', () => {
      const context = createContext();
      const result = modelsModule.conventionProcessor!.process(modelWithMetadata, context) as ModelSpec[];

      const doc = result.find(m => m.name === 'Document')!;
      const attrNames = doc.attributes.map(a => a.name);

      // Synthetic attributes from metadata
      expect(attrNames).toContain('id');
      expect(attrNames).toContain('createdAt');
      expect(attrNames).toContain('updatedAt');
      expect(attrNames).toContain('createdBy');
      expect(attrNames).toContain('updatedBy');
      expect(attrNames).toContain('deletedAt');
      expect(attrNames).toContain('isDeleted');
      expect(attrNames).toContain('version');

      // User-defined attributes
      expect(attrNames).toContain('title');
      expect(attrNames).toContain('content');
    });

    it('should resolve model inheritance', () => {
      const context = createContext();
      const result = modelsModule.conventionProcessor!.process(modelWithInheritance, context) as ModelSpec[];

      const employee = result.find(m => m.name === 'Employee')!;
      const attrNames = employee.attributes.map(a => a.name);

      // Should have both parent and child attributes
      expect(attrNames).toContain('name');       // from BaseEntity
      expect(attrNames).toContain('createdAt');  // from BaseEntity
      expect(attrNames).toContain('department'); // own
      expect(attrNames).toContain('salary');     // own
    });

    it('should add built-in profile behaviors', () => {
      const context = createContext();
      const result = modelsModule.conventionProcessor!.process(basicModel, context) as ModelSpec[];

      const user = result.find(m => m.name === 'User')!;
      expect(user.behaviors).toHaveProperty('attachProfile');
      expect(user.behaviors).toHaveProperty('detachProfile');
      expect(user.behaviors).toHaveProperty('hasProfile');
    });
  });
});
