/**
 * View Type Definitions for SpecVerse v3.5.0
 *
 * Type-safe definitions for the Views schema structure.
 * Generated from SPECVERSE-SCHEMA.json ViewsSection definitions.
 */

/**
 * Standard view types
 */
export type StandardViewType =
  | 'page'
  | 'list'
  | 'detail'
  | 'form'
  | 'dashboard'
  | 'modal'
  | 'dialog'
  | 'drawer'
  | 'wizard'
  | 'split';

/**
 * View type - standard or custom (camelCase)
 */
export type ViewType = StandardViewType | string;

/**
 * Standard component types
 */
export type StandardComponentType =
  // Data Display
  | 'table'
  | 'list'
  | 'grid'
  | 'card'
  | 'chart'
  // Form Controls
  | 'form'
  | 'input'
  | 'select'
  | 'checkbox'
  | 'radio'
  // Actions
  | 'button'
  | 'link'
  | 'icon'
  // Overlays
  | 'modal'
  | 'dialog'
  | 'drawer'
  | 'popover'
  | 'tooltip'
  // Containers
  | 'tabs'
  | 'accordion'
  | 'carousel'
  // Utility
  | 'filterPanel'
  | 'searchBar'
  | 'pagination'
  // Navigation
  | 'breadcrumb'
  | 'navbar'
  | 'sidebar'
  | 'footer'
  // Date/Time
  | 'calendar'
  | 'datepicker'
  | 'timepicker'
  // Advanced
  | 'tree'
  | 'timeline'
  | 'kanban'
  | 'gantt'
  | 'header';

/**
 * Component type - standard, custom PascalCase, or custom kebab-case
 */
export type ComponentType = StandardComponentType | string;

/**
 * Chart types for chart components
 */
export type ChartType = 'pie' | 'bar' | 'line' | 'area' | 'scatter' | 'donut';

/**
 * Layout alignment options
 */
export type LayoutAlignment = 'start' | 'center' | 'end' | 'stretch';

/**
 * Standard layout pattern types
 */
export type LayoutType =
  | 'single-column'
  | 'two-column'
  | 'three-column'
  | 'grid'
  | 'flex'
  | 'sidebar-left'
  | 'sidebar-right'
  | 'sidebar-both'
  | 'header-content'
  | 'header-content-footer'
  | 'master-detail'
  | 'split-horizontal'
  | 'split-vertical';

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'auto' | 'system';

/**
 * Field definition for forms and filters
 */
export interface FieldDefinition {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

/**
 * Option for select/dropdown components
 */
export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Validation rules for form components
 */
export interface ValidationRules {
  required?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Layout region configuration
 */
export interface LayoutRegion {
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  flex?: string;
  order?: number;
  align?: LayoutAlignment;
}

/**
 * Responsive layout configuration
 */
export interface ResponsiveLayout {
  mobile?: Record<string, any>;
  tablet?: Record<string, any>;
  desktop?: Record<string, any>;
}

/**
 * Standard layout definition
 */
export interface StandardLayout {
  type: LayoutType;
  regions?: Record<string, LayoutRegion>;
  spacing?: string;
  responsive?: ResponsiveLayout;
}

/**
 * View component definition
 */
export interface ViewComponent {
  /** Component type identifier */
  type?: ComponentType;

  /** Model this component operates on */
  model?: string;

  /** Column names for table/grid components */
  columns?: string[];

  /** Form fields or filter fields */
  fields?: (string | FieldDefinition)[];

  /** Chart type for chart components */
  chartType?: ChartType;

  /** Data source reference (e.g., 'tasks.status', 'events') */
  dataSource?: string;

  /** Source reference for component data */
  source?: string;

  /** Options for select/dropdown components */
  options?: SelectOption[];

  /** Component-specific properties */
  properties?: Record<string, any>;

  /** Event handlers (e.g., onClick, onChange) */
  events?: Record<string, string>;

  /** Validation rules for form components */
  validation?: ValidationRules;
}

/**
 * View-level feature flags and configuration
 */
export interface ViewProperties {
  // UI Features
  responsive?: boolean;
  authenticated?: boolean;
  authorized?: boolean;
  realtime?: boolean;

  // Data Features
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  paginated?: boolean;
  pagination?: boolean;

  // Export/Print
  exportable?: boolean;
  printable?: boolean;
  bookmarkable?: boolean;

  // Performance
  cacheable?: boolean;

  // Edit Mode
  editable?: boolean;

  // Refresh
  refreshInterval?: number;

  // Theming
  theme?: Theme;
  locale?: string;

  // Additional custom properties
  [key: string]: boolean | string | number | any[] | object | undefined;
}

/**
 * View definition
 */
export interface ViewDefinition {
  /** Human-readable description of the view */
  description?: string;

  /** View type/category */
  type?: ViewType;

  /** Primary model(s) for this view */
  model?: string | string[];

  /** Tags for categorization */
  tags?: string[];

  /** Whether this view is exported for reuse */
  export?: boolean;

  /** View layout definition */
  layout?: StandardLayout | Record<string, any>;

  /** Events this view subscribes to */
  subscribes_to?: string[];

  /** UI components within this view (visual elements like tables, forms, buttons) */
  uiComponents?: Record<string, ViewComponent>;

  /** View-level feature flags and configuration */
  properties?: ViewProperties;
}

/**
 * Views section - collection of view definitions
 */
export type ViewsSection = Record<string, ViewDefinition>;

/**
 * Namespace export for convenient access
 */
export namespace Views {
  export type Definition = ViewDefinition;
  export type Component = ViewComponent;
  export type Layout = StandardLayout;
  export type Properties = ViewProperties;
  export type Type = ViewType;
  export type ComponentTypeEnum = ComponentType;
}
