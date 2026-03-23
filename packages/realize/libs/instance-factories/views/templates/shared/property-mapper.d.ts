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
/**
 * All supported property mapping targets
 */
export type PropertyTarget = 'shadcn' | 'mui' | 'antd' | 'vuetify' | 'elementPlus' | 'primeVue' | 'carbon' | 'svelteui' | 'angularMaterial' | 'primeNg' | 'runtime' | 'semantic';
/**
 * Framework categories for quick target identification
 */
export type FrameworkCategory = 'react' | 'vue' | 'svelte' | 'angular' | 'runtime';
export declare const FRAMEWORK_TARGETS: Record<FrameworkCategory, PropertyTarget[]>;
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
    semantic: string;
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
/**
 * Variant mappings - Primary, secondary, destructive actions
 * Consistency: 60-85% across frameworks (HIGH)
 */
export declare const VARIANT_MAPPING: PropertyMapping;
/**
 * Size mappings - Component dimensions
 * Consistency: 85-90% across frameworks (VERY HIGH)
 */
export declare const SIZE_MAPPING: PropertyMapping;
/**
 * Color mappings - Semantic color values
 * Consistency: 70-80% across frameworks (HIGH)
 */
export declare const COLOR_MAPPING: PropertyMapping;
/**
 * Position mappings - Spatial positioning
 * Consistency: 95-100% across frameworks (UNIVERSAL)
 */
export declare const POSITION_MAPPING: PropertyMapping;
/**
 * Orientation mappings - Layout direction
 * Consistency: 90-95% across frameworks (VERY HIGH)
 */
export declare const ORIENTATION_MAPPING: PropertyMapping;
/**
 * All common property mappings
 */
export declare const COMMON_PROPERTY_MAPPINGS: Record<string, PropertyMapping>;
/**
 * Component-specific overrides for properties that differ from common mappings
 *
 * Example: Table pagination size works differently than button size
 */
export declare const COMPONENT_SPECIFIC_MAPPINGS: ComponentPropertyMapping;
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
export declare function mapProperty(componentType: string, propertyName: string, specverseValue: any, target: PropertyTarget): any;
/**
 * Gets the semantic meaning of a property value (universal across frameworks)
 *
 * @param propertyName - Property name
 * @param specverseValue - SpecVerse property value
 * @returns Semantic meaning string
 */
export declare function getSemanticMeaning(propertyName: string, specverseValue: string): string;
/**
 * Maps all properties of a component to a target framework/library
 *
 * @param componentType - Component type
 * @param properties - Object containing all component properties
 * @param target - Target framework/library
 * @returns Object with all properties mapped to target
 */
export declare function mapProperties(componentType: string, properties: Record<string, any>, target: PropertyTarget): Record<string, any>;
/**
 * Gets all framework targets for a given framework category
 *
 * @param category - Framework category
 * @returns Array of property targets for that framework
 */
export declare function getFrameworkTargets(category: FrameworkCategory): PropertyTarget[];
/**
 * Checks if a property value has a mapping for a specific target
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @param specverseValue - SpecVerse property value
 * @param target - Target framework/library
 * @returns True if mapping exists, false otherwise
 */
export declare function hasMapping(componentType: string, propertyName: string, specverseValue: string, target: PropertyTarget): boolean;
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
export declare function getAllMappings(componentType: string, propertyName: string, specverseValue: string): Partial<PropertyValueMapping> | null;
//# sourceMappingURL=property-mapper.d.ts.map