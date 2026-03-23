/**
 * React Component Generator
 *
 * Extends BaseComponentGenerator to generate React/TypeScript components.
 * Outputs .tsx files with proper imports, hooks, types, and JSX.
 *
 * Features:
 * - TypeScript with strict typing
 * - React hooks (useState, useEffect)
 * - JSX component rendering
 * - Adapter integration (shadcn, MUI, antd)
 * - Proper file structure and exports
 */
import { BaseComponentGenerator, ViewSpec, StateDefinition, EventDefinition, GeneratorConfig } from '../shared/base-generator.js';
import type { ComponentAdapter } from '../shared/adapter-types.js';
/**
 * React-specific generator configuration
 */
export interface ReactGeneratorConfig extends GeneratorConfig {
    framework: 'react';
    target: 'shadcn' | 'mui' | 'antd';
    typescript: boolean;
    strictMode?: boolean;
    includeComments?: boolean;
}
/**
 * React component props interface
 */
export interface ReactComponentProps {
    [key: string]: any;
}
/**
 * Generates React/TypeScript components from SpecVerse view specifications
 *
 * Output structure:
 * ```tsx
 * import React, { useState, useEffect } from 'react';
 * import { Button } from '@/components/ui/button';
 *
 * interface {ComponentName}Props {
 *   // ... props
 * }
 *
 * export function {ComponentName}({ ...props }: {ComponentName}Props) {
 *   // State declarations
 *   const [count, setCount] = useState(0);
 *
 *   // Event handlers
 *   const handleClick = () => { ... };
 *
 *   // Component tree
 *   return (
 *     <div>
 *       <Button onClick={handleClick}>Click me</Button>
 *     </div>
 *   );
 * }
 * ```
 */
export declare class ReactComponentGenerator extends BaseComponentGenerator {
    private readonly reactConfig;
    constructor(adapter: ComponentAdapter, config: ReactGeneratorConfig);
    /**
     * Generate React imports
     */
    protected generateImports(viewSpec: ViewSpec): string;
    /**
     * Generate complete React component
     */
    protected generateComponent(parts: {
        name: string;
        imports: string;
        state: string;
        events: string;
        components: string;
    }): string;
    /**
     * Generate state declarations using React hooks
     */
    protected generateState(state: Record<string, StateDefinition>): string;
    /**
     * Generate event handlers
     */
    protected generateEvents(events: Record<string, EventDefinition>): string;
    /**
     * Get file extension (.tsx for React/TypeScript)
     */
    getFileExtension(): string;
    /**
     * Get additional files (styles, types, etc.)
     */
    getAdditionalFiles(viewSpec: ViewSpec): Record<string, string>;
    /**
     * Get React core imports (useState, useEffect, etc.)
     */
    private getReactCoreImports;
    /**
     * Get component library imports
     */
    private getComponentImports;
    /**
     * Generate props interface for TypeScript
     */
    private generatePropsInterface;
    /**
     * Generate main component function
     */
    private generateComponentFunction;
    /**
     * Generate separate types file
     */
    private generateTypesFile;
    /**
     * Check if component needs useEffect hook
     */
    private needsUseEffect;
    /**
     * Capitalize first letter of string
     */
    private capitalize;
    /**
     * Override to add React-specific rendering hints
     */
    protected renderAdapterComponent(type: string, properties: Record<string, any>, children: string | undefined, context: any): string;
}
/**
 * Create a ReactComponentGenerator instance
 *
 * @param adapter - Component adapter (shadcn, mui, antd)
 * @param config - Generator configuration
 * @returns ReactComponentGenerator instance
 */
export declare function createReactGenerator(adapter: ComponentAdapter, config?: Partial<ReactGeneratorConfig>): ReactComponentGenerator;
/**
 * Generate React component from view spec (one-liner)
 *
 * @param viewSpec - View specification
 * @param adapter - Component adapter
 * @param options - Optional configuration
 * @returns Generated component code
 */
export declare function generateReactComponent(viewSpec: ViewSpec, adapter: ComponentAdapter, options?: Partial<ReactGeneratorConfig>): string;
/**
 * Generate React component with all additional files
 *
 * @param viewSpec - View specification
 * @param adapter - Component adapter
 * @param options - Optional configuration
 * @returns Map of filename to content
 */
export declare function generateReactComponentFiles(viewSpec: ViewSpec, adapter: ComponentAdapter, options?: Partial<ReactGeneratorConfig>): Map<string, string>;
//# sourceMappingURL=react-component-generator.d.ts.map