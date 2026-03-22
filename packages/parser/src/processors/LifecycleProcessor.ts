import { AbstractProcessor } from './AbstractProcessor.js';
import { LifecycleSpec } from '../types/ast.js';

export class LifecycleProcessor extends AbstractProcessor<any, LifecycleSpec> {
  /**
   * Process lifecycle definition (shorthand or structured)
   */
  process(name: string, definition: any): LifecycleSpec {
    if (definition.flow) {
      // Shorthand: "draft -> active -> suspended"
      const states = definition.flow.split('->').map((s: string) => s.trim());
      const actions = states.slice(1).map((state: string) => `to_${state}`);
      
      return {
        name,
        type: 'shorthand',
        states,
        actions
      };
    } else if (definition.states && definition.transitions) {
      // Structured: explicit states and transitions
      const transitions: { [action: string]: { from: string; to: string; condition?: string } } = {};
      const actions: string[] = [];
      
      for (const [action, transitionDef] of Object.entries(definition.transitions)) {
        const match = (transitionDef as string).match(/^(\w+)\s*->\s*(\w+)(?:\s+when=(.+))?$/);
        if (match) {
          const [, from, to, condition] = match;
          transitions[action] = { from, to, condition };
          actions.push(action);
        }
      }
      
      return {
        name,
        type: 'structured',
        states: definition.states,
        transitions,
        actions
      };
    }
    
    throw new Error(`Invalid lifecycle definition for ${name}`);
  }
}
