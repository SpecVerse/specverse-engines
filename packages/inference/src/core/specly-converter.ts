/**
 * Converts inference engine output to human-readable .specly format
 */

import { LogicalComponentSpec } from './types.js';

export class SpeclyConverter {
  
  /**
   * Convert a LogicalComponentSpec to .specly format string
   */
  static toSpecly(spec: LogicalComponentSpec, componentName?: string): string {
    let output = '';
    
    // v3.1 format requires components container
    output += 'components:\n';
    
    // Component entry
    const compName = componentName || spec.name || 'GeneratedComponent';
    output += `  ${compName}:\n`;
    
    if (spec.version) {
      output += `    version: "${spec.version}"\n`;
    }

    if (spec.description) {
      output += `    description: "${spec.description}"\n`;
    }

    if ((spec as any).tags && Array.isArray((spec as any).tags) && (spec as any).tags.length > 0) {
      output += `    tags: [${(spec as any).tags.map((t: string) => `"${t}"`).join(', ')}]\n`;
    }

    if ((spec as any).export) {
      output += '    export:\n';
      const exportSection = (spec as any).export;
      if (exportSection.models && Array.isArray(exportSection.models) && exportSection.models.length > 0) {
        output += `      models: [${exportSection.models.join(', ')}]\n`;
      }
      if (exportSection.controllers && Array.isArray(exportSection.controllers) && exportSection.controllers.length > 0) {
        output += `      controllers: [${exportSection.controllers.join(', ')}]\n`;
      }
    }

    // Add empty line after header
    output += '\n';
    
    // Models section
    if (spec.models && Object.keys(spec.models).length > 0) {
      output += '    models:\n';
      for (const [modelName, modelSpec] of Object.entries(spec.models)) {
        output += this.convertModel(modelName, modelSpec, 3);
      }
      output += '\n';
    }
    
    // Controllers section  
    if (spec.controllers && Object.keys(spec.controllers).length > 0) {
      output += '    controllers:\n';
      for (const [controllerName, controllerSpec] of Object.entries(spec.controllers)) {
        output += this.convertController(controllerName, controllerSpec, 3);
      }
      output += '\n';
    }
    
    // Services section
    if (spec.services && Object.keys(spec.services).length > 0) {
      output += '    services:\n';
      for (const [serviceName, serviceSpec] of Object.entries(spec.services)) {
        output += this.convertService(serviceName, serviceSpec, 3);
      }
      output += '\n';
    }
    
    // Events section
    if (spec.events && Object.keys(spec.events).length > 0) {
      output += '    events:\n';
      for (const [eventName, eventSpec] of Object.entries(spec.events)) {
        output += this.convertEvent(eventName, eventSpec, 3);
      }
      output += '\n';
    }
    
    // Views section
    if (spec.views && Object.keys(spec.views).length > 0) {
      output += '    views:\n';
      for (const [viewName, viewSpec] of Object.entries(spec.views)) {
        output += this.convertView(viewName, viewSpec, 3);
      }
      output += '\n';
    }
    
    return output.trim();
  }
  
  private static convertModel(name: string, model: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    let output = `${indent}${name}:\n`;
    
    if (model.description) {
      output += `${indent}  description: "${model.description}"\n`;
    }
    
    // Attributes
    if (model.attributes && Object.keys(model.attributes).length > 0) {
      output += `${indent}  attributes:\n`;
      for (const [attrName, attrSpec] of Object.entries(model.attributes)) {
        output += `${indent}    ${attrName}: ${attrSpec}\n`;
      }
    }
    
    // Relationships
    if (model.relationships && Object.keys(model.relationships).length > 0) {
      output += `${indent}  relationships:\n`;
      for (const [relName, relSpec] of Object.entries(model.relationships)) {
        const rel = relSpec as any;
        // Use SpecLy convention format: relationshipName: type Target modifiers
        let relString = rel.type || 'belongsTo';
        if (rel.target) relString += ` ${rel.target}`;
        if (rel.cascade === true) relString += ' cascade';
        if (rel.eager === true) relString += ' eager';
        output += `${indent}    ${relName}: ${relString}\n`;
      }
    }
    
    // Lifecycles
    if (model.lifecycles && Object.keys(model.lifecycles).length > 0) {
      output += `${indent}  lifecycles:\n`;
      for (const [lifecycleName, lifecycleSpec] of Object.entries(model.lifecycles)) {
        output += `${indent}    ${lifecycleName}:\n`;
        const lifecycle = lifecycleSpec as any;

        // Convert to SpecLy flow format
        if (lifecycle.states && Array.isArray(lifecycle.states)) {
          // Use flow format for simple state sequences
          const flow = lifecycle.states.join(' -> ');
          output += `${indent}      flow: ${flow}\n`;
        }
        // Handle ConventionProcessor shorthand format (type: 'shorthand')
        else if (lifecycle.type === 'shorthand' && lifecycle.states) {
          // Convert back to human-readable flow syntax
          const flow = lifecycle.states.join(' -> ');
          output += `${indent}      flow: ${flow}\n`;
        }
        // Handle ConventionProcessor structured format (type: 'structured')
        else if (lifecycle.type === 'structured') {
          if (lifecycle.states) {
            const flow = lifecycle.states.join(' -> ');
            output += `${indent}      flow: ${flow}\n`;
          }
          if (lifecycle.transitions) {
            output += `${indent}      transitions:\n`;
            for (const [actionName, transition] of Object.entries(lifecycle.transitions)) {
              const trans = transition as any;
              output += `${indent}        ${actionName}: ${trans.from} -> ${trans.to}\n`;
            }
          }
        }
        // Handle legacy transitions array format (backwards compatibility)
        else if (lifecycle.transitions && Array.isArray(lifecycle.transitions)) {
          output += `${indent}      transitions:\n`;
          lifecycle.transitions.forEach((transition: any) => {
            output += `${indent}        ${transition.name}: ${transition.from} -> ${transition.to}\n`;
          });
        }
        // Handle any other properties
        else {
          for (const [key, value] of Object.entries(lifecycle)) {
            if (key !== 'type' && key !== 'states' && key !== 'transitions') {
              output += `${indent}      ${key}: ${value}\n`;
            }
          }
        }
      }
    }

    // Behaviors (Phase 4: Preserve model behaviors)
    if (model.behaviors && Object.keys(model.behaviors).length > 0) {
      output += `${indent}  behaviors:\n`;
      for (const [behaviorName, behaviorSpec] of Object.entries(model.behaviors)) {
        const behavior = behaviorSpec as any;
        output += `${indent}    ${behaviorName}:\n`;

        if (behavior.description) {
          output += `${indent}      description: "${behavior.description}"\n`;
        }

        if (behavior.parameters && Object.keys(behavior.parameters).length > 0) {
          output += `${indent}      parameters:\n`;
          for (const [paramName, paramSpec] of Object.entries(behavior.parameters)) {
            // Handle both string and object parameter formats
            let paramString: string;
            if (typeof paramSpec === 'string') {
              paramString = paramSpec;
            } else if (typeof paramSpec === 'object' && paramSpec !== null) {
              // Object format: { type: 'Integer', default: 1 } or { type: 'String', required: true }
              const spec = paramSpec as any;
              paramString = spec.type || 'String';
              if (spec.required) paramString += ' required';
              else if (spec.optional) paramString += ' optional';
              if (spec.default !== undefined) paramString += ` default=${spec.default}`;
            } else {
              paramString = 'String required';
            }
            output += `${indent}        ${paramName}: ${paramString}\n`;
          }
        }

        if (behavior.returns) {
          output += `${indent}      returns: ${behavior.returns}\n`;
        }

        if (behavior.requires && Array.isArray(behavior.requires) && behavior.requires.length > 0) {
          // Use inline format for short arrays (convention syntax)
          if (behavior.requires.length <= 3) {
            const items = behavior.requires.map((req: string) => `"${req}"`).join(', ');
            output += `${indent}      requires: [${items}]\n`;
          } else {
            output += `${indent}      requires:\n`;
            behavior.requires.forEach((req: string) => {
              output += `${indent}        - "${req}"\n`;
            });
          }
        }

        if (behavior.ensures && Array.isArray(behavior.ensures) && behavior.ensures.length > 0) {
          // Use inline format for short arrays (convention syntax)
          if (behavior.ensures.length <= 3) {
            const items = behavior.ensures.map((ens: string) => `"${ens}"`).join(', ');
            output += `${indent}      ensures: [${items}]\n`;
          } else {
            output += `${indent}      ensures:\n`;
            behavior.ensures.forEach((ens: string) => {
              output += `${indent}        - "${ens}"\n`;
            });
          }
        }

        if (behavior.publishes && Array.isArray(behavior.publishes) && behavior.publishes.length > 0) {
          // Use inline format for short arrays (convention syntax)
          if (behavior.publishes.length <= 3) {
            const items = behavior.publishes.map((event: string) => event).join(', ');
            output += `${indent}      publishes: [${items}]\n`;
          } else {
            output += `${indent}      publishes:\n`;
            behavior.publishes.forEach((event: string) => {
              output += `${indent}        - ${event}\n`;
            });
          }
        }
      }
    }

    output += '\n';
    return output;
  }
  
  private static convertController(name: string, controller: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    let output = `${indent}${name}:\n`;
    
    if (controller.description) {
      output += `${indent}  description: "${controller.description}"\n`;
    }
    
    if (controller.model) {
      output += `${indent}  model: ${controller.model}\n`;
    }
    
    // CURED operations
    if (controller.cured) {
      output += `${indent}  cured:\n`;
      for (const [actionName, actionSpec] of Object.entries(controller.cured)) {
        output += this.convertAction(actionName, actionSpec, indentLevel + 2);
      }
    }

    // Custom domain actions (separate from CURED)
    if (controller.customActions) {
      output += `${indent}  actions:\n`;
      for (const [actionName, actionSpec] of Object.entries(controller.customActions)) {
        output += this.convertAction(actionName, actionSpec, indentLevel + 2);
      }
    }
    
    output += '\n';
    return output;
  }
  
  private static convertAction(name: string, action: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    let output = `${indent}${name}:\n`;
    
    if (action.description) {
      output += `${indent}  description: "${action.description}"\n`;
    }
    
    // Parameters
    if (action.parameters) {
      output += `${indent}  parameters:\n`;
      for (const [paramName, paramSpec] of Object.entries(action.parameters)) {
        output += `${indent}    ${paramName}: ${paramSpec}\n`;
      }
    }
    
    // Returns
    if (action.returns) {
      output += `${indent}  returns: ${action.returns}\n`;
    }
    
    // Requires (use inline format for convention syntax)
    if (action.requires && Array.isArray(action.requires)) {
      if (action.requires.length <= 3) {
        const items = action.requires.map((req: string) => `"${req}"`).join(', ');
        output += `${indent}  requires: [${items}]\n`;
      } else {
        output += `${indent}  requires:\n`;
        action.requires.forEach((req: string) => {
          output += `${indent}    - "${req}"\n`;
        });
      }
    }

    // Ensures (use inline format for convention syntax)
    if (action.ensures && Array.isArray(action.ensures)) {
      if (action.ensures.length <= 3) {
        const items = action.ensures.map((ens: string) => `"${ens}"`).join(', ');
        output += `${indent}  ensures: [${items}]\n`;
      } else {
        output += `${indent}  ensures:\n`;
        action.ensures.forEach((ens: string) => {
          output += `${indent}    - "${ens}"\n`;
        });
      }
    }

    // Publishes (use inline format for convention syntax)
    if (action.publishes && Array.isArray(action.publishes)) {
      if (action.publishes.length <= 3) {
        const items = action.publishes.map((event: string) => event).join(', ');
        output += `${indent}  publishes: [${items}]\n`;
      } else {
        output += `${indent}  publishes:\n`;
        action.publishes.forEach((event: string) => {
          output += `${indent}    - ${event}\n`;
        });
      }
    }
    
    return output;
  }
  
  private static convertService(name: string, service: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    let output = `${indent}${name}:\n`;
    
    if (service.description) {
      output += `${indent}  description: "${service.description}"\n`;
    }
    
    // Subscriptions
    if (service.subscribes_to) {
      output += `${indent}  subscribes_to:\n`;
      for (const [eventName, handlerName] of Object.entries(service.subscribes_to)) {
        output += `${indent}    ${eventName}: ${handlerName}\n`;
      }
    }
    
    // Operations
    if (service.operations) {
      output += `${indent}  operations:\n`;
      for (const [opName, opSpec] of Object.entries(service.operations)) {
        output += this.convertOperation(opName, opSpec, indentLevel + 2);
      }
    }
    
    output += '\n';
    return output;
  }
  
  private static convertOperation(name: string, operation: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    let output = `${indent}${name}:\n`;
    
    if (operation.description) {
      output += `${indent}  description: "${operation.description}"\n`;
    }
    
    // Parameters
    if (operation.parameters) {
      output += `${indent}  parameters:\n`;
      for (const [paramName, paramSpec] of Object.entries(operation.parameters)) {
        output += `${indent}    ${paramName}: ${paramSpec}\n`;
      }
    }
    
    // Returns
    if (operation.returns) {
      output += `${indent}  returns: ${operation.returns}\n`;
    }
    
    // Requires
    if (operation.requires && Array.isArray(operation.requires)) {
      output += `${indent}  requires:\n`;
      operation.requires.forEach((req: string) => {
        output += `${indent}    - "${req}"\n`;
      });
    }
    
    // Ensures
    if (operation.ensures && Array.isArray(operation.ensures)) {
      output += `${indent}  ensures:\n`;
      operation.ensures.forEach((ens: string) => {
        output += `${indent}    - "${ens}"\n`;
      });
    }
    
    return output;
  }
  
  private static convertEvent(name: string, event: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    let output = `${indent}${name}:\n`;
    
    if (event.description) {
      output += `${indent}  description: "${event.description}"\n`;
    }
    
    // Attributes
    if (event.attributes) {
      output += `${indent}  attributes:\n`;
      for (const [attrName, attrSpec] of Object.entries(event.attributes)) {
        output += `${indent}    ${attrName}: ${attrSpec}\n`;
      }
    }
    
    output += '\n';
    return output;
  }
  
  private static convertView(name: string, view: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    let output = `${indent}${name}:\n`;
    
    if (view.type) {
      output += `${indent}  type: ${view.type}\n`;
    }

    // Handle both 'model' (single or array) and 'models' (array)
    // Schema expects property name to be 'model' even for arrays
    if (view.model) {
      if (Array.isArray(view.model)) {
        // Use inline format for arrays (convention syntax)
        output += `${indent}  model: [${view.model.join(', ')}]\n`;
      } else {
        output += `${indent}  model: ${view.model}\n`;
      }
    } else if (view.models && Array.isArray(view.models)) {
      // Convert 'models' to 'model' for v3.3 schema compliance (inline format)
      output += `${indent}  model: [${view.models.join(', ')}]\n`;
    }

    if (view.description) {
      output += `${indent}  description: "${view.description}"\n`;
    }
    
    // Subscribes or subscribes_to (use inline format for convention syntax)
    if (view.subscribes_to && Array.isArray(view.subscribes_to)) {
      if (view.subscribes_to.length <= 5) {
        // Inline format for short arrays
        output += `${indent}  subscribes_to: [${view.subscribes_to.join(', ')}]\n`;
      } else {
        output += `${indent}  subscribes_to:\n`;
        view.subscribes_to.forEach((event: string) => {
          output += `${indent}    - ${event}\n`;
        });
      }
    } else if (view.subscribes && Array.isArray(view.subscribes)) {
      if (view.subscribes.length <= 5) {
        // Inline format for short arrays
        output += `${indent}  subscribes: [${view.subscribes.join(', ')}]\n`;
      } else {
        output += `${indent}  subscribes:\n`;
        view.subscribes.forEach((event: string) => {
          output += `${indent}    - ${event}\n`;
        });
      }
    }
    
    // UI Components (can be object or array)
    if (view.uiComponents) {
      output += `${indent}  uiComponents:\n`;

      if (Array.isArray(view.uiComponents)) {
        // Array format
        view.uiComponents.forEach((component: any) => {
          output += `${indent}    - type: ${component.type}\n`;
          if (component.properties) {
            output += `${indent}      properties:\n`;
            for (const [propName, propValue] of Object.entries(component.properties)) {
              if (Array.isArray(propValue)) {
                output += `${indent}        ${propName}:\n`;
                propValue.forEach((item: any) => {
                  if (typeof item === 'object' && item !== null) {
                    // Handle object items in arrays
                    if (item.name && item.label) {
                      output += `${indent}          - name: ${item.name}\n`;
                      output += `${indent}            label: ${this.formatValue(item.label)}\n`;
                      if (item.icon) output += `${indent}            icon: ${item.icon}\n`;
                      if (item.bulk !== undefined) output += `${indent}            bulk: ${item.bulk}\n`;
                    } else {
                      output += `${indent}          - ${this.formatComplexValue(item, indent + '            ')}\n`;
                    }
                  } else {
                    output += `${indent}          - ${this.formatValue(item)}\n`;
                  }
                });
              } else if (typeof propValue === 'object' && propValue !== null) {
                output += `${indent}        ${propName}:\n`;
                for (const [subKey, subValue] of Object.entries(propValue)) {
                  if (Array.isArray(subValue)) {
                    output += `${indent}          ${subKey}:\n`;
                    subValue.forEach((subItem: any) => {
                      output += `${indent}            - ${this.formatValue(subItem)}\n`;
                    });
                  } else {
                    output += `${indent}          ${subKey}: ${this.formatValue(subValue)}\n`;
                  }
                }
              } else {
                output += `${indent}        ${propName}: ${this.formatValue(propValue)}\n`;
              }
            }
          }
        });
      } else {
        // Object format (named components)
        for (const [compName, compSpec] of Object.entries(view.uiComponents)) {
          const comp = compSpec as any;
          output += `${indent}    ${compName}:\n`;
          if (comp.type) {
            output += `${indent}      type: ${comp.type}\n`;
          }
          if (comp.properties) {
            output += `${indent}      properties:\n`;
            for (const [propName, propValue] of Object.entries(comp.properties)) {
              if (Array.isArray(propValue)) {
                output += `${indent}        ${propName}:\n`;
                propValue.forEach((item: any) => {
                  if (typeof item === 'object' && item !== null) {
                    // Special handling for form sections with fields
                    if (propName === 'sections' && item.title && item.fields) {
                      output += `${indent}          - title: ${this.formatValue(item.title)}\n`;
                      output += `${indent}            fields:\n`;
                      if (Array.isArray(item.fields)) {
                        item.fields.forEach((field: any) => {
                          output += `${indent}              - name: ${field.name}\n`;
                          output += `${indent}                type: ${field.type}\n`;
                          if (field.label) output += `${indent}                label: ${this.formatValue(field.label)}\n`;
                          if (field.required !== undefined) output += `${indent}                required: ${field.required}\n`;
                          if (field.validation) output += `${indent}                validation: ${this.formatValue(field.validation)}\n`;
                        });
                      }
                    } else {
                      // Format other object items properly
                      const objEntries = Object.entries(item);
                      if (objEntries.length === 1) {
                        const [key, val] = objEntries[0];
                        output += `${indent}          - ${key}: ${this.formatValue(val)}\n`;
                      } else {
                        output += `${indent}          -\n`;
                        objEntries.forEach(([key, val]) => {
                          output += `${indent}            ${key}: ${this.formatValue(val)}\n`;
                        });
                      }
                    }
                  } else {
                    output += `${indent}          - ${item}\n`;
                  }
                });
              } else if (typeof propValue === 'object' && propValue !== null) {
                output += `${indent}        ${propName}:\n`;
                for (const [subKey, subValue] of Object.entries(propValue)) {
                  output += `${indent}          ${subKey}: ${this.formatValue(subValue)}\n`;
                }
              } else {
                output += `${indent}        ${propName}: ${this.formatValue(propValue)}\n`;
              }
            }
          }
        }
      }
    }
    
    // Handle any other view properties
    // Note: 'models' is handled above and converted to 'model', so skip it here
    const handledProps = new Set(['type', 'model', 'models', 'description', 'subscribes_to', 'subscribes', 'uiComponents']);
    for (const [key, value] of Object.entries(view)) {
      if (!handledProps.has(key)) {
        if (Array.isArray(value)) {
          output += `${indent}  ${key}:\n`;
          value.forEach((item: any) => {
            output += `${indent}    - ${this.formatValue(item)}\n`;
          });
        } else if (typeof value === 'object' && value !== null) {
          output += `${indent}  ${key}:\n`;
          for (const [subKey, subValue] of Object.entries(value)) {
            output += `${indent}    ${subKey}: ${this.formatValue(subValue)}\n`;
          }
        } else {
          output += `${indent}  ${key}: ${this.formatValue(value)}\n`;
        }
      }
    }
    
    output += '\n';
    return output;
  }
  
  private static formatValue(value: any): string {
    if (typeof value === 'string') {
      return value.includes(' ') ? `"${value}"` : value;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
    }
    if (typeof value === 'object' && value !== null) {
      // Handle simple objects by showing key-value pairs
      const entries = Object.entries(value);
      if (entries.length <= 3) {
        return `{ ${entries.map(([k, v]) => `${k}: ${this.formatValue(v)}`).join(', ')} }`;
      }
      return 'Object';
    }
    return String(value);
  }
  
  private static formatComplexValue(value: any, indent: string): string {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      let result = '';
      for (const [key, val] of Object.entries(value)) {
        if (Array.isArray(val)) {
          result += `${key}:\n`;
          val.forEach((item: any) => {
            result += `${indent}  - ${this.formatValue(item)}\n`;
          });
        } else {
          result += `${key}: ${this.formatValue(val)}\n`;
        }
      }
      return result.trim();
    }
    return this.formatValue(value);
  }
}