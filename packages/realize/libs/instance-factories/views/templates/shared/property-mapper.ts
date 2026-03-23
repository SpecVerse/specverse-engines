/**
 * Property Mapper - Multi-Framework Support
 *
 * Maps SpecVerse component properties to framework-specific property values.
 * Supports React (shadcn, MUI, antd), Vue (Vuetify, Element Plus), Svelte (Carbon),
 * Angular (Material), and runtime interpretation.
 *
 * Architecture:
 * - PropertyTarget: All supported frameworks/libraries + semantic layer
 * - COMMON_PROPERTY_MAPPINGS: Universal properties (variant, size, color, position, orientation)
 * - COMPONENT_SPECIFIC_MAPPINGS: Per-component overrides
 * - mapProperty(): Main mapping function with fallback chain
 */

// ============================================================================
// Types
// ============================================================================

/**
 * All supported property mapping targets
 */
export type PropertyTarget =
  // React libraries
  | 'shadcn'
  | 'mui'
  | 'antd'
  // Vue libraries
  | 'vuetify'
  | 'elementPlus'
  | 'primeVue'
  // Svelte libraries
  | 'carbon'
  | 'svelteui'
  // Angular libraries
  | 'angularMaterial'
  | 'primeNg'
  // Runtime interpretation
  | 'runtime'
  // Universal semantic meaning
  | 'semantic';

/**
 * Framework categories for quick target identification
 */
export type FrameworkCategory = 'react' | 'vue' | 'svelte' | 'angular' | 'runtime';

export const FRAMEWORK_TARGETS: Record<FrameworkCategory, PropertyTarget[]> = {
  react: ['shadcn', 'mui', 'antd'],
  vue: ['vuetify', 'elementPlus', 'primeVue'],
  svelte: ['carbon', 'svelteui'],
  angular: ['angularMaterial', 'primeNg'],
  runtime: ['runtime']
};

/**
 * Property value mapping for a specific SpecVerse value
 */
export interface PropertyValueMapping {
  shadcn?: string | boolean | number;
  mui?: string | boolean | number;
  antd?: string | boolean | number;
  vuetify?: string | boolean | number;
  elementPlus?: string | boolean | number;
  primeVue?: string | boolean | number;
  carbon?: string | boolean | number;
  svelteui?: string | boolean | number;
  angularMaterial?: string | boolean | number;
  primeNg?: string | boolean | number;
  runtime?: string | boolean | number;
  semantic: string; // Always required - universal meaning
}

/**
 * Complete mapping for a property
 */
export interface PropertyMapping {
  [specverseValue: string]: PropertyValueMapping;
}

/**
 * Component-specific property overrides
 */
export interface ComponentPropertyMapping {
  [componentType: string]: {
    [propertyName: string]: PropertyMapping;
  };
}

// ============================================================================
// Common Property Mappings (Universal across all component types)
// ============================================================================

/**
 * Variant mappings - Primary, secondary, destructive actions
 * Consistency: 60-85% across frameworks (HIGH)
 */
export const VARIANT_MAPPING: PropertyMapping = {
  primary: {
    shadcn: 'default',
    mui: 'contained',
    antd: 'primary',
    vuetify: 'primary',
    elementPlus: 'primary',
    primeVue: 'primary',
    carbon: 'primary',
    svelteui: 'primary',
    angularMaterial: 'primary',
    primeNg: 'primary',
    runtime: 'primary',
    semantic: 'primary-action'
  },
  secondary: {
    shadcn: 'secondary',
    mui: 'outlined',
    antd: 'default',
    vuetify: 'secondary',
    elementPlus: 'default',
    primeVue: 'secondary',
    carbon: 'secondary',
    svelteui: 'secondary',
    angularMaterial: 'accent',
    primeNg: 'secondary',
    runtime: 'secondary',
    semantic: 'secondary-action'
  },
  destructive: {
    shadcn: 'destructive',
    mui: 'error',
    antd: 'danger',
    vuetify: 'error',
    elementPlus: 'danger',
    primeVue: 'danger',
    carbon: 'danger',
    svelteui: 'error',
    angularMaterial: 'warn',
    primeNg: 'danger',
    runtime: 'destructive',
    semantic: 'destructive-action'
  },
  ghost: {
    shadcn: 'ghost',
    mui: 'text',
    antd: 'link',
    vuetify: 'text',
    elementPlus: 'text',
    primeVue: 'text',
    carbon: 'ghost',
    svelteui: 'ghost',
    angularMaterial: 'basic',
    primeNg: 'text',
    runtime: 'ghost',
    semantic: 'minimal-action'
  },
  outline: {
    shadcn: 'outline',
    mui: 'outlined',
    antd: 'default',
    vuetify: 'outlined',
    elementPlus: 'plain',
    primeVue: 'outlined',
    carbon: 'tertiary',
    svelteui: 'outline',
    angularMaterial: 'stroked',
    primeNg: 'outlined',
    runtime: 'outline',
    semantic: 'outlined-action'
  }
};

/**
 * Size mappings - Component dimensions
 * Consistency: 85-90% across frameworks (VERY HIGH)
 */
export const SIZE_MAPPING: PropertyMapping = {
  small: {
    shadcn: 'sm',
    mui: 'small',
    antd: 'small',
    vuetify: 'small',
    elementPlus: 'small',
    primeVue: 'small',
    carbon: 'sm',
    svelteui: 'sm',
    angularMaterial: 'small',
    primeNg: 'small',
    runtime: 'small',
    semantic: 'compact'
  },
  medium: {
    shadcn: 'default',
    mui: 'medium',
    antd: 'middle',
    vuetify: 'default',
    elementPlus: 'default',
    primeVue: 'default',
    carbon: 'md',
    svelteui: 'md',
    angularMaterial: 'medium',
    primeNg: 'medium',
    runtime: 'medium',
    semantic: 'standard'
  },
  large: {
    shadcn: 'lg',
    mui: 'large',
    antd: 'large',
    vuetify: 'large',
    elementPlus: 'large',
    primeVue: 'large',
    carbon: 'lg',
    svelteui: 'lg',
    angularMaterial: 'large',
    primeNg: 'large',
    runtime: 'large',
    semantic: 'spacious'
  }
};

/**
 * Color mappings - Semantic color values
 * Consistency: 70-80% across frameworks (HIGH)
 */
export const COLOR_MAPPING: PropertyMapping = {
  primary: {
    shadcn: 'primary',
    mui: 'primary',
    antd: 'primary',
    vuetify: 'primary',
    elementPlus: 'primary',
    primeVue: 'primary',
    carbon: 'blue',
    svelteui: 'primary',
    angularMaterial: 'primary',
    primeNg: 'primary',
    runtime: 'primary',
    semantic: 'primary-color'
  },
  success: {
    shadcn: 'success',
    mui: 'success',
    antd: 'success',
    vuetify: 'success',
    elementPlus: 'success',
    primeVue: 'success',
    carbon: 'green',
    svelteui: 'success',
    angularMaterial: 'success',
    primeNg: 'success',
    runtime: 'success',
    semantic: 'positive-feedback'
  },
  warning: {
    shadcn: 'warning',
    mui: 'warning',
    antd: 'warning',
    vuetify: 'warning',
    elementPlus: 'warning',
    primeVue: 'warning',
    carbon: 'yellow',
    svelteui: 'warning',
    angularMaterial: 'warn',
    primeNg: 'warning',
    runtime: 'warning',
    semantic: 'caution-feedback'
  },
  error: {
    shadcn: 'destructive',
    mui: 'error',
    antd: 'error',
    vuetify: 'error',
    elementPlus: 'error',
    primeVue: 'danger',
    carbon: 'red',
    svelteui: 'error',
    angularMaterial: 'warn',
    primeNg: 'danger',
    runtime: 'error',
    semantic: 'negative-feedback'
  },
  info: {
    shadcn: 'default',
    mui: 'info',
    antd: 'info',
    vuetify: 'info',
    elementPlus: 'info',
    primeVue: 'info',
    carbon: 'cyan',
    svelteui: 'info',
    angularMaterial: 'primary',
    primeNg: 'info',
    runtime: 'info',
    semantic: 'informational-feedback'
  }
};

/**
 * Position mappings - Spatial positioning
 * Consistency: 95-100% across frameworks (UNIVERSAL)
 */
export const POSITION_MAPPING: PropertyMapping = {
  top: {
    shadcn: 'top',
    mui: 'top',
    antd: 'top',
    vuetify: 'top',
    elementPlus: 'top',
    primeVue: 'top',
    carbon: 'top',
    svelteui: 'top',
    angularMaterial: 'above',
    primeNg: 'top',
    runtime: 'top',
    semantic: 'top-position'
  },
  bottom: {
    shadcn: 'bottom',
    mui: 'bottom',
    antd: 'bottom',
    vuetify: 'bottom',
    elementPlus: 'bottom',
    primeVue: 'bottom',
    carbon: 'bottom',
    svelteui: 'bottom',
    angularMaterial: 'below',
    primeNg: 'bottom',
    runtime: 'bottom',
    semantic: 'bottom-position'
  },
  left: {
    shadcn: 'left',
    mui: 'left',
    antd: 'left',
    vuetify: 'left',
    elementPlus: 'left',
    primeVue: 'left',
    carbon: 'left',
    svelteui: 'left',
    angularMaterial: 'before',
    primeNg: 'left',
    runtime: 'left',
    semantic: 'left-position'
  },
  right: {
    shadcn: 'right',
    mui: 'right',
    antd: 'right',
    vuetify: 'right',
    elementPlus: 'right',
    primeVue: 'right',
    carbon: 'right',
    svelteui: 'right',
    angularMaterial: 'after',
    primeNg: 'right',
    runtime: 'right',
    semantic: 'right-position'
  }
};

/**
 * Orientation mappings - Layout direction
 * Consistency: 90-95% across frameworks (VERY HIGH)
 */
export const ORIENTATION_MAPPING: PropertyMapping = {
  horizontal: {
    shadcn: 'horizontal',
    mui: 'horizontal',
    antd: 'horizontal',
    vuetify: 'horizontal',
    elementPlus: 'horizontal',
    primeVue: 'horizontal',
    carbon: 'horizontal',
    svelteui: 'horizontal',
    angularMaterial: 'horizontal',
    primeNg: 'horizontal',
    runtime: 'horizontal',
    semantic: 'horizontal-layout'
  },
  vertical: {
    shadcn: 'vertical',
    mui: 'vertical',
    antd: 'vertical',
    vuetify: 'vertical',
    elementPlus: 'vertical',
    primeVue: 'vertical',
    carbon: 'vertical',
    svelteui: 'vertical',
    angularMaterial: 'vertical',
    primeNg: 'vertical',
    runtime: 'vertical',
    semantic: 'vertical-layout'
  }
};

/**
 * All common property mappings
 */
export const COMMON_PROPERTY_MAPPINGS: Record<string, PropertyMapping> = {
  variant: VARIANT_MAPPING,
  size: SIZE_MAPPING,
  color: COLOR_MAPPING,
  position: POSITION_MAPPING,
  orientation: ORIENTATION_MAPPING
};

// ============================================================================
// Component-Specific Property Mappings (Overrides)
// ============================================================================

/**
 * Component-specific overrides for properties that differ from common mappings
 *
 * Example: Table pagination size works differently than button size
 */
export const COMPONENT_SPECIFIC_MAPPINGS: ComponentPropertyMapping = {
  table: {
    size: {
      small: {
        shadcn: 'sm',
        mui: 'small',
        antd: 'small',
        vuetify: 'small',
        elementPlus: 'small',
        primeVue: 'small',
        carbon: 'sm',
        svelteui: 'compact',
        angularMaterial: 'small',
        primeNg: 'small',
        runtime: 'small',
        semantic: 'compact-table'
      },
      medium: {
        shadcn: 'default',
        mui: 'medium',
        antd: 'middle',
        vuetify: 'default',
        elementPlus: 'default',
        primeVue: 'default',
        carbon: 'md',
        svelteui: 'default',
        angularMaterial: 'medium',
        primeNg: 'medium',
        runtime: 'medium',
        semantic: 'standard-table'
      },
      large: {
        shadcn: 'lg',
        mui: 'large',
        antd: 'large',
        vuetify: 'large',
        elementPlus: 'large',
        primeVue: 'large',
        carbon: 'lg',
        svelteui: 'relaxed',
        angularMaterial: 'large',
        primeNg: 'large',
        runtime: 'large',
        semantic: 'spacious-table'
      }
    }
  },

  input: {
    variant: {
      // Inputs use different variant semantics
      filled: {
        shadcn: 'default',
        mui: 'filled',
        antd: 'filled',
        vuetify: 'filled',
        elementPlus: 'default',
        primeVue: 'filled',
        carbon: 'default',
        svelteui: 'filled',
        angularMaterial: 'fill',
        primeNg: 'filled',
        runtime: 'filled',
        semantic: 'filled-input'
      },
      outlined: {
        shadcn: 'outline',
        mui: 'outlined',
        antd: 'outlined',
        vuetify: 'outlined',
        elementPlus: 'default',
        primeVue: 'outlined',
        carbon: 'outline',
        svelteui: 'outlined',
        angularMaterial: 'outline',
        primeNg: 'outlined',
        runtime: 'outlined',
        semantic: 'outlined-input'
      },
      standard: {
        shadcn: 'default',
        mui: 'standard',
        antd: 'borderless',
        vuetify: 'underlined',
        elementPlus: 'default',
        primeVue: 'standard',
        carbon: 'default',
        svelteui: 'standard',
        angularMaterial: 'standard',
        primeNg: 'standard',
        runtime: 'standard',
        semantic: 'standard-input'
      }
    }
  },

  badge: {
    variant: {
      // Badges use different variant semantics
      dot: {
        shadcn: 'default',
        mui: 'dot',
        antd: 'default',
        vuetify: 'dot',
        elementPlus: 'default',
        primeVue: 'default',
        carbon: 'default',
        svelteui: 'dot',
        angularMaterial: 'default',
        primeNg: 'default',
        runtime: 'dot',
        semantic: 'notification-indicator'
      },
      standard: {
        shadcn: 'default',
        mui: 'standard',
        antd: 'default',
        vuetify: 'default',
        elementPlus: 'default',
        primeVue: 'default',
        carbon: 'default',
        svelteui: 'default',
        angularMaterial: 'default',
        primeNg: 'default',
        runtime: 'standard',
        semantic: 'count-indicator'
      }
    }
  }
};

// ============================================================================
// Mapping Functions
// ============================================================================

/**
 * Maps a single property value from SpecVerse to a target framework/library
 *
 * Fallback chain:
 * 1. Component-specific mapping
 * 2. Common property mapping
 * 3. Original value (passthrough)
 *
 * @param componentType - Component type (e.g., 'button', 'table')
 * @param propertyName - Property name (e.g., 'variant', 'size')
 * @param specverseValue - SpecVerse property value (e.g., 'primary', 'large')
 * @param target - Target framework/library
 * @returns Mapped property value for target
 */
export function mapProperty(
  componentType: string,
  propertyName: string,
  specverseValue: any,
  target: PropertyTarget
): any {
  // Handle non-string primitive values (numbers, booleans) - pass through
  if (typeof specverseValue !== 'string') {
    return specverseValue;
  }

  // 1. Try component-specific mapping
  const componentMapping = COMPONENT_SPECIFIC_MAPPINGS[componentType]?.[propertyName]?.[specverseValue];
  if (componentMapping && target in componentMapping) {
    return componentMapping[target as keyof PropertyValueMapping];
  }

  // 2. Try common property mapping
  const commonMapping = COMMON_PROPERTY_MAPPINGS[propertyName]?.[specverseValue];
  if (commonMapping && target in commonMapping) {
    return commonMapping[target as keyof PropertyValueMapping];
  }

  // 3. Fallback: Return original value
  return specverseValue;
}

/**
 * Gets the semantic meaning of a property value (universal across frameworks)
 *
 * @param propertyName - Property name
 * @param specverseValue - SpecVerse property value
 * @returns Semantic meaning string
 */
export function getSemanticMeaning(
  propertyName: string,
  specverseValue: string
): string {
  const commonMapping = COMMON_PROPERTY_MAPPINGS[propertyName]?.[specverseValue];
  if (commonMapping && 'semantic' in commonMapping) {
    return commonMapping.semantic as string;
  }

  return `${propertyName}-${specverseValue}`;
}

/**
 * Maps all properties of a component to a target framework/library
 *
 * @param componentType - Component type
 * @param properties - Object containing all component properties
 * @param target - Target framework/library
 * @returns Object with all properties mapped to target
 */
export function mapProperties(
  componentType: string,
  properties: Record<string, any>,
  target: PropertyTarget
): Record<string, any> {
  const mappedProperties: Record<string, any> = {};

  for (const [propName, propValue] of Object.entries(properties)) {
    mappedProperties[propName] = mapProperty(
      componentType,
      propName,
      propValue,
      target
    );
  }

  return mappedProperties;
}

/**
 * Gets all framework targets for a given framework category
 *
 * @param category - Framework category
 * @returns Array of property targets for that framework
 */
export function getFrameworkTargets(category: FrameworkCategory): PropertyTarget[] {
  return FRAMEWORK_TARGETS[category];
}

/**
 * Checks if a property value has a mapping for a specific target
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @param specverseValue - SpecVerse property value
 * @param target - Target framework/library
 * @returns True if mapping exists, false otherwise
 */
export function hasMapping(
  componentType: string,
  propertyName: string,
  specverseValue: string,
  target: PropertyTarget
): boolean {
  const componentMapping = COMPONENT_SPECIFIC_MAPPINGS[componentType]?.[propertyName]?.[specverseValue];
  if (componentMapping && target in componentMapping) {
    return true;
  }

  const commonMapping = COMMON_PROPERTY_MAPPINGS[propertyName]?.[specverseValue];
  if (commonMapping && target in commonMapping) {
    return true;
  }

  return false;
}

/**
 * Gets all available mappings for a property across all frameworks
 *
 * Useful for debugging and documentation generation
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @param specverseValue - SpecVerse property value
 * @returns Object with all target mappings
 */
export function getAllMappings(
  componentType: string,
  propertyName: string,
  specverseValue: string
): Partial<PropertyValueMapping> | null {
  const componentMapping = COMPONENT_SPECIFIC_MAPPINGS[componentType]?.[propertyName]?.[specverseValue];
  if (componentMapping) {
    return componentMapping;
  }

  const commonMapping = COMMON_PROPERTY_MAPPINGS[propertyName]?.[specverseValue];
  if (commonMapping) {
    return commonMapping;
  }

  return null;
}
