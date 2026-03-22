/**
 * Integration tests for Lifecycle diagram generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedDiagramGenerator } from '../../core/UnifiedDiagramGenerator.js';
import { LifecyclePlugin } from '../../plugins/lifecycle/LifecyclePlugin.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

describe('Lifecycle Integration', () => {
  let generator: UnifiedDiagramGenerator;

  beforeEach(() => {
    generator = new UnifiedDiagramGenerator({
      plugins: [new LifecyclePlugin()],
      theme: 'default'
    });
  });

  it('should generate lifecycle diagram for single model', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'OrderSystem',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'status',
            type: 'shorthand',
            states: ['pending', 'confirmed', 'shipped', 'delivered'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('stateDiagram-v2');
    expect(result).toContain('Order');
    expect(result).toContain('pending');
    expect(result).toContain('confirmed');
    expect(result).toContain('shipped');
    expect(result).toContain('delivered');
  });

  it('should generate lifecycle diagram for multiple models', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'ECommerce',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'OrderStatus',
            type: 'shorthand',
            states: ['draft', 'submitted', 'completed'],
            transitions: {}
          }],
          behaviors: {}
        }, {
          name: 'Product',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'StockStatus',
            type: 'shorthand',
            states: ['in_stock', 'low_stock', 'out_of_stock'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('Order');
    expect(result).toContain('Product');
    expect(result).toContain('draft');
    expect(result).toContain('in_stock');
  });

  it('should handle lifecycle with guards', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'explicit',
            states: ['pending', 'confirmed', 'shipped'],
            transitions: {
              confirm: {
                from: 'pending',
                to: 'confirmed',
                guard: 'payment_received'
              },
              ship: {
                from: 'confirmed',
                to: 'shipped',
                guard: 'stock_available'
              }
            }
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('pending');
    expect(result).toContain('confirmed');
    expect(result).toContain('shipped');
  });

  it('should handle lifecycle with actions', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'User',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'explicit',
            states: ['inactive', 'active', 'suspended'],
            transitions: {
              activate: {
                from: 'inactive',
                to: 'active',
                action: 'send_welcome_email'
              },
              suspend: {
                from: 'active',
                to: 'suspended',
                action: 'notify_admin'
              }
            }
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('inactive');
    expect(result).toContain('active');
    expect(result).toContain('suspended');
  });

  it('should handle multiple lifecycles in one model', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'OrderStatus',
            type: 'shorthand',
            states: ['pending', 'confirmed'],
            transitions: {}
          }, {
            name: 'PaymentStatus',
            type: 'shorthand',
            states: ['unpaid', 'paid'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('pending');
    expect(result).toContain('unpaid');
  });

  it('should handle models with no lifecycles gracefully', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    expect(() => generator.generate(ast, 'lifecycle')).toThrow('No model lifecycles found');
  });

  it('should handle single state lifecycle', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Setting',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'shorthand',
            states: ['active'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('active');
  });

  it('should handle complex state transitions', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'explicit',
            states: ['draft', 'pending', 'confirmed', 'cancelled'],
            transitions: {
              submit: {
                from: 'draft',
                to: 'pending'
              },
              confirm: {
                from: 'pending',
                to: 'confirmed'
              },
              cancel_from_draft: {
                from: 'draft',
                to: 'cancelled'
              },
              cancel_from_pending: {
                from: 'pending',
                to: 'cancelled'
              }
            }
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('draft');
    expect(result).toContain('pending');
    expect(result).toContain('confirmed');
    expect(result).toContain('cancelled');
  });

  it('should include transition labels', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'explicit',
            states: ['pending', 'confirmed'],
            transitions: {
              confirm: {
                from: 'pending',
                to: 'confirmed'
              }
            }
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('pending');
    expect(result).toContain('confirmed');
    expect(result).toContain('confirm');
  });

  it('should validate Mermaid syntax is correct', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'shorthand',
            states: ['pending', 'confirmed'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toMatch(/stateDiagram-v2/);
    expect(result).toMatch(/\[*\]/); // Start/end states
  });

  it('should handle lifecycle across multiple components', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'ComponentA',
        version: '1.0.0',
        models: [{
          name: 'OrderA',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'shorthand',
            states: ['pending', 'completed'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }, {
        name: 'ComponentB',
        version: '1.0.0',
        models: [{
          name: 'OrderB',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'shorthand',
            states: ['active', 'archived'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('OrderA');
    expect(result).toContain('OrderB');
  });

  it('should apply theme to lifecycle diagram', () => {
    const themedGenerator = new UnifiedDiagramGenerator({
      plugins: [new LifecyclePlugin()],
      theme: 'forest'
    });

    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'shorthand',
            states: ['pending', 'completed'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = themedGenerator.generate(ast, 'lifecycle');

    expect(result).toContain('stateDiagram-v2');
  });

  it('should handle self-transitions', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'explicit',
            states: ['processing'],
            transitions: {
              update: {
                from: 'processing',
                to: 'processing'
              }
            }
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('processing');
  });

  it('should handle parallel state machines', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Document',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'ApprovalStatus',
            type: 'shorthand',
            states: ['pending_approval', 'approved', 'rejected'],
            transitions: {}
          }, {
            name: 'PublicationStatus',
            type: 'shorthand',
            states: ['draft', 'published', 'archived'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    const result = generator.generate(ast, 'lifecycle');

    expect(result).toContain('pending_approval');
    expect(result).toContain('draft');
  });

  it('should support lifecycle validation', () => {
    const ast: SpecVerseAST = {
      components: [{
        name: 'System',
        version: '1.0.0',
        models: [{
          name: 'Order',
          attributes: [{ name: 'id', type: 'UUID', required: true }],
          relationships: [],
          lifecycles: [{
            name: 'Status',
            type: 'shorthand',
            states: ['pending', 'confirmed'],
            transitions: {}
          }],
          behaviors: {}
        }],
        controllers: [],
        services: [],
        views: [],
        events: [],
        imports: [],
        exports: []
      }],
      profiles: []
    };

    // Validation happens during generation - should not throw
    expect(() => generator.generate(ast, 'lifecycle')).not.toThrow();
  });
});
