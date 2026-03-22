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

import { mapProperties, PropertyTarget } from './property-mapper.js';
import { getSyntaxPattern, FrameworkTarget } from './syntax-mapper.js';
import { ATOMIC_COMPONENTS_REGISTRY, AtomicComponentDefinition } from './atomic-components-registry.js';
import type { ComponentAdapter } from './adapter-types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * UI Component specification from SpecVerse view definition
 */
export interface UIComponent {
  type: string;
  properties?: Record<string, any>;
  children?: UIComponent[];
  dataSource?: string; // Model array for lists
  condition?: string; // Conditional rendering expression
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
  dataContext?: string; // Current data variable (for loops)
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
export abstract class BaseComponentGenerator {
  // Configuration
  protected readonly config: GeneratorConfig;
  protected readonly adapter: ComponentAdapter;

  // Architectural constraints
  protected readonly MAX_DEPTH: number;
  protected readonly ENABLE_WARNINGS: boolean;

  // Tracking
  protected warnings: string[] = [];
  protected imports: Set<string> = new Set();

  constructor(adapter: ComponentAdapter, config: GeneratorConfig) {
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
  public generate(viewSpec: ViewSpec): GenerationResult {
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
  protected generateComponentTree(components: Record<string, UIComponent>): string {
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
  protected renderComponent(
    component: UIComponent,
    context: RenderContext
  ): string {
    // Depth enforcement
    if (context.depth > this.MAX_DEPTH) {
      this.addWarning(
        `Component at path ${context.path.join('.')} exceeds max depth (${this.MAX_DEPTH}). ` +
        `Flattening to maintain readability.`
      );
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
    return this.renderAdapterComponent(
      component.type,
      mappedProps,
      children,
      context
    );
  }

  /**
   * Map component properties using property-mapper
   */
  protected mapComponentProperties(
    component: UIComponent,
    componentDef: AtomicComponentDefinition
  ): Record<string, any> {
    if (!component.properties) {
      return {};
    }

    return mapProperties(
      component.type,
      component.properties,
      this.config.target
    );
  }

  /**
   * Render child components with incremented depth
   */
  protected renderChildren(
    children: UIComponent[],
    parentContext: RenderContext
  ): string {
    const childContext: RenderContext = {
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
  protected renderConditional(
    component: UIComponent,
    mappedProps: Record<string, any>,
    context: RenderContext
  ): string {
    const innerComponent = this.renderAdapterComponent(
      component.type,
      mappedProps,
      component.children
        ? this.renderChildren(component.children, context)
        : undefined,
      context
    );

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
  protected renderList(
    component: UIComponent,
    mappedProps: Record<string, any>,
    context: RenderContext
  ): string {
    const itemName = this.getItemName(component.dataSource!);
    const keyProperty = this.getKeyProperty(component);

    // Create child context with data variable
    const childContext: RenderContext = {
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
  protected renderFlattened(
    component: UIComponent,
    context: RenderContext
  ): string {
    // Render component without children
    const componentDef = ATOMIC_COMPONENTS_REGISTRY[component.type];
    const mappedProps = this.mapComponentProperties(component, componentDef);

    const flatComponent = this.renderAdapterComponent(
      component.type,
      mappedProps,
      undefined, // No children
      context
    );

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
  protected renderAdapterComponent(
    type: string,
    properties: Record<string, any>,
    children: string | undefined,
    context: RenderContext
  ): string {
    const adapterComponent = this.adapter.components[type];
    if (!adapterComponent) {
      this.addWarning(`Adapter missing component: ${type}`);
      return `<!-- Missing adapter for: ${type} -->`;
    }

    return adapterComponent.render({
      properties,
      children
    });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get component name for import/usage
   */
  protected getComponentName(type: string): string {
    const componentDef = ATOMIC_COMPONENTS_REGISTRY[type];
    return componentDef?.name || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Get item variable name for loop rendering
   */
  protected getItemName(dataSource: string): string {
    // Convert "users" -> "user", "items" -> "item"
    if (dataSource.endsWith('s')) {
      return dataSource.slice(0, -1);
    }
    return dataSource + 'Item';
  }

  /**
   * Get key property for list items
   */
  protected getKeyProperty(component: UIComponent): string {
    return component.properties?.keyProperty || 'id';
  }

  /**
   * Format properties for inline rendering
   */
  protected formatProps(properties: Record<string, any>): string {
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
  protected addWarning(message: string): void {
    if (this.ENABLE_WARNINGS) {
      this.warnings.push(message);
    }
  }

  /**
   * Reset generator state for new generation
   */
  protected reset(): void {
    this.warnings = [];
    this.imports = new Set();
  }

  /**
   * Add import statement
   */
  protected addImport(importStatement: string): void {
    this.imports.add(importStatement);
  }

  // ============================================================================
  // Abstract Methods (Framework-Specific)
  // ============================================================================

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
  public abstract getFileExtension(): string;

  /**
   * Get additional files that need to be generated (e.g., CSS, types)
   *
   * @param viewSpec - View specification
   * @returns Map of filename to content
   */
  public abstract getAdditionalFiles(viewSpec: ViewSpec): Record<string, string>;
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
export function validateNestingDepth(
  component: UIComponent,
  maxDepth: number = 3
): { valid: boolean; actualDepth: number; issues: string[] } {
  const issues: string[] = [];

  function calculateDepth(comp: UIComponent, currentDepth: number): number {
    if (!comp.children || comp.children.length === 0) {
      return currentDepth;
    }

    const childDepths = comp.children.map(child =>
      calculateDepth(child, currentDepth + 1)
    );

    return Math.max(...childDepths);
  }

  const actualDepth = calculateDepth(component, 0);

  if (actualDepth > maxDepth) {
    issues.push(
      `Component nesting depth (${actualDepth}) exceeds maximum (${maxDepth})`
    );
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
export function extractComponentTypes(
  components: Record<string, UIComponent>
): Set<string> {
  const types = new Set<string>();

  function walk(component: UIComponent): void {
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
export function countComponents(
  components: Record<string, UIComponent>
): number {
  let count = 0;

  function walk(component: UIComponent): void {
    count++;
    if (component.children) {
      component.children.forEach(walk);
    }
  }

  Object.values(components).forEach(walk);

  return count;
}
