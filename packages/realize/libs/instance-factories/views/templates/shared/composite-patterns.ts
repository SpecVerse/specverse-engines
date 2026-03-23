/**
 * Composite View Patterns Registry
 *
 * Tech-independent definitions for composite view patterns.
 * These patterns describe high-level view structures that can be rendered
 * by any framework adapter (React, Vue, Svelte, Angular, etc.)
 *
 * NO FRAMEWORK DEPENDENCIES - Pure TypeScript definitions only.
 */

import type {
  CompositeViewPattern,
  CompositePatternRegistry,
  CURVEDOperation,
  DataSource,
  LayoutStrategy
} from './composite-pattern-types.js';

/**
 * FormView Pattern
 *
 * A data entry view for creating or updating entities.
 * Generates forms with validation, field rendering, and submission handling.
 */
export const FORM_VIEW_PATTERN: CompositeViewPattern = {
  // Identity
  id: 'form-view',
  name: 'FormView',
  version: '1.0.0',
  description: 'Data entry form for creating or updating entities with validation and field rendering',

  // Metadata
  category: 'data-entry',
  tags: ['form', 'crud', 'data-entry', 'validation', 'create', 'update'],

  // Composition
  requiredAtomicComponents: [
    'form',
    'input',
    'button'
  ],
  optionalAtomicComponents: [
    'select',
    'textarea',
    'checkbox',
    'radio',
    'label',
    'error-message',
    'fieldset',
    'legend'
  ],

  // Layout
  layoutStrategy: {
    type: 'single-column',
    responsive: true,
    sections: [
      {
        id: 'fields',
        title: 'Form Fields',
        layout: {
          type: 'single-column',
          gap: 'medium'
        }
      },
      {
        id: 'actions',
        title: 'Actions',
        layout: {
          type: 'flex',
          gap: 'small'
        }
      }
    ]
  },

  // Data Bindings
  dataBindings: {
    source: 'controller',
    operations: [
      {
        operation: 'create',
        returns: 'entity',
        optimistic: false,
        cache: { enabled: false }
      },
      {
        operation: 'update',
        params: ['id'],
        returns: 'entity',
        optimistic: true,
        cache: { enabled: false }
      },
      {
        operation: 'validate',
        returns: 'validation-result',
        optimistic: false,
        cache: { enabled: false }
      }
    ],
    relationships: []
  },

  // Behavior
  supportedOperations: ['create', 'update', 'validate'],

  eventHandlers: [
    {
      event: 'submit',
      operation: 'create',
      validate: true
    },
    {
      event: 'submit',
      operation: 'update',
      validate: true
    },
    {
      event: 'blur',
      operation: 'validate',
      validate: false
    }
  ],

  // State Management
  state: {
    fields: ['formData', 'errors', 'touched', 'isSubmitting'],
    persistence: 'none'
  }
};

/**
 * ListView Pattern
 *
 * A data display view for showing collections of entities.
 * Supports table, list, card, and kanban display modes with filtering and pagination.
 */
export const LIST_VIEW_PATTERN: CompositeViewPattern = {
  // Identity
  id: 'list-view',
  name: 'ListView',
  version: '1.0.0',
  description: 'Data display for collections with filtering, sorting, and pagination support',

  // Metadata
  category: 'data-display',
  tags: ['list', 'table', 'collection', 'data-display', 'pagination', 'filtering'],

  // Composition
  requiredAtomicComponents: [
    'table',
    'list'
  ],
  optionalAtomicComponents: [
    'card',
    'badge',
    'button',
    'input',
    'select',
    'pagination',
    'search',
    'filter'
  ],

  // Layout
  layoutStrategy: {
    type: 'flex',
    responsive: true,
    direction: 'column',
    sections: [
      {
        id: 'toolbar',
        title: 'Toolbar',
        fields: ['search', 'filters', 'actions'],
        layout: {
          type: 'flex',
          gap: 'medium'
        }
      },
      {
        id: 'content',
        title: 'Content',
        layout: {
          type: 'single-column'
        }
      },
      {
        id: 'pagination',
        title: 'Pagination',
        layout: {
          type: 'flex',
          gap: 'small'
        }
      }
    ]
  },

  // Data Bindings
  dataBindings: {
    source: 'controller',
    operations: [
      {
        operation: 'retrieve_many',
        returns: 'entity-array',
        optimistic: false,
        cache: {
          enabled: true,
          ttl: 300,
          key: 'list-{modelName}-{filters}'
        }
      }
    ],
    relationships: []
  },

  // Behavior
  supportedOperations: ['retrieve_many'],

  eventHandlers: [
    {
      event: 'search',
      operation: 'retrieve_many',
      validate: false
    },
    {
      event: 'filter',
      operation: 'retrieve_many',
      validate: false
    },
    {
      event: 'sort',
      operation: 'retrieve_many',
      validate: false
    },
    {
      event: 'paginate',
      operation: 'retrieve_many',
      validate: false
    }
  ],

  // State Management
  state: {
    fields: ['entities', 'filters', 'sort', 'pagination', 'loading'],
    persistence: 'session'
  }
};

/**
 * DetailView Pattern
 *
 * A data display view for showing a single entity with all its attributes.
 * Supports editing, deleting, and navigating to related entities.
 */
export const DETAIL_VIEW_PATTERN: CompositeViewPattern = {
  // Identity
  id: 'detail-view',
  name: 'DetailView',
  version: '1.0.0',
  description: 'Single entity detail display with edit and delete actions',

  // Metadata
  category: 'data-display',
  tags: ['detail', 'view', 'entity', 'display', 'read-only'],

  // Composition
  requiredAtomicComponents: [
    'card',
    'container'
  ],
  optionalAtomicComponents: [
    'badge',
    'button',
    'tabs',
    'card',
    'list',
    'table'
  ],

  // Layout
  layoutStrategy: {
    type: 'single-column',
    responsive: true,
    sections: [
      {
        id: 'header',
        title: 'Header',
        fields: ['title', 'status', 'actions'],
        layout: {
          type: 'flex',
          gap: 'medium'
        }
      },
      {
        id: 'main',
        title: 'Main Content',
        layout: {
          type: 'two-column',
          columns: 2,
          gap: 'large'
        }
      },
      {
        id: 'relationships',
        title: 'Related Data',
        layout: {
          type: 'grid',
          columns: 2,
          gap: 'medium'
        }
      }
    ]
  },

  // Data Bindings
  dataBindings: {
    source: 'controller',
    operations: [
      {
        operation: 'retrieve',
        params: ['id'],
        returns: 'entity',
        optimistic: false,
        cache: {
          enabled: true,
          ttl: 300,
          key: 'detail-{modelName}-{id}'
        }
      },
      {
        operation: 'update',
        params: ['id'],
        returns: 'entity',
        optimistic: true,
        cache: { enabled: false }
      },
      {
        operation: 'delete',
        params: ['id'],
        returns: 'void',
        optimistic: false,
        cache: { enabled: false }
      }
    ],
    relationships: []
  },

  // Behavior
  supportedOperations: ['retrieve', 'update', 'delete'],

  eventHandlers: [
    {
      event: 'edit',
      operation: 'update',
      validate: true
    },
    {
      event: 'delete',
      operation: 'delete',
      validate: false,
      confirm: {
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this item?'
      }
    }
  ],

  // State Management
  state: {
    fields: ['entity', 'loading', 'error', 'editMode'],
    persistence: 'none'
  }
};

/**
 * DashboardView Pattern
 *
 * A multi-section dashboard for displaying aggregated data, metrics, and summaries.
 * Supports customizable grid layouts with various widget types.
 */
export const DASHBOARD_VIEW_PATTERN: CompositeViewPattern = {
  // Identity
  id: 'dashboard-view',
  name: 'DashboardView',
  version: '1.0.0',
  description: 'Multi-section dashboard with metrics, charts, and data summaries',

  // Metadata
  category: 'dashboard',
  tags: ['dashboard', 'overview', 'metrics', 'analytics', 'summary'],

  // Composition
  requiredAtomicComponents: [
    'grid',
    'card'
  ],
  optionalAtomicComponents: [
    'chart',
    'metric',
    'table',
    'list',
    'badge',
    'progress',
    'stat'
  ],

  // Layout
  layoutStrategy: {
    type: 'grid',
    responsive: true,
    columns: 12,
    sections: [
      {
        id: 'metrics',
        title: 'Key Metrics',
        layout: {
          type: 'grid',
          columns: 4,
          gap: 'medium'
        }
      },
      {
        id: 'charts',
        title: 'Charts',
        layout: {
          type: 'grid',
          columns: 2,
          gap: 'large'
        }
      },
      {
        id: 'recent-activity',
        title: 'Recent Activity',
        layout: {
          type: 'single-column',
          gap: 'small'
        }
      }
    ]
  },

  // Data Bindings
  dataBindings: {
    source: 'service',
    operations: [
      {
        operation: 'retrieve_many',
        returns: 'entity-array',
        optimistic: false,
        cache: {
          enabled: true,
          ttl: 600,
          key: 'dashboard-{component}'
        }
      }
    ],
    relationships: []
  },

  // Behavior
  supportedOperations: ['retrieve_many'],

  eventHandlers: [
    {
      event: 'refresh',
      operation: 'retrieve_many',
      validate: false
    }
  ],

  // State Management
  state: {
    fields: ['metrics', 'charts', 'recentActivity', 'loading', 'lastUpdate'],
    persistence: 'session'
  },

  // Customization
  customization: {
    allowedOverrides: ['layoutStrategy', 'sections', 'metrics'],
    requiredOverrides: []
  }
};

/**
 * Composite Patterns Registry
 *
 * Central registry of all composite view patterns available in SpecVerse.
 * Framework adapters and instance factories use this registry to generate
 * framework-specific implementations.
 */
export const COMPOSITE_VIEW_PATTERNS: CompositePatternRegistry = {
  'form-view': FORM_VIEW_PATTERN,
  'list-view': LIST_VIEW_PATTERN,
  'detail-view': DETAIL_VIEW_PATTERN,
  'dashboard-view': DASHBOARD_VIEW_PATTERN
};

/**
 * Get a pattern by ID
 */
export function getPattern(id: string): CompositeViewPattern | undefined {
  return COMPOSITE_VIEW_PATTERNS[id];
}

/**
 * Get all patterns by category
 */
export function getPatternsByCategory(category: string): CompositeViewPattern[] {
  return Object.values(COMPOSITE_VIEW_PATTERNS).filter(
    pattern => pattern.category === category
  );
}

/**
 * Get all patterns by tag
 */
export function getPatternsByTag(tag: string): CompositeViewPattern[] {
  return Object.values(COMPOSITE_VIEW_PATTERNS).filter(
    pattern => pattern.tags.includes(tag)
  );
}

/**
 * Get all pattern IDs
 */
export function getPatternIds(): string[] {
  return Object.keys(COMPOSITE_VIEW_PATTERNS);
}

/**
 * Check if a pattern exists
 */
export function hasPattern(id: string): boolean {
  return id in COMPOSITE_VIEW_PATTERNS;
}
