/**
 * SpecVerse v3.1 AI View Generator
 * 
 * Transforms parsed AST into AI-optimized specification for code generation
 * Expands conventions and infers implementation details while preserving business rules
 */

import {
  SpecVerseAST,
  ModelSpec,
  ControllerSpec,
  ServiceSpec,
  ViewSpec,
  EventSpec,
  AttributeSpec,
  RelationshipSpec,
  LifecycleSpec,
  ExecutablePropertiesSpec,
  CuredOperationsSpec,
  SubscriptionSpec
} from '@specverse/types';

export interface AIOptimizedAttribute {
  name: string;
  type: string;
  constraints: {
    required: boolean;
    unique: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    format?: string;
  };
  dbMapping: {
    columnName: string;
    columnType: string;
    index?: boolean;
    nullable: boolean;
    defaultValue?: any;
  };
  validation: {
    rules: string[];
    errorMessages?: { [rule: string]: string };
  };
  metadata: {
    searchable?: boolean;
    encrypted?: boolean;
    audit?: boolean;
  };
}

export interface AIOptimizedRelationship {
  name: string;
  type: 'hasMany' | 'hasOne' | 'belongsTo' | 'manyToMany';
  target: string;
  foreignKey: string;
  joinStrategy: 'eager' | 'lazy';
  cascadeOperations: string[];
  joinTable?: {
    name: string;
    columns: { [key: string]: string };
  };
}

export interface AIOptimizedBehavior {
  name: string;
  signature: string;
  implementation: {
    preconditions: string[];
    postconditions: string[];
    sideEffects: string[];
    steps: string[];
    transactional: boolean;
  };
  metadata: {
    async: boolean;
    cacheable: boolean;
    idempotent: boolean;
  };
}

export interface ServiceOperationHint {
  type: 'findUnique' | 'findMany' | 'create' | 'update' | 'delete' | 'upsert' | 'aggregate' | 'custom' | 'validate';  // v3.3: Added validate
  complexity: 'simple' | 'nested' | 'aggregated';
  transactional: boolean;
  targetOperation?: 'create' | 'update' | 'evolve';  // v3.3: For validate operations
  includes?: string[];  // Related entities to load
  queryHints?: {
    pagination?: boolean;
    sorting?: boolean;
    filtering?: boolean;
    search?: boolean;
  };
  validation?: {
    schema?: string;
    library?: 'zod' | 'yup' | 'class-validator' | 'joi';
  };
  caching?: {
    enabled: boolean;
    ttl?: number;
    key?: string;
  };
}

export interface AIOptimizedEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  operation?: string;  // CURVED operation name: create, retrieve, list, update, evolve, delete, validate
  parameters: {
    path: { [name: string]: AIOptimizedAttribute };
    query: { [name: string]: AIOptimizedAttribute };
    body: { [name: string]: AIOptimizedAttribute };
  };
  responseType: {
    success: string;
    error: string;
  };
  businessRules: {
    preconditions: string[];
    postconditions: string[];
  };
  metadata: {
    authenticated: boolean;
    authorized: string[];
    rateLimit?: { requests: number; window: string };
    readOnly?: boolean;
    dryRun?: boolean;
    validationMode?: 'strict' | 'lenient';
    validationOnly?: boolean;        // v3.3: Indicates validation-only endpoint
    targetOperation?: 'create' | 'update' | 'evolve';  // v3.3: Target operation for validation
  };
  serviceOperation?: ServiceOperationHint;
}

export interface AIOptimizedSubscription {
  name: string;
  eventTypes: string[];
  handler: string;
  filterExpression?: string;
  processingMode: 'sync' | 'async';
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
  };
}

export interface AIOptimizedModel {
  name: string;
  attributes: AIOptimizedAttribute[];
  relationships: AIOptimizedRelationship[];
  behaviors: AIOptimizedBehavior[];
  lifecycle: {
    states: string[];
    transitions: { [action: string]: { from: string; to: string; condition?: string } };
    currentStateField: string;
  };
  dbMapping: {
    tableName: string;
    schema?: string;
    indexes: string[];
  };
  metadata?: {  // v3.3: Model metadata from metadata primitives
    id?: any;
    audit?: any;
    softDelete?: any;
    label?: string | string[];
    status?: any;
    version?: any;
  };
}

export interface AIOptimizedController {
  name: string;
  model?: string;  // Model name for template use (same as modelReference)
  modelReference: string;
  basePath?: string;  // Optional - only set if explicitly in spec, otherwise templates generate
  endpoints: AIOptimizedEndpoint[];
  subscriptions: AIOptimizedSubscription[];
  middleware: string[];
}

export interface AIOptimizedService {
  name: string;
  operations: AIOptimizedBehavior[];
  subscriptions: AIOptimizedSubscription[];
  dependencies: string[];
}

export interface AIOptimizedView {
  name: string;
  type?: string;  // Preserve view type (list, detail, dashboard, form)
  description?: string;  // Preserve view description
  model?: string | string[];  // Preserve model reference(s)
  uiComponents?: { [name: string]: any; };  // Preserve uiComponents as-is
  subscriptions: AIOptimizedSubscription[];
  components: {
    [name: string]: {
      type: string;
      props: any;
      dataBindings: string[];
    };
  };
  routing: {
    path: string;
    params?: string[];
  };
}

export interface AIOptimizedEvent {
  name: string;
  payload: AIOptimizedAttribute[];
  metadata: {
    persistent: boolean;
    ttl?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface AIOptimizedSpec {
  metadata: {
    component?: string;
    deployment?: string;
    instance?: string;
    version?: string;
    description?: string;
    tags?: string[];
    manifest?: ManifestConfig;
  };
  imports: {
    from: string;
    items: { name: string; type: string }[];
  }[];
  exports: {
    type: string;
    items: string[];
  }[];
  models: AIOptimizedModel[];
  controllers: AIOptimizedController[];
  services: AIOptimizedService[];
  views: AIOptimizedView[];
  events: AIOptimizedEvent[];
  infrastructure: {
    database: {
      type: string;
      migrations: boolean;
      seedData: boolean;
    };
    messaging: {
      type: string;
      queues: string[];
    };
    caching: {
      type: string;
      ttl: number;
    };
  };
}

export interface ManifestConfig {
  implementationType?: string;
  customizations?: {
    [key: string]: any;
  };
  codeGeneration?: {
    validation?: {
      library: string;
    };
    orm?: {
      library: string;
      features?: string[];
    };
    authentication?: {
      strategy: string;
    };
    [key: string]: any;
  };
}

export interface GenerationOptions {
  deployment?: string;
  instance?: string;
  manifest?: ManifestConfig;
}

export class AIViewGenerator {
  
  /**
   * Generate AI-optimized specification from parsed AST
   *
   * @param ast - Parsed SpecVerse AST
   * @param options - Optional generation options for deployment filtering
   */
  generate(ast: SpecVerseAST, options?: GenerationOptions): AIOptimizedSpec {
    const { deployment, instance, manifest } = options || {};

    // Find deployment specification if provided
    const deploymentSpec = deployment
      ? ast.deployments?.find(d => d.name === deployment)
      : null;

    // Find instance specification if provided
    const instanceSpec = deploymentSpec && instance
      ? (deploymentSpec.instances as any)?.[instance]
      : null;

    // Extract manifest configuration if provided
    const manifestConfig = manifest
      ? {
          implementationType: manifest.implementationType,
          customizations: manifest.customizations,
          codeGeneration: manifest.codeGeneration
        }
      : undefined;

    // v3.1 uses container format - collect from all components
    const allModels: ModelSpec[] = [];
    const allControllers: ControllerSpec[] = [];
    const allServices: ServiceSpec[] = [];
    const allViews: ViewSpec[] = [];
    const allEvents: EventSpec[] = [];
    const allImports: any[] = [];
    const allExports: any[] = [];

    // Extract first component for metadata
    const primaryComponent = ast.components && ast.components.length > 0 ? ast.components[0] : null;
    const metadata = primaryComponent ? {
      component: primaryComponent.name,
      deployment: deployment || (ast.deployments && ast.deployments.length > 0 ? ast.deployments[0].name : undefined),
      instance: instance || undefined,
      version: primaryComponent.version,
      description: primaryComponent.description,
      tags: primaryComponent.tags,
      manifest: manifestConfig
    } : {
      component: 'Unknown',
      deployment: deployment || undefined,
      instance: instance || undefined,
      version: '1.0.0',
      description: 'Generated AI specification',
      tags: [],
      manifest: manifestConfig
    };

    // Aggregate all items from components with optional filtering
    for (const component of ast.components || []) {
      allModels.push(...(component.models || []));

      // Filter controllers by deployment instance if specified
      const controllers = component.controllers || [];
      if (instanceSpec && instanceSpec.advertises && instanceSpec.advertises.length > 0) {
        // Only include controllers advertised by this instance
        allControllers.push(
          ...controllers.filter(c => instanceSpec.advertises!.includes(c.name))
        );
      } else {
        // No filtering - include all controllers
        allControllers.push(...controllers);
      }

      allServices.push(...(component.services || []));
      allViews.push(...(component.views || []));
      allEvents.push(...(component.events || []));
      if (component.imports) allImports.push(...component.imports);
      if (component.exports) allExports.push(component.exports);
    }

    return {
      metadata,
      imports: this.expandImports(allImports),
      exports: this.expandExports(allExports),
      models: allModels.map(model => this.optimizeModel(model)),
      controllers: allControllers.map(controller => this.optimizeController(controller, allModels)),
      services: allServices.map(service => this.optimizeService(service)),
      views: allViews.map(view => this.optimizeView(view)),
      events: allEvents.map(event => this.optimizeEvent(event)),
      infrastructure: this.inferInfrastructure(ast)
    };
  }

  /**
   * Expand imports into structured format
   */
  private expandImports(imports: any[]): any[] {
    return imports.map(imp => {
      if (typeof imp === 'string') {
        // Simple import: "file:./common.yaml"
        const [file, path] = imp.split(':');
        return {
          from: path,
          items: []
        };
      } else if (imp.file) {
        // Structured import with select
        return {
          from: imp.file.split(':')[1],
          items: (imp.select || []).map((item: string) => ({
            name: item,
            type: 'unknown' // Would need to resolve from imported file
          }))
        };
      }
      return imp;
    });
  }

  /**
   * Expand exports into categorized structure
   */
  private expandExports(exports: any): any[] {
    const result = [];
    for (const [type, items] of Object.entries(exports)) {
      if (Array.isArray(items)) {
        result.push({ type, items });
      }
    }
    return result;
  }

  /**
   * Optimize model with database mappings and expanded metadata
   */
  private optimizeModel(model: ModelSpec): AIOptimizedModel {
    return {
      name: model.name,
      attributes: (model.attributes || []).map(attr => this.optimizeAttribute(attr, model)),
      relationships: (model.relationships || []).map(rel => this.optimizeRelationship(rel, model.name)),
      behaviors: Object.entries(model.behaviors || {}).map(([name, spec]) =>
        this.optimizeBehavior(name, spec)
      ),
      lifecycle: (model.lifecycles && model.lifecycles.length > 0) ? {
        states: model.lifecycles[0].states,
        transitions: model.lifecycles[0].transitions || {},
        currentStateField: `${model.lifecycles[0].name}State`
      } : {
        states: [],
        transitions: {},
        currentStateField: 'state'
      },
      dbMapping: {
        tableName: this.toSnakeCase(model.name) + 's',
        indexes: this.inferIndexes(model)
      },
      metadata: model.metadata  // v3.3: Include model metadata for code generation
    };
  }

  /**
   * Optimize attribute with full implementation details
   * v3.3: Uses explicit model metadata instead of heuristics
   */
  private optimizeAttribute(attr: AttributeSpec, model?: ModelSpec): AIOptimizedAttribute {
    return {
      name: attr.name,
      type: attr.type,
      constraints: {
        required: attr.required,
        unique: attr.unique,
        min: attr.min,
        max: attr.max,
        pattern: this.inferPattern(attr),
        format: this.inferFormat(attr)
      },
      dbMapping: {
        columnName: this.toSnakeCase(attr.name),
        columnType: this.inferDbType(attr),
        index: attr.searchable || attr.unique,
        nullable: !attr.required,
        defaultValue: attr.default
      },
      validation: {
        rules: this.generateValidationRules(attr)
      },
      metadata: {
        searchable: attr.searchable,
        encrypted: this.isEncryptedField(attr),
        audit: this.isAuditField(attr, model)
      }
    };
  }

  /**
   * Optimize relationship with foreign key inference
   */
  private optimizeRelationship(rel: RelationshipSpec, modelName: string): AIOptimizedRelationship {
    const foreignKey = this.inferForeignKey(rel, modelName);
    
    return {
      name: rel.name,
      type: rel.type,
      target: rel.target,
      foreignKey,
      joinStrategy: rel.eager ? 'eager' : 'lazy',
      cascadeOperations: rel.cascade ? ['delete', 'update'] : [],
      joinTable: rel.type === 'manyToMany' ? {
        name: this.inferJoinTableName(modelName, rel.target),
        columns: {
          [this.toSnakeCase(modelName) + '_id']: 'uuid',
          [this.toSnakeCase(rel.target) + '_id']: 'uuid'
        }
      } : undefined
    };
  }

  /**
   * Optimize behavior/action/operation with metadata
   */
  private optimizeBehavior(name: string, spec: ExecutablePropertiesSpec): AIOptimizedBehavior {
    return {
      name,
      signature: this.generateMethodSignature(name, spec),
      implementation: {
        preconditions: spec.requires || [],
        postconditions: spec.ensures || [],
        sideEffects: spec.publishes || [],
        steps: spec.steps || [],
        transactional: this.inferTransactional(spec)
      },
      metadata: {
        async: this.inferAsync(spec),
        cacheable: this.inferCacheable(name, spec),
        idempotent: this.inferIdempotent(name)
      }
    };
  }

  /**
   * Optimize controller with endpoint expansion
   */
  private optimizeController(controller: ControllerSpec, allModels: ModelSpec[]): AIOptimizedController {
    // Use explicit path from spec if provided, otherwise generate generic placeholder for internal use
    // Placeholder is NOT exposed to templates (basePath field left undefined) - templates generate their own
    const basePathForEndpoints = controller.path || (controller.model ? `/${controller.model.toLowerCase()}` : `/${this.toKebabCase(controller.name)}`);

    // Find the model to get its relationships
    const model = allModels.find(m => m.name === controller.model);
    const relationships = model?.relationships || [];
    const modelName = controller.model;

    const endpoints: AIOptimizedEndpoint[] = [];

    // Add CURVED operation endpoints
    // Auto-generate all CURVED operations if controller has a model
    // User can define empty object {} to get all operations, or specify individual operations
    if (controller.model) {
      const cured = controller.cured || {};  // Default to empty object if not specified
      const hasLifecycle = model && model.lifecycles && model.lifecycles.length > 0;
      endpoints.push(...this.expandCuredEndpoints(cured, basePathForEndpoints, modelName, relationships, hasLifecycle));
    }

    // Add custom action endpoints
    for (const [name, action] of Object.entries(controller.actions || {})) {
      endpoints.push(this.createEndpoint(name, action, basePathForEndpoints, modelName, relationships));
    }

    return {
      name: controller.name,
      model: controller.model,
      modelReference: controller.model,
      basePath: controller.path,  // Only set if explicitly provided in spec, otherwise undefined
      endpoints,
      subscriptions: this.optimizeSubscriptions(controller.subscriptions || { events: [], handlers: {} }),
      middleware: ['authenticate', 'authorize', 'validate']
    };
  }

  /**
   * Optimize service with dependency inference
   */
  private optimizeService(service: ServiceSpec): AIOptimizedService {
    return {
      name: service.name,
      operations: Object.entries(service.operations || {}).map(([name, spec]) =>
        this.optimizeBehavior(name, spec)
      ),
      subscriptions: this.optimizeSubscriptions(service.subscriptions || { events: [], handlers: {} }),
      dependencies: this.inferDependencies(service)
    };
  }

  /**
   * Optimize view with component structure
   */
  private optimizeView(view: ViewSpec): AIOptimizedView {
    return {
      name: view.name,
      ...(view.type && { type: view.type }),  // Preserve view type (list, detail, dashboard, form)
      ...(view.description && { description: view.description }),  // Preserve description
      ...(view.model && { model: view.model }),  // Preserve model reference(s)
      ...(view.uiComponents && { uiComponents: view.uiComponents }),  // Preserve uiComponents as-is
      subscriptions: this.optimizeSubscriptions(view.subscriptions),
      components: this.expandComponents(view.uiComponents),
      routing: {
        path: `/${this.toKebabCase(view.name.replace(/View$/, ''))}`
      }
    };
  }

  /**
   * Optimize event with metadata
   */
  private optimizeEvent(event: EventSpec): AIOptimizedEvent {
    return {
      name: event.name,
      payload: event.payload.map(attr => this.optimizeAttribute(attr, undefined)),
      metadata: {
        persistent: true,
        ttl: 86400, // 24 hours default
        priority: 'normal'
      }
    };
  }

  /**
   * Optimize subscriptions into structured format
   */
  private optimizeSubscriptions(subscriptions: SubscriptionSpec): AIOptimizedSubscription[] {
    if (!subscriptions || !subscriptions.events) return [];
    
    return subscriptions.events.map(event => ({
      name: `on${event}`,
      eventTypes: [event],
      handler: subscriptions.handlers?.[event] || `handle${event}`,
      processingMode: 'async',
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential'
      }
    }));
  }

  /**
   * Expand CURVED operations into REST endpoints
   * Auto-generates all CURVED operations (Create, Update, Retrieve, Validate, Evolve, Delete)
   * Operations are generated by default unless explicitly disabled
   */
  private expandCuredEndpoints(
    cured: CuredOperationsSpec,
    basePath: string,
    modelName?: string,
    relationships?: RelationshipSpec[],
    hasLifecycle: boolean = false
  ): AIOptimizedEndpoint[] {
    const endpoints: AIOptimizedEndpoint[] = [];

    // Auto-generate all CURVED operations by default
    // Operations can be customized by defining them in the spec
    // To disable an operation, don't include it (or we could support disabled: true in future)

    // CREATE - Always generate
    const createDef = cured.create || {} as ExecutablePropertiesSpec;
    const createRules = {
      preconditions: (createDef as any).requires || [],
      postconditions: (createDef as any).ensures || []
    };

    endpoints.push({
      method: 'POST',
      path: basePath,
      operation: 'create',
      parameters: this.extractParameters(createDef),
      responseType: { success: (createDef as any).returns || 'Object', error: 'Error' },
      businessRules: createRules,
      metadata: { authenticated: true, authorized: ['create'] },
      serviceOperation: this.inferServiceOperation('POST', basePath, createRules, modelName, relationships)
    });

    // RETRIEVE - Always generate
    const retrieveDef = cured.retrieve || {} as ExecutablePropertiesSpec;
    const retrieveRules = {
      preconditions: (retrieveDef as any).requires || [],
      postconditions: (retrieveDef as any).ensures || []
    };
    const retrievePath = `${basePath}/:id`;

    endpoints.push({
      method: 'GET',
      path: retrievePath,
      operation: 'retrieve',
      parameters: {
        path: { id: this.createIdAttribute() },
        query: {},
        body: {}
      },
      responseType: { success: (retrieveDef as any).returns || 'Object', error: 'Error' },
      businessRules: retrieveRules,
      metadata: { authenticated: true, authorized: ['read'] },
      serviceOperation: this.inferServiceOperation('GET', retrievePath, retrieveRules, modelName, relationships)
    });

    // RETRIEVE_MANY (List) - Always generate
    const retrieveManyDef = cured.retrieve_many || {} as ExecutablePropertiesSpec;
    const retrieveManyRules = {
      preconditions: (retrieveManyDef as any).requires || [],
      postconditions: (retrieveManyDef as any).ensures || []
    };

    endpoints.push({
      method: 'GET',
      path: basePath,
      operation: 'list',
      parameters: {
        path: {},
        query: {
          page: this.createPaginationAttribute('page'),
          limit: this.createPaginationAttribute('limit'),
          sort: this.createPaginationAttribute('sort'),
          filter: this.createPaginationAttribute('filter')
        },
        body: {}
      },
      responseType: { success: 'Array<Object>', error: 'Error' },
      businessRules: retrieveManyRules,
      metadata: { authenticated: true, authorized: ['read'] },
      serviceOperation: this.inferServiceOperation('GET', basePath, retrieveManyRules, modelName, relationships)
    });

    // UPDATE - Always generate
    const updateDef = cured.update || {} as ExecutablePropertiesSpec;
    const updateRules = {
      preconditions: (updateDef as any).requires || [],
      postconditions: (updateDef as any).ensures || []
    };
    const updatePath = `${basePath}/:id`;

    endpoints.push({
      method: 'PUT',
      path: updatePath,
      operation: 'update',
      parameters: this.extractParameters(updateDef, true),
      responseType: { success: (updateDef as any).returns || 'Object', error: 'Error' },
      businessRules: updateRules,
      metadata: { authenticated: true, authorized: ['update'] },
      serviceOperation: this.inferServiceOperation('PUT', updatePath, updateRules, modelName, relationships)
    });

    // EVOLVE - Generate if lifecycle present OR explicitly defined
    if (hasLifecycle || cured.evolve) {
      const evolveDef = cured.evolve || {} as ExecutablePropertiesSpec;
      const evolveRules = {
        preconditions: (evolveDef as any).requires || [],
        postconditions: (evolveDef as any).ensures || []
      };
      const evolvePath = `${basePath}/:id/evolve`;

      endpoints.push({
        method: 'PATCH',
        path: evolvePath,
        operation: 'evolve',
        parameters: this.extractParameters(evolveDef, true),
        responseType: { success: (evolveDef as any).returns || 'Object', error: 'Error' },
        businessRules: evolveRules,
        metadata: { authenticated: true, authorized: ['update'] },
        serviceOperation: this.inferServiceOperation('PATCH', evolvePath, evolveRules, modelName, relationships)
      });
    }

    // DELETE - Always generate
    const deleteDef = cured.delete || {} as ExecutablePropertiesSpec;
    const deleteRules = {
      preconditions: (deleteDef as any).requires || [],
      postconditions: (deleteDef as any).ensures || []
    };
    const deletePath = `${basePath}/:id`;

    endpoints.push({
      method: 'DELETE',
      path: deletePath,
      operation: 'delete',
      parameters: {
        path: { id: this.createIdAttribute() },
        query: {},
        body: {}
      },
      responseType: { success: 'void', error: 'Error' },
      businessRules: deleteRules,
      metadata: { authenticated: true, authorized: ['delete'] },
      serviceOperation: this.inferServiceOperation('DELETE', deletePath, deleteRules, modelName, relationships)
    });

    // VALIDATE - Always generate (v3.3+)
    // Single unified validation endpoint that handles all operations
    const validateEndpoints = this.expandValidateEndpoints(cured, basePath, modelName);
    endpoints.push(...validateEndpoints);

    return endpoints;
  }

  /**
   * Expand validate operation into validation endpoint (v3.3+)
   * Always generates a single unified validation endpoint that accepts operation context
   */
  private expandValidateEndpoints(
    cured: CuredOperationsSpec,
    basePath: string,
    modelName?: string
  ): AIOptimizedEndpoint[] {
    const validateEndpoints: AIOptimizedEndpoint[] = [];

    // v3.3: ALWAYS generate a SINGLE validate endpoint
    // This endpoint accepts {operation, data} and validates accordingly
    // Maps to service.validate(data, { operation })
    // Users can customize by defining cured.validate in spec

    // Collect parameters from all CURED operations for complete validation support
    const allParameters: any = {
      body: {
        operation: { type: 'String', description: 'Operation to validate for (create|update|evolve)' },
        data: { type: 'Object', description: 'Data to validate' }
      },
      path: {},
      query: {}
    };

    // Collect business rules from all operations
    const allBusinessRules = {
      preconditions: [] as string[],
      postconditions: [] // No postconditions for validation (no side effects)
    };

    // Aggregate requires clauses from all operations
    ['create', 'update', 'evolve'].forEach(op => {
      const operation = cured[op as 'create' | 'update' | 'evolve'];
      if (operation && typeof operation !== 'boolean' && 'requires' in operation) {
        allBusinessRules.preconditions.push(...(operation.requires || []));
      }
    });

    // Create single unified validation endpoint
    validateEndpoints.push({
      method: 'POST',
      path: `${basePath}/validate`,
      operation: 'validate',
      parameters: allParameters,
      responseType: {
        success: 'ValidationResult',
        error: 'Error'
      },
      businessRules: allBusinessRules,
      metadata: {
        authenticated: true,
        authorized: ['validate'],
        readOnly: true,
        validationOnly: true,  // Indicates this is a validation-only endpoint
        targetOperation: undefined  // Supports all operations via context parameter
      },
      serviceOperation: {
        type: 'validate',        // Special type for validation operations
        targetOperation: undefined,  // Determined at runtime from request body
        complexity: 'simple',
        transactional: false,
        validation: {
          schema: modelName,
          library: 'zod'
        }
      }
    });

    return validateEndpoints;
  }

  /**
   * Create endpoint from custom action
   */
  private createEndpoint(
    name: string,
    action: ExecutablePropertiesSpec,
    basePath: string,
    modelName?: string,
    relationships?: RelationshipSpec[]
  ): AIOptimizedEndpoint {
    const method = this.inferHttpMethod(name, action);
    const path = `${basePath}/${this.toKebabCase(name)}`;
    const businessRules = {
      preconditions: action.requires || [],
      postconditions: action.ensures || []
    };

    return {
      method,
      path,
      parameters: this.extractParameters(action),
      responseType: {
        success: action.returns || 'Object',
        error: 'Error'
      },
      businessRules,
      metadata: {
        authenticated: true,
        authorized: [name]
      },
      serviceOperation: this.inferServiceOperation(method, path, businessRules, modelName, relationships)
    };
  }

  /**
   * Helper methods for inference and conversion
   */
  
  private inferDbType(attr: AttributeSpec): string {
    const typeMap: { [key: string]: string } = {
      'String': 'VARCHAR(255)',
      'Text': 'TEXT',
      'Integer': 'INTEGER',
      'Number': 'DECIMAL(10,2)',
      'Boolean': 'BOOLEAN',
      'Date': 'DATE',
      'DateTime': 'TIMESTAMP',
      'Timestamp': 'TIMESTAMP',  // Support both DateTime and Timestamp
      'UUID': 'UUID',
      'Email': 'VARCHAR(255)',
      'URL': 'VARCHAR(500)',
      'JSON': 'JSONB',
      'Object': 'JSONB'
    };
    
    let dbType = typeMap[attr.type] || 'VARCHAR(255)';
    
    if (attr.max && (attr.type === 'String' || attr.type === 'Email')) {
      dbType = `VARCHAR(${attr.max})`;
    }
    
    return dbType;
  }

  private inferPattern(attr: AttributeSpec): string | undefined {
    const patterns: { [key: string]: string } = {
      'Email': '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      'URL': '^https?://.+',
      'UUID': '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    };
    
    return patterns[attr.type];
  }

  private inferFormat(attr: AttributeSpec): string | undefined {
    const formats: { [key: string]: string } = {
      'Email': 'email',
      'URL': 'uri',
      'UUID': 'uuid',
      'Date': 'date',
      'DateTime': 'date-time'
    };
    
    return formats[attr.type];
  }

  private inferForeignKey(rel: RelationshipSpec, modelName: string): string {
    if (rel.type === 'belongsTo') {
      return this.toSnakeCase(rel.target) + '_id';
    } else if (rel.type === 'hasMany' || rel.type === 'hasOne') {
      return this.toSnakeCase(modelName) + '_id';
    }
    return '';
  }

  private inferJoinTableName(model1: string, model2: string): string {
    const sorted = [model1, model2].sort();
    return this.toSnakeCase(sorted[0]) + '_' + this.toSnakeCase(sorted[1]);
  }

  /**
   * Infer service operation hints for code generation
   * Provides Prisma-style operation types, transaction hints, and query optimization metadata
   */
  private inferServiceOperation(
    method: string,
    path: string,
    businessRules: { preconditions: string[]; postconditions: string[] },
    modelName?: string,
    relationships?: RelationshipSpec[]
  ): ServiceOperationHint {
    // Determine operation type from HTTP method + path pattern
    let type: ServiceOperationHint['type'];

    // Count path segments to distinguish between standard CURED and custom actions
    const pathSegments = path.split('/').filter(s => s.length > 0);
    const hasIdParam = path.includes(':id');
    const hasCustomSegment = pathSegments.length > 1 && !hasIdParam && !path.includes('/evolve');

    // Check for aggregate operations first
    if (path.includes('/aggregate') || path.includes('/count') || path.includes('/sum')) {
      type = 'aggregate';
    } else if (method === 'GET' && hasIdParam) {
      type = 'findUnique';
    } else if (method === 'GET' && !hasCustomSegment) {
      // Only classify as findMany if it's the base collection path
      type = 'findMany';
    } else if (method === 'POST' && path.includes('/upsert')) {
      type = 'upsert';
    } else if (method === 'POST' && !hasCustomSegment) {
      // Only classify as create if it's the base collection path
      type = 'create';
    } else if ((method === 'PUT' || method === 'PATCH') && hasIdParam) {
      type = 'update';
    } else if (method === 'DELETE' && hasIdParam) {
      type = 'delete';
    } else {
      // Anything else is a custom operation
      type = 'custom';
    }

    // Determine complexity based on business rules and relationships
    const hasMultiplePreconditions = businessRules.preconditions.length > 1;
    const hasMultiplePostconditions = businessRules.postconditions.length > 1;
    const hasRelationships = relationships && relationships.length > 0;

    let complexity: ServiceOperationHint['complexity'];
    if (type === 'aggregate') {
      complexity = 'aggregated';
    } else if (hasMultiplePreconditions || hasMultiplePostconditions || hasRelationships) {
      complexity = 'nested';
    } else {
      complexity = 'simple';
    }

    // Determine transactionality
    // Write operations and nested operations should be transactional
    const isWriteOperation = ['create', 'update', 'delete', 'upsert'].includes(type);
    const transactional = isWriteOperation || complexity === 'nested';

    // Infer related entities to include (for eager loading)
    const includes: string[] = [];
    if (relationships && relationships.length > 0) {
      // For retrieve operations, suggest including relationships
      if (type === 'findUnique' || type === 'findMany') {
        relationships.forEach(rel => {
          if (rel.type === 'belongsTo' || rel.type === 'hasOne') {
            includes.push(rel.target);
          }
        });
      }
    }

    // Add query hints for list operations
    const queryHints: ServiceOperationHint['queryHints'] = type === 'findMany' ? {
      pagination: true,
      sorting: true,
      filtering: true,
      search: true
    } : undefined;

    // Infer caching for read operations
    const caching: ServiceOperationHint['caching'] = type === 'findUnique' || type === 'findMany' ? {
      enabled: true,
      ttl: type === 'findUnique' ? 300 : 60,  // 5 min for single, 1 min for list
      key: type === 'findUnique'
        ? `${modelName}:${path.split(':')[1] || 'id'}`
        : `${modelName}:list`
    } : undefined;

    return {
      type,
      complexity,
      transactional,
      includes: includes.length > 0 ? includes : undefined,
      queryHints,
      caching
    };
  }

  private inferIndexes(model: ModelSpec): string[] {
    const indexes: string[] = [];
    
    model.attributes.forEach(attr => {
      if (attr.unique) {
        indexes.push(`idx_${this.toSnakeCase(model.name)}_${this.toSnakeCase(attr.name)}_unique`);
      } else if (attr.searchable) {
        indexes.push(`idx_${this.toSnakeCase(model.name)}_${this.toSnakeCase(attr.name)}`);
      }
    });
    
    model.relationships.forEach(rel => {
      if (rel.type === 'belongsTo') {
        const fk = this.toSnakeCase(rel.target) + '_id';
        indexes.push(`idx_${this.toSnakeCase(model.name)}_${fk}`);
      }
    });
    
    return indexes;
  }

  private generateValidationRules(attr: AttributeSpec): string[] {
    const rules: string[] = [];
    
    if (attr.required) rules.push('required');
    if (attr.unique) rules.push('unique');
    if (attr.min !== undefined) rules.push(`min:${attr.min}`);
    if (attr.max !== undefined) rules.push(`max:${attr.max}`);
    if (attr.type === 'Email') rules.push('email');
    if (attr.type === 'URL') rules.push('url');
    if (attr.verified) rules.push('verified');
    
    return rules;
  }

  /**
   * v3.3: Check if field should be encrypted based on type (not name patterns)
   * No longer uses brittle heuristics like name.includes('password')
   */
  private isEncryptedField(attr: AttributeSpec): boolean {
    const encryptTypes = ['Password', 'Secret', 'Token'];
    return encryptTypes.includes(attr.type);
  }

  /**
   * v3.3: Check if field is an audit field using explicit metadata
   * Replaces brittle heuristic that matched hardcoded field names
   */
  private isAuditField(attr: AttributeSpec, model?: ModelSpec): boolean {
    // If model has explicit audit metadata, check if this attribute is an audit field
    if (model?.metadata?.audit) {
      const auditFieldNames = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
      return auditFieldNames.includes(attr.name);
    }

    // If model has softDelete metadata, check if this is a soft delete field
    if (model?.metadata?.softDelete) {
      const softDeleteFieldNames = ['deletedAt', 'isDeleted'];
      return softDeleteFieldNames.includes(attr.name);
    }

    return false;
  }

  private generateMethodSignature(name: string, spec: ExecutablePropertiesSpec): string {
    const params = Object.entries(spec.parameters || {})
      .map(([paramName, paramSpec]) => `${paramName}: ${paramSpec.type}`)
      .join(', ');
    
    const returnType = spec.returns || 'void';
    
    return `${name}(${params}): Promise<${returnType}>`;
  }

  private inferTransactional(spec: ExecutablePropertiesSpec): boolean {
    // Operations that modify state should be transactional
    return !!(spec.ensures && spec.ensures.length > 0) || 
           !!(spec.publishes && spec.publishes.length > 0);
  }

  private inferAsync(spec: ExecutablePropertiesSpec): boolean {
    // All database operations should be async
    return true;
  }

  private inferCacheable(name: string, spec: ExecutablePropertiesSpec): boolean {
    // Read operations without side effects are cacheable
    const readPrefixes = ['get', 'find', 'search', 'list', 'retrieve'];
    return readPrefixes.some(prefix => name.toLowerCase().startsWith(prefix)) &&
           (!spec.publishes || spec.publishes.length === 0);
  }

  private inferIdempotent(name: string): boolean {
    // Operations that can be safely retried
    const idempotentPrefixes = ['get', 'find', 'search', 'list', 'retrieve', 'update', 'delete'];
    return idempotentPrefixes.some(prefix => name.toLowerCase().startsWith(prefix));
  }

  private extractParameters(spec: ExecutablePropertiesSpec, includeId: boolean = false): any {
    const parameters: any = {
      path: {},
      query: {},
      body: {}
    };

    if (includeId) {
      parameters.path.id = this.createIdAttribute();
    }

    // Put all parameters in body for now (could be smarter about this)
    for (const [name, param] of Object.entries(spec.parameters || {})) {
      parameters.body[name] = this.optimizeAttribute(param, undefined);
    }

    return parameters;
  }

  private createIdAttribute(): AIOptimizedAttribute {
    return this.optimizeAttribute({
      name: 'id',
      type: 'UUID',
      required: true,
      unique: true
    }, undefined);
  }

  private createPaginationAttribute(name: string): AIOptimizedAttribute {
    const types: { [key: string]: AttributeSpec } = {
      page: { name: 'page', type: 'Integer', required: false, unique: false, min: 1, default: '1' },
      limit: { name: 'limit', type: 'Integer', required: false, unique: false, min: 1, max: 100, default: '20' },
      sort: { name: 'sort', type: 'String', required: false, unique: false },
      filter: { name: 'filter', type: 'String', required: false, unique: false }
    };

    return this.optimizeAttribute(types[name] || types.page, undefined);
  }

  private inferHttpMethod(name: string, action: ExecutablePropertiesSpec): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' {
    const methodMap: { [prefix: string]: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' } = {
      'get': 'GET',
      'find': 'GET',
      'search': 'GET',
      'list': 'GET',
      'retrieve': 'GET',
      'create': 'POST',
      'add': 'POST',
      'update': 'PUT',
      'modify': 'PUT',
      'patch': 'PATCH',
      'delete': 'DELETE',
      'remove': 'DELETE',
      'destroy': 'DELETE'
    };
    
    const nameLower = name.toLowerCase();
    for (const [prefix, method] of Object.entries(methodMap)) {
      if (nameLower.startsWith(prefix)) {
        return method;
      }
    }
    
    // Default based on whether it has side effects
    return (action.publishes && action.publishes.length > 0) ? 'POST' : 'GET';
  }

  private expandComponents(components: { [name: string]: any }): any {
    const expanded: any = {};
    
    for (const [name, component] of Object.entries(components)) {
      expanded[name] = {
        type: component.type || 'div',
        props: component.props || {},
        dataBindings: component.dataBindings || []
      };
    }
    
    return expanded;
  }

  private inferDependencies(service: ServiceSpec): string[] {
    const deps: Set<string> = new Set();
    
    // Infer from subscriptions
    if (service.subscriptions && service.subscriptions.events) {
      service.subscriptions.events.forEach(event => {
        // Assume event comes from a model/controller with similar name
        const modelName = event.replace(/(Created|Updated|Deleted|Changed)$/, '');
        deps.add(`${modelName}Repository`);
      });
    }
    
    // Common service dependencies
    deps.add('Logger');
    deps.add('EventBus');
    
    return Array.from(deps);
  }

  private inferInfrastructure(ast: SpecVerseAST): any {
    // Collect all events from all components
    const allEvents: EventSpec[] = [];
    const allTags: string[] = [];
    
    for (const component of ast.components || []) {
      allEvents.push(...component.events);
      if (component.tags) allTags.push(...component.tags);
    }

    return {
      database: {
        type: 'postgresql', // Default for production
        migrations: true,
        seedData: allTags.includes('demo') || false
      },
      messaging: {
        type: 'rabbitmq',
        queues: allEvents.map(e => this.toKebabCase(e.name))
      },
      caching: {
        type: 'redis',
        ttl: 3600 // 1 hour default
      }
    };
  }

  /**
   * String conversion utilities
   */
  
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }
}