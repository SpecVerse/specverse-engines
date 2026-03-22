/**
 * Tests for LifecyclePlugin
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LifecyclePlugin } from '../../plugins/lifecycle/LifecyclePlugin.js';
import { DiagramContext } from '../../core/DiagramContext.js';
import { styleManager } from '../../core/StyleManager.js';
import { MermaidRenderer } from '../../renderers/MermaidRenderer.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

describe('LifecyclePlugin', () => {
  let plugin: LifecyclePlugin;
  let renderer: MermaidRenderer;
  let mockAST: SpecVerseAST;

  beforeEach(() => {
    plugin = new LifecyclePlugin();
    renderer = new MermaidRenderer();

    // Create mock AST with models that have lifecycles
    mockAST = {
      components: [
        {
          name: 'OrderManagement',
          version: '1.0.0',
          models: [
            {
              name: 'Order',
              attributes: [
                { name: 'id', type: 'UUID', required: true }
              ],
              relationships: [],
              lifecycles: [
                {
                  name: 'OrderStatus',
                  type: 'shorthand',
                  states: ['pending', 'confirmed', 'shipped', 'delivered', 'completed'],
                  transitions: {}
                }
              ],
              behaviors: {}
            },
            {
              name: 'Payment',
              attributes: [
                { name: 'id', type: 'UUID', required: true }
              ],
              relationships: [],
              lifecycles: [
                {
                  name: 'PaymentStatus',
                  type: 'explicit',
                  states: ['initiated', 'processing', 'succeeded', 'failed'],
                  transitions: {
                    process: {
                      from: 'initiated',
                      to: 'processing'
                    },
                    succeed: {
                      from: 'processing',
                      to: 'succeeded',
                      condition: 'payment_approved'
                    },
                    fail: {
                      from: 'processing',
                      to: 'failed',
                      condition: 'payment_declined'
                    }
                  }
                }
              ],
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
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('lifecycle-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toContain('lifecycle');
    });

    it('should support correct diagram types', () => {
      expect(plugin.supportedTypes).toContain('lifecycle');
    });

    it('should provide default options', () => {
      const options = plugin.getDefaultOptions();
      expect(options.includeLifecycles).toBe(true);
      expect(options.title).toBe('Model Lifecycles');
    });
  });

  describe('Validation', () => {
    it('should validate AST with lifecycles', () => {
      const result = plugin.validate(mockAST);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with no lifecycles', () => {
      const emptyAST: SpecVerseAST = {
        components: [
          {
            name: 'Empty',
            version: '1.0.0',
            models: [
              {
                name: 'TestModel',
                attributes: [],
                relationships: [],
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

      const result = plugin.validate(emptyAST);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('No model lifecycles found');
    });

    it('should fail validation for lifecycle with no states', () => {
      const invalidAST: SpecVerseAST = {
        components: [
          {
            name: 'Invalid',
            version: '1.0.0',
            models: [
              {
                name: 'BadModel',
                attributes: [],
                relationships: [],
                lifecycles: [
                  {
                    name: 'EmptyLifecycle',
                    type: 'shorthand',
                    states: [],
                    transitions: {}
                  }
                ],
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

      const result = plugin.validate(invalidAST);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('has no states');
    });

    it('should warn about single-state lifecycles', () => {
      const singleStateAST: SpecVerseAST = {
        components: [
          {
            name: 'Simple',
            version: '1.0.0',
            models: [
              {
                name: 'SimpleModel',
                attributes: [],
                relationships: [],
                lifecycles: [
                  {
                    name: 'SimpleLifecycle',
                    type: 'shorthand',
                    states: ['active'],
                    transitions: {}
                  }
                ],
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

      const result = plugin.validate(singleStateAST);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('only one state');
    });
  });

  describe('State Machine Generation', () => {
    it('should generate state machine diagram', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');

      expect(diagram.type).toBe('stateDiagram');
      expect(diagram.lifecycles).toBeDefined();
      expect(diagram.lifecycles!.length).toBeGreaterThan(0);
    });

    it('should handle shorthand lifecycles', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');
      const mermaid = renderer.renderStateDiagram(diagram, context);

      expect(mermaid).toContain('stateDiagram-v2');
      expect(mermaid).toContain('Order');
      expect(mermaid).toContain('OrderStatus');
      expect(mermaid).toContain('pending');
      expect(mermaid).toContain('confirmed');
      expect(mermaid).toContain('shipped');
    });

    it('should create sequential transitions for shorthand type', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');

      const orderLifecycle = diagram.lifecycles!.find(l => l.modelName === 'Order');
      expect(orderLifecycle).toBeDefined();
      expect(orderLifecycle!.transitions.length).toBeGreaterThan(0);

      // Should have transitions: pending->confirmed, confirmed->shipped, etc.
      const pendingTransition = orderLifecycle!.transitions.find(
        t => t.from.includes('pending') && t.to.includes('confirmed')
      );
      expect(pendingTransition).toBeDefined();
    });

    it('should handle explicit transitions', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');
      const mermaid = renderer.renderStateDiagram(diagram, context);

      expect(mermaid).toContain('Payment');
      expect(mermaid).toContain('PaymentStatus');
      expect(mermaid).toContain('process');
      expect(mermaid).toContain('succeed');
      expect(mermaid).toContain('payment_approved');
    });

    it('should include transition labels', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');

      const paymentLifecycle = diagram.lifecycles!.find(l => l.modelName === 'Payment');
      expect(paymentLifecycle).toBeDefined();

      const succeedTransition = paymentLifecycle!.transitions.find(t => t.label?.includes('succeed'));
      expect(succeedTransition).toBeDefined();
      expect(succeedTransition!.label).toContain('payment_approved');
    });

    it('should add initial transition from [*]', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');
      const mermaid = renderer.renderStateDiagram(diagram, context);

      expect(mermaid).toContain('[*]');
    });

    it('should add final transition to [*] for terminal states', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');

      const orderLifecycle = diagram.lifecycles!.find(l => l.modelName === 'Order');
      expect(orderLifecycle).toBeDefined();

      // Should have final transition since last state is 'completed'
      const finalTransition = orderLifecycle!.transitions.find(t => t.to === '[*]');
      expect(finalTransition).toBeDefined();
    });

    it('should not add final transition for non-terminal states', () => {
      const nonTerminalAST: SpecVerseAST = {
        components: [
          {
            name: 'Test',
            version: '1.0.0',
            models: [
              {
                name: 'Task',
                attributes: [],
                relationships: [],
                lifecycles: [
                  {
                    name: 'TaskStatus',
                    type: 'shorthand',
                    states: ['pending', 'active', 'paused'],
                    transitions: {}
                  }
                ],
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

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(nonTerminalAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');

      const taskLifecycle = diagram.lifecycles!.find(l => l.modelName === 'Task');
      const finalTransition = taskLifecycle!.transitions.find(t => t.to === '[*]');
      expect(finalTransition).toBeUndefined();
    });

    it('should handle multiple lifecycles in same model', () => {
      const multiLifecycleAST: SpecVerseAST = {
        components: [
          {
            name: 'Test',
            version: '1.0.0',
            models: [
              {
                name: 'Document',
                attributes: [],
                relationships: [],
                lifecycles: [
                  {
                    name: 'ApprovalStatus',
                    type: 'shorthand',
                    states: ['draft', 'review', 'approved'],
                    transitions: {}
                  },
                  {
                    name: 'PublishStatus',
                    type: 'shorthand',
                    states: ['unpublished', 'published'],
                    transitions: {}
                  }
                ],
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

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(multiLifecycleAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');

      expect(diagram.lifecycles!.length).toBe(2);
      expect(diagram.lifecycles!.some(l => l.lifecycleName === 'ApprovalStatus')).toBe(true);
      expect(diagram.lifecycles!.some(l => l.lifecycleName === 'PublishStatus')).toBe(true);
    });

    it('should handle empty AST gracefully', () => {
      const emptyAST: SpecVerseAST = {
        components: [
          {
            name: 'Empty',
            version: '1.0.0',
            models: [],
            controllers: [],
            services: [],
            views: [],
            events: []
          }
        ],
        deployments: []
      };

      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(emptyAST, {}, theme);

      const diagram = plugin.generate(context, 'lifecycle');

      expect(diagram.states).toBeDefined();
      expect(diagram.states!.length).toBe(1);
      expect(diagram.states![0].name).toBe('NoLifecycles');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported diagram type', () => {
      const theme = styleManager.getTheme('default');
      const context = new DiagramContext(mockAST, {}, theme);

      expect(() => {
        plugin.generate(context, 'er-diagram' as any);
      }).toThrow();
    });
  });
});
