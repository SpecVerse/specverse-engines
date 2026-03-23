/**
 * Runtime View Renderer
 *
 * Dynamically renders SpecVerse views at runtime using React.createElement.
 * Used by app-demo for live view rendering without code generation.
 *
 * Architecture:
 * - No code generation - creates React elements directly
 * - Uses component-metadata for runtime hints
 * - Integrates with BaseComponentGenerator for shared logic
 * - Supports dynamic state and event binding
 * - Real-time view updates
 */

import React, { createElement, useState, useEffect, useMemo } from 'react';
import {
  BaseComponentGenerator,
  ViewSpec,
  StateDefinition,
  EventDefinition,
  UIComponent,
  RenderContext,
  GeneratorConfig
} from '../shared/base-generator.js';
import { mapProperties } from '../shared/property-mapper.js';
import { getComponentMetadata } from '../shared/component-metadata.js';
import type { ComponentAdapter } from '../shared/adapter-types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Runtime renderer configuration
 */
export interface RuntimeRendererConfig extends GeneratorConfig {
  framework: 'runtime';
  target: 'runtime';
  /**
   * Enable live reload on spec changes
   */
  liveReload?: boolean;
  /**
   * Debug mode with console logging
   */
  debug?: boolean;
}

/**
 * Runtime component props
 */
export interface RuntimeComponentProps {
  [key: string]: any;
  children?: React.ReactNode;
}

/**
 * Runtime state manager
 */
export interface RuntimeState {
  [key: string]: any;
}

/**
 * Runtime event handlers
 */
export interface RuntimeEventHandlers {
  [key: string]: (...args: any[]) => void;
}

/**
 * Runtime view context
 */
export interface RuntimeViewContext {
  state: RuntimeState;
  setState: (updates: Partial<RuntimeState>) => void;
  handlers: RuntimeEventHandlers;
  data: Record<string, any[]>; // Model data for lists
}

// ============================================================================
// Runtime View Renderer
// ============================================================================

/**
 * Renders SpecVerse views dynamically at runtime
 *
 * Unlike code generators, this creates React elements directly without
 * generating .tsx files. Used by app-demo for live view rendering.
 */
export class RuntimeViewRenderer extends BaseComponentGenerator {
  private readonly runtimeConfig: RuntimeRendererConfig;
  private viewContext?: RuntimeViewContext;

  constructor(adapter: ComponentAdapter, config: RuntimeRendererConfig) {
    super(adapter, config);
    this.runtimeConfig = config;
  }

  // ============================================================================
  // Public API - Runtime Rendering
  // ============================================================================

  /**
   * Render view as React element (runtime)
   *
   * @param viewSpec - View specification
   * @param context - Runtime context (state, data, handlers)
   * @returns React element
   */
  public renderRuntime(
    viewSpec: ViewSpec,
    context?: Partial<RuntimeViewContext>
  ): React.ReactElement {
    // Initialize runtime context
    this.viewContext = this.initializeContext(viewSpec, context);

    // Create root element
    const components = this.renderComponentsRuntime(viewSpec.components);

    return createElement(
      'div',
      { className: 'specverse-runtime-view', 'data-view': viewSpec.name },
      components
    );
  }

  /**
   * Create a React component from view spec
   *
   * Returns a React component function that can be used directly
   *
   * @param viewSpec - View specification
   * @returns React component function
   */
  public createRuntimeComponent(viewSpec: ViewSpec): React.FC<any> {
    const renderer = this;

    return function RuntimeViewComponent(props: any) {
      // Initialize state from view spec
      const [state, setState] = useState<RuntimeState>(() =>
        renderer.initializeState(viewSpec.state)
      );

      // Initialize event handlers
      const handlers = useMemo(() =>
        renderer.createEventHandlers(viewSpec.events, state, setState),
        [state]
      );

      // Create runtime context
      const context: RuntimeViewContext = {
        state,
        setState: (updates) => setState(prev => ({ ...prev, ...updates })),
        handlers,
        data: props.data || {}
      };

      // Render view
      return renderer.renderRuntime(viewSpec, context);
    };
  }

  // ============================================================================
  // Abstract Method Implementations (Not Used in Runtime)
  // ============================================================================

  protected generateImports(viewSpec: ViewSpec): string {
    // Runtime doesn't generate code
    return '';
  }

  protected generateComponent(parts: any): string {
    // Runtime doesn't generate code
    return '';
  }

  protected generateState(state: Record<string, StateDefinition>): string {
    // Runtime doesn't generate code
    return '';
  }

  protected generateEvents(events: Record<string, EventDefinition>): string {
    // Runtime doesn't generate code
    return '';
  }

  public getFileExtension(): string {
    return ''; // No files generated
  }

  public getAdditionalFiles(viewSpec: ViewSpec): Record<string, string> {
    return {}; // No files generated
  }

  // ============================================================================
  // Runtime-Specific Methods
  // ============================================================================

  /**
   * Initialize runtime context
   */
  private initializeContext(
    viewSpec: ViewSpec,
    context?: Partial<RuntimeViewContext>
  ): RuntimeViewContext {
    return {
      state: context?.state || this.initializeState(viewSpec.state),
      setState: context?.setState || (() => {}),
      handlers: context?.handlers || this.createEventHandlers(viewSpec.events),
      data: context?.data || {}
    };
  }

  /**
   * Initialize state from view spec
   */
  private initializeState(state?: Record<string, StateDefinition>): RuntimeState {
    if (!state) return {};

    const initialState: RuntimeState = {};

    for (const [name, def] of Object.entries(state)) {
      initialState[name] = def.initial;
    }

    return initialState;
  }

  /**
   * Create event handlers from view spec
   */
  private createEventHandlers(
    events?: Record<string, EventDefinition>,
    state?: RuntimeState,
    setState?: (updates: Partial<RuntimeState>) => void
  ): RuntimeEventHandlers {
    if (!events) return {};

    const handlers: RuntimeEventHandlers = {};

    for (const [name, def] of Object.entries(events)) {
      // Create handler function
      handlers[`handle${this.capitalize(name)}`] = (...args: any[]) => {
        if (this.runtimeConfig.debug) {
          console.log(`[RuntimeView] Event: ${name}`, args);
        }

        // Execute event body
        try {
          // Create function from body
          const fn = new Function('state', 'setState', 'args', def.body);
          fn(state, setState, args);
        } catch (error) {
          console.error(`[RuntimeView] Event handler error (${name}):`, error);
        }
      };
    }

    return handlers;
  }

  /**
   * Render components as React elements
   */
  private renderComponentsRuntime(components: Record<string, UIComponent>): React.ReactNode[] {
    return Object.entries(components).map(([name, component]) =>
      this.renderComponentRuntime(component, {
        depth: 0,
        path: [name]
      })
    );
  }

  /**
   * Render single component as React element
   */
  private renderComponentRuntime(
    component: UIComponent,
    context: RenderContext
  ): React.ReactElement | null {
    // Depth enforcement
    if (context.depth > this.MAX_DEPTH) {
      if (this.runtimeConfig.debug) {
        console.warn(`[RuntimeView] Max depth exceeded at ${context.path.join('.')}`);
      }
      return null;
    }

    // Get component metadata
    const metadata = getComponentMetadata(component.type);
    if (!metadata) {
      console.warn(`[RuntimeView] Unknown component type: ${component.type}`);
      return null;
    }

    // Map properties
    const mappedProps = component.properties
      ? mapProperties(component.type, component.properties, 'runtime')
      : {};

    // Add key for React
    const props: RuntimeComponentProps = {
      ...mappedProps,
      key: context.path.join('-')
    };

    // Handle conditional rendering
    if (component.condition && this.viewContext) {
      const condition = this.evaluateCondition(component.condition, this.viewContext);
      if (!condition) return null;
    }

    // Handle list rendering
    if (component.dataSource && this.viewContext) {
      return this.renderListRuntime(component, props, context);
    }

    // Render children
    let children: React.ReactNode = null;
    if (component.children && component.children.length > 0) {
      children = component.children.map((child, index) =>
        this.renderComponentRuntime(child, {
          ...context,
          depth: context.depth + 1,
          path: [...context.path, `child_${index}`]
        })
      );
    }

    // Get adapter component render function
    const adapterComponent = this.adapter.components[component.type];
    if (!adapterComponent) {
      console.warn(`[RuntimeView] No adapter for component: ${component.type}`);
      return null;
    }

    // For runtime, we need to create actual React elements
    // The adapter render function returns JSX string, so we need to convert it
    // For now, create a simple wrapper
    return this.createElementFromAdapter(component.type, props, children);
  }

  /**
   * Render list of items
   */
  private renderListRuntime(
    component: UIComponent,
    props: RuntimeComponentProps,
    context: RenderContext
  ): React.ReactElement | null {
    if (!this.viewContext) return null;

    const dataArray = this.viewContext.data[component.dataSource!];
    if (!Array.isArray(dataArray)) {
      console.warn(`[RuntimeView] Data source not found: ${component.dataSource}`);
      return null;
    }

    const items = dataArray.map((item, index) => {
      const itemProps = {
        ...props,
        ...item,
        key: `${context.path.join('-')}-${index}`
      };

      return this.createElementFromAdapter(component.type, itemProps, null);
    });

    return createElement(React.Fragment, null, ...items);
  }

  /**
   * Create React element from adapter component
   */
  private createElementFromAdapter(
    type: string,
    props: RuntimeComponentProps,
    children: React.ReactNode
  ): React.ReactElement {
    // For runtime, we create a simple div wrapper with className
    // In actual implementation, this would integrate with a component library
    return createElement(
      'div',
      {
        ...props,
        className: `specverse-runtime-${type} ${props.className || ''}`.trim(),
        'data-component': type
      },
      children
    );
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: string, context: RuntimeViewContext): boolean {
    try {
      const fn = new Function('state', 'data', `return ${condition}`);
      return fn(context.state, context.data);
    } catch (error) {
      console.error(`[RuntimeView] Condition evaluation error:`, error);
      return false;
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a RuntimeViewRenderer instance
 *
 * @param adapter - Component adapter (runtime adapter)
 * @param config - Optional configuration
 * @returns RuntimeViewRenderer instance
 */
export function createRuntimeRenderer(
  adapter: ComponentAdapter,
  config?: Partial<RuntimeRendererConfig>
): RuntimeViewRenderer {
  const defaultConfig: RuntimeRendererConfig = {
    framework: 'runtime',
    target: 'runtime',
    liveReload: false,
    debug: false,
    maxDepth: 3,
    enableWarnings: true
  };

  const finalConfig = { ...defaultConfig, ...config } as RuntimeRendererConfig;

  return new RuntimeViewRenderer(adapter, finalConfig);
}

/**
 * Render view at runtime (convenience function)
 *
 * @param viewSpec - View specification
 * @param adapter - Component adapter
 * @param context - Runtime context
 * @returns React element
 */
export function renderView(
  viewSpec: ViewSpec,
  adapter: ComponentAdapter,
  context?: Partial<RuntimeViewContext>
): React.ReactElement {
  const renderer = createRuntimeRenderer(adapter);
  return renderer.renderRuntime(viewSpec, context);
}

/**
 * Create runtime component (convenience function)
 *
 * @param viewSpec - View specification
 * @param adapter - Component adapter
 * @returns React component function
 */
export function createViewComponent(
  viewSpec: ViewSpec,
  adapter: ComponentAdapter
): React.FC<any> {
  const renderer = createRuntimeRenderer(adapter);
  return renderer.createRuntimeComponent(viewSpec);
}
