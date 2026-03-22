/**
 * SpecVerse v3.0 Diagram Generator
 * 
 * Generates Mermaid diagrams from SpecVerse AST
 * Supports entity-relationship, sequence, and architecture diagrams
 */

import {
  SpecVerseAST,
  ModelSpec,
  ControllerSpec,
  ServiceSpec,
  ViewSpec,
  EventSpec,
  RelationshipSpec,
  LifecycleSpec
} from '@specverse/types';

export interface DiagramOptions {
  type: 'er' | 'sequence' | 'architecture' | 'lifecycle' | 'deployment';
  includeAttributes?: boolean;
  includeRelationships?: boolean;
  includeEvents?: boolean;
  includeControllers?: boolean;
  includeServices?: boolean;
  includeCapabilities?: boolean;
  includeScaling?: boolean;
}

export class UMLGenerator {
  
  /**
   * Generate diagram based on options
   */
  generate(ast: SpecVerseAST, options: DiagramOptions = { type: 'er' }): string {
    switch (options.type) {
      case 'er':
        return this.generateERDiagram(ast, options);
      case 'sequence':
        return this.generateSequenceDiagram(ast, options);
      case 'architecture':
        return this.generateArchitectureDiagram(ast, options);
      case 'lifecycle':
        return this.generateLifecycleDiagrams(ast);
      case 'deployment':
        return this.generateDeploymentDiagram(ast, options);
      default:
        return this.generateERDiagram(ast, options);
    }
  }

  /**
   * Generate Entity-Relationship Diagram
   */
  private generateERDiagram(ast: SpecVerseAST, options: DiagramOptions): string {
    const lines: string[] = ['erDiagram'];
    
    // Collect all models from all components
    const allModels: ModelSpec[] = [];
    for (const component of ast.components) {
      allModels.push(...component.models);
    }
    
    // Add models with attributes
    allModels.forEach(model => {
      if (options.includeAttributes !== false) {
        lines.push(`  ${model.name} {`);
        
        model.attributes.forEach(attr => {
          const type = this.mapToERType(attr.type);
          const modifiers = [];
          if (attr.unique) modifiers.push('UK');
          if (attr.required) modifiers.push('NOT NULL');
          
          const modifierStr = modifiers.length > 0 ? ` "${modifiers.join(', ')}"` : '';
          lines.push(`    ${type} ${attr.name}${modifierStr}`);
        });
        
        lines.push('  }');
      }
      
      // Add relationships
      if (options.includeRelationships !== false) {
        model.relationships.forEach(rel => {
          const relLine = this.generateRelationshipLine(model.name, rel);
          if (relLine) lines.push(`  ${relLine}`);
        });
      }
    });
    
    return lines.join('\n');
  }

  /**
   * Generate Sequence Diagram for event flows
   */
  private generateSequenceDiagram(ast: SpecVerseAST, options: DiagramOptions): string {
    const lines: string[] = ['sequenceDiagram'];
    
    // Collect all controllers and services from all components
    const allControllers: ControllerSpec[] = [];
    const allServices: ServiceSpec[] = [];
    
    for (const component of ast.components) {
      allControllers.push(...component.controllers);
      allServices.push(...component.services);
    }
    
    // Find a representative flow (e.g., create operation)
    const controller = allControllers[0];
    if (!controller) return lines.join('\n');
    
    lines.push('  participant Client');
    lines.push(`  participant ${controller.name}`);
    
    // Add services that subscribe to events
    const eventHandlers = new Map<string, string[]>();
    allServices.forEach(service => {
      if (service.subscriptions && service.subscriptions.events) {
        service.subscriptions.events.forEach(event => {
          if (!eventHandlers.has(event)) {
            eventHandlers.set(event, []);
          }
          eventHandlers.get(event)!.push(service.name);
        });
      }
    });
    
    eventHandlers.forEach((services) => {
      services.forEach(service => {
        lines.push(`  participant ${service}`);
      });
    });
    
    // Generate flow for create operation
    if (controller.cured?.create) {
      lines.push(`  Client->>+${controller.name}: POST /${controller.model?.toLowerCase()}`);
      
      if (controller.cured.create.requires) {
        controller.cured.create.requires.forEach(req => {
          lines.push(`  Note over ${controller.name}: Validate: ${req}`);
        });
      }
      
      lines.push(`  ${controller.name}->>-Client: 201 Created`);
      
      if (controller.cured.create.publishes) {
        controller.cured.create.publishes.forEach(event => {
          const handlers = eventHandlers.get(event) || [];
          handlers.forEach(service => {
            lines.push(`  ${controller.name}-->>+${service}: ${event}`);
            lines.push(`  ${service}-->>-${controller.name}: Acknowledged`);
          });
        });
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Generate Architecture Diagram showing component relationships
   */
  private generateArchitectureDiagram(ast: SpecVerseAST, options: DiagramOptions): string {
    const lines: string[] = ['graph TB'];
    
    // Collect all items from all components
    const allViews: ViewSpec[] = [];
    const allControllers: ControllerSpec[] = [];
    const allServices: ServiceSpec[] = [];
    const allModels: ModelSpec[] = [];
    const allEvents: EventSpec[] = [];
    
    for (const component of ast.components) {
      allViews.push(...component.views);
      allControllers.push(...component.controllers);
      allServices.push(...component.services);
      allModels.push(...component.models);
      allEvents.push(...component.events);
    }
    
    // Client layer
    lines.push('  subgraph "Client Layer"');
    allViews.forEach(view => {
      lines.push(`    ${view.name}[${view.name}]`);
    });
    lines.push('  end');
    
    // Controller layer
    if (options.includeControllers !== false) {
      lines.push('  subgraph "Controller Layer"');
      allControllers.forEach(controller => {
        lines.push(`    ${controller.name}[${controller.name}]`);
      });
      lines.push('  end');
    }
    
    // Service layer
    if (options.includeServices !== false) {
      lines.push('  subgraph "Service Layer"');
      allServices.forEach(service => {
        lines.push(`    ${service.name}[${service.name}]`);
      });
      lines.push('  end');
    }
    
    // Model layer
    lines.push('  subgraph "Model Layer"');
    allModels.forEach(model => {
      lines.push(`    ${model.name}[(${model.name})]`);
    });
    lines.push('  end');
    
    // Event bus
    if (options.includeEvents !== false && allEvents.length > 0) {
      lines.push('  subgraph "Event Bus"');
      allEvents.forEach(event => {
        lines.push(`    ${event.name}{{${event.name}}}`);
      });
      lines.push('  end');
    }
    
    // Add connections
    // Views to Controllers
    allViews.forEach(view => {
      allControllers.forEach(controller => {
        lines.push(`  ${view.name} --> ${controller.name}`);
      });
    });
    
    // Controllers to Models
    allControllers.forEach(controller => {
      if (controller.model) {
        lines.push(`  ${controller.name} --> ${controller.model}`);
      }
    });
    
    // Controllers/Services to Events
    allControllers.forEach(controller => {
      if (controller.cured) {
        Object.values(controller.cured).forEach(operation => {
          if (operation && operation.publishes) {
            operation.publishes.forEach((event: string) => {
              lines.push(`  ${controller.name} -.-> ${event}`);
            });
          }
        });
      }
    });
    
    // Events to Services
    allServices.forEach(service => {
      if (service.subscriptions && service.subscriptions.events) {
        service.subscriptions.events.forEach(event => {
          lines.push(`  ${event} -.-> ${service.name}`);
        });
      }
    });
    
    return lines.join('\n');
  }

  /**
   * Generate Lifecycle State Diagrams
   */
  private generateLifecycleDiagrams(ast: SpecVerseAST): string {
    const diagrams: string[] = [];
    
    // Collect all models from all components
    const allModels: ModelSpec[] = [];
    for (const component of ast.components) {
      allModels.push(...component.models);
    }
    
    allModels.forEach(model => {
      model.lifecycles.forEach(lifecycle => {
        const lines: string[] = [`stateDiagram-v2`];
        lines.push(`  # ${model.name} - ${lifecycle.name} Lifecycle`);
        
        // Add states
        lifecycle.states.forEach((state, index) => {
          if (index === 0) {
            lines.push(`  [*] --> ${state}`);
          }
        });
        
        // Add transitions
        if (lifecycle.type === 'shorthand') {
          // Generate automatic transitions
          for (let i = 0; i < lifecycle.states.length - 1; i++) {
            lines.push(`  ${lifecycle.states[i]} --> ${lifecycle.states[i + 1]}`);
          }
        } else if (lifecycle.transitions) {
          // Use explicit transitions
          Object.entries(lifecycle.transitions).forEach(([action, transition]) => {
            const label = transition.condition ? `${action} [${transition.condition}]` : action;
            lines.push(`  ${transition.from} --> ${transition.to} : ${label}`);
          });
        }
        
        // Add final state
        const lastState = lifecycle.states[lifecycle.states.length - 1];
        if (lastState.toLowerCase().includes('complete') || 
            lastState.toLowerCase().includes('archived') ||
            lastState.toLowerCase().includes('deleted')) {
          lines.push(`  ${lastState} --> [*]`);
        }
        
        diagrams.push(lines.join('\n'));
      });
    });
    
    return diagrams.join('\n\n');
  }

  /**
   * Helper methods
   */
  
  private mapToERType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'String': 'string',
      'Text': 'text',
      'Integer': 'int',
      'Number': 'float',
      'Boolean': 'boolean',
      'Date': 'date',
      'DateTime': 'datetime',
      'UUID': 'uuid',
      'Email': 'string',
      'URL': 'string',
      'JSON': 'json',
      'Object': 'json',
      'Array': 'json'
    };
    
    return typeMap[type] || 'string';
  }

  private generateRelationshipLine(modelName: string, rel: RelationshipSpec): string | null {
    switch (rel.type) {
      case 'hasMany':
        return `${modelName} ||--o{ ${rel.target} : has`;
      case 'hasOne':
        return `${modelName} ||--|| ${rel.target} : has`;
      case 'belongsTo':
        return `${modelName} }o--|| ${rel.target} : belongs_to`;
      case 'manyToMany':
        return `${modelName} }o--o{ ${rel.target} : has_and_belongs_to_many`;
      default:
        return null;
    }
  }

  /**
   * Generate all diagram types for a specification
   */
  generateAll(ast: SpecVerseAST): { [type: string]: string } {
    return {
      'entity-relationship': this.generate(ast, { type: 'er' }),
      'sequence': this.generate(ast, { type: 'sequence' }),
      'architecture': this.generate(ast, { type: 'architecture' }),
      'lifecycle': this.generate(ast, { type: 'lifecycle' }),
      'deployment': this.generate(ast, { type: 'deployment' })
    };
  }

  /**
   * Generate a summary diagram showing key statistics
   */
  generateSummaryDiagram(ast: SpecVerseAST): string {
    const lines: string[] = ['pie title Specification Components'];
    
    // Count all items across components
    let modelCount = 0;
    let controllerCount = 0;
    let serviceCount = 0;
    let viewCount = 0;
    let eventCount = 0;
    
    for (const component of ast.components) {
      modelCount += component.models.length;
      controllerCount += component.controllers.length;
      serviceCount += component.services.length;
      viewCount += component.views.length;
      eventCount += component.events.length;
    }
    
    const counts = {
      Models: modelCount,
      Controllers: controllerCount,
      Services: serviceCount,
      Views: viewCount,
      Events: eventCount
    };
    
    Object.entries(counts).forEach(([type, count]) => {
      if (count > 0) {
        lines.push(`  "${type}" : ${count}`);
      }
    });
    
    return lines.join('\n');
  }

  /**
   * Generate a complexity diagram showing relationships between components
   */
  generateComplexityDiagram(ast: SpecVerseAST): string {
    const lines: string[] = ['graph LR'];
    
    // Calculate complexity metrics
    let totalRelationships = 0;
    let totalAttributes = 0;
    let totalOperations = 0;
    
    // Collect all items from all components
    let totalModels = 0;
    let totalControllers = 0;
    let totalServices = 0;
    let totalEvents = 0;
    
    for (const component of ast.components) {
      totalModels += component.models.length;
      totalControllers += component.controllers.length;
      totalServices += component.services.length;
      totalEvents += component.events.length;
      
      component.models.forEach(model => {
        totalRelationships += model.relationships.length;
        totalAttributes += model.attributes.length;
        totalOperations += Object.keys(model.behaviors).length;
      });
      
      component.controllers.forEach(controller => {
        totalOperations += Object.keys(controller.actions).length;
        if (controller.cured) {
          totalOperations += Object.keys(controller.cured).filter(k => controller.cured![k as keyof typeof controller.cured]).length;
        }
      });
      
      component.services.forEach(service => {
        totalOperations += Object.keys(service.operations).length;
      });
    }
    
    lines.push(`  A[Models: ${totalModels}] --> B[Attributes: ${totalAttributes}]`);
    lines.push(`  A --> C[Relationships: ${totalRelationships}]`);
    lines.push(`  D[Controllers: ${totalControllers}] --> E[Operations: ${totalOperations}]`);
    lines.push(`  F[Services: ${totalServices}] --> E`);
    lines.push(`  G[Events: ${totalEvents}] --> H[Subscriptions: ${this.countSubscriptions(ast)}]`);
    
    return lines.join('\n');
  }

  private countSubscriptions(ast: SpecVerseAST): number {
    let count = 0;
    
    for (const component of ast.components) {
      component.controllers.forEach(controller => {
        if (controller.subscriptions && controller.subscriptions.events) {
          count += controller.subscriptions.events.length;
        }
      });
      
      component.services.forEach(service => {
        if (service.subscriptions && service.subscriptions.events) {
          count += service.subscriptions.events.length;
        }
      });
      
      component.views.forEach(view => {
        if (view.subscriptions && view.subscriptions.events) {
          count += view.subscriptions.events.length;
        }
      });
    }
    
    return count;
  }

  /**
   * Generate Deployment Diagram showing logical instances and communication channels
   */
  private generateDeploymentDiagram(ast: SpecVerseAST, options: DiagramOptions): string {
    const lines: string[] = ['graph TB'];
    
    // Check if we have deployment information
    const deployments = (ast as any).deployments;
    if (!deployments || Object.keys(deployments).length === 0) {
      lines.push('  NoDeployments[No Deployment Specifications Available]');
      lines.push('  style NoDeployments fill:#f9f,stroke:#333,stroke-width:2px');
      return lines.join('\n');
    }

    // Process each deployment
    Object.entries(deployments).forEach(([deploymentName, deployment]: [string, any]) => {
      const instances = deployment.instances || {};
      
      // Communication Channels (at the top)
      if (instances.communications && Object.keys(instances.communications).length > 0) {
        lines.push('  subgraph "Communication Channels"');
        Object.entries(instances.communications).forEach(([channelName, channel]: [string, any]) => {
          const capabilities = Array.isArray(channel.capabilities) ? channel.capabilities : [];
          const capabilityCount = capabilities.length;
          const channelType = channel.type || 'pubsub';
          const namespace = channel.namespace || 'global';
          
          lines.push(`    ${channelName}[["${channelName}<br/>📡 ${channelType}<br/>🌐 ${namespace}<br/>📋 ${capabilityCount} capabilities"]]`);
          lines.push(`    style ${channelName} fill:#e1f5fe,stroke:#0288d1,stroke-width:2px`);
          
          if (options.includeCapabilities !== false && capabilities.length > 0) {
            // Show top 3 capabilities as a summary
            const topCapabilities = capabilities.slice(0, 3);
            const capText = topCapabilities.join('<br/>');
            const moreText = capabilities.length > 3 ? `<br/>+${capabilities.length - 3} more` : '';
            lines.push(`    ${channelName}_caps["${capText}${moreText}"]`);
            lines.push(`    ${channelName} -.-> ${channelName}_caps`);
            lines.push(`    style ${channelName}_caps fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1px,stroke-dasharray: 5 5`);
          }
        });
        lines.push('  end');
        lines.push('');
      }

      // Controller Instances
      if (instances.controllers && Object.keys(instances.controllers).length > 0) {
        lines.push('  subgraph "Controller Instances"');
        Object.entries(instances.controllers).forEach(([instanceName, instance]: [string, any]) => {
          const namespace = instance.namespace || 'default';
          const scale = instance.scale || 1;
          const component = instance.component || 'unknown';
          
          lines.push(`    ${instanceName}[["🎮 ${instanceName}<br/>📦 ${component}<br/>🏷️ ${namespace}<br/>⚖️ scale: ${scale}"]]`);
          lines.push(`    style ${instanceName} fill:#e8f5e8,stroke:#4caf50,stroke-width:2px`);
          
          // Show advertises and uses if enabled
          if (options.includeCapabilities !== false) {
            const advertises = Array.isArray(instance.advertises) ? instance.advertises : 
                              typeof instance.advertises === 'string' ? [instance.advertises] : [];
            const uses = Array.isArray(instance.uses) ? instance.uses : [];
            
            if (advertises.length > 0) {
              const advText = advertises.slice(0, 2).join('<br/>');
              const advMore = advertises.length > 2 ? `<br/>+${advertises.length - 2} more` : '';
              lines.push(`    ${instanceName}_adv["📢 Advertises:<br/>${advText}${advMore}"]`);
              lines.push(`    ${instanceName} --> ${instanceName}_adv`);
              lines.push(`    style ${instanceName}_adv fill:#e8f5e8,stroke:#4caf50,stroke-width:1px,stroke-dasharray: 5 5`);
            }
            
            if (uses.length > 0) {
              const useText = uses.slice(0, 2).join('<br/>');
              const useMore = uses.length > 2 ? `<br/>+${uses.length - 2} more` : '';
              lines.push(`    ${instanceName}_use["🔗 Uses:<br/>${useText}${useMore}"]`);
              lines.push(`    ${instanceName} -.-> ${instanceName}_use`);
              lines.push(`    style ${instanceName}_use fill:#fff3e0,stroke:#ff9800,stroke-width:1px,stroke-dasharray: 5 5`);
            }
          }
        });
        lines.push('  end');
        lines.push('');
      }

      // Service Instances
      if (instances.services && Object.keys(instances.services).length > 0) {
        lines.push('  subgraph "Service Instances"');
        Object.entries(instances.services).forEach(([instanceName, instance]: [string, any]) => {
          const namespace = instance.namespace || 'default';
          const scale = instance.scale || 1;
          const component = instance.component || 'unknown';
          
          lines.push(`    ${instanceName}[["⚙️ ${instanceName}<br/>📦 ${component}<br/>🏷️ ${namespace}<br/>⚖️ scale: ${scale}"]]`);
          lines.push(`    style ${instanceName} fill:#fff3e0,stroke:#ff9800,stroke-width:2px`);
          
          // Show capabilities
          if (options.includeCapabilities !== false) {
            const advertises = Array.isArray(instance.advertises) ? instance.advertises : 
                              typeof instance.advertises === 'string' ? [instance.advertises] : [];
            const uses = Array.isArray(instance.uses) ? instance.uses : [];
            
            if (advertises.length > 0) {
              const advText = advertises.slice(0, 2).join('<br/>');
              const advMore = advertises.length > 2 ? `<br/>+${advertises.length - 2} more` : '';
              lines.push(`    ${instanceName}_adv["📢 Advertises:<br/>${advText}${advMore}"]`);
              lines.push(`    ${instanceName} --> ${instanceName}_adv`);
              lines.push(`    style ${instanceName}_adv fill:#fff3e0,stroke:#ff9800,stroke-width:1px,stroke-dasharray: 5 5`);
            }
            
            if (uses.length > 0) {
              const useText = uses.slice(0, 2).join('<br/>');
              const useMore = uses.length > 2 ? `<br/>+${uses.length - 2} more` : '';
              lines.push(`    ${instanceName}_use["🔗 Uses:<br/>${useText}${useMore}"]`);
              lines.push(`    ${instanceName} -.-> ${instanceName}_use`);
              lines.push(`    style ${instanceName}_use fill:#f3e5f5,stroke:#9c27b0,stroke-width:1px,stroke-dasharray: 5 5`);
            }
          }
        });
        lines.push('  end');
        lines.push('');
      }

      // View Instances
      if (instances.views && Object.keys(instances.views).length > 0) {
        lines.push('  subgraph "View Instances"');
        Object.entries(instances.views).forEach(([instanceName, instance]: [string, any]) => {
          const namespace = instance.namespace || 'default';
          const scale = instance.scale || 1;
          const component = instance.component || 'unknown';
          
          lines.push(`    ${instanceName}[["👁️ ${instanceName}<br/>📦 ${component}<br/>🏷️ ${namespace}<br/>⚖️ scale: ${scale}"]]`);
          lines.push(`    style ${instanceName} fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px`);
          
          // Show capabilities
          if (options.includeCapabilities !== false) {
            const uses = Array.isArray(instance.uses) ? instance.uses : [];
            
            if (uses.length > 0) {
              const useText = uses.slice(0, 3).join('<br/>');
              const useMore = uses.length > 3 ? `<br/>+${uses.length - 3} more` : '';
              lines.push(`    ${instanceName}_use["🔗 Uses:<br/>${useText}${useMore}"]`);
              lines.push(`    ${instanceName} -.-> ${instanceName}_use`);
              lines.push(`    style ${instanceName}_use fill:#f3e5f5,stroke:#9c27b0,stroke-width:1px,stroke-dasharray: 5 5`);
            }
          }
        });
        lines.push('  end');
        lines.push('');
      }

      // Add connections between instances and communication channels
      if (instances.communications && Object.keys(instances.communications).length > 0) {
        Object.entries(instances.communications).forEach(([channelName, channel]: [string, any]) => {
          // Connect all instances to the main communication channel
          ['controllers', 'services', 'views'].forEach(instanceType => {
            if (instances[instanceType]) {
              Object.keys(instances[instanceType]).forEach(instanceName => {
                lines.push(`    ${instanceName} -.->|"communicates via"| ${channelName}`);
              });
            }
          });
        });
      }
    });

    return lines.join('\n');
  }
}