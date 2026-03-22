/**
 * ArchitecturePlugin - System architecture visualization
 *
 * Supports:
 * - mvc-architecture: MVC architecture overview
 * - service-architecture: Service layer architecture
 * - component-dependencies: Component dependency graph
 */

import { BaseDiagramPlugin } from '../../core/BaseDiagramPlugin.js';
import {
  DiagramType,
  DiagramContext,
  MermaidDiagram,
  ValidationResult
} from '../../types/index.js';
import { SpecVerseAST, ModelSpec, ControllerSpec, ServiceSpec, ViewSpec } from '@specverse/types';

export class ArchitecturePlugin extends BaseDiagramPlugin {
  name = 'architecture-plugin';
  version = '1.0.0';
  description = 'System architecture visualization for MVC, services, and component dependencies';
  supportedTypes: DiagramType[] = ['mvc-architecture', 'service-architecture', 'component-dependencies'];

  /**
   * Generate diagram based on type
   */
  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    this.validateType(type);

    switch (type) {
      case 'mvc-architecture':
        return this.generateMVCArchitecture(context);
      case 'service-architecture':
        return this.generateServiceArchitecture(context);
      case 'component-dependencies':
        return this.generateComponentDependencies(context);
      default:
        throw new Error(`Unsupported diagram type: ${type}`);
    }
  }

  /**
   * Validate AST for architecture diagram generation
   */
  validate(ast: SpecVerseAST): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const allModels = ast.components.flatMap(c => c.models);
    const allControllers = ast.components.flatMap(c => c.controllers);
    const allServices = ast.components.flatMap(c => c.services);
    const allViews = ast.components.flatMap(c => c.views);

    if (allModels.length === 0) {
      warnings.push('No models found - architecture diagrams will be minimal');
    }

    if (allControllers.length === 0 && allServices.length === 0) {
      warnings.push('No controllers or services found - consider adding application logic');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate MVC architecture diagram
   *
   * Shows traditional Model-View-Controller architecture with:
   * - Models layer (data and business logic)
   * - Controllers layer (request handling)
   * - Views layer (presentation)
   * - Services layer (optional business logic)
   */
  private generateMVCArchitecture(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'TB');
    diagram.title = context.options.title || 'MVC Architecture';

    const allModels = context.getAllModels();
    const allControllers = context.getAllControllers();
    const allViews = context.getAllViews();
    const allServices = context.getAllServices();

    // LAYER 1: Views
    const viewNodes: string[] = [];
    allViews.forEach(view => {
      viewNodes.push(view.name);
      const node = {
        id: view.name,
        label: `${view.name}\nView`,
        type: 'view' as const,
        color: context.theme.colors.view,
        shape: 'rounded'
      };
      diagram.nodes.push(node);
      context.nodes.set(view.name, node);
    });

    if (viewNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'views_layer',
        label: '🖥️ VIEWS (Presentation Layer)',
        nodes: viewNodes,
        direction: 'LR'
      });
    }

    // LAYER 2: Controllers
    const controllerNodes: string[] = [];
    allControllers.forEach(controller => {
      controllerNodes.push(controller.name);

      const curedOps = controller.cured ? Object.keys(controller.cured).join(', ') : '';
      const actions = controller.actions ? Object.keys(controller.actions).join(', ') : '';
      let label = `${controller.name}`;
      if (curedOps) label += `\nCURED: ${curedOps}`;
      if (actions) label += `\nActions: ${actions}`;

      const node = {
        id: controller.name,
        label,
        type: 'controller' as const,
        color: context.theme.colors.controller,
        shape: 'rounded'
      };
      diagram.nodes.push(node);
      context.nodes.set(controller.name, node);
    });

    if (controllerNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'controllers_layer',
        label: '⚙️ CONTROLLERS (Request Handling)',
        nodes: controllerNodes,
        direction: 'LR'
      });
    }

    // LAYER 3: Services (optional middleware)
    const serviceNodes: string[] = [];
    allServices.forEach(service => {
      serviceNodes.push(service.name);

      const operations = service.operations ? Object.keys(service.operations).join(', ') : '';
      let label = `${service.name}`;
      if (operations) label += `\nOps: ${operations}`;

      const node = {
        id: service.name,
        label,
        type: 'service' as const,
        color: context.theme.colors.service,
        shape: 'rounded'
      };
      diagram.nodes.push(node);
      context.nodes.set(service.name, node);
    });

    if (serviceNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'services_layer',
        label: '🔧 SERVICES (Business Logic)',
        nodes: serviceNodes,
        direction: 'LR'
      });
    }

    // LAYER 4: Models
    const modelNodes: string[] = [];
    allModels.forEach(model => {
      modelNodes.push(model.name);

      const attrs = model.attributes ? Object.keys(model.attributes).slice(0, 3).join(', ') : '';
      let label = `${model.name}`;
      if (attrs) label += `\n${attrs}${Object.keys(model.attributes || {}).length > 3 ? '...' : ''}`;

      const node = {
        id: model.name,
        label,
        type: 'model' as const,
        color: context.theme.colors.model,
        shape: 'rounded'
      };
      diagram.nodes.push(node);
      context.nodes.set(model.name, node);
    });

    if (modelNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'models_layer',
        label: '📦 MODELS (Data & Domain Logic)',
        nodes: modelNodes,
        direction: 'LR'
      });
    }

    // Add edges: Views → Controllers
    allViews.forEach(view => {
      allControllers.forEach(controller => {
        // If view references same model as controller
        if (controller.model && view.model === controller.model) {
          diagram.edges.push({
            from: view.name,
            to: controller.name,
            label: 'requests',
            type: 'solid',
            arrow: 'single'
          });
        }
      });
    });

    // Add edges: Controllers → Services
    allControllers.forEach(controller => {
      allServices.forEach(service => {
        // Controllers typically call services
        diagram.edges.push({
          from: controller.name,
          to: service.name,
          label: 'uses',
          type: 'solid',
          arrow: 'single'
        });
      });
    });

    // Add edges: Controllers → Models (direct access)
    allControllers.forEach(controller => {
      if (controller.model) {
        diagram.edges.push({
          from: controller.name,
          to: controller.model,
          label: 'manages',
          type: 'solid',
          arrow: 'single'
        });
      }
    });

    // Add edges: Services → Models
    allServices.forEach(service => {
      allModels.forEach(model => {
        // Services access models for business logic
        // This is a simplification - in real code we'd analyze operation signatures
        diagram.edges.push({
          from: service.name,
          to: model.name,
          label: 'accesses',
          type: 'solid',
          arrow: 'single'
        });
      });
    });

    return diagram;
  }

  /**
   * Generate service architecture diagram
   *
   * Shows service layer organization with:
   * - Service groupings by domain/responsibility
   * - Service dependencies
   * - Model usage by services
   */
  private generateServiceArchitecture(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'TB');
    diagram.title = context.options.title || 'Service Architecture';

    const allServices = context.getAllServices();
    const allModels = context.getAllModels();
    const allControllers = context.getAllControllers();

    // Create service nodes
    const serviceNodes: string[] = [];
    allServices.forEach(service => {
      serviceNodes.push(service.name);

      const operations = service.operations ? Object.keys(service.operations).join(', ') : '';
      const subscribes = service.subscriptions?.events?.join(', ') || '';

      let label = `${service.name}`;
      if (operations) label += `\nOperations: ${operations}`;
      if (subscribes) label += `\nSubscribes: ${subscribes}`;

      const node = {
        id: service.name,
        label,
        type: 'service' as const,
        color: context.theme.colors.service,
        shape: 'rounded'
      };
      diagram.nodes.push(node);
      context.nodes.set(service.name, node);
    });

    if (serviceNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'services_layer',
        label: '🔧 SERVICE LAYER',
        nodes: serviceNodes,
        direction: 'LR'
      });
    }

    // Create model nodes
    const modelNodes: string[] = [];
    allModels.forEach(model => {
      modelNodes.push(`model_${model.name}`);

      const attrs = model.attributes ? Object.keys(model.attributes).slice(0, 3).join(', ') : '';
      let label = `${model.name}`;
      if (attrs) label += `\n${attrs}${Object.keys(model.attributes || {}).length > 3 ? '...' : ''}`;

      const node = {
        id: `model_${model.name}`,
        label,
        type: 'model' as const,
        color: context.theme.colors.model,
        shape: 'rounded'
      };
      diagram.nodes.push(node);
      context.nodes.set(`model_${model.name}`, node);
    });

    if (modelNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'models_layer',
        label: '📦 DATA MODELS',
        nodes: modelNodes,
        direction: 'LR'
      });
    }

    // Add edges: Services → Models
    allServices.forEach(service => {
      allModels.forEach(model => {
        diagram.edges.push({
          from: service.name,
          to: `model_${model.name}`,
          label: 'uses',
          type: 'solid',
          arrow: 'single'
        });
      });
    });

    // Add edges: Service dependencies (via event subscriptions)
    allServices.forEach(service => {
      if (service.operations) {
        Object.values(service.operations).forEach((op: any) => {
          if (op?.publishes) {
            // Find services that subscribe to these events
            op.publishes.forEach((eventName: string) => {
              allServices.forEach(subscriber => {
                if (subscriber.subscriptions?.events?.includes(eventName)) {
                  diagram.edges.push({
                    from: service.name,
                    to: subscriber.name,
                    label: eventName,
                    type: 'dashed',
                    arrow: 'single'
                  });
                }
              });
            });
          }
        });
      }
    });

    return diagram;
  }

  /**
   * Generate component dependencies diagram
   *
   * Shows dependencies between components:
   * - Import relationships
   * - Model references
   * - Service dependencies
   * - Component boundaries
   */
  private generateComponentDependencies(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'LR');
    diagram.title = context.options.title || 'Component Dependencies';

    const components = context.ast.components;

    // Create component nodes
    components.forEach(component => {
      const componentNode = {
        id: component.name,
        label: `${component.name}\n${component.version || 'v1.0.0'}`,
        type: 'component' as const,
        color: context.theme.colors.component,
        shape: 'rounded'
      };
      diagram.nodes.push(componentNode);
      context.nodes.set(component.name, componentNode);

      // Create subgraph for component contents
      const componentSubnodes: string[] = [];

      // Add models
      component.models.forEach(model => {
        const modelId = `${component.name}_${model.name}`;
        componentSubnodes.push(modelId);

        const node = {
          id: modelId,
          label: model.name,
          type: 'model' as const,
          color: context.theme.colors.model,
          shape: 'rounded'
        };
        diagram.nodes.push(node);
        context.nodes.set(modelId, node);
      });

      // Add controllers
      component.controllers.forEach(controller => {
        const controllerId = `${component.name}_${controller.name}`;
        componentSubnodes.push(controllerId);

        const node = {
          id: controllerId,
          label: controller.name,
          type: 'controller' as const,
          color: context.theme.colors.controller,
          shape: 'rounded'
        };
        diagram.nodes.push(node);
        context.nodes.set(controllerId, node);
      });

      // Add services
      component.services.forEach(service => {
        const serviceId = `${component.name}_${service.name}`;
        componentSubnodes.push(serviceId);

        const node = {
          id: serviceId,
          label: service.name,
          type: 'service' as const,
          color: context.theme.colors.service,
          shape: 'rounded'
        };
        diagram.nodes.push(node);
        context.nodes.set(serviceId, node);
      });

      // Create subgraph
      if (componentSubnodes.length > 0) {
        diagram.subgraphs.push({
          id: `component_${component.name}`,
          label: component.name,
          nodes: componentSubnodes,
          direction: 'TB'
        });
      }
    });

    // Add edges for imports
    components.forEach(component => {
      if (component.imports) {
        component.imports.forEach(imp => {
          // Find the imported component
          const importedComponent = components.find(c =>
            imp.from === c.name || imp.from === `@${c.name}`
          );

          if (importedComponent) {
            diagram.edges.push({
              from: component.name,
              to: importedComponent.name,
              label: 'imports',
              type: 'solid',
              arrow: 'single'
            });
          }
        });
      }
    });

    // Add edges for controller → model relationships
    components.forEach(component => {
      component.controllers.forEach(controller => {
        if (controller.model) {
          const controllerId = `${component.name}_${controller.name}`;
          const modelId = `${component.name}_${controller.model}`;

          diagram.edges.push({
            from: controllerId,
            to: modelId,
            label: 'manages',
            type: 'solid',
            arrow: 'single'
          });
        }
      });
    });

    // Add edges for service dependencies (event-based)
    components.forEach(component => {
      component.services.forEach(service => {
        if (service.operations) {
          Object.values(service.operations).forEach((op: any) => {
            if (op?.publishes) {
              op.publishes.forEach((eventName: string) => {
                // Find subscribers across all components
                components.forEach(targetComp => {
                  targetComp.services.forEach(targetService => {
                    if (targetService.subscriptions?.events?.includes(eventName)) {
                      const fromId = `${component.name}_${service.name}`;
                      const toId = `${targetComp.name}_${targetService.name}`;

                      diagram.edges.push({
                        from: fromId,
                        to: toId,
                        label: eventName,
                        type: 'dashed',
                        arrow: 'single'
                      });
                    }
                  });
                });
              });
            }
          });
        }
      });
    });

    return diagram;
  }

  /**
   * Get default options for architecture diagrams
   */
  getDefaultOptions() {
    return {
      includeModels: true,
      includeControllers: true,
      includeServices: true,
      includeViews: true,
      title: 'System Architecture'
    };
  }
}
