/**
 * LifecyclePlugin - State machine and lifecycle diagrams
 *
 * Supports:
 * - lifecycle-state-machine: Individual lifecycle state machines for models
 * - lifecycle-overview: All lifecycles in a component
 */

import { BaseDiagramPlugin } from '../../core/BaseDiagramPlugin.js';
import {
  DiagramType,
  DiagramContext,
  MermaidDiagram,
  MermaidState,
  MermaidTransition,
  ValidationResult
} from '../../types/index.js';
import { SpecVerseAST, ModelSpec, LifecycleSpec } from '@specverse/types';

export class LifecyclePlugin extends BaseDiagramPlugin {
  name = 'lifecycle-plugin';
  version = '1.0.0';
  description = 'State machine and lifecycle diagrams for model lifecycles';
  supportedTypes: DiagramType[] = ['lifecycle'];

  /**
   * Generate diagram based on type
   */
  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    this.validateType(type);

    switch (type) {
      case 'lifecycle':
        return this.generateStateMachines(context);
      default:
        throw new Error(`Unsupported diagram type: ${type}`);
    }
  }

  /**
   * Validate AST for lifecycle diagram generation
   */
  validate(ast: SpecVerseAST): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for models with lifecycles
    const allModels = ast.components.flatMap(c => c.models);
    const modelsWithLifecycles = allModels.filter(m => m.lifecycles && m.lifecycles.length > 0);

    if (modelsWithLifecycles.length === 0) {
      errors.push('No model lifecycles found - lifecycle diagrams require models with lifecycle definitions');
    } else {
      // Validate lifecycle definitions
      modelsWithLifecycles.forEach(model => {
        model.lifecycles.forEach(lifecycle => {
          if (!lifecycle.states || lifecycle.states.length === 0) {
            errors.push(`Lifecycle "${lifecycle.name}" in model "${model.name}" has no states`);
          }

          if (lifecycle.states.length === 1) {
            warnings.push(`Lifecycle "${lifecycle.name}" in model "${model.name}" has only one state`);
          }

          // Check for unreachable states in explicit transitions
          if (lifecycle.transitions && lifecycle.type !== 'shorthand') {
            const reachableStates = new Set<string>();
            reachableStates.add(lifecycle.states[0]); // Initial state

            Object.values(lifecycle.transitions).forEach(transition => {
              reachableStates.add(transition.from);
              reachableStates.add(transition.to);
            });

            lifecycle.states.forEach(state => {
              if (!reachableStates.has(state)) {
                warnings.push(`State "${state}" in lifecycle "${lifecycle.name}" may be unreachable`);
              }
            });
          }
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate state machine diagrams for all lifecycles
   */
  private generateStateMachines(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('stateDiagram', 'TD');
    diagram.title = context.options.title || 'Model Lifecycles';

    const allModels = context.getAllModels();
    const modelsWithLifecycles = allModels.filter(m => m.lifecycles && m.lifecycles.length > 0);

    if (modelsWithLifecycles.length === 0) {
      // Create empty state
      diagram.states = [
        {
          name: 'NoLifecycles',
          label: 'No Model Lifecycles Defined',
          type: 'normal'
        }
      ];
      return diagram;
    }

    // Generate state machines for each lifecycle
    diagram.lifecycles = [];

    modelsWithLifecycles.forEach(model => {
      model.lifecycles.forEach(lifecycle => {
        const lifecycleDiagram: any = {
          modelName: model.name,
          lifecycleName: lifecycle.name,
          states: [],
          transitions: []
        };

        // Add states
        lifecycle.states.forEach((stateName, index) => {
          const isInitial = index === 0;
          const isFinal = this.isFinalState(stateName, index, lifecycle.states.length);
          const state: MermaidState = {
            name: `${model.name}_${lifecycle.name}_${stateName}`,
            label: stateName,
            type: isInitial ? 'start' : (isFinal ? 'end' : 'normal'),
            metadata: {
              modelName: model.name,
              lifecycleName: lifecycle.name,
              isInitial,
              isFinal
            }
          };

          lifecycleDiagram.states.push(state);
        });

        // Add transitions based on lifecycle type
        if (lifecycle.type === 'shorthand') {
          // Automatic sequential transitions
          for (let i = 0; i < lifecycle.states.length - 1; i++) {
            const transition: MermaidTransition = {
              from: `${model.name}_${lifecycle.name}_${lifecycle.states[i]}`,
              to: `${model.name}_${lifecycle.name}_${lifecycle.states[i + 1]}`,
              label: undefined
            };
            lifecycleDiagram.transitions.push(transition);
          }
        } else if (lifecycle.transitions) {
          // Explicit transitions
          Object.entries(lifecycle.transitions).forEach(([action, transitionDef]) => {
            const trans = transitionDef as any;
            const label = trans.condition ? `${action} [${trans.condition}]` : action;
            const transition: MermaidTransition = {
              from: `${model.name}_${lifecycle.name}_${trans.from}`,
              to: `${model.name}_${lifecycle.name}_${trans.to}`,
              label: label
            };
            lifecycleDiagram.transitions.push(transition);
          });
        }

        // Add initial transition
        if (lifecycle.states.length > 0) {
          lifecycleDiagram.transitions.unshift({
            from: '[*]',
            to: `${model.name}_${lifecycle.name}_${lifecycle.states[0]}`,
            label: 'start'
          });
        }

        // Add final transition if applicable
        const lastState = lifecycle.states[lifecycle.states.length - 1];
        if (this.isFinalState(lastState, lifecycle.states.length - 1, lifecycle.states.length)) {
          lifecycleDiagram.transitions.push({
            from: `${model.name}_${lifecycle.name}_${lastState}`,
            to: '[*]',
            label: 'end'
          });
        }

        diagram.lifecycles!.push(lifecycleDiagram);
      });
    });

    return diagram;
  }

  /**
   * Helper: Determine if a state is a final state
   */
  private isFinalState(stateName: string, index: number, totalStates: number): boolean {
    const lowerState = stateName.toLowerCase();
    const finalKeywords = ['complete', 'completed', 'archived', 'deleted', 'closed', 'finished', 'terminated'];

    // Check if it's the last state and has a final keyword
    return index === totalStates - 1 && finalKeywords.some(keyword => lowerState.includes(keyword));
  }

  /**
   * Get default options for lifecycle diagrams
   */
  getDefaultOptions() {
    return {
      includeLifecycles: true,
      title: 'Model Lifecycles'
    };
  }
}
