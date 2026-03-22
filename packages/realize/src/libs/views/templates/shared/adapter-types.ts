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
 * Simplified adapter interface (used by tests and runtime renderer)
 */
export interface ComponentAdapter {
  name: string;
  version: string;
  description: string;
  components: Record<string, {
    import?: string;
    render: (params: { properties?: Record<string, any>; children?: string }) => string;
  }>;
}

/**
 * Helper to render properties as JSX attributes
 */
export function renderProps(props: Record<string, any>): string {
  return Object.entries(props)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? key : '';
      }
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }
      if (typeof value === 'number') {
        return `${key}={${value}}`;
      }
      if (Array.isArray(value)) {
        return `${key}={${JSON.stringify(value)}}`;
      }
      if (typeof value === 'object') {
        return `${key}={${JSON.stringify(value)}}`;
      }
      return `${key}={${value}}`;
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Helper to indent code
 */
export function indent(code: string, level: number = 0): string {
  const spaces = '  '.repeat(level);
  return code.split('\n').map(line => line ? spaces + line : line).join('\n');
}

/**
 * Helper to wrap component with children
 */
export function wrapWithChildren(
  openTag: string,
  children: string,
  closeTag: string,
  indentLevel: number = 0
): string {
  return `${openTag}\n${indent(children, indentLevel + 1)}\n${indent(closeTag, indentLevel)}`;
}
