/**
 * ClassDiagramPlugin - UML Class diagram generation
 *
 * Supports:
 * - class-diagram: UML class diagram with attributes and methods
 */

import { BaseDiagramPlugin } from '../../core/BaseDiagramPlugin.js';
import {
  DiagramType,
  DiagramContext,
  MermaidDiagram,
  ValidationResult
} from '../../types/index.js';
import { SpecVerseAST } from '@specverse/types';

export class ClassDiagramPlugin extends BaseDiagramPlugin {
  name = 'class-diagram-plugin';
  version = '1.0.0';
  description = 'UML class diagrams with attributes and methods';
  supportedTypes: DiagramType[] = ['class-diagram'];

  /**
   * Generate diagram based on type
   */
  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    this.validateType(type);
    return this.generateClassDiagram(context);
  }

  /**
   * Validate AST for class diagram generation
   */
  validate(ast: SpecVerseAST): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for models
    const allModels = ast.components.flatMap(c => c.models);
    if (allModels.length === 0) {
      warnings.push('No models found - class diagrams work best with at least one model');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate UML class diagram
   */
  private generateClassDiagram(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('classDiagram');
    diagram.title = context.options.title || 'Class Diagram';

    const allModels = context.getAllModels();
    const allControllers = context.getAllControllers();
    const allServices = context.getAllServices();
    const allViews = context.getAllViews();

    // Add models as classes
    allModels.forEach(model => {
      const attributes: string[] = [];
      const methods: string[] = [];

      // Add attributes
      if (context.options.includeAttributes !== false) {
        model.attributes.forEach(attr => {
          let attrLine = `+${attr.name}: ${attr.type}`;
          if (attr.required) attrLine += ' required';
          if (attr.unique) attrLine += ' unique';
          if (attr.default !== undefined) attrLine += ` = ${attr.default}`;
          attributes.push(attrLine);
        });
      }

      // Add behaviors as methods
      if (context.options.includeBehaviors !== false && model.behaviors) {
        Object.entries(model.behaviors).forEach(([name, behavior]: [string, any]) => {
          const params = behavior.parameters
            ? Object.entries(behavior.parameters).map(([pname, param]: [string, any]) => {
                return `${pname}: ${param.type}`;
              }).join(', ')
            : '';
          const returnType = behavior.returns || 'void';
          let methodLine = `+${name}(${params}): ${returnType}`;

          // Add contract information as comment
          if (behavior.requires || behavior.ensures) {
            const contracts = [];
            if (behavior.requires) contracts.push(`requires: ${behavior.requires.join(', ')}`);
            if (behavior.ensures) contracts.push(`ensures: ${behavior.ensures.join(', ')}`);
            methodLine += ` %% ${contracts.join(' | ')}`;
          }

          methods.push(methodLine);
        });
      }

      // Note: Profile management methods (attachProfile, detachProfile, hasProfile) are already
      // included in model.behaviors by the parser, so we don't need to add them manually

      diagram.nodes.push({
        id: model.name,
        label: model.name,
        type: 'model',
        color: context.theme.colors.model,
        attributes,
        methods,
        metadata: { kind: 'class' }
      });
    });

    // Add controllers as classes
    if (context.options.includeControllers !== false) {
      allControllers.forEach(controller => {
        const methods: string[] = [];

        // Add CURED operations
        if (controller.cured) {
          if (controller.cured.create) methods.push('+create()');
          if (controller.cured.retrieve) methods.push('+retrieve()');
          if (controller.cured.update) methods.push('+update()');
          if (controller.cured.delete) methods.push('+delete()');
        }

        // Add custom actions
        if (controller.actions) {
          Object.entries(controller.actions).forEach(([name, action]: [string, any]) => {
            methods.push(`+${name}()`);
          });
        }

        diagram.nodes.push({
          id: controller.name,
          label: controller.name,
          type: 'controller',
          color: context.theme.colors.controller,
          methods,
          metadata: { stereotype: 'controller' }
        });

        // Add relationship to model
        if (controller.model) {
          diagram.edges.push({
            from: controller.name,
            to: controller.model,
            label: 'manages',
            type: 'solid',
            arrow: 'single',
            metadata: { order: 1 }
          });
        }
      });
    }

    // Add services as classes
    if (context.options.includeServices !== false) {
      allServices.forEach(service => {
        const methods: string[] = [];

        // Add operations
        if (service.operations) {
          Object.entries(service.operations).forEach(([name, operation]: [string, any]) => {
            methods.push(`+${name}()`);
          });
        }

        diagram.nodes.push({
          id: service.name,
          label: service.name,
          type: 'service',
          color: context.theme.colors.service,
          methods,
          metadata: { stereotype: 'service' }
        });
      });
    }

    // Add views as classes
    if (context.options.includeViews !== false) {
      allViews.forEach(view => {
        const attributes: string[] = [];
        const methods: string[] = [];

        // Add properties as attributes
        if (view.properties && Object.keys(view.properties).length > 0) {
          Object.entries(view.properties).forEach(([name, value]: [string, any]) => {
            // Handle boolean properties (e.g., responsive: true)
            const attrValue = typeof value === 'boolean' ? value.toString() : value;
            attributes.push(`+${name}: ${typeof value} = ${attrValue}`);
          });
        }

        // Add components as methods (render methods)
        // Handle both view.uiComponents (object) and view.layout.components (array)
        let componentNames: string[] = [];

        if (view.uiComponents && typeof view.uiComponents === 'object' && !Array.isArray(view.uiComponents)) {
          // view.uiComponents is an object: { ComponentName: {} }
          componentNames = Object.keys(view.uiComponents);
        } else if (view.layout && typeof view.layout === 'object') {
          // view.layout.components is an array: ['ComponentName1', 'ComponentName2']
          const layoutComponents = (view.layout as any).components;
          if (layoutComponents && Array.isArray(layoutComponents)) {
            componentNames = layoutComponents;
          }
        }

        componentNames.forEach(componentName => {
          methods.push(`+render${componentName}(): Component`);
        });

        diagram.nodes.push({
          id: view.name,
          label: view.name,
          type: 'view',
          color: context.theme.colors.view,
          attributes,
          methods,
          metadata: { stereotype: 'view' }
        });

        // Add relationship to model(s) if specified
        if (view.model) {
          // Handle both single model (string) and multiple models (array or comma-separated string)
          const models = Array.isArray(view.model)
            ? view.model
            : view.model.includes(',')
              ? view.model.split(',').map((m: string) => m.trim())
              : [view.model];

          models.forEach(modelName => {
            diagram.edges.push({
              from: view.name,
              to: modelName,
              label: 'displays',
              type: 'dashed',
              arrow: 'single',
              metadata: { order: 4 }
            });
          });
        }
      });
    }

    // Add events as nodes
    if (context.options.includeEvents !== false) {
      const allEvents = context.getAllEvents();

      allEvents.forEach(event => {
        const attributes: string[] = [];

        // Add payload attributes (event.payload is an array of AttributeSpec)
        if (event.payload && Array.isArray(event.payload)) {
          event.payload.forEach(attr => {
            // Ensure attr is an AttributeSpec object
            if (attr && typeof attr === 'object' && attr.name) {
              let attrLine = `+${attr.name}: ${attr.type}`;
              if (attr.required) attrLine += ' required';
              if (attr.unique) attrLine += ' unique';
              if (attr.default !== undefined) attrLine += ` = ${attr.default}`;
              attributes.push(attrLine);
            }
          });
        }

        diagram.nodes.push({
          id: event.name,
          label: event.name,
          type: 'event',
          color: context.theme.colors.event,
          attributes,
          metadata: { stereotype: 'event' }
        });
      });
    }

    // Add event subscriptions as relationships
    if (context.options.includeEvents !== false) {
      const allEvents = context.getAllEvents();

      // Add controller subscriptions
      allControllers.forEach(controller => {
        if (controller.subscriptions?.events && controller.subscriptions.events.length > 0) {
          controller.subscriptions.events.forEach(eventName => {
            if (allEvents.some(e => e.name === eventName)) {
              diagram.edges.push({
                from: controller.name,
                to: eventName,
                label: 'subscribes',
                type: 'dashed',
                arrow: 'single',
                metadata: { order: 2 }
              });
            }
          });
        }
      });

      // Add service subscriptions
      allServices.forEach(service => {
        if (service.subscriptions?.events && service.subscriptions.events.length > 0) {
          service.subscriptions.events.forEach(eventName => {
            if (allEvents.some(e => e.name === eventName)) {
              diagram.edges.push({
                from: service.name,
                to: eventName,
                label: 'subscribes',
                type: 'dashed',
                arrow: 'single',
                metadata: { order: 3 }
              });
            }
          });
        }
      });

      // Add view subscriptions
      allViews.forEach(view => {
        if (view.subscriptions?.events && view.subscriptions.events.length > 0) {
          view.subscriptions.events.forEach(eventName => {
            if (allEvents.some(e => e.name === eventName)) {
              diagram.edges.push({
                from: view.name,
                to: eventName,
                label: 'subscribes',
                type: 'dashed',
                arrow: 'single',
                metadata: { order: 5 }
              });
            }
          });
        }
      });
    }

    return diagram;
  }

  /**
   * Get default options for class diagrams
   */
  getDefaultOptions() {
    return {
      includeAttributes: true,
      includeBehaviors: true,
      includeControllers: true,
      includeServices: true,
      includeViews: true,
      includeEvents: true,
      title: 'Class Diagram'
    };
  }
}
