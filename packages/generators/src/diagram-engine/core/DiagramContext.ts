/**
 * DiagramContext - Shared state and helper methods for diagram generation
 *
 * Provides centralized access to AST data and helper methods for plugins
 */

import {
  DiagramContext as IDiagramContext,
  DiagramOptions,
  ThemeConfig,
  MermaidNode,
  MermaidEdge,
  Subgraph,
  MermaidRelation,
  MermaidLifecycle
} from '../types/index.js';

import {
  SpecVerseAST,
  ComponentSpec,
  ModelSpec,
  ControllerSpec,
  ServiceSpec,
  EventSpec,
  ViewSpec
} from '@specverse/types';

/**
 * Implementation of DiagramContext with helper methods
 */
export class DiagramContext implements IDiagramContext {
  ast: SpecVerseAST;
  options: DiagramOptions;
  theme: ThemeConfig;

  nodes: Map<string, MermaidNode>;
  edges: MermaidEdge[];
  subgraphs: Map<string, Subgraph>;
  relations: MermaidRelation[];
  lifecycles: Map<string, MermaidLifecycle>;
  metadata: Map<string, any>;

  constructor(ast: SpecVerseAST, options: DiagramOptions, theme: ThemeConfig) {
    this.ast = ast;
    this.options = options;
    this.theme = theme;

    this.nodes = new Map();
    this.edges = [];
    this.subgraphs = new Map();
    this.relations = [];
    this.lifecycles = new Map();
    this.metadata = new Map();
  }

  // ==================== Node Management ====================

  /**
   * Add a node to the diagram
   */
  addNode(node: MermaidNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): MermaidNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Check if a node exists
   */
  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  // ==================== Edge Management ====================

  /**
   * Add an edge to the diagram
   */
  addEdge(edge: MermaidEdge): void {
    this.edges.push(edge);
  }

  /**
   * Add multiple edges
   */
  addEdges(edges: MermaidEdge[]): void {
    this.edges.push(...edges);
  }

  // ==================== Subgraph Management ====================

  /**
   * Add a subgraph to the diagram
   */
  addSubgraph(name: string, subgraph: Subgraph): void {
    this.subgraphs.set(name, subgraph);
  }

  /**
   * Get a subgraph by name
   */
  getSubgraph(name: string): Subgraph | undefined {
    return this.subgraphs.get(name);
  }

  // ==================== AST Query Methods ====================

  /**
   * Get all models across all components
   */
  getAllModels(): ModelSpec[] {
    const models: ModelSpec[] = [];
    for (const component of this.ast.components) {
      if (component.models) {
        models.push(...component.models);
      }
    }
    return models;
  }

  /**
   * Get deduplicated relationships across all models
   *
   * Bidirectional relationships (hasMany/belongsTo, hasOne/belongsTo) are represented
   * only once, preventing duplicate lines in diagrams.
   *
   * @returns Array of deduplicated relationships with metadata
   */
  getDeduplicatedRelationships(): Array<{
    from: string;
    to: string;
    relationship: any;
    isCanonical: boolean;
  }> {
    const relationships: Array<{
      from: string;
      to: string;
      relationship: any;
      isCanonical: boolean;
    }> = [];

    const processedSignatures = new Set<string>();
    const allModels = this.getAllModels();

    for (const model of allModels) {
      if (!model.relationships || model.relationships.length === 0) {
        continue;
      }

      for (const rel of model.relationships) {
        // Create a canonical signature for this relationship
        const signature = this.createRelationshipSignature(model.name, rel.target, rel.type);

        // Skip if we've already processed this relationship (or its inverse)
        if (processedSignatures.has(signature)) {
          continue;
        }

        // Mark this relationship as processed
        processedSignatures.add(signature);

        // Determine if this is the canonical direction
        const isCanonical = this.isCanonicalDirection(rel.type);

        relationships.push({
          from: model.name,
          to: rel.target,
          relationship: rel,
          isCanonical
        });
      }
    }

    return relationships;
  }

  /**
   * Create a canonical signature for a relationship
   *
   * The signature is the same regardless of direction for bidirectional relationships:
   * - Department hasMany Employee → "Department:Employee:one-to-many"
   * - Employee belongsTo Department → "Department:Employee:one-to-many"
   *
   * @private
   */
  private createRelationshipSignature(from: string, to: string, relType: string): string {
    // Normalize the relationship type
    const normalizedType = this.normalizeRelationshipType(relType);

    // For bidirectional relationships, always order alphabetically to ensure
    // both sides generate the same signature
    if (normalizedType === 'one-to-many' || normalizedType === 'one-to-one') {
      // Sort model names alphabetically
      const [modelA, modelB] = [from, to].sort();
      return `${modelA}:${modelB}:${normalizedType}`;
    }

    // For many-to-many, also use alphabetical ordering
    if (normalizedType === 'many-to-many') {
      const [modelA, modelB] = [from, to].sort();
      return `${modelA}:${modelB}:${normalizedType}`;
    }

    // For non-standard relationships, use as-is
    return `${from}:${to}:${relType}`;
  }

  /**
   * Normalize relationship type to canonical form
   *
   * @private
   */
  private normalizeRelationshipType(relType: string): string {
    switch (relType) {
      case 'hasMany':
      case 'belongsTo':
        return 'one-to-many';
      case 'hasOne':
        return 'one-to-one';
      case 'manyToMany':
        return 'many-to-many';
      default:
        return relType;
    }
  }

  /**
   * Determine if this relationship direction is the canonical one
   *
   * For bidirectional relationships, we prefer:
   * - hasMany over belongsTo (e.g., Department hasMany Employee)
   * - hasOne over belongsTo (e.g., Department hasOne Manager)
   *
   * @private
   */
  private isCanonicalDirection(relType: string): boolean {
    return relType === 'hasMany' || relType === 'hasOne' || relType === 'manyToMany';
  }

  /**
   * Get a model by name
   */
  getModelByName(name: string): ModelSpec | undefined {
    for (const component of this.ast.components) {
      if (component.models) {
        const model = component.models.find(m => m.name === name);
        if (model) return model;
      }
    }
    return undefined;
  }

  /**
   * Get all controllers across all components
   */
  getAllControllers(): ControllerSpec[] {
    const controllers: ControllerSpec[] = [];
    for (const component of this.ast.components) {
      if (component.controllers) {
        controllers.push(...component.controllers);
      }
    }
    return controllers;
  }

  /**
   * Get a controller by name
   */
  getControllerByName(name: string): ControllerSpec | undefined {
    for (const component of this.ast.components) {
      if (component.controllers) {
        const controller = component.controllers.find(c => c.name === name);
        if (controller) return controller;
      }
    }
    return undefined;
  }

  /**
   * Get all services across all components
   */
  getAllServices(): ServiceSpec[] {
    const services: ServiceSpec[] = [];
    for (const component of this.ast.components) {
      if (component.services) {
        services.push(...component.services);
      }
    }
    return services;
  }

  /**
   * Get a service by name
   */
  getServiceByName(name: string): ServiceSpec | undefined {
    for (const component of this.ast.components) {
      if (component.services) {
        const service = component.services.find(s => s.name === name);
        if (service) return service;
      }
    }
    return undefined;
  }

  /**
   * Get all events across all components
   */
  getAllEvents(): EventSpec[] {
    const events: EventSpec[] = [];
    for (const component of this.ast.components) {
      if (component.events) {
        events.push(...component.events);
      }
    }
    return events;
  }

  /**
   * Get an event by name
   */
  getEventByName(name: string): EventSpec | undefined {
    for (const component of this.ast.components) {
      if (component.events) {
        const event = component.events.find(e => e.name === name);
        if (event) return event;
      }
    }
    return undefined;
  }

  /**
   * Get all views across all components
   */
  getAllViews(): ViewSpec[] {
    const views: ViewSpec[] = [];
    for (const component of this.ast.components) {
      if (component.views) {
        views.push(...component.views);
      }
    }
    return views;
  }

  // ==================== Event Flow Helpers ====================

  /**
   * Get all subscribers to a specific event
   */
  getEventSubscribers(eventName: string): Array<ControllerSpec | ServiceSpec | ViewSpec> {
    const subscribers: Array<ControllerSpec | ServiceSpec | ViewSpec> = [];

    // Check controllers
    for (const controller of this.getAllControllers()) {
      if (controller.subscriptions?.events?.includes(eventName)) {
        subscribers.push(controller);
      }
    }

    // Check services
    for (const service of this.getAllServices()) {
      if (service.subscriptions?.events?.includes(eventName)) {
        subscribers.push(service);
      }
    }

    // Check views
    for (const view of this.getAllViews()) {
      if (view.subscriptions?.events?.includes(eventName)) {
        subscribers.push(view);
      }
    }

    return subscribers;
  }

  /**
   * Get all publishers of a specific event
   */
  getEventPublishers(eventName: string): Array<ModelSpec | ControllerSpec | ServiceSpec> {
    const publishers: Array<ModelSpec | ControllerSpec | ServiceSpec> = [];

    // Check model behaviors
    for (const model of this.getAllModels()) {
      if (model.behaviors) {
        for (const [name, behavior] of Object.entries(model.behaviors)) {
          if (behavior.publishes?.includes(eventName)) {
            publishers.push(model);
            break;
          }
        }
      }
    }

    // Check controller actions
    for (const controller of this.getAllControllers()) {
      if (controller.cured) {
        for (const operation of Object.values(controller.cured)) {
          if (operation?.publishes?.includes(eventName)) {
            publishers.push(controller);
            break;
          }
        }
      }
      if (controller.actions) {
        for (const action of Object.values(controller.actions)) {
          if (action.publishes?.includes(eventName)) {
            publishers.push(controller);
            break;
          }
        }
      }
    }

    // Check service operations
    for (const service of this.getAllServices()) {
      if (service.operations) {
        for (const operation of Object.values(service.operations)) {
          if (operation.publishes?.includes(eventName)) {
            publishers.push(service);
            break;
          }
        }
      }
    }

    return publishers;
  }

  /**
   * Get all events published by a component (model, controller, or service)
   */
  getPublishedEvents(component: ModelSpec | ControllerSpec | ServiceSpec): string[] {
    const events: string[] = [];

    // Check if it's a model
    if ('attributes' in component && 'behaviors' in component) {
      const model = component as ModelSpec;
      if (model.behaviors) {
        for (const behavior of Object.values(model.behaviors)) {
          if (behavior.publishes) {
            events.push(...behavior.publishes);
          }
        }
      }
    }

    // Check if it's a controller
    if ('cured' in component || 'actions' in component) {
      const controller = component as ControllerSpec;
      if (controller.cured) {
        for (const operation of Object.values(controller.cured)) {
          if (operation?.publishes) {
            events.push(...operation.publishes);
          }
        }
      }
      if (controller.actions) {
        for (const action of Object.values(controller.actions)) {
          if (action.publishes) {
            events.push(...action.publishes);
          }
        }
      }
    }

    // Check if it's a service
    if ('operations' in component) {
      const service = component as ServiceSpec;
      if (service.operations) {
        for (const operation of Object.values(service.operations)) {
          if (operation.publishes) {
            events.push(...operation.publishes);
          }
        }
      }
    }

    return Array.from(new Set(events)); // Remove duplicates
  }

  // ==================== Deployment Helpers ====================

  /**
   * Get all deployment instances that advertise a capability
   */
  getCapabilityProviders(capability: string): any[] {
    const providers: any[] = [];

    for (const deployment of this.ast.deployments || []) {
      if (deployment.instances) {
        // Check all instance types
        for (const instanceType of ['controllers', 'services', 'storage', 'communications', 'security', 'infrastructure', 'monitoring']) {
          const instances = (deployment.instances as any)[instanceType];
          if (instances) {
            for (const [name, instance] of Object.entries(instances)) {
              const advertises = (instance as any).advertises;
              if (Array.isArray(advertises) && advertises.includes(capability)) {
                providers.push({ name, instance, type: instanceType });
              } else if (advertises === capability || advertises === '*') {
                providers.push({ name, instance, type: instanceType });
              }
            }
          }
        }
      }
    }

    return providers;
  }

  /**
   * Get all deployment instances that use a capability
   */
  getCapabilityConsumers(capability: string): any[] {
    const consumers: any[] = [];

    for (const deployment of this.ast.deployments || []) {
      if (deployment.instances) {
        for (const instanceType of ['controllers', 'services', 'views']) {
          const instances = (deployment.instances as any)[instanceType];
          if (instances) {
            for (const [name, instance] of Object.entries(instances)) {
              const uses = (instance as any).uses;
              if (Array.isArray(uses) && uses.includes(capability)) {
                consumers.push({ name, instance, type: instanceType });
              } else if (uses === capability || uses === '*') {
                consumers.push({ name, instance, type: instanceType });
              }
            }
          }
        }
      }
    }

    return consumers;
  }

  // ==================== Utility Methods ====================

  /**
   * Clear all state (useful for generating multiple diagrams)
   */
  clear(): void {
    this.nodes.clear();
    this.edges = [];
    this.subgraphs.clear();
    this.relations = [];
    this.lifecycles.clear();
    this.metadata.clear();
  }

  /**
   * Clone the context (useful for plugin isolation)
   */
  clone(): DiagramContext {
    const cloned = new DiagramContext(this.ast, { ...this.options }, { ...this.theme });
    cloned.nodes = new Map(this.nodes);
    cloned.edges = [...this.edges];
    cloned.subgraphs = new Map(this.subgraphs);
    cloned.relations = [...this.relations];
    cloned.lifecycles = new Map(this.lifecycles);
    cloned.metadata = new Map(this.metadata);
    return cloned;
  }
}
