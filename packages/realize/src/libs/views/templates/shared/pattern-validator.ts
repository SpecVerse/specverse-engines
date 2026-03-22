/**
 * Composite View Pattern Validator
 *
 * Validates composite view patterns for correctness and completeness.
 * Ensures patterns are well-formed and can be used by framework adapters.
 *
 * NO FRAMEWORK DEPENDENCIES - Pure TypeScript validation logic.
 */

import type {
  CompositeViewPattern,
  PatternValidationResult
} from './composite-pattern-types.js';
import { ATOMIC_COMPONENTS_REGISTRY } from './atomic-components-registry.js';

/**
 * Validate a composite view pattern
 */
export function validatePattern(pattern: CompositeViewPattern): PatternValidationResult {
  const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
  const warnings: Array<{ field: string; message: string }> = [];

  // Validate identity fields
  if (!pattern.id || pattern.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Pattern ID is required',
      severity: 'error'
    });
  }

  if (!pattern.name || pattern.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Pattern name is required',
      severity: 'error'
    });
  }

  if (!pattern.version || !isValidVersion(pattern.version)) {
    errors.push({
      field: 'version',
      message: 'Pattern version must be in semver format (e.g., 1.0.0)',
      severity: 'error'
    });
  }

  if (!pattern.description || pattern.description.trim() === '') {
    warnings.push({
      field: 'description',
      message: 'Pattern description is recommended for clarity'
    });
  }

  // Validate category
  const validCategories = ['data-entry', 'data-display', 'dashboard', 'navigation', 'workflow'];
  if (!validCategories.includes(pattern.category)) {
    errors.push({
      field: 'category',
      message: `Category must be one of: ${validCategories.join(', ')}`,
      severity: 'error'
    });
  }

  // Validate required atomic components
  if (!pattern.requiredAtomicComponents || pattern.requiredAtomicComponents.length === 0) {
    errors.push({
      field: 'requiredAtomicComponents',
      message: 'At least one required atomic component must be specified',
      severity: 'error'
    });
  } else {
    // Check if required components exist in atomic registry
    for (const component of pattern.requiredAtomicComponents) {
      if (!ATOMIC_COMPONENTS_REGISTRY[component]) {
        errors.push({
          field: 'requiredAtomicComponents',
          message: `Required component '${component}' not found in ATOMIC_COMPONENTS_REGISTRY`,
          severity: 'error'
        });
      }
    }
  }

  // Validate optional atomic components
  if (pattern.optionalAtomicComponents) {
    for (const component of pattern.optionalAtomicComponents) {
      if (!ATOMIC_COMPONENTS_REGISTRY[component]) {
        warnings.push({
          field: 'optionalAtomicComponents',
          message: `Optional component '${component}' not found in ATOMIC_COMPONENTS_REGISTRY`
        });
      }
    }
  }

  // Validate layout strategy
  if (!pattern.layoutStrategy) {
    errors.push({
      field: 'layoutStrategy',
      message: 'Layout strategy is required',
      severity: 'error'
    });
  } else {
    const validLayoutTypes = ['single-column', 'two-column', 'grid', 'flex', 'masonry', 'custom'];
    if (!validLayoutTypes.includes(pattern.layoutStrategy.type)) {
      errors.push({
        field: 'layoutStrategy.type',
        message: `Layout type must be one of: ${validLayoutTypes.join(', ')}`,
        severity: 'error'
      });
    }
  }

  // Validate data bindings
  if (!pattern.dataBindings) {
    errors.push({
      field: 'dataBindings',
      message: 'Data bindings are required',
      severity: 'error'
    });
  } else {
    const validSources = ['model', 'controller', 'service', 'store', 'computed'];
    if (!validSources.includes(pattern.dataBindings.source)) {
      errors.push({
        field: 'dataBindings.source',
        message: `Data source must be one of: ${validSources.join(', ')}`,
        severity: 'error'
      });
    }

    if (!pattern.dataBindings.operations || pattern.dataBindings.operations.length === 0) {
      errors.push({
        field: 'dataBindings.operations',
        message: 'At least one data operation must be specified',
        severity: 'error'
      });
    } else {
      // Validate each operation
      for (const op of pattern.dataBindings.operations) {
        const validOps = ['create', 'update', 'retrieve', 'retrieve_many', 'validate', 'evolve', 'delete'];
        if (!validOps.includes(op.operation)) {
          errors.push({
            field: 'dataBindings.operations',
            message: `Operation '${op.operation}' must be one of: ${validOps.join(', ')}`,
            severity: 'error'
          });
        }
      }
    }
  }

  // Validate supported operations
  if (!pattern.supportedOperations || pattern.supportedOperations.length === 0) {
    errors.push({
      field: 'supportedOperations',
      message: 'At least one supported operation must be specified',
      severity: 'error'
    });
  }

  // Validate event handlers (if present)
  if (pattern.eventHandlers) {
    for (const handler of pattern.eventHandlers) {
      if (!handler.event) {
        errors.push({
          field: 'eventHandlers',
          message: 'Event handler must specify an event name',
          severity: 'error'
        });
      }

      // Must have either operation or handler
      if (!handler.operation && !handler.handler) {
        errors.push({
          field: 'eventHandlers',
          message: `Event handler for '${handler.event}' must specify either operation or handler`,
          severity: 'error'
        });
      }
    }
  }

  // Validate relationships (if present)
  if (pattern.dataBindings?.relationships) {
    for (const rel of pattern.dataBindings.relationships) {
      const validRelTypes = ['belongsTo', 'hasMany', 'hasOne', 'manyToMany'];
      if (!validRelTypes.includes(rel.type)) {
        errors.push({
          field: 'dataBindings.relationships',
          message: `Relationship type '${rel.type}' must be one of: ${validRelTypes.join(', ')}`,
          severity: 'error'
        });
      }

      if (!rel.display?.labelField) {
        warnings.push({
          field: 'dataBindings.relationships',
          message: `Relationship '${rel.name}' should specify a labelField for display`
        });
      }
    }
  }

  // Validate extends (if present)
  if (pattern.extends) {
    // Check if parent pattern exists would require access to full registry
    // This is a soft warning
    warnings.push({
      field: 'extends',
      message: `Pattern extends '${pattern.extends}' - ensure parent pattern exists`
    });
  }

  // Validate customization (if present)
  if (pattern.customization) {
    if (pattern.customization.requiredOverrides && pattern.customization.requiredOverrides.length > 0) {
      // Check that required overrides reference valid fields
      const validFields = ['layoutStrategy', 'sections', 'operations', 'relationships'];
      for (const override of pattern.customization.requiredOverrides) {
        if (!validFields.includes(override)) {
          warnings.push({
            field: 'customization.requiredOverrides',
            message: `Override field '${override}' may not be a valid customization point`
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate version string (basic semver check)
 */
function isValidVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  return semverRegex.test(version);
}

/**
 * Validate all patterns in a registry
 */
export function validatePatternRegistry(
  registry: Record<string, CompositeViewPattern>
): Record<string, PatternValidationResult> {
  const results: Record<string, PatternValidationResult> = {};

  for (const [id, pattern] of Object.entries(registry)) {
    results[id] = validatePattern(pattern);
  }

  return results;
}

/**
 * Get summary of validation results
 */
export function getValidationSummary(results: Record<string, PatternValidationResult>): {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
} {
  const total = Object.keys(results).length;
  const valid = Object.values(results).filter(r => r.valid).length;
  const invalid = total - valid;
  const warnings = Object.values(results).reduce(
    (sum, r) => sum + r.warnings.length,
    0
  );

  return { total, valid, invalid, warnings };
}
