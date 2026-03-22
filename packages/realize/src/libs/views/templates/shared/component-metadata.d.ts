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
import { AtomicComponentDefinition } from './atomic-components-registry.js';
/**
 * Property metadata for runtime interpretation
 */
export interface PropertyMetadata {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
    required: boolean;
    default?: any;
    description: string;
    enumValues?: string[];
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
        alternatives?: string[];
        compositions?: string[];
        containers?: string[];
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
/**
 * Metadata for the 5 universal properties
 */
export declare const COMMON_PROPERTY_METADATA: Record<string, PropertyMetadata>;
/**
 * Enhanced metadata for all atomic components
 */
export declare const COMPONENT_METADATA_REGISTRY: Record<string, ComponentMetadata>;
/**
 * Get metadata for a component type
 *
 * @param componentType - Component type from atomic registry
 * @returns Component metadata or undefined
 */
export declare function getComponentMetadata(componentType: string): ComponentMetadata | undefined;
/**
 * Get all available component types with metadata
 *
 * @returns Array of component type names
 */
export declare function getAllComponentTypes(): string[];
/**
 * Get components by category
 *
 * @param category - Component category
 * @returns Array of component metadata
 */
export declare function getComponentsByCategory(category: ComponentMetadata['category']): ComponentMetadata[];
/**
 * Get components that can contain children
 *
 * @returns Array of container component metadata
 */
export declare function getContainerComponents(): ComponentMetadata[];
/**
 * Get leaf components (cannot contain children)
 *
 * @returns Array of leaf component metadata
 */
export declare function getLeafComponents(): ComponentMetadata[];
/**
 * Check if a component supports a specific property
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @returns True if property is supported
 */
export declare function supportsProperty(componentType: string, propertyName: string): boolean;
/**
 * Get property metadata for a component
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @returns Property metadata or undefined
 */
export declare function getPropertyMetadata(componentType: string, propertyName: string): PropertyMetadata | undefined;
/**
 * Validate property value against metadata
 *
 * @param componentType - Component type
 * @param propertyName - Property name
 * @param value - Property value
 * @returns Validation result with errors
 */
export declare function validatePropertyValue(componentType: string, propertyName: string, value: any): {
    valid: boolean;
    errors: string[];
};
/**
 * Get recommended components for composition
 *
 * @param componentType - Component type
 * @returns Array of recommended component types
 */
export declare function getRecommendedCompositions(componentType: string): string[];
/**
 * Check if two components can be nested
 *
 * @param parentType - Parent component type
 * @param childType - Child component type
 * @returns True if nesting is allowed
 */
export declare function canNest(parentType: string, childType: string): boolean;
//# sourceMappingURL=component-metadata.d.ts.map