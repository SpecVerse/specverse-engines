/**
 * API Types Generator
 * Generates TypeScript type definitions for API interactions
 */

export interface ApiTypesGeneratorContext {
  spec: any;
  manifest: any;
}

export async function generate(context: ApiTypesGeneratorContext): Promise<string> {
  return `/**
 * API Types
 *
 * Shared type definitions for API interactions
 */

export interface RuntimeInfo {
  models: string[];
  controllers: string[];
  controllerModels?: Record<string, string>;  // Controller name -> Model name mapping
  events: string[];
  services: string[];
  views?: string[];
  operations?: Record<string, (Operation | string)[]>;
  specFile?: string;
}

export interface Operation {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  returns?: string;
  requires?: string[];
  ensures?: string[];
  publishes?: string[];
}

export interface Event {
  eventName: string;
  data: any;
  timestamp: Date;
}

export interface ModelSchema {
  name: string;
  description?: string;
  attributes: Record<string, AttributeDefinition>;
  relationships?: Record<string, RelationshipDefinition>;
  lifecycles?: Record<string, LifecycleDefinition>;
  behaviors?: Record<string, BehaviorDefinition>;
}

export interface AttributeDefinition {
  type: string;
  required?: boolean;
  default?: any;
  auto?: string;
  unique?: boolean;
}

export interface RelationshipDefinition {
  type: 'belongsTo' | 'hasMany' | 'hasOne';
  model: string;
  targetModel?: string;
  foreignKey?: string;
}

export interface LifecycleDefinition {
  initial?: string;
  states?: Record<string, any>;
  flow?: string;
}

export interface BehaviorDefinition {
  description?: string;
  parameters?: Record<string, any>;
  returns?: string;
  requires?: string[];
  ensures?: string[];
  publishes?: string[];
}

export interface Entity {
  id: string;
  data: Record<string, any>;
  metadata?: {
    lifecycleStates?: Record<string, string>;
    [key: string]: any;
  };
}

export interface View {
  name: string;
  description?: string;
  type: string;
  model?: string | string[];  // Legacy: model-based views
  controller?: string;  // New: controller-based views
  related?: Array<{ model: string }>;  // Related models for multi-model views
  columns?: string[];  // Column names for list/table views
  sections?: any[];  // Sections for dashboard views
  uiComponents?: Record<string, any>;
  subscribesTo?: string[];
  properties?: Record<string, any>;
}

export interface Service {
  name: string;
  description?: string;
  subscribesTo: string[];
  subscribes_to?: string[];
  operations: ServiceOperation[];
}

export interface ServiceOperation {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  returns?: string;
  requires?: string[];
  ensures?: string[];
  publishes?: string[];
}

export interface Behavior {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  returns?: string;
  requires?: string[];
  ensures?: string[];
  publishes?: string[];
}

export interface WebSocketMessage {
  id?: string;
  type: 'subscribe' | 'unsubscribe' | 'execute' | 'transition' | 'query';
  payload: any;
}

export interface WebSocketResponse {
  id?: string;
  type: 'event' | 'result' | 'error' | 'reload';
  payload: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
`;
}
