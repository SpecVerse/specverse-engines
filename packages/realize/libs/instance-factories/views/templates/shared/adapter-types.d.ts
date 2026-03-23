/**
 * Component Library Adapter Types
 *
 * Defines the interface for UI library adapters (shadcn/ui, Material-UI, Ant Design, etc.)
 * Each adapter implements these types to map SpecVerse atomic components to their framework.
 */
/**
 * Context passed to component render functions
 */
export interface RenderContext {
    /** Component properties from SpecVerse spec */
    properties: Record<string, any>;
    /** Model definition if component is model-bound */
    model?: any;
    /** Component name in the spec */
    name: string;
    /** Child components (for containers) */
    children?: string;
    /** Indentation level for formatting */
    indent?: number;
}
/**
 * Mapping for a single atomic component type
 */
export interface ComponentMapping {
    /** Import statement(s) needed for this component */
    imports: string[];
    /** Function to render the component as JSX string */
    render: (context: RenderContext) => string;
    /** Dependencies required for this component */
    dependencies?: {
        name: string;
        version: string;
    }[];
    /** Optional component-specific configuration */
    config?: Record<string, any>;
}
/**
 * Complete UI library adapter
 */
export interface ComponentLibraryAdapter {
    /** Library name */
    name: string;
    /** Library version */
    version: string;
    /** Description */
    description: string;
    /** Base dependencies for the library */
    baseDependencies: {
        name: string;
        version: string;
    }[];
    /** Mapping for all 49 atomic component types */
    components: Record<string, ComponentMapping>;
    /** Optional global configuration */
    config?: {
        /** Import path prefix (e.g., '@/components/ui', '@mui/material') */
        importPrefix?: string;
        /** Whether to use default or named imports */
        importStyle?: 'default' | 'named';
        /** Theme configuration */
        theme?: Record<string, any>;
    };
}
/**
 * Helper to render properties as JSX attributes
 */
export declare function renderProps(props: Record<string, any>): string;
/**
 * Helper to indent code
 */
export declare function indent(code: string, level?: number): string;
/**
 * Helper to wrap component with children
 */
export declare function wrapWithChildren(openTag: string, children: string, closeTag: string, indentLevel?: number): string;
//# sourceMappingURL=adapter-types.d.ts.map