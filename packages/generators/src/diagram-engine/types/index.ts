/**
 * Core type definitions for the Unified Diagram Engine
 *
 * Provides interfaces for diagram generation, plugins, context, and styling
 */

import { SpecVerseAST, ComponentSpec, ModelSpec, ControllerSpec, ServiceSpec, EventSpec, ViewSpec } from '@specverse/types';

/**
 * Available diagram types
 */
export type DiagramType =
  // Event Flow Diagrams
  | 'event-flow-layered'
  | 'event-flow-sequence'
  | 'event-flow-swimlane'
  // Model Diagrams
  | 'class-diagram'
  | 'er-diagram'
  | 'profile-attachment'
  | 'lifecycle'
  // Architecture Diagrams
  | 'mvc-architecture'
  | 'service-architecture'
  | 'component-dependencies'
  // Deployment Diagrams
  | 'deployment-topology'
  | 'capability-flow'
  | 'environment-comparison'
  // Manifest Diagrams
  | 'manifest-mapping'
  | 'technology-stack'
  | 'capability-bindings'
  // Supporting Diagrams
  | 'api-routes'
  | 'security-architecture'
  | 'monitoring-observability';

/**
 * Output format for diagrams
 */
export type OutputFormat = 'mermaid' | 'plantuml' | 'graphviz';

/**
 * Diagram generation options
 */
export interface DiagramOptions {
  // Display options
  includeAttributes?: boolean;
  includeRelationships?: boolean;
  includeLifecycles?: boolean;
  includeBehaviors?: boolean;
  includeProfiles?: boolean;
  includeControllers?: boolean;
  includeServices?: boolean;
  includeEvents?: boolean;
  includeImports?: boolean;
  includeExports?: boolean;
  includeCapabilities?: boolean;
  includeScaling?: boolean;

  // Styling options
  theme?: string;
  title?: string;

  // Layout options
  direction?: 'TB' | 'TD' | 'BT' | 'LR' | 'RL';
  layerStyle?: 'horizontal' | 'vertical';

  // Filtering options
  components?: string[];
  models?: string[];
  events?: string[];

  // Custom options (plugin-specific)
  [key: string]: any;
}

/**
 * Color palette for themes
 */
export interface ColorPalette {
  model: string;
  profile: string;
  controller: string;
  service: string;
  event: string;
  view: string;
  domainEvent: string;
  appEvent: string;
  lifecycle: string;
  deployment: string;
  manifest: string;
  component: string;
  implementation: string;
  technology: string;
  capability: string;
}

/**
 * Shape configuration for nodes
 */
export interface ShapeConfig {
  model: 'rectangle' | 'rounded' | 'stadium' | 'cylinder';
  controller: 'rectangle' | 'rounded' | 'hexagon';
  service: 'rectangle' | 'rounded' | 'circle';
  event: 'diamond' | 'rounded' | 'hexagon';
  view: 'rectangle' | 'rounded' | 'trapezoid';
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  rankDir: 'TB' | 'TD' | 'BT' | 'LR' | 'RL';
  nodeSpacing: number;
  rankSpacing: number;
  edgeSpacing: number;
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  name: string;
  description?: string;
  colors: ColorPalette;
  shapes: ShapeConfig;
  layout: LayoutConfig;
}

/**
 * Mermaid node representation
 */
export interface MermaidNode {
  id: string;
  label: string;
  type: 'model' | 'profile' | 'controller' | 'service' | 'event' | 'view' | 'deployment' | 'manifest' |
        'component' | 'implementation' | 'technology' | 'capability' |
        'domainEvent' | 'appEvent';
  shape?: string;
  color?: string;
  attributes?: string[];
  methods?: string[];
  metadata?: Record<string, any>;
}

/**
 * Mermaid edge representation
 */
export interface MermaidEdge {
  from: string;
  to: string;
  type: 'solid' | 'dashed' | 'dotted';
  label?: string;
  arrow?: 'single' | 'double' | 'none';
  style?: string;
  metadata?: Record<string, any>;
}

/**
 * Mermaid subgraph representation
 */
export interface Subgraph {
  id: string;
  label: string;
  nodes: string[];
  direction?: 'TB' | 'TD' | 'BT' | 'LR' | 'RL';
  style?: string;
}

/**
 * Mermaid relationship (for ER diagrams)
 */
export interface MermaidRelation {
  from: string;
  to: string;
  type: 'hasMany' | 'hasOne' | 'belongsTo' | 'manyToMany';
  label?: string;
  cascade?: boolean;
  through?: string;
  fromCardinality?: string;
  toCardinality?: string;
  metadata?: Record<string, any>;
}

/**
 * Lifecycle state
 */
export interface MermaidState {
  id?: string;  // Optional for backward compatibility
  name: string;
  label?: string;  // Optional display label
  type?: 'start' | 'end' | 'normal';
  metadata?: Record<string, any>;
}

/**
 * Lifecycle transition
 */
export interface MermaidTransition {
  from: string;
  to: string;
  action?: string;
  condition?: string;
  label?: string;
}

/**
 * Lifecycle diagram
 */
export interface MermaidLifecycle {
  name: string;
  states: MermaidState[];
  transitions: MermaidTransition[];
}

/**
 * Sequence diagram element
 */
export interface MermaidSequence {
  type: 'participant' | 'message' | 'note' | 'activate' | 'deactivate';
  participant?: string;  // For participant declarations
  label?: string;  // For participant labels
  from?: string;  // For messages
  to?: string;  // For messages
  message?: string;  // For messages and notes
  activate?: boolean;  // For messages with activation
  placement?: 'over' | 'left' | 'right';  // For notes
  participants?: string[];  // For notes over multiple participants
}

/**
 * Complete Mermaid diagram
 */
export interface MermaidDiagram {
  type: 'graph' | 'erDiagram' | 'sequenceDiagram' | 'stateDiagram' | 'classDiagram';
  direction?: 'TB' | 'TD' | 'BT' | 'LR' | 'RL';
  title?: string;
  nodes: MermaidNode[];
  edges: MermaidEdge[];
  subgraphs: Subgraph[];
  relations?: MermaidRelation[];  // For ER diagrams
  lifecycles?: MermaidLifecycle[];  // For lifecycle diagrams
  states?: MermaidState[];  // For state machine diagrams
  sequences?: MermaidSequence[];  // For sequence diagrams
  metadata?: Record<string, any>;
}

/**
 * Diagram context - shared state during diagram generation
 */
export interface DiagramContext {
  ast: SpecVerseAST;
  options: DiagramOptions;
  theme: ThemeConfig;

  // Shared collections
  nodes: Map<string, MermaidNode>;
  edges: MermaidEdge[];
  subgraphs: Map<string, Subgraph>;
  relations: MermaidRelation[];
  lifecycles: Map<string, MermaidLifecycle>;
  metadata: Map<string, any>;

  // Helper methods
  getAllModels(): ModelSpec[];
  getAllControllers(): ControllerSpec[];
  getAllServices(): ServiceSpec[];
  getAllViews(): ViewSpec[];
  getAllEvents(): EventSpec[];
  getDeduplicatedRelationships(): Array<{
    from: string;
    to: string;
    relationship: any;
    isCanonical: boolean;
  }>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Plugin interface - all diagram plugins must implement this
 */
export interface DiagramPlugin {
  /**
   * Plugin metadata
   */
  name: string;
  version: string;
  description: string;
  supportedTypes: DiagramType[];

  /**
   * Generate diagram from context
   */
  generate(context: DiagramContext, type: DiagramType): MermaidDiagram;

  /**
   * Validate AST before generation
   */
  validate(ast: SpecVerseAST): ValidationResult;

  /**
   * Get default options for this plugin
   */
  getDefaultOptions(): Partial<DiagramOptions>;
}

/**
 * Diagram generator configuration
 */
export interface DiagramGeneratorConfig {
  plugins: DiagramPlugin[];
  theme?: string | ThemeConfig;
  outputFormat?: OutputFormat;
}
