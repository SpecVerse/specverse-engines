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
import { mapProperties } from './property-mapper.js';
import { getSyntaxPattern } from './syntax-mapper.js';
import { ATOMIC_COMPONENTS_REGISTRY } from './atomic-components-registry.js';
// ============================================================================
// Base Generator Abstract Class
// ============================================================================
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
export class BaseComponentGenerator {
    // Configuration
    config;
    adapter;
    // Architectural constraints
    MAX_DEPTH;
    ENABLE_WARNINGS;
    // Tracking
    warnings = [];
    imports = new Set();
    constructor(adapter, config) {
        this.adapter = adapter;
        this.config = config;
        this.MAX_DEPTH = config.maxDepth ?? 3;
        this.ENABLE_WARNINGS = config.enableWarnings ?? true;
    }
    // ============================================================================
    // Public API
    // ============================================================================
    /**
     * Generate code for a complete view specification
     *
     * @param viewSpec - View specification from SpecVerse
     * @returns Generation result with code, imports, and warnings
     */
    generate(viewSpec) {
        this.reset();
        // Generate imports
        const importStatements = this.generateImports(viewSpec);
        // Generate state declarations
        const stateCode = viewSpec.state
            ? this.generateState(viewSpec.state)
            : '';
        // Generate event handlers
        const eventsCode = viewSpec.events
            ? this.generateEvents(viewSpec.events)
            : '';
        // Generate component tree
        const componentsCode = this.generateComponentTree(viewSpec.components);
        // Generate complete component
        const code = this.generateComponent({
            name: viewSpec.name,
            imports: importStatements,
            state: stateCode,
            events: eventsCode,
            components: componentsCode
        });
        return {
            code,
            imports: Array.from(this.imports),
            warnings: this.warnings
        };
    }
    // ============================================================================
    // Shared Component Rendering (Framework-Agnostic)
    // ============================================================================
    /**
     * Render all components in the view
     */
    generateComponentTree(components) {
        const rendered = Object.entries(components).map(([name, component]) => {
            return this.renderComponent(component, {
                depth: 0,
                path: [name],
                dataContext: undefined
            });
        });
        return rendered.join('\n\n');
    }
    /**
     * Render a single component with depth tracking and nesting enforcement
     *
     * This is the core shared logic - applies to ALL frameworks
     */
    renderComponent(component, context) {
        // Depth enforcement
        if (context.depth > this.MAX_DEPTH) {
            this.addWarning(`Component at path ${context.path.join('.')} exceeds max depth (${this.MAX_DEPTH}). ` +
                `Flattening to maintain readability.`);
            return this.renderFlattened(component, context);
        }
        // Get component definition from registry
        const componentDef = ATOMIC_COMPONENTS_REGISTRY[component.type];
        if (!componentDef) {
            this.addWarning(`Unknown component type: ${component.type}`);
            return `<!-- Unknown component: ${component.type} -->`;
        }
        // Map properties to target framework
        const mappedProps = this.mapComponentProperties(component, componentDef);
        // Handle conditional rendering
        if (component.condition) {
            return this.renderConditional(component, mappedProps, context);
        }
        // Handle list rendering (dataSource)
        if (component.dataSource) {
            return this.renderList(component, mappedProps, context);
        }
        // Handle children
        const children = component.children
            ? this.renderChildren(component.children, context)
            : undefined;
        // Delegate to adapter for framework-specific rendering
        return this.renderAdapterComponent(component.type, mappedProps, children, context);
    }
    /**
     * Map component properties using property-mapper
     */
    mapComponentProperties(component, componentDef) {
        if (!component.properties) {
            return {};
        }
        return mapProperties(component.type, component.properties, this.config.target);
    }
    /**
     * Render child components with incremented depth
     */
    renderChildren(children, parentContext) {
        const childContext = {
            ...parentContext,
            depth: parentContext.depth + 1
        };
        return children
            .map((child, index) => {
            const childPath = [...parentContext.path, `child_${index}`];
            return this.renderComponent(child, {
                ...childContext,
                path: childPath
            });
        })
            .join('\n');
    }
    /**
     * Render conditional component using syntax-mapper
     */
    renderConditional(component, mappedProps, context) {
        const innerComponent = this.renderAdapterComponent(component.type, mappedProps, component.children
            ? this.renderChildren(component.children, context)
            : undefined, context);
        // Use syntax-mapper for framework-specific conditional syntax
        return getSyntaxPattern('conditionalRender', this.config.framework, {
            condition: component.condition,
            Component: this.getComponentName(component.type),
            props: this.formatProps(mappedProps)
        });
    }
    /**
     * Render list (loop) component using syntax-mapper
     */
    renderList(component, mappedProps, context) {
        const itemName = this.getItemName(component.dataSource);
        const keyProperty = this.getKeyProperty(component);
        // Create child context with data variable
        const childContext = {
            ...context,
            depth: context.depth + 1,
            dataContext: itemName
        };
        // Use syntax-mapper for framework-specific loop syntax
        return getSyntaxPattern('loopRender', this.config.framework, {
            array: component.dataSource,
            item: itemName,
            key: keyProperty,
            Component: this.getComponentName(component.type)
        });
    }
    /**
     * Flatten component when depth exceeded
     *
     * Extracts nested children into sibling components to reduce nesting
     */
    renderFlattened(component, context) {
        // Render component without children
        const componentDef = ATOMIC_COMPONENTS_REGISTRY[component.type];
        const mappedProps = this.mapComponentProperties(component, componentDef);
        const flatComponent = this.renderAdapterComponent(component.type, mappedProps, undefined, // No children
        context);
        // Render children as siblings (extracted)
        const flattenedChildren = component.children
            ? component.children.map((child, index) => {
                return this.renderComponent(child, {
                    depth: context.depth, // Same depth (sibling)
                    path: [...context.path, `flattened_${index}`]
                });
            }).join('\n')
            : '';
        return flatComponent + '\n' + flattenedChildren;
    }
    /**
     * Delegate to adapter for actual component rendering
     */
    renderAdapterComponent(type, properties, children, context) {
        const adapterComponent = this.adapter.components[type];
        if (!adapterComponent) {
            this.addWarning(`Adapter missing component: ${type}`);
            return `<!-- Missing adapter for: ${type} -->`;
        }
        return adapterComponent.render({
            properties,
            children,
            context: {
                depth: context.depth,
                dataContext: context.dataContext
            }
        });
    }
    // ============================================================================
    // Helper Methods
    // ============================================================================
    /**
     * Get component name for import/usage
     */
    getComponentName(type) {
        const componentDef = ATOMIC_COMPONENTS_REGISTRY[type];
        return componentDef?.name || type.charAt(0).toUpperCase() + type.slice(1);
    }
    /**
     * Get item variable name for loop rendering
     */
    getItemName(dataSource) {
        // Convert "users" -> "user", "items" -> "item"
        if (dataSource.endsWith('s')) {
            return dataSource.slice(0, -1);
        }
        return dataSource + 'Item';
    }
    /**
     * Get key property for list items
     */
    getKeyProperty(component) {
        return component.properties?.keyProperty || 'id';
    }
    /**
     * Format properties for inline rendering
     */
    formatProps(properties) {
        return Object.entries(properties)
            .map(([key, value]) => {
            if (typeof value === 'string') {
                return `${key}="${value}"`;
            }
            return `${key}={${JSON.stringify(value)}}`;
        })
            .join(' ');
    }
    /**
     * Add warning message
     */
    addWarning(message) {
        if (this.ENABLE_WARNINGS) {
            this.warnings.push(message);
        }
    }
    /**
     * Reset generator state for new generation
     */
    reset() {
        this.warnings = [];
        this.imports = new Set();
    }
    /**
     * Add import statement
     */
    addImport(importStatement) {
        this.imports.add(importStatement);
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Validate component nesting depth
 *
 * @param component - Component to validate
 * @param maxDepth - Maximum allowed depth
 * @returns Validation result with depth and issues
 */
export function validateNestingDepth(component, maxDepth = 3) {
    const issues = [];
    function calculateDepth(comp, currentDepth) {
        if (!comp.children || comp.children.length === 0) {
            return currentDepth;
        }
        const childDepths = comp.children.map(child => calculateDepth(child, currentDepth + 1));
        return Math.max(...childDepths);
    }
    const actualDepth = calculateDepth(component, 0);
    if (actualDepth > maxDepth) {
        issues.push(`Component nesting depth (${actualDepth}) exceeds maximum (${maxDepth})`);
    }
    return {
        valid: actualDepth <= maxDepth,
        actualDepth,
        issues
    };
}
/**
 * Extract all component types used in a view
 *
 * @param components - Component tree
 * @returns Set of component types
 */
export function extractComponentTypes(components) {
    const types = new Set();
    function walk(component) {
        types.add(component.type);
        if (component.children) {
            component.children.forEach(walk);
        }
    }
    Object.values(components).forEach(walk);
    return types;
}
/**
 * Count total components in a view
 *
 * @param components - Component tree
 * @returns Component count
 */
export function countComponents(components) {
    let count = 0;
    function walk(component) {
        count++;
        if (component.children) {
            component.children.forEach(walk);
        }
    }
    Object.values(components).forEach(walk);
    return count;
}
//# sourceMappingURL=base-generator.js.map