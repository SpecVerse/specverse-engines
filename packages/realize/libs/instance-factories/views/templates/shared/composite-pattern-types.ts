/**
 * Composite View Pattern Types
 *
 * Tech-independent type definitions for composite view patterns.
 * These patterns can be used by any framework adapter (React, Vue, Svelte, etc.)
 * to generate framework-specific implementations.
 *
 * NO FRAMEWORK DEPENDENCIES - Pure TypeScript types only.
 */

/**
 * CURVED operations supported by SpecVerse
 */
export type CURVEDOperation =
  | 'create'
  | 'update'
  | 'retrieve'
  | 'retrieve_many'
  | 'validate'
  | 'evolve'
  | 'delete';

/**
 * View pattern categories
 */
export type ViewCategory =
  | 'data-entry'      // Forms, inputs, creation/editing
  | 'data-display'    // Lists, tables, detail views
  | 'dashboard'       // Multi-section dashboards with metrics
  | 'navigation'      // Navigation, menus, routing
  | 'workflow';       // Wizards, multi-step processes

/**
 * Layout strategies for view rendering
 */
export type LayoutStrategy =
  | 'single-column'
  | 'two-column'
  | 'grid'
  | 'flex'
  | 'masonry'
  | 'custom';

/**
 * Data source types for views
 */
export type DataSource =
  | 'model'          // Direct model data
  | 'controller'     // Via controller operations
  | 'service'        // Via service layer
  | 'store'          // From state store
  | 'computed';      // Computed/derived data

/**
 * Section definition for multi-section layouts
 */
export interface SectionDefinition {
  id: string;
  title?: string;
  description?: string;

  // Fields to include (model attributes)
  fields?: string[];

  // Nested sections
  sections?: SectionDefinition[];

  // Layout for this section
  layout?: {
    type: LayoutStrategy;
    columns?: number;
    gap?: 'small' | 'medium' | 'large';
  };

  // Conditional rendering
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'exists';
    value: any;
  };
}

/**
 * Data operation definition (tech-independent)
 */
export interface DataOperation {
  operation: CURVEDOperation;
  params?: string[];        // Required parameters
  returns?: string;         // Return type

  // Optimistic updates
  optimistic?: boolean;

  // Caching strategy
  cache?: {
    enabled: boolean;
    ttl?: number;           // Time-to-live in seconds
    key?: string;           // Cache key pattern
  };
}

/**
 * Relationship binding for related data
 */
export interface RelationshipBinding {
  name: string;              // Relationship name (e.g., 'author', 'comments')
  type: 'belongsTo' | 'hasMany' | 'hasOne' | 'manyToMany';
  target: string;            // Target model name

  // Display configuration
  display: {
    as: 'select' | 'autocomplete' | 'chips' | 'table' | 'list' | 'inline';
    labelField: string;      // Field to use as display label
    searchable?: boolean;
  };

  // Loading strategy
  loading: 'eager' | 'lazy' | 'manual';
}

/**
 * Event handler definition
 */
export interface EventHandlerDefinition {
  event: string;             // Event name (e.g., 'submit', 'click', 'change')
  operation?: CURVEDOperation; // Operation to trigger
  handler?: string;          // Custom handler function name

  // Validation before execution
  validate?: boolean;

  // Confirmation dialog
  confirm?: {
    title: string;
    message: string;
  };
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'email' | 'url' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message?: string;
  }>;
}


/**
 * Core composite view pattern definition
 */
export interface CompositeViewPattern {
  // Identity
  id: string;
  name: string;
  version: string;
  description: string;

  // Metadata
  category: ViewCategory;
  tags: string[];
  author?: string;
  license?: string;

  // Composition
  requiredAtomicComponents: string[];  // From ATOMIC_COMPONENTS_REGISTRY
  optionalAtomicComponents: string[];

  // Layout
  layoutStrategy: {
    type: LayoutStrategy;
    responsive: boolean;
    sections?: SectionDefinition[];

    // Grid-specific
    columns?: number;
    rows?: number;

    // Flex-specific
    direction?: 'row' | 'column';
    wrap?: boolean;
  };

  // Data Bindings
  dataBindings: {
    source: DataSource;
    operations: DataOperation[];
    relationships?: RelationshipBinding[];
  };

  // Behavior
  supportedOperations: CURVEDOperation[];
  eventHandlers?: EventHandlerDefinition[];
  validationRules?: ValidationRule[];

  // State Management
  state?: {
    fields: string[];        // State fields to track
    persistence?: 'none' | 'session' | 'local';
  };

  // Extensibility
  extends?: string;          // Parent pattern ID
  customization?: {
    allowedOverrides: string[];  // Which properties can be overridden
    requiredOverrides: string[]; // Which properties must be overridden
  };
}

/**
 * Pattern registry structure
 */
export interface CompositePatternRegistry {
  [patternId: string]: CompositeViewPattern;
}

/**
 * Pattern validation result
 */
export interface PatternValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Pattern usage context (for adapter generation)
 */
export interface PatternContext {
  pattern: CompositeViewPattern;
  viewSpec: any;             // View specification from .specly file
  modelSchema: any;          // Model schema
  framework: 'react' | 'vue' | 'svelte' | 'angular';

  // Runtime vs generation
  mode: 'runtime' | 'generation';

  // Additional context
  metadata?: Record<string, any>;
}
