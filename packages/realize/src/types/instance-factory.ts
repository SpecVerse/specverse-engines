/**
 * Instance Factory Definitions
 *
 * TypeScript interfaces for SpecVerse Instance Factories.
 * These define reusable technology specifications for code generation.
 */

/**
 * Package dependency specification
 */
export interface Dependency {
  name: string;
  version: string;
  optional?: boolean;
}

/**
 * Code template specification
 */
export interface CodeTemplate {
  /** Template engine to use */
  engine: 'typescript' | 'handlebars' | 'ai';

  /** Template content or path (for handlebars) */
  template?: string;

  /** Path to generator function (for typescript) */
  generator?: string;

  /** Generation prompt (for AI) */
  prompt?: string;

  /** Output file path pattern with variables like {controller}, {model} */
  outputPattern: string;

  /** Paths to validation functions */
  validators?: string[];

  /** Paths to post-processing functions */
  postProcessors?: string[];
}

/**
 * Technology stack information
 */
export interface TechnologyStack {
  /**
   * Runtime environment identifier (kebab-case).
   * Standard: node, deno, bun, python, rust, go, browser
   * Custom values allowed (e.g., "zig", "dotnet")
   * Pattern: ^[a-z][a-z0-9-]+$
   */
  runtime: string;

  /**
   * Programming language identifier (kebab-case).
   * Standard: typescript, javascript, python, rust, go, java, csharp, php, ruby, kotlin, swift
   * Custom values allowed (e.g., "gleam", "elixir")
   * Pattern: ^[a-z][a-z0-9-]+$
   */
  language: string;

  /** Framework name (fastify, express, react, vue, etc.) */
  framework?: string;

  /** ORM/database library (prisma, typeorm, drizzle, etc.) */
  orm?: string;

  /** Validation library (zod, joi, class-validator, etc.) */
  validation?: string;

  /** Additional technology properties */
  [key: string]: string | undefined;
}

/**
 * Compatibility requirements
 */
export interface CompatibilityRequirements {
  /** SpecVerse version range (semver) */
  specverse: string;

  /** Node.js version requirement */
  node?: string;

  /** Additional compatibility requirements */
  [key: string]: string | undefined;
}

/**
 * Capability declaration
 */
export interface Capabilities {
  /** Capabilities this implementation provides */
  provides: string[];

  /** Capabilities this implementation requires */
  requires?: string[];
}

/**
 * Dependencies specification
 */
export interface Dependencies {
  /** Runtime dependencies */
  runtime?: Dependency[];

  /** Development dependencies */
  dev?: Dependency[];

  /** Peer dependencies */
  peer?: Dependency[];
}

/**
 * Instance factory metadata
 */
export interface InstanceFactoryMetadata {
  /** Author name or organization */
  author?: string;

  /** Repository URL */
  repository?: string;

  /** Homepage URL */
  homepage?: string;

  /** License identifier (MIT, Apache-2.0, etc.) */
  license?: string;

  /** Tags for categorization */
  tags?: string[];

  /** Keywords for search */
  keywords?: string[];

  /** Documentation URL */
  documentation?: string;
}

/**
 * Complete Instance Factory definition
 *
 * An instance factory defines a specific technology stack and
 * how to generate code for that stack from SpecVerse specifications.
 */
export interface InstanceFactory {
  /** Unique name for this instance factory */
  name: string;

  /** Semantic version */
  version: string;

  /** Category for deployment instances */
  category: 'controller' | 'service' | 'view' | 'storage' | 'security' | 'infrastructure' | 'monitoring' | 'communication';

  /** Human-readable description */
  description?: string;

  /** Version compatibility requirements */
  compatibility?: CompatibilityRequirements;

  /** What this implementation provides and requires */
  capabilities: Capabilities;

  /** Technology stack information */
  technology: TechnologyStack;

  /** Package dependencies */
  dependencies?: Dependencies;

  /** Code generation templates */
  codeTemplates: Record<string, CodeTemplate>;

  /** Default configuration */
  configuration?: Record<string, any>;

  /** Parent implementation type to extend from */
  extends?: string;

  /** Additional metadata */
  metadata?: InstanceFactoryMetadata;
}

/**
 * Reference to an instance factory in a manifest
 */
export interface InstanceFactoryReference {
  /** Reference path: "backend/fastify-prisma" or "@org/impl-types/name" */
  ref: string;

  /** Semantic version range */
  version?: string;

  /** Short alias for referencing in mappings */
  alias?: string;

  /** Configuration overrides */
  configuration?: Record<string, any>;

  /** Template overrides */
  templates?: Record<string, string>;
}

/**
 * Capability mapping in a manifest (v3.3 with instanceFactory)
 */
export interface CapabilityMapping {
  /** Capability pattern (e.g., "api.rest" or "storage.database.*") */
  capability: string;

  /** Instance factory reference (alias or full ref) */
  instanceFactory: string;

  /** Version constraint for instance factory */
  version?: string;

  /** Configuration overrides for this mapping */
  configuration?: Record<string, any>;

  /** Namespace for grouping */
  namespace?: string;
}

/**
 * Instance mapping in a manifest (v3.3 - highest priority)
 */
export interface InstanceMapping {
  /** Specific instance name from deployment */
  instanceName: string;

  /** Instance factory reference */
  instanceFactory: string;

  /** Version constraint for instance factory */
  version?: string;

  /** Configuration overrides for this mapping */
  configuration?: Record<string, any>;
}

/**
 * Default mappings by category (v3.3 - lowest priority)
 */
export interface DefaultMappings {
  controller?: string;
  service?: string;
  view?: string;
  storage?: string;
  security?: string;
  infrastructure?: string;
  monitoring?: string;
  communication?: string;
}

/**
 * Deployment reference in manifest (v3.3)
 */
export interface DeploymentReference {
  /** Path to .specly file containing deployment */
  deploymentSource: string;

  /** Name of deployment in the spec */
  deploymentName: string;

  /** Version constraint for deployment */
  deploymentVersion?: string;
}

/**
 * Resolved implementation with context
 */
export interface ResolvedImplementation {
  /** The capability being resolved */
  capability: string;

  /** The resolved instance factory (with overrides applied) */
  instanceFactory: InstanceFactory;

  /** The deployment instance this is for */
  instance?: any; // Will be typed when we integrate with deployment types

  /** Resolved configuration (defaults + manifest overrides + mapping overrides) */
  configuration: Record<string, any>;

  /** Base path for resolving template files (directory containing the instance factory file) */
  basePath?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Error messages if validation failed */
  errors?: string[];

  /** Warning messages */
  warnings?: string[];

  /** Suggested fixes */
  suggestions?: string[];
}

/**
 * Template context for code generation
 */
export interface TemplateContext {
  /** AI-optimized specification */
  spec: any; // Will use AIOptimizedSpec type when imported

  /** Resolved instance factory */
  factory: InstanceFactory;

  /** Current model (if generating for a specific model) */
  model?: any;

  /** Current controller (if generating for a specific controller) */
  controller?: any;

  /** Current service (if generating for a specific service) */
  service?: any;

  /** Deployment instance (if generating for a specific instance) */
  instance?: any;

  /** Additional context properties */
  [key: string]: any;
}

/**
 * Template engine interface
 */
export interface TemplateEngine {
  /**
   * Render a template with the given context
   */
  render(template: CodeTemplate, context: TemplateContext): Promise<string>;
}

/**
 * Library source configuration
 */
export interface LibrarySource {
  /** Source type */
  type: 'local' | 'npm' | 'remote';

  /** Source path or URL */
  path: string;

  /** Priority (higher = checked first) */
  priority?: number;
}

/**
 * Implementation type library configuration
 */
export interface LibraryConfig {
  /** Library sources to search */
  sources: LibrarySource[];

  /** Cache configuration */
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}
