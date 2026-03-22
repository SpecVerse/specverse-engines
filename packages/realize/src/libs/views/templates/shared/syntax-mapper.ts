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

// ============================================================================
// Types
// ============================================================================

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
export type SyntaxPatternKey =
  // State management
  | 'stateDeclaration'
  | 'stateUpdate'
  | 'stateGetter'
  // Rendering patterns
  | 'loopRender'
  | 'conditionalRender'
  | 'componentRender'
  // Event handling
  | 'eventHandler'
  | 'eventBinding'
  // Lifecycle
  | 'onMount'
  | 'onUnmount'
  | 'onUpdate'
  // Props/Attributes
  | 'propDeclaration'
  | 'propAccess'
  | 'propBinding'
  // Imports
  | 'componentImport'
  | 'hookImport'
  | 'libraryImport';

// ============================================================================
// Syntax Pattern Definitions
// ============================================================================

/**
 * State Management Patterns
 */
export const STATE_PATTERNS: Record<string, SyntaxPattern> = {
  /**
   * Declare a state variable
   * Variables: name, Name (capitalized), type (optional), initial
   */
  stateDeclaration: {
    react: 'const [${name}, set${Name}] = useState<${type}>(${initial});',
    vue: 'const ${name} = ref<${type}>(${initial});',
    svelte: 'let ${name}: ${type} = ${initial};',
    angular: '${name}: ${type} = ${initial};',
    runtime: 'const [${name}, set${Name}] = useState<${type}>(${initial});'
  },

  /**
   * Update a state variable
   * Variables: name, Name (capitalized), value
   */
  stateUpdate: {
    react: 'set${Name}(${value});',
    vue: '${name}.value = ${value};',
    svelte: '${name} = ${value};',
    angular: 'this.${name} = ${value};',
    runtime: 'set${Name}(${value});'
  },

  /**
   * Access a state variable value
   * Variables: name
   */
  stateGetter: {
    react: '${name}',
    vue: '${name}.value',
    svelte: '${name}',
    angular: 'this.${name}',
    runtime: '${name}'
  }
};

/**
 * Rendering Patterns
 */
export const RENDER_PATTERNS: Record<string, SyntaxPattern> = {
  /**
   * Render array of items with loop
   * Variables: array, item, key, Component
   */
  loopRender: {
    react: '{${array}.map((${item}) => <${Component} key={${item}.${key}} ${item}={${item}} />)}',
    vue: '<${Component} v-for="${item} in ${array}" :key="${item}.${key}" :${item}="${item}" />',
    svelte: '{#each ${array} as ${item} (${item}.${key})}<${Component} ${item}={${item}} />{/each}',
    angular: '<${component} *ngFor="let ${item} of ${array}; trackBy: track${Item}" [${item}]="${item}"></${component}>',
    runtime: '{${array}.map((${item}) => createElement(${Component}, { key: ${item}.${key}, ${item} }))}'
  },

  /**
   * Conditional rendering
   * Variables: condition, Component, props (optional)
   */
  conditionalRender: {
    react: '{${condition} && <${Component} ${props} />}',
    vue: '<${Component} v-if="${condition}" ${props} />',
    svelte: '{#if ${condition}}<${Component} ${props} />{/if}',
    angular: '<${component} *ngIf="${condition}" ${props}></${component}>',
    runtime: '{${condition} && createElement(${Component}, ${props})}'
  },

  /**
   * Render a component with props
   * Variables: Component, props
   */
  componentRender: {
    react: '<${Component} ${props} />',
    vue: '<${Component} ${props} />',
    svelte: '<${Component} ${props} />',
    angular: '<${component} ${props}></${component}>',
    runtime: 'createElement(${Component}, ${props})'
  }
};

/**
 * Event Handling Patterns
 */
export const EVENT_PATTERNS: Record<string, SyntaxPattern> = {
  /**
   * Declare event handler function
   * Variables: name, Name (capitalized), params, body
   */
  eventHandler: {
    react: 'const handle${Name} = (${params}) => {\n  ${body}\n};',
    vue: 'const handle${Name} = (${params}) => {\n  ${body}\n};',
    svelte: 'function handle${Name}(${params}) {\n  ${body}\n}',
    angular: 'handle${Name}(${params}): void {\n  ${body}\n}',
    runtime: 'const handle${Name} = (${params}) => {\n  ${body}\n};'
  },

  /**
   * Bind event to handler
   * Variables: event, handler
   */
  eventBinding: {
    react: '${event}={${handler}}',
    vue: '@${event}="${handler}"',
    svelte: 'on:${event}={${handler}}',
    angular: '(${event})="${handler}($event)"',
    runtime: '${event}: ${handler}'
  }
};

/**
 * Lifecycle Patterns
 */
export const LIFECYCLE_PATTERNS: Record<string, SyntaxPattern> = {
  /**
   * Component mount lifecycle
   * Variables: body
   */
  onMount: {
    react: 'useEffect(() => {\n  ${body}\n}, []);',
    vue: 'onMounted(() => {\n  ${body}\n});',
    svelte: 'onMount(() => {\n  ${body}\n});',
    angular: 'ngOnInit(): void {\n  ${body}\n}',
    runtime: 'useEffect(() => {\n  ${body}\n}, []);'
  },

  /**
   * Component unmount lifecycle
   * Variables: body
   */
  onUnmount: {
    react: 'useEffect(() => {\n  return () => {\n    ${body}\n  };\n}, []);',
    vue: 'onUnmounted(() => {\n  ${body}\n});',
    svelte: 'onDestroy(() => {\n  ${body}\n});',
    angular: 'ngOnDestroy(): void {\n  ${body}\n}',
    runtime: 'useEffect(() => {\n  return () => {\n    ${body}\n  };\n}, []);'
  },

  /**
   * Value change/update lifecycle
   * Variables: dependencies, body
   */
  onUpdate: {
    react: 'useEffect(() => {\n  ${body}\n}, [${dependencies}]);',
    vue: 'watch([${dependencies}], () => {\n  ${body}\n});',
    svelte: '$: if (${dependencies}) {\n  ${body}\n}',
    angular: 'ngOnChanges(changes: SimpleChanges): void {\n  ${body}\n}',
    runtime: 'useEffect(() => {\n  ${body}\n}, [${dependencies}]);'
  }
};

/**
 * Props/Attributes Patterns
 */
export const PROP_PATTERNS: Record<string, SyntaxPattern> = {
  /**
   * Declare component props/properties
   * Variables: name, type, required (boolean)
   */
  propDeclaration: {
    react: '${name}${required ? "" : "?"}: ${type}',
    vue: '${name}: { type: ${type}, required: ${required} }',
    svelte: 'export let ${name}: ${type}${required ? "" : " | undefined"};',
    angular: '@Input() ${name}${required ? "!" : "?"}: ${type};',
    runtime: '${name}${required ? "" : "?"}: ${type}'
  },

  /**
   * Access props inside component
   * Variables: name
   */
  propAccess: {
    react: '${name}',
    vue: 'props.${name}',
    svelte: '${name}',
    angular: 'this.${name}',
    runtime: '${name}'
  },

  /**
   * Bind prop value to component
   * Variables: name, value
   */
  propBinding: {
    react: '${name}={${value}}',
    vue: ':${name}="${value}"',
    svelte: '${name}={${value}}',
    angular: '[${name}]="${value}"',
    runtime: '${name}: ${value}'
  }
};

/**
 * Import Patterns
 */
export const IMPORT_PATTERNS: Record<string, SyntaxPattern> = {
  /**
   * Import a component
   * Variables: Component, path
   */
  componentImport: {
    react: "import ${Component} from '${path}';",
    vue: "import ${Component} from '${path}';",
    svelte: "import ${Component} from '${path}';",
    angular: "import { ${Component} } from '${path}';",
    runtime: "import ${Component} from '${path}';"
  },

  /**
   * Import hooks/composables
   * Variables: hooks (comma-separated), source
   */
  hookImport: {
    react: "import { ${hooks} } from '${source}';",
    vue: "import { ${hooks} } from '${source}';",
    svelte: "import { ${hooks} } from '${source}';",
    angular: "import { ${hooks} } from '${source}';",
    runtime: "import { ${hooks} } from '${source}';"
  },

  /**
   * Import from library
   * Variables: exports, library
   */
  libraryImport: {
    react: "import { ${exports} } from '${library}';",
    vue: "import { ${exports} } from '${library}';",
    svelte: "import { ${exports} } from '${library}';",
    angular: "import { ${exports} } from '${library}';",
    runtime: "import { ${exports} } from '${library}';"
  }
};

/**
 * All syntax patterns organized by category
 */
export const SYNTAX_PATTERNS: Record<SyntaxPatternKey, SyntaxPattern> = {
  // State
  stateDeclaration: STATE_PATTERNS.stateDeclaration,
  stateUpdate: STATE_PATTERNS.stateUpdate,
  stateGetter: STATE_PATTERNS.stateGetter,
  // Rendering
  loopRender: RENDER_PATTERNS.loopRender,
  conditionalRender: RENDER_PATTERNS.conditionalRender,
  componentRender: RENDER_PATTERNS.componentRender,
  // Events
  eventHandler: EVENT_PATTERNS.eventHandler,
  eventBinding: EVENT_PATTERNS.eventBinding,
  // Lifecycle
  onMount: LIFECYCLE_PATTERNS.onMount,
  onUnmount: LIFECYCLE_PATTERNS.onUnmount,
  onUpdate: LIFECYCLE_PATTERNS.onUpdate,
  // Props
  propDeclaration: PROP_PATTERNS.propDeclaration,
  propAccess: PROP_PATTERNS.propAccess,
  propBinding: PROP_PATTERNS.propBinding,
  // Imports
  componentImport: IMPORT_PATTERNS.componentImport,
  hookImport: IMPORT_PATTERNS.hookImport,
  libraryImport: IMPORT_PATTERNS.libraryImport
};

// ============================================================================
// Template Replacement Functions
// ============================================================================

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
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  // Replace all ${variable} patterns
  for (const [key, value] of Object.entries(variables)) {
    // Handle capitalized version (e.g., ${Name} from ${name})
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    const capitalizedPattern = new RegExp(`\\$\\{${capitalizedKey}\\}`, 'g');
    result = result.replace(capitalizedPattern, String(value).charAt(0).toUpperCase() + String(value).slice(1));

    // Handle normal version (e.g., ${name})
    const normalPattern = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(normalPattern, String(value));
  }

  // Handle conditional expressions in template (e.g., ${required ? "" : "?"})
  // This is a simple evaluator for common patterns
  result = result.replace(/\$\{(\w+)\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\}/g, (match, varName, trueVal, falseVal) => {
    const varValue = variables[varName];
    return varValue ? trueVal : falseVal;
  });

  return result;
}

/**
 * Gets a syntax pattern for a specific framework with variable replacement
 *
 * @param pattern - The syntax pattern key to use
 * @param framework - Target framework
 * @param variables - Variables to replace in template
 * @returns Generated code string for the framework
 */
export function getSyntaxPattern(
  pattern: SyntaxPatternKey,
  framework: FrameworkTarget,
  variables: Record<string, any>
): string {
  const syntaxPattern = SYNTAX_PATTERNS[pattern];

  if (!syntaxPattern) {
    throw new Error(`Unknown syntax pattern: ${pattern}`);
  }

  const template = syntaxPattern[framework];

  if (!template) {
    throw new Error(`Framework ${framework} not supported for pattern ${pattern}`);
  }

  return replaceTemplateVariables(template, variables);
}

/**
 * Gets all framework implementations of a pattern
 *
 * Useful for documentation or comparison
 *
 * @param pattern - The syntax pattern key
 * @param variables - Variables to replace in templates
 * @returns Object mapping frameworks to generated code
 */
export function getAllFrameworkSyntax(
  pattern: SyntaxPatternKey,
  variables: Record<string, any>
): Record<FrameworkTarget, string> {
  const frameworks: FrameworkTarget[] = ['react', 'vue', 'svelte', 'angular', 'runtime'];
  const result: Partial<Record<FrameworkTarget, string>> = {};

  for (const framework of frameworks) {
    result[framework] = getSyntaxPattern(pattern, framework, variables);
  }

  return result as Record<FrameworkTarget, string>;
}

/**
 * Checks if a pattern is available for a framework
 *
 * @param pattern - The syntax pattern key
 * @param framework - Target framework
 * @returns True if pattern exists for framework
 */
export function hasPattern(
  pattern: SyntaxPatternKey,
  framework: FrameworkTarget
): boolean {
  const syntaxPattern = SYNTAX_PATTERNS[pattern];
  return Boolean(syntaxPattern && syntaxPattern[framework] !== undefined);
}

/**
 * Gets all available pattern keys
 *
 * @returns Array of all syntax pattern keys
 */
export function getAllPatternKeys(): SyntaxPatternKey[] {
  return Object.keys(SYNTAX_PATTERNS) as SyntaxPatternKey[];
}

/**
 * Gets pattern keys by category
 *
 * @param category - Pattern category
 * @returns Array of pattern keys in that category
 */
export function getPatternsByCategory(
  category: 'state' | 'render' | 'event' | 'lifecycle' | 'prop' | 'import'
): SyntaxPatternKey[] {
  const categoryMap: Record<string, SyntaxPatternKey[]> = {
    state: ['stateDeclaration', 'stateUpdate', 'stateGetter'],
    render: ['loopRender', 'conditionalRender', 'componentRender'],
    event: ['eventHandler', 'eventBinding'],
    lifecycle: ['onMount', 'onUnmount', 'onUpdate'],
    prop: ['propDeclaration', 'propAccess', 'propBinding'],
    import: ['componentImport', 'hookImport', 'libraryImport']
  };

  return categoryMap[category] || [];
}

// ============================================================================
// Framework-Specific Helpers
// ============================================================================

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
export function generateStateCode(
  framework: FrameworkTarget,
  stateName: string,
  stateType: string,
  initialValue: string
): { declaration: string; update: (value: string) => string; get: string } {
  const declaration = getSyntaxPattern('stateDeclaration', framework, {
    name: stateName,
    Name: stateName.charAt(0).toUpperCase() + stateName.slice(1),
    type: stateType,
    initial: initialValue
  });

  const update = (value: string) => getSyntaxPattern('stateUpdate', framework, {
    name: stateName,
    Name: stateName.charAt(0).toUpperCase() + stateName.slice(1),
    value
  });

  const get = getSyntaxPattern('stateGetter', framework, { name: stateName });

  return { declaration, update, get };
}

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
export function generateEventCode(
  framework: FrameworkTarget,
  eventName: string,
  handlerName: string,
  params: string,
  body: string
): { handler: string; binding: string } {
  const handler = getSyntaxPattern('eventHandler', framework, {
    name: handlerName,
    Name: handlerName.charAt(0).toUpperCase() + handlerName.slice(1),
    params,
    body
  });

  const binding = getSyntaxPattern('eventBinding', framework, {
    event: eventName,
    handler: `handle${handlerName.charAt(0).toUpperCase() + handlerName.slice(1)}`
  });

  return { handler, binding };
}
