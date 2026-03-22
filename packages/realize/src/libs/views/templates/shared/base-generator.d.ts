/**
 * Base Generator - Abstract Class for Framework Generators
 *
 * Provides shared functionality for React, Vue, Svelte, Angular, and Runtime generators.
 * Enforces architectural constraints (nesting depth, state management) while allowing
 * framework-specific implementation details.
 *
 * Architecture:
 * - Shared: Component tree rendering, property mapping, nesting enforcement
 * - Abstract: Syntax generation, file structure, imports (framework-specific)
 * - Constraints: MAX_DEPTH = 3, basic state only, common properties only
 */
import { PropertyTarget } from './property-mapper.js';
import { FrameworkTarget } from './syntax-mapper.js';
import { AtomicComponentDefinition } from './atomic-components-registry.js';
import type { ComponentAdapter } from './adapter-types.js';
/**
 * UI Component specification from SpecVerse view definition
 */
export interface UIComponent {
    type: string;
    properties?: Record<string, any>;
    children?: UIComponent[];
    dataSource?: string;
    condition?: string;
}
/**
 * View specification from SpecVerse
 */
export interface ViewSpec {
    name: string;
    description?: string;
    components: Record<string, UIComponent>;
    state?: Record<string, StateDefinition>;
    events?: Record<string, EventDefinition>;
}
/**
 * State variable definition
 */
export interface StateDefinition {
    type: string;
    initial: any;
    description?: string;
}
/**
 * Event handler definition
 */
export interface EventDefinition {
    params?: string;
    body: string;
    description?: string;
}
/**
 * Component rendering context
 */
export interface RenderContext {
    depth: number;
    path: string[];
    parentComponent?: string;
    dataContext?: string;
}
/**
 * Generation result
 */
export interface GenerationResult {
    code: string;
    imports: string[];
    warnings: string[];
}
/**
 * Generator configuration
 */
export interface GeneratorConfig {
    target: PropertyTarget;
    framework: FrameworkTarget;
    maxDepth?: number;
    enableWarnings?: boolean;
}
/**
 * Base generator for all framework implementations
 *
 * Provides shared logic for:
 * - Component tree rendering with depth enforcement
 * - Property mapping via property-mapper
 * - Nesting validation and flattening
 * - State and event management
 *
 * Framework-specific subclasses must implement:
 * - generateImports(): Framework-specific import statements
 * - generateComponent(): Framework-specific component structure
 * - generateState(): Framework-specific state declarations
 * - generateEvents(): Framework-specific event handlers
 */
export declare abstract class BaseComponentGenerator {
    protected readonly config: GeneratorConfig;
    protected readonly adapter: ComponentAdapter;
    protected readonly MAX_DEPTH: number;
    protected readonly ENABLE_WARNINGS: boolean;
    protected warnings: string[];
    protected imports: Set<string>;
    constructor(adapter: ComponentAdapter, config: GeneratorConfig);
    /**
     * Generate code for a complete view specification
     *
     * @param viewSpec - View specification from SpecVerse
     * @returns Generation result with code, imports, and warnings
     */
    generate(viewSpec: ViewSpec): GenerationResult;
    /**
     * Render all components in the view
     */
    protected generateComponentTree(components: Record<string, UIComponent>): string;
    /**
     * Render a single component with depth tracking and nesting enforcement
     *
     * This is the core shared logic - applies to ALL frameworks
     */
    protected renderComponent(component: UIComponent, context: RenderContext): string;
    /**
     * Map component properties using property-mapper
     */
    protected mapComponentProperties(component: UIComponent, componentDef: AtomicComponentDefinition): Record<string, any>;
    /**
     * Render child components with incremented depth
     */
    protected renderChildren(children: UIComponent[], parentContext: RenderContext): string;
    /**
     * Render conditional component using syntax-mapper
     */
    protected renderConditional(component: UIComponent, mappedProps: Record<string, any>, context: RenderContext): string;
    /**
     * Render list (loop) component using syntax-mapper
     */
    protected renderList(component: UIComponent, mappedProps: Record<string, any>, context: RenderContext): string;
    /**
     * Flatten component when depth exceeded
     *
     * Extracts nested children into sibling components to reduce nesting
     */
    protected renderFlattened(component: UIComponent, context: RenderContext): string;
    /**
     * Delegate to adapter for actual component rendering
     */
    protected renderAdapterComponent(type: string, properties: Record<string, any>, children: string | undefined, context: RenderContext): string;
    /**
     * Get component name for import/usage
     */
    protected getComponentName(type: string): string;
    /**
     * Get item variable name for loop rendering
     */
    protected getItemName(dataSource: string): string;
    /**
     * Get key property for list items
     */
    protected getKeyProperty(component: UIComponent): string;
    /**
     * Format properties for inline rendering
     */
    protected formatProps(properties: Record<string, any>): string;
    /**
     * Add warning message
     */
    protected addWarning(message: string): void;
    /**
     * Reset generator state for new generation
     */
    protected reset(): void;
    /**
     * Add import statement
     */
    protected addImport(importStatement: string): void;
    /**
     * Generate import statements for the framework
     *
     * @param viewSpec - View specification
     * @returns Import statements code
     */
    protected abstract generateImports(viewSpec: ViewSpec): string;
    /**
     * Generate complete component code with framework-specific structure
     *
     * @param parts - Component parts (imports, state, events, components)
     * @returns Complete component code
     */
    protected abstract generateComponent(parts: {
        name: string;
        imports: string;
        state: string;
        events: string;
        components: string;
    }): string;
    /**
     * Generate state declarations using framework-specific syntax
     *
     * @param state - State definitions
     * @returns State declaration code
     */
    protected abstract generateState(state: Record<string, StateDefinition>): string;
    /**
     * Generate event handlers using framework-specific syntax
     *
     * @param events - Event definitions
     * @returns Event handler code
     */
    protected abstract generateEvents(events: Record<string, EventDefinition>): string;
    /**
     * Get file extension for the framework
     *
     * @returns File extension (e.g., '.tsx', '.vue', '.svelte')
     */
    abstract getFileExtension(): string;
    /**
     * Get additional files that need to be generated (e.g., CSS, types)
     *
     * @param viewSpec - View specification
     * @returns Map of filename to content
     */
    abstract getAdditionalFiles(viewSpec: ViewSpec): Record<string, string>;
}
/**
 * Validate component nesting depth
 *
 * @param component - Component to validate
 * @param maxDepth - Maximum allowed depth
 * @returns Validation result with depth and issues
 */
export declare function validateNestingDepth(component: UIComponent, maxDepth?: number): {
    valid: boolean;
    actualDepth: number;
    issues: string[];
};
/**
 * Extract all component types used in a view
 *
 * @param components - Component tree
 * @returns Set of component types
 */
export declare function extractComponentTypes(components: Record<string, UIComponent>): Set<string>;
/**
 * Count total components in a view
 *
 * @param components - Component tree
 * @returns Component count
 */
export declare function countComponents(components: Record<string, UIComponent>): number;
//# sourceMappingURL=base-generator.d.ts.map