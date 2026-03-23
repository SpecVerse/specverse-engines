/**
 * Component Metadata - Runtime Rendering Hints
 *
 * Provides metadata for runtime interpretation and dynamic rendering.
 * Bridges the static atomic components registry with dynamic runtime engines.
 *
 * Used by:
 * - app-demo runtime engine for dynamic component rendering
 * - Documentation generation for component catalogs
 * - AI-powered component suggestions
 * - IDE tooling and autocomplete
 *
 * Architecture:
 * - Enriches atomic component definitions with runtime hints
 * - Provides property descriptions and validation rules
 * - Includes rendering capabilities and constraints
 * - Supports dynamic component discovery
 */

import { ATOMIC_COMPONENTS_REGISTRY, AtomicComponentDefinition } from './atomic-components-registry.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Property metadata for runtime interpretation
 */
export interface PropertyMetadata {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
  required: boolean;
  default?: any;
  description: string;
  enumValues?: string[]; // For enum types
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  /**
   * Common property that maps across frameworks
   * (variant, size, color, position, orientation)
   */
  isCommon?: boolean;
  /**
   * Property affects layout/rendering significantly
   */
  affectsLayout?: boolean;
}

/**
 * Event metadata for runtime interpretation
 */
export interface EventMetadata {
  name: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    description: string;
  }[];
  /**
   * Event bubbles up to parent components
   */
  bubbles?: boolean;
}

/**
 * Rendering capability metadata
 */
export interface RenderingCapability {
  /**
   * Component can contain children
   */
  supportsChildren: boolean;
  /**
   * Component supports conditional rendering (v-if, *ngIf, etc.)
   */
  supportsConditional: boolean;
  /**
   * Component supports list rendering (v-for, *ngFor, map, etc.)
   */
  supportsList: boolean;
  /**
   * Component supports slots/content projection
   */
  supportsSlots: boolean;
  /**
   * Maximum recommended nesting depth
   */
  maxDepth?: number;
  /**
   * Preferred position in component tree
   */
  preferredPosition?: 'root' | 'container' | 'leaf' | 'any';
}

/**
 * Accessibility metadata
 */
export interface AccessibilityMetadata {
  /**
   * ARIA role
   */
  role?: string;
  /**
   * Keyboard navigable
   */
  keyboardNavigable: boolean;
  /**
   * Required ARIA attributes
   */
  requiredAriaAttrs?: string[];
  /**
   * Screen reader description template
   */
  screenReaderDescription?: string;
}

/**
 * Component state metadata
 */
export interface StateMetadata {
  /**
   * Component manages internal state
   */
  hasInternalState: boolean;
  /**
   * State properties managed by component
   */
  stateProperties?: {
    name: string;
    type: string;
    description: string;
    defaultValue?: any;
  }[];
}

/**
 * Complete component metadata for runtime
 */
export interface ComponentMetadata extends AtomicComponentDefinition {
  /**
   * Property definitions with validation
   */
  propertyMetadata: PropertyMetadata[];
  /**
   * Event definitions
   */
  eventMetadata?: EventMetadata[];
  /**
   * Rendering capabilities
   */
  capabilities: RenderingCapability;
  /**
   * Accessibility information
   */
  accessibility: AccessibilityMetadata;
  /**
   * State management information
   */
  state: StateMetadata;
  /**
   * Related components (alternatives, compositions)
   */
  related?: {
    alternatives?: string[]; // Similar components
    compositions?: string[]; // Components often used with this one
    containers?: string[]; // Common parent containers
  };
  /**
   * Usage examples for runtime
   */
  usageExamples?: {
    title: string;
    description: string;
    code: string;
  }[];
}

// ============================================================================
// Common Property Metadata
// ============================================================================

/**
 * Metadata for the 5 universal properties
 */
export const COMMON_PROPERTY_METADATA: Record<string, PropertyMetadata> = {
  variant: {
    name: 'variant',
    type: 'enum',
    required: false,
    default: 'primary',
    description: 'Visual style variant for the component',
    enumValues: ['primary', 'secondary', 'destructive', 'ghost', 'outline'],
    isCommon: true,
    affectsLayout: false
  },
  size: {
    name: 'size',
    type: 'enum',
    required: false,
    default: 'medium',
    description: 'Size of the component',
    enumValues: ['small', 'medium', 'large'],
    isCommon: true,
    affectsLayout: true
  },
  color: {
    name: 'color',
    type: 'enum',
    required: false,
    default: 'primary',
    description: 'Color scheme for the component',
    enumValues: ['primary', 'success', 'warning', 'error', 'info'],
    isCommon: true,
    affectsLayout: false
  },
  position: {
    name: 'position',
    type: 'enum',
    required: false,
    default: 'top',
    description: 'Position or alignment of the component',
    enumValues: ['top', 'bottom', 'left', 'right'],
    isCommon: true,
    affectsLayout: true
  },
  orientation: {
    name: 'orientation',
    type: 'enum',
    required: false,
    default: 'horizontal',
    description: 'Layout orientation of the component',
    enumValues: ['horizontal', 'vertical'],
    isCommon: true,
    affectsLayout: true
  }
};

// ============================================================================
// Component-Specific Metadata Registry
// ============================================================================

/**
 * Enhanced metadata for all atomic components
 */
export const COMPONENT_METADATA_REGISTRY: Record<string, ComponentMetadata> = {
  // Data Display Components
  table: {
    ...ATOMIC_COMPONENTS_REGISTRY.table,
    propertyMetadata: [
      {
        name: 'columns',
        type: 'array',
        required: true,
        description: 'Column definitions for the table',
        validation: { min: 1 }
      },
      {
        name: 'dataSource',
        type: 'string',
        required: true,
        description: 'Model array name for table data'
      },
      {
        name: 'sortable',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable column sorting',
        affectsLayout: false
      },
      {
        name: 'filterable',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable filtering',
        affectsLayout: true
      },
      {
        name: 'pagination',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable pagination',
        affectsLayout: true
      },
      COMMON_PROPERTY_METADATA.size
    ],
    eventMetadata: [
      {
        name: 'onRowClick',
        description: 'Fired when a row is clicked',
        parameters: [
          { name: 'row', type: 'object', description: 'Clicked row data' },
          { name: 'index', type: 'number', description: 'Row index' }
        ]
      },
      {
        name: 'onSort',
        description: 'Fired when column sort changes',
        parameters: [
          { name: 'column', type: 'string', description: 'Column key' },
          { name: 'direction', type: 'string', description: 'Sort direction (asc/desc)' }
        ]
      }
    ],
    capabilities: {
      supportsChildren: false,
      supportsConditional: true,
      supportsList: true,
      supportsSlots: false,
      maxDepth: 1,
      preferredPosition: 'leaf'
    },
    accessibility: {
      role: 'table',
      keyboardNavigable: true,
      requiredAriaAttrs: ['aria-label'],
      screenReaderDescription: 'Data table with {columns.length} columns'
    },
    state: {
      hasInternalState: true,
      stateProperties: [
        { name: 'sortColumn', type: 'string', description: 'Currently sorted column' },
        { name: 'sortDirection', type: 'string', description: 'Sort direction (asc/desc)' },
        { name: 'currentPage', type: 'number', description: 'Current page number', defaultValue: 1 }
      ]
    },
    related: {
      alternatives: ['list', 'grid'],
      compositions: ['pagination', 'search'],
      containers: ['card', 'container']
    }
  },

  button: {
    ...ATOMIC_COMPONENTS_REGISTRY.button,
    propertyMetadata: [
      COMMON_PROPERTY_METADATA.variant,
      COMMON_PROPERTY_METADATA.size,
      {
        name: 'disabled',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Disable button interaction'
      },
      {
        name: 'loading',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Show loading state'
      },
      {
        name: 'label',
        type: 'string',
        required: false,
        description: 'Button text label'
      }
    ],
    eventMetadata: [
      {
        name: 'onClick',
        description: 'Fired when button is clicked',
        parameters: [
          { name: 'event', type: 'MouseEvent', description: 'Click event' }
        ],
        bubbles: true
      }
    ],
    capabilities: {
      supportsChildren: true,
      supportsConditional: true,
      supportsList: false,
      supportsSlots: false,
      maxDepth: 1,
      preferredPosition: 'leaf'
    },
    accessibility: {
      role: 'button',
      keyboardNavigable: true,
      requiredAriaAttrs: ['aria-label'],
      screenReaderDescription: '{variant} button: {label}'
    },
    state: {
      hasInternalState: false
    },
    related: {
      alternatives: ['link', 'icon-button'],
      compositions: ['icon', 'badge'],
      containers: ['form', 'card', 'toolbar']
    }
  },

  card: {
    ...ATOMIC_COMPONENTS_REGISTRY.card,
    propertyMetadata: [
      {
        name: 'title',
        type: 'string',
        required: false,
        description: 'Card title'
      },
      {
        name: 'elevation',
        type: 'enum',
        required: false,
        default: 'medium',
        description: 'Shadow depth',
        enumValues: ['none', 'low', 'medium', 'high']
      },
      COMMON_PROPERTY_METADATA.size
    ],
    capabilities: {
      supportsChildren: true,
      supportsConditional: true,
      supportsList: true,
      supportsSlots: true,
      maxDepth: 3,
      preferredPosition: 'container'
    },
    accessibility: {
      role: 'article',
      keyboardNavigable: false,
      screenReaderDescription: 'Card: {title}'
    },
    state: {
      hasInternalState: false
    },
    related: {
      alternatives: ['panel', 'container'],
      compositions: ['button', 'image', 'text', 'list'],
      containers: ['grid', 'container']
    }
  },

  input: {
    ...ATOMIC_COMPONENTS_REGISTRY.input,
    propertyMetadata: [
      {
        name: 'type',
        type: 'enum',
        required: false,
        default: 'text',
        description: 'Input type',
        enumValues: ['text', 'email', 'password', 'number', 'tel', 'url']
      },
      {
        name: 'placeholder',
        type: 'string',
        required: false,
        description: 'Placeholder text'
      },
      {
        name: 'required',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Field is required'
      },
      {
        name: 'disabled',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Disable input'
      },
      COMMON_PROPERTY_METADATA.size,
      {
        name: 'variant',
        type: 'enum',
        required: false,
        default: 'outlined',
        description: 'Visual style variant',
        enumValues: ['filled', 'outlined', 'standard'],
        isCommon: true
      }
    ],
    eventMetadata: [
      {
        name: 'onChange',
        description: 'Fired when input value changes',
        parameters: [
          { name: 'value', type: 'string', description: 'New value' },
          { name: 'event', type: 'Event', description: 'Change event' }
        ]
      },
      {
        name: 'onBlur',
        description: 'Fired when input loses focus',
        parameters: [
          { name: 'event', type: 'FocusEvent', description: 'Blur event' }
        ]
      }
    ],
    capabilities: {
      supportsChildren: false,
      supportsConditional: true,
      supportsList: false,
      supportsSlots: false,
      maxDepth: 0,
      preferredPosition: 'leaf'
    },
    accessibility: {
      role: 'textbox',
      keyboardNavigable: true,
      requiredAriaAttrs: ['aria-label', 'aria-required'],
      screenReaderDescription: '{type} input: {placeholder}'
    },
    state: {
      hasInternalState: true,
      stateProperties: [
        { name: 'value', type: 'string', description: 'Current input value', defaultValue: '' },
        { name: 'isFocused', type: 'boolean', description: 'Input has focus', defaultValue: false }
      ]
    },
    related: {
      alternatives: ['textarea', 'select'],
      compositions: ['label', 'validation-message'],
      containers: ['form', 'form-field']
    }
  },

  modal: {
    ...ATOMIC_COMPONENTS_REGISTRY.modal,
    propertyMetadata: [
      {
        name: 'title',
        type: 'string',
        required: false,
        description: 'Modal title'
      },
      {
        name: 'open',
        type: 'boolean',
        required: true,
        description: 'Modal visibility state'
      },
      {
        name: 'closable',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Show close button'
      },
      COMMON_PROPERTY_METADATA.size
    ],
    eventMetadata: [
      {
        name: 'onClose',
        description: 'Fired when modal is closed',
        parameters: []
      }
    ],
    capabilities: {
      supportsChildren: true,
      supportsConditional: true,
      supportsList: false,
      supportsSlots: true,
      maxDepth: 2,
      preferredPosition: 'root'
    },
    accessibility: {
      role: 'dialog',
      keyboardNavigable: true,
      requiredAriaAttrs: ['aria-modal', 'aria-labelledby'],
      screenReaderDescription: 'Modal dialog: {title}'
    },
    state: {
      hasInternalState: true,
      stateProperties: [
        { name: 'open', type: 'boolean', description: 'Modal open state', defaultValue: false }
      ]
    },
    related: {
      alternatives: ['drawer', 'popover'],
      compositions: ['button', 'form', 'card'],
      containers: ['root']
    }
  },

  badge: {
    ...ATOMIC_COMPONENTS_REGISTRY.badge,
    propertyMetadata: [
      {
        name: 'content',
        type: 'string',
        required: false,
        description: 'Badge content/label'
      },
      COMMON_PROPERTY_METADATA.variant,
      COMMON_PROPERTY_METADATA.color,
      {
        name: 'variant',
        type: 'enum',
        required: false,
        default: 'standard',
        description: 'Badge style',
        enumValues: ['dot', 'standard'],
        isCommon: true
      }
    ],
    capabilities: {
      supportsChildren: false,
      supportsConditional: true,
      supportsList: false,
      supportsSlots: false,
      maxDepth: 0,
      preferredPosition: 'leaf'
    },
    accessibility: {
      role: 'status',
      keyboardNavigable: false,
      screenReaderDescription: 'Badge: {content}'
    },
    state: {
      hasInternalState: false
    },
    related: {
      alternatives: ['chip', 'tag'],
      compositions: ['icon', 'avatar'],
      containers: ['button', 'card']
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get metadata for a component type
 *
 * @param componentType - Component type from atomic registry
 * @returns Component metadata or undefined
 */
export function getComponentMetadata(componentType: string): ComponentMetadata | undefined {
  return COMPONENT_METADATA_REGISTRY[componentType];
}

/**
 * Get all available component types with metadata
 *
 * @returns Array of component type names
 */
export function getAllComponentTypes(): string[] {
  return Object.keys(COMPONENT_METADATA_REGISTRY);
}

/**
 * Get components by category
 *
 * @param category - Component category
 * @returns Array of component metadata
 */
export function getComponentsByCategory(
  category: ComponentMetadata['category']
): ComponentMetadata[] {
  return Object.values(COMPONENT_METADATA_REGISTRY).filter(
    comp => comp.category === category
  );
}

/**
 * Get components that can contain children
 *
 * @returns Array of container component metadata
 */
export function getContainerComponents(): ComponentMetadata[] {
  return Object.values(COMPONENT_METADATA_REGISTRY).filter(
    comp => comp.capabilities.supportsChildren
  );
}

/**
 * Get leaf components (cannot contain children)
 *
 * @returns Array of leaf component metadata
 */
export function getLeafComponents(): ComponentMetadata[] {
  return Object.values(COMPONENT_METADATA_REGISTRY).filter(
    comp => !comp.capabilities.supportsChildren
  );
}

/**
 * Check if a component supports a specific property
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @returns True if property is supported
 */
export function supportsProperty(componentType: string, propertyName: string): boolean {
  const metadata = getComponentMetadata(componentType);
  if (!metadata) return false;

  return metadata.propertyMetadata.some(prop => prop.name === propertyName);
}

/**
 * Get property metadata for a component
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @returns Property metadata or undefined
 */
export function getPropertyMetadata(
  componentType: string,
  propertyName: string
): PropertyMetadata | undefined {
  const metadata = getComponentMetadata(componentType);
  if (!metadata) return undefined;

  return metadata.propertyMetadata.find(prop => prop.name === propertyName);
}

/**
 * Validate property value against metadata
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @param value - Property value
 * @returns Validation result with errors
 */
export function validatePropertyValue(
  componentType: string,
  propertyName: string,
  value: any
): { valid: boolean; errors: string[] } {
  const propMeta = getPropertyMetadata(componentType, propertyName);
  if (!propMeta) {
    return { valid: false, errors: [`Unknown property: ${propertyName}`] };
  }

  const errors: string[] = [];

  // Type validation
  if (propMeta.type === 'enum' && propMeta.enumValues) {
    if (!propMeta.enumValues.includes(value)) {
      errors.push(`Invalid enum value. Expected one of: ${propMeta.enumValues.join(', ')}`);
    }
  }

  // Validation rules
  if (propMeta.validation) {
    if (propMeta.validation.min !== undefined && value < propMeta.validation.min) {
      errors.push(`Value must be >= ${propMeta.validation.min}`);
    }
    if (propMeta.validation.max !== undefined && value > propMeta.validation.max) {
      errors.push(`Value must be <= ${propMeta.validation.max}`);
    }
    if (propMeta.validation.pattern && typeof value === 'string') {
      const regex = new RegExp(propMeta.validation.pattern);
      if (!regex.test(value)) {
        errors.push(`Value must match pattern: ${propMeta.validation.pattern}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get recommended components for composition
 *
 * @param componentType - Component type
 * @returns Array of recommended component types
 */
export function getRecommendedCompositions(componentType: string): string[] {
  const metadata = getComponentMetadata(componentType);
  return metadata?.related?.compositions || [];
}

/**
 * Check if two components can be nested
 *
 * @param parentType - Parent component type
 * @param childType - Child component type
 * @returns True if nesting is allowed
 */
export function canNest(parentType: string, childType: string): boolean {
  const parentMeta = getComponentMetadata(parentType);
  const childMeta = getComponentMetadata(childType);

  if (!parentMeta || !childMeta) return false;

  // Parent must support children
  if (!parentMeta.capabilities.supportsChildren) return false;

  // Check depth constraints
  if (childMeta.capabilities.preferredPosition === 'root') return false;

  return true;
}
