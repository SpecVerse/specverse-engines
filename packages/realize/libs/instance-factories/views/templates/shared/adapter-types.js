/**
 * Component Library Adapter Types
 *
 * Defines the interface for UI library adapters (shadcn/ui, Material-UI, Ant Design, etc.)
 * Each adapter implements these types to map SpecVerse atomic components to their framework.
 */
/**
 * Helper to render properties as JSX attributes
 */
export function renderProps(props) {
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
export function indent(code, level = 0) {
    const spaces = '  '.repeat(level);
    return code.split('\n').map(line => line ? spaces + line : line).join('\n');
}
/**
 * Helper to wrap component with children
 */
export function wrapWithChildren(openTag, children, closeTag, indentLevel = 0) {
    return `${openTag}\n${indent(children, indentLevel + 1)}\n${indent(closeTag, indentLevel)}`;
}
//# sourceMappingURL=adapter-types.js.map