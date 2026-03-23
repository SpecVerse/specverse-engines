/**
 * Atomic Components Registry
 *
 * Defines all 49 atomic component types from SpecVerse v3.4.0 schema.
 * Each type has metadata about its purpose, properties, and usage patterns.
 *
 * This registry is framework-agnostic. UI library adapters (shadcn, MUI, etc.)
 * implement these types using their specific components.
 */
export interface AtomicComponentDefinition {
    /** Component type identifier (matches schema enum) */
    type: string;
    /** Human-readable name */
    name: string;
    /** Category from v3.4 schema */
    category: 'data-display' | 'forms-inputs' | 'actions' | 'overlays-feedback' | 'navigation' | 'layout' | 'progress' | 'specialized';
    /** Description of component purpose */
    description: string;
    /** Common SpecVerse properties this component accepts */
    properties: string[];
    /** Whether this component can contain child components */
    canHaveChildren: boolean;
    /** Example usage in SpecVerse spec */
    example: string;
}
/**
 * Complete registry of all 49 atomic component types
 */
export declare const ATOMIC_COMPONENTS_REGISTRY: Record<string, AtomicComponentDefinition>;
/**
 * Get component definition by type
 */
export declare function getComponentDefinition(type: string): AtomicComponentDefinition | undefined;
/**
 * Get all components in a category
 */
export declare function getComponentsByCategory(category: string): AtomicComponentDefinition[];
/**
 * Validate if a component type exists
 */
export declare function isValidComponentType(type: string): boolean;
/**
 * Get all component types as array
 */
export declare function getAllComponentTypes(): string[];
/**
 * Component categories summary
 */
export declare const COMPONENT_CATEGORIES: {
    readonly 'data-display': 9;
    readonly 'forms-inputs': 11;
    readonly actions: 5;
    readonly 'overlays-feedback': 9;
    readonly navigation: 5;
    readonly layout: 6;
    readonly progress: 2;
    readonly specialized: 2;
};
/**
 * Total count: 49 atomic components
 */
export declare const TOTAL_COMPONENT_COUNT = 49;
//# sourceMappingURL=atomic-components-registry.d.ts.map