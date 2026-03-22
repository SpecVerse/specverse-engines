/**
 * Unified Two-Level Mapping System (v3.6+)
 *
 * Simplifies factory mappings with a clear two-level system:
 * - Level 1: defaults (sugar syntax for common cases)
 * - Level 2: overrides (explicit with optional configuration)
 *
 * @module realize/types/unified-mappings
 * @version 3.6.0
 */

/**
 * Default Mappings (Level 1)
 *
 * Simple category → factory alias mappings.
 * Uses sugar syntax for convenience.
 *
 * @example
 * ```yaml
 * defaults:
 *   orm: "prisma"      # All storage.database → PrismaPostgres
 *   api: "fastify"     # All api.rest → FastifyRoutes
 *   cache: "redis"     # All storage.cache → RedisCache
 * ```
 */
export interface DefaultMappingsV2 {
  /** ORM/Database factory (maps to storage.database.*) */
  orm?: string;

  /** API framework factory (maps to api.rest.*) */
  api?: string;

  /** Cache factory (maps to storage.cache.*) */
  cache?: string;

  /** Queue/Message broker factory (maps to messaging.queue.*) */
  queue?: string;

  /** Authentication factory (maps to security.authentication.*) */
  auth?: string;

  /** Email service factory (maps to communication.email.*) */
  email?: string;

  /** File storage factory (maps to storage.files.*) */
  storage?: string;

  /** Search engine factory (maps to storage.search.*) */
  search?: string;

  /** Logging factory (maps to observability.logging.*) */
  logging?: string;

  /** Monitoring factory (maps to observability.monitoring.*) */
  monitoring?: string;

  /** Additional custom categories */
  [category: string]: string | undefined;
}

/**
 * Override Mapping (Level 2)
 *
 * Explicit mapping with optional instance-specific configuration.
 * Can target either:
 * - A capability pattern (e.g., "storage.database.postgres")
 * - An instance name (e.g., "primary-db" from deployment)
 *
 * @example
 * ```yaml
 * overrides:
 *   # Capability override
 *   - target: "storage.database.postgres"
 *     factory: "PrismaPostgres"
 *
 *   # Instance override with config
 *   - target: "primary-db"
 *     factory: "PrismaPostgres"
 *     configuration:
 *       url: "${DATABASE_URL}"
 *       poolSize: 20
 * ```
 */
export interface OverrideMapping {
  /**
   * Target to override
   *
   * Can be:
   * - Capability pattern: "storage.database", "api.rest.crud"
   * - Instance name: "primary-db", "cache-cluster"
   */
  target: string;

  /**
   * Factory name to use
   *
   * Must match a factory declared in instanceFactories section.
   */
  factory: string;

  /**
   * Instance-specific configuration (optional)
   *
   * Only applies when target is an instance name.
   */
  configuration?: Record<string, any>;

  /**
   * Version constraint (optional)
   *
   * Overrides the version from instanceFactories declaration.
   */
  version?: string;

  /**
   * Namespace for grouping (optional)
   */
  namespace?: string;
}

/**
 * Target type discrimination
 */
export type TargetType = 'capability' | 'instance';

/**
 * Resolved override with type information
 */
export interface ResolvedOverride extends OverrideMapping {
  /** Whether target is a capability or instance name */
  targetType: TargetType;

  /** Original target before resolution */
  originalTarget: string;
}

/**
 * Helper functions
 */

/**
 * Determine if a target is a capability pattern
 *
 * Capability patterns contain dots (e.g., "storage.database")
 * Instance names typically don't (e.g., "primary-db")
 *
 * @param target - Target string to check
 * @returns True if target looks like a capability
 */
export function isCapabilityTarget(target: string): boolean {
  // Capability patterns have dots and match capability naming convention
  // storage.database, api.rest.crud, security.authentication
  return /^[a-z]+\.[a-z]+(\.[a-z]+)*$/.test(target);
}

/**
 * Determine if a target is an instance name
 *
 * @param target - Target string to check
 * @returns True if target looks like an instance name
 */
export function isInstanceTarget(target: string): boolean {
  return !isCapabilityTarget(target);
}

/**
 * Resolve target type for an override
 *
 * @param override - Override mapping to analyze
 * @returns Resolved override with type information
 */
export function resolveOverrideType(override: OverrideMapping): ResolvedOverride {
  const targetType: TargetType = isCapabilityTarget(override.target)
    ? 'capability'
    : 'instance';

  return {
    ...override,
    targetType,
    originalTarget: override.target
  };
}

/**
 * Expand defaults to capability mappings
 *
 * Converts sugar syntax to explicit capability patterns.
 *
 * @param defaults - Default mappings
 * @returns Map of capability patterns to factory aliases
 */
export function expandDefaults(defaults: DefaultMappingsV2): Map<string, string> {
  const expanded = new Map<string, string>();

  // Predefined category → capability mappings
  const categoryMappings: Record<string, string[]> = {
    orm: ['storage.database'],
    api: ['api.rest', 'api.rest.crud'],
    cache: ['storage.cache'],
    queue: ['messaging.queue'],
    auth: ['security.authentication', 'security.authorization'],
    email: ['communication.email'],
    storage: ['storage.files', 'storage.objects'],
    search: ['storage.search'],
    logging: ['observability.logging'],
    monitoring: ['observability.monitoring', 'observability.metrics']
  };

  for (const [category, factoryAlias] of Object.entries(defaults)) {
    if (!factoryAlias) continue;

    const capabilities = categoryMappings[category] || [category];

    for (const capability of capabilities) {
      expanded.set(capability, factoryAlias);
    }
  }

  return expanded;
}

/**
 * Validate override references
 *
 * Checks that overrides reference declared factories.
 *
 * @param overrides - Override mappings to validate
 * @param declaredFactories - Set of declared factory names
 * @returns Validation errors (empty if valid)
 */
export function validateOverrides(
  overrides: OverrideMapping[],
  declaredFactories: Set<string>
): string[] {
  const errors: string[] = [];

  for (const override of overrides) {
    if (!declaredFactories.has(override.factory)) {
      errors.push(
        `Override references undeclared factory: "${override.factory}" for target "${override.target}". ` +
        `Add it to instanceFactories section.`
      );
    }

    // Warn if configuration is used with capability target
    if (override.configuration && isCapabilityTarget(override.target)) {
      errors.push(
        `Override for capability "${override.target}" has configuration, but capabilities don't support instance config. ` +
        `Use an instance name as target instead.`
      );
    }
  }

  return errors;
}
