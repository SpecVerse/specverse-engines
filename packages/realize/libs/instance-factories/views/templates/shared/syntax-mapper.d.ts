/**
 * Syntax Mapper - Framework Syntax Patterns
 *
 * Maps universal programming patterns to framework-specific syntax.
 * Enables consistent code generation across React, Vue, Svelte, Angular, and runtime.
 *
 * Architecture:
 * - SyntaxPattern: Template strings for each framework
 * - SYNTAX_PATTERNS: Universal patterns (state, loops, events, conditions, imports)
 * - getSyntaxPattern(): Template variable replacement
 *
 * Example:
 *   getSyntaxPattern('stateDeclaration', 'react', {name: 'count', initial: '0'})
 *   → "const [count, setCount] = useState(0);"
 */
/**
 * All supported framework targets for syntax generation
 */
export type FrameworkTarget = 'react' | 'vue' | 'svelte' | 'angular' | 'runtime';
/**
 * Syntax pattern definition for a single programming pattern
 * Maps each framework to its specific syntax template
 */
export interface SyntaxPattern {
    react: string;
    vue: string;
    svelte: string;
    angular: string;
    runtime: string;
}
/**
 * Available syntax pattern categories
 */
export type SyntaxPatternKey = 'stateDeclaration' | 'stateUpdate' | 'stateGetter' | 'loopRender' | 'conditionalRender' | 'componentRender' | 'eventHandler' | 'eventBinding' | 'onMount' | 'onUnmount' | 'onUpdate' | 'propDeclaration' | 'propAccess' | 'propBinding' | 'componentImport' | 'hookImport' | 'libraryImport';
/**
 * State Management Patterns
 */
export declare const STATE_PATTERNS: Record<string, SyntaxPattern>;
/**
 * Rendering Patterns
 */
export declare const RENDER_PATTERNS: Record<string, SyntaxPattern>;
/**
 * Event Handling Patterns
 */
export declare const EVENT_PATTERNS: Record<string, SyntaxPattern>;
/**
 * Lifecycle Patterns
 */
export declare const LIFECYCLE_PATTERNS: Record<string, SyntaxPattern>;
/**
 * Props/Attributes Patterns
 */
export declare const PROP_PATTERNS: Record<string, SyntaxPattern>;
/**
 * Import Patterns
 */
export declare const IMPORT_PATTERNS: Record<string, SyntaxPattern>;
/**
 * All syntax patterns organized by category
 */
export declare const SYNTAX_PATTERNS: Record<SyntaxPatternKey, SyntaxPattern>;
/**
 * Replaces template variables in a pattern string
 *
 * Template variables use ${variableName} syntax.
 * Special handling for capitalization: ${Name} will capitalize first letter
 *
 * @param template - Template string with ${variables}
 * @param variables - Object mapping variable names to values
 * @returns String with variables replaced
 */
export declare function replaceTemplateVariables(template: string, variables: Record<string, any>): string;
/**
 * Gets a syntax pattern for a specific framework with variable replacement
 *
 * @param pattern - The syntax pattern key to use
 * @param framework - Target framework
 * @param variables - Variables to replace in template
 * @returns Generated code string for the framework
 */
export declare function getSyntaxPattern(pattern: SyntaxPatternKey, framework: FrameworkTarget, variables: Record<string, any>): string;
/**
 * Gets all framework implementations of a pattern
 *
 * Useful for documentation or comparison
 *
 * @param pattern - The syntax pattern key
 * @param variables - Variables to replace in templates
 * @returns Object mapping frameworks to generated code
 */
export declare function getAllFrameworkSyntax(pattern: SyntaxPatternKey, variables: Record<string, any>): Record<FrameworkTarget, string>;
/**
 * Checks if a pattern is available for a framework
 *
 * @param pattern - The syntax pattern key
 * @param framework - Target framework
 * @returns True if pattern exists for framework
 */
export declare function hasPattern(pattern: SyntaxPatternKey, framework: FrameworkTarget): boolean;
/**
 * Gets all available pattern keys
 *
 * @returns Array of all syntax pattern keys
 */
export declare function getAllPatternKeys(): SyntaxPatternKey[];
/**
 * Gets pattern keys by category
 *
 * @param category - Pattern category
 * @returns Array of pattern keys in that category
 */
export declare function getPatternsByCategory(category: 'state' | 'render' | 'event' | 'lifecycle' | 'prop' | 'import'): SyntaxPatternKey[];
/**
 * Generate state management code for a framework
 * Convenience function that combines declaration and update patterns
 *
 * @param framework - Target framework
 * @param stateName - Name of state variable
 * @param stateType - TypeScript type
 * @param initialValue - Initial value
 * @returns Object with declaration and updater syntax
 */
export declare function generateStateCode(framework: FrameworkTarget, stateName: string, stateType: string, initialValue: string): {
    declaration: string;
    update: (value: string) => string;
    get: string;
};
/**
 * Generate event handler code for a framework
 *
 * @param framework - Target framework
 * @param eventName - Name of event (e.g., 'click', 'submit')
 * @param handlerName - Name of handler function
 * @param params - Handler parameters
 * @param body - Handler body code
 * @returns Object with handler function and binding syntax
 */
export declare function generateEventCode(framework: FrameworkTarget, eventName: string, handlerName: string, params: string, body: string): {
    handler: string;
    binding: string;
};
//# sourceMappingURL=syntax-mapper.d.ts.map