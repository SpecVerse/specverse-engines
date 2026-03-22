/**
 * Core types for the V3.1 Inference Engine
 * Maintains strict separation between logical and physical concerns
 */

// ===============================
// Core Inference Types
// ===============================

export interface InferenceRule<TInput, TOutput> {
  /** Unique identifier for the rule */
  name: string;
  
  /** Pattern name for categorization */
  pattern: string;
  
  /** Optional condition for rule matching (JavaScript expression) */
  condition?: string;
  
  /** Template for generating output */
  template: RuleTemplate;
  
  /** Priority for rule ordering (higher = more priority) */
  priority: number;
  
  /** Optional description for documentation */
  description?: string;
}

export interface RuleTemplate {
  /** Template engine type */
  type: 'handlebars' | 'json' | 'yaml' | 'specly';
  
  /** Template content - can be string or array of strings */
  content: string | string[];
  
  /** Optional partial templates */
  partials?: Record<string, string>;
  
  /** Optional helper functions */
  helpers?: Record<string, string>;
}

export interface InferenceContext {
  /** Version of SpecVerse being processed */
  version: string;
  
  /** Models being processed */
  models: ModelDefinition[];
  
  /** Current model being processed (if applicable) */
  currentModel?: ModelDefinition;
  
  /** Relationship analysis results */
  relationships?: RelationshipAnalysis;
  
  /** Additional context data */
  metadata: Record<string, any>;
  
  /** Environment context for deployment inference */
  environment?: {
    target: 'development' | 'staging' | 'production';
    constraints: Record<string, any>;
  };
}

// ===============================
// Model and Relationship Types
// ===============================

export interface ModelDefinition {
  name: string;
  attributes: AttributeDefinition[];
  lifecycle?: LifecycleDefinition;
  relationships?: RelationshipDefinition[];
  behaviors?: BehaviorDefinition[];
  profiles?: ProfileDefinition[];
  metadata?: Record<string, any>;
}

export interface AttributeDefinition {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  default?: any;
  auto?: string;
  constraints?: string[];
  description?: string;
}

export interface RelationshipDefinition {
  name: string;
  type: 'belongsTo' | 'hasMany' | 'hasOne' | 'manyToMany';
  targetModel: string;
  foreignKey?: string;
  cascadeDelete?: boolean;
  description?: string;
}

export interface LifecycleDefinition {
  name: string;
  states: string[];
  transitions: TransitionDefinition[];
  initial?: string;
}

export interface TransitionDefinition {
  name: string;
  from: string;
  to: string;
  conditions?: string[];
}

export interface ProfileDefinition {
  name: string;
  attributes: AttributeDefinition[];
  baseProfiles?: string[];
}

export interface BehaviorDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, string>;
  returns?: string;
  requires?: string[];
  ensures?: string[];
  publishes?: string[];
}

export interface RelationshipAnalysis {
  parentRelationships: RelationshipDefinition[];
  childRelationships: RelationshipDefinition[];
  siblingRelationships: RelationshipDefinition[];
  manyToManyRelationships: RelationshipDefinition[];
  cascadeDeleteTargets: string[];
}

// ===============================
// Logical Output Types (Component Layer)
// ===============================

export interface LogicalComponentSpec {
  name: string;
  version?: string;
  description?: string;
  controllers: Record<string, ControllerSpec>;
  services: Record<string, ServiceSpec>;
  events: Record<string, EventSpec>;
  views: Record<string, ViewSpec>;
  models: Record<string, ModelSpec>;
  commonDefinitions?: Record<string, TypeDefinition>;
}

export interface ControllerSpec {
  model?: string;
  description?: string;
  cured?: CUREDOperations;
  customActions?: Record<string, ActionSpec>;
  subscribes_to?: Record<string, string>;
}

export interface CUREDOperations {
  create?: ActionSpec;
  update?: ActionSpec;
  retrieve?: ActionSpec;
  retrieve_many?: ActionSpec;
  evolve?: ActionSpec;
  delete?: ActionSpec;
  validate?: ActionSpec;  // v3.3: Unified validation operation
}

export interface ActionSpec {
  description?: string;
  parameters: Record<string, string>;
  returns: string;
  requires?: string[];
  ensures?: string[];
  publishes?: string[];
}

export interface ServiceSpec {
  description?: string;
  subscribes_to?: Record<string, string>;
  operations?: Record<string, OperationSpec>;
}

export interface OperationSpec {
  description?: string;
  parameters: Record<string, string>;
  returns: string;
  requires?: string[];
  ensures?: string[];
}

export interface EventSpec {
  description?: string;
  attributes: Record<string, string>;
}

export interface ViewSpec {
  type?: 'list' | 'detail' | 'form' | 'dashboard' | 'master_detail' |
         'analytics' | 'board' | 'calendar' | 'timeline' | 'map' |
         'wizard' | 'feed' | 'profile' | 'settings' | 'workflow' | 'comparison';
  model?: string;
  models?: string[];
  description?: string;
  subscribes_to?: string[];
  uiComponents?: Record<string, any>;
}

export interface ViewComponent {
  type: string;
  properties?: Record<string, any>;
}

export interface ModelSpec {
  description?: string;
  metadata?: ModelMetadataSpec;
  attributes: Record<string, string>;
  relationships?: Record<string, RelationshipSpec>;
  lifecycles?: Record<string, LifecycleSpec>;
  behaviors?: Record<string, any>;
}

export interface RelationshipSpec {
  type: string;
  target: string;
  cascade?: boolean;
}

export interface LifecycleSpec {
  states: string[];
  transitions: Record<string, TransitionSpec>;
}

export interface TransitionSpec {
  from: string;
  to: string;
}

// ===============================
// Metadata Primitives (v3.3)
// ===============================

export interface ModelMetadataSpec {
  /** ID field generation strategy */
  id?: IdMetadata | 'auto' | 'manual' | 'composite' | 'uuid' | 'integer';

  /** Field(s) to use as display label in UIs */
  label?: string | string[];

  /** Audit fields configuration (timestamps + user tracking) */
  audit?: boolean | AuditMetadata;

  /** Soft delete configuration */
  softDelete?: boolean | SoftDeleteMetadata;

  /** Status field configuration (from lifecycle or explicit) */
  status?: string | StatusMetadata;

  /** Versioning configuration for optimistic locking */
  version?: boolean | VersionMetadata;
}

export interface IdMetadata {
  /** ID generation type */
  type: 'auto' | 'manual' | 'composite' | 'uuid' | 'integer';

  /** Custom name for ID field (default: 'id') */
  name?: string;

  /** Fields for composite ID */
  fields?: string[];
}

export interface AuditMetadata {
  /** Enable timestamp tracking (createdAt, updatedAt) */
  timestamps?: boolean;

  /** Enable user tracking (createdBy, updatedBy) */
  users?: boolean;

  /** Custom names for timestamp fields */
  timestampNames?: {
    created?: string;
    updated?: string;
  };

  /** Custom names for user tracking fields */
  userNames?: {
    created?: string;
    updated?: string;
  };
}

export interface SoftDeleteMetadata {
  /** Enable soft delete */
  enabled?: boolean;

  /** Custom names for soft delete fields */
  fieldNames?: {
    deletedAt?: string;
    isDeleted?: string;
  };
}

export interface StatusMetadata {
  /** Name for status field */
  field?: string;

  /** Lifecycle to derive states from */
  lifecycle?: string;

  /** Explicit status values (if no lifecycle) */
  values?: string[];
}

export interface VersionMetadata {
  /** Enable versioning */
  enabled?: boolean;

  /** Name for version field */
  field?: string;

  /** Type of version field */
  type?: 'integer' | 'timestamp';
}

// ===============================
// Validate Operation (v3.3)
// ===============================

export interface TypeDefinition {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  description?: string;
  properties?: Record<string, string>;
  items?: string;
}

// ===============================
// Logical Deployment Types (Deployment Layer)
// ===============================

export interface LogicalDeploymentSpec {
  version: string;
  environment?: 'development' | 'staging' | 'production';
  description?: string;
  imports?: ComponentImport[];
  instances: {
    controllers?: Record<string, any>;
    services?: Record<string, any>;
    views?: Record<string, any>;
    communications?: Record<string, any>;
    storage?: Record<string, any>;
    security?: Record<string, any>;
    infrastructure?: Record<string, any>;
    monitoring?: Record<string, any>;
  };
  channels?: Record<string, LogicalChannel>;
  bindings?: Record<string, LogicalBinding>;
}

export interface ComponentImport {
  source: string;
  alias?: string;
  select?: string[];
}

export interface LogicalInstance {
  /** Logical type reference (Component.Controller format) */
  type: string;
  
  /** Logical resource requirements */
  logical_requirements: {
    compute: 'low' | 'medium' | 'high' | 'variable';
    memory: 'small' | 'standard' | 'large' | 'xlarge';
    scaling: 'fixed' | 'horizontal' | 'vertical' | 'auto';
    availability: 'standard' | 'high' | 'critical';
  };
  
  /** CURED-specific configuration hints */
  cured_config?: {
    [operation: string]: {
      scaling_hint?: 'read_heavy' | 'write_heavy' | 'balanced';
      caching_hint?: 'none' | 'moderate' | 'aggressive';
      validation_hint?: 'loose' | 'standard' | 'strict';
      rate_limiting_hint?: 'none' | 'moderate' | 'strict';
    };
  };
  
  /** Subscription configuration for services */
  subscription_config?: {
    concurrency?: number;
    batch_size?: number;
    retry_policy?: 'none' | 'linear' | 'exponential';
  };
}

export interface LogicalChannel {
  type: 'event_bus' | 'message_queue' | 'pub_sub' | 'request_reply';
  
  logical_properties: {
    message_pattern: 'fire_and_forget' | 'request_reply' | 'publish_subscribe';
    reliability: 'at_most_once' | 'at_least_once' | 'exactly_once';
    ordering: 'none' | 'per_partition' | 'global';
    persistence: 'ephemeral' | 'durable';
  };
}

export interface LogicalBinding {
  type: 'publisher' | 'subscriber' | 'request' | 'reply';
  from: string;
  to: string;
  pattern: 'fire_and_forget' | 'reliable_delivery' | 'confirmed_delivery';
}

// ===============================
// Generator Interfaces
// ===============================

export interface LogicalGenerator<TInput, TOutput> {
  name: string;
  supports(input: TInput, context: InferenceContext): boolean;
  generate(input: TInput[], context: InferenceContext): Promise<any>;
}

export interface DeploymentGenerator<TInput, TOutput> {
  name: string;
  supports(input: TInput, context: InferenceContext): boolean;
  generate(input: TInput, context: InferenceContext): Promise<any>;
}

// ===============================
// Rule Loading and Validation
// ===============================

export interface RuleSet {
  version: string;
  logical_inference?: {
    controllers?: InferenceRule<ModelDefinition, ControllerSpec>[];
    services?: InferenceRule<ModelDefinition, ServiceSpec>[];
    events?: InferenceRule<ModelDefinition, EventSpec>[];
    views?: InferenceRule<ModelDefinition, ViewSpec>[];
  };
  deployment_inference?: {
    instances?: InferenceRule<LogicalComponentSpec, LogicalInstance>[];
    channels?: InferenceRule<LogicalComponentSpec, LogicalChannel>[];
    bindings?: InferenceRule<LogicalComponentSpec, LogicalBinding>[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
}

// ===============================
// Engine Configuration
// ===============================

export interface InferenceEngineConfig {
  /** Enable/disable logical inference categories */
  logical: {
    generateControllers: boolean;
    generateServices: boolean;
    generateEvents: boolean;
    generateViews: boolean;
    generateTypes: boolean;
  };
  
  /** Enable/disable deployment inference categories */
  deployment: {
    generateInstances: boolean;
    generateChannels: boolean;
    generateBindings: boolean;
  };
  
  /** Rule file locations */
  rules: {
    logicalRulesPath: string;
    deploymentRulesPath: string;
  };
  
  /** Template configuration */
  templates: {
    templatesPath: string;
    defaultEngine: 'handlebars';
  };
  
  /** Validation settings */
  validation: {
    strictMode: boolean;
    failOnWarnings: boolean;
  };
}

export const DEFAULT_ENGINE_CONFIG: InferenceEngineConfig = {
  logical: {
    generateControllers: true,
    generateServices: true,
    generateEvents: true,
    generateViews: true,
    generateTypes: true,
  },
  deployment: {
    generateInstances: true,
    generateChannels: true,
    generateBindings: true,
  },
  rules: {
    logicalRulesPath: 'rules/logical', // Will be resolved by CLI or calling code
    deploymentRulesPath: 'rules/deployment', // Will be resolved by CLI or calling code
  },
  templates: {
    templatesPath: './templates',
    defaultEngine: 'handlebars',
  },
  validation: {
    strictMode: false,
    failOnWarnings: false,
  },
};