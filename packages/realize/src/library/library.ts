/**
 * Instance Factory Library
 *
 * Manages a collection of instance factories and provides
 * lookup, filtering, and version resolution.
 */

import path from 'path';
import semver from 'semver';
import { fileURLToPath } from 'url';
import { loadInstanceFactories, loadFromMultipleSources, type LoadResult } from './loader.js';
import { InstanceFactoryValidator, type CompatibilityResult } from './validator.js';
import type { InstanceFactory, LibrarySource, LibraryConfig } from '../types/index.js';

/**
 * Query options for finding instance factories
 */
export interface QueryOptions {
  /** Filter by type category */
  category?: InstanceFactory['category'];

  /** Filter by capability (supports wildcards) */
  capability?: string;

  /** Filter by technology stack */
  technology?: {
    runtime?: string;
    language?: string;
    framework?: string;
    orm?: string;
    validation?: string;
  };

  /** Filter by version range */
  version?: string;

  /** Filter by tags */
  tags?: string[];
}

/**
 * Library for managing instance factories
 */
export class InstanceFactoryLibrary {
  private types: Map<string, LoadResult[]> = new Map();
  private validator: InstanceFactoryValidator;
  private sources: LibrarySource[] = [];

  constructor() {
    this.validator = new InstanceFactoryValidator();
  }

  /**
   * Load instance factories from a directory
   */
  async load(baseDir: string, options?: { pattern?: string; validate?: boolean }): Promise<void> {
    const result = await loadInstanceFactories({
      baseDir,
      pattern: options?.pattern,
      validate: options?.validate ?? true,
      ignoreInvalid: false
    });

    // Add to library
    for (const loadResult of result.types) {
      const name = loadResult.type.name;
      const existing = this.types.get(name) || [];
      existing.push(loadResult);
      this.types.set(name, existing);
    }

    // Sort versions (newest first)
    for (const [name, versions] of this.types.entries()) {
      versions.sort((a, b) => semver.rcompare(a.type.version, b.type.version));
    }
  }

  /**
   * Load from multiple sources with priority ordering
   */
  async loadFromSources(sources: LibrarySource[]): Promise<void> {
    // Sort by priority (highest first)
    const sortedSources = [...sources].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const result = await loadFromMultipleSources(
      sortedSources.map(s => ({ path: s.path })),
      { validate: true, ignoreInvalid: false }
    );

    // Add to library
    for (const loadResult of result.types) {
      const name = loadResult.type.name;
      const existing = this.types.get(name) || [];
      existing.push(loadResult);
      this.types.set(name, existing);
    }

    // Sort versions (newest first)
    for (const [name, versions] of this.types.entries()) {
      versions.sort((a, b) => semver.rcompare(a.type.version, b.type.version));
    }

    this.sources = sortedSources;
  }

  /**
   * Load from configuration
   */
  async loadFromConfig(config: LibraryConfig): Promise<void> {
    await this.loadFromSources(config.sources);
  }

  /**
   * Get an instance factory by name and optional version
   */
  get(name: string, versionRange?: string): InstanceFactory | undefined {
    const versions = this.types.get(name);
    if (!versions || versions.length === 0) {
      return undefined;
    }

    // If no version range specified, return latest
    if (!versionRange) {
      return versions[0].type;
    }

    // Find first version that satisfies range
    for (const result of versions) {
      if (semver.satisfies(result.type.version, versionRange)) {
        return result.type;
      }
    }

    return undefined;
  }

  /**
   * Get all versions of an instance factory
   */
  getVersions(name: string): InstanceFactory[] {
    const versions = this.types.get(name);
    return versions ? versions.map(v => v.type) : [];
  }

  /**
   * Check if an instance factory exists
   */
  has(name: string, versionRange?: string): boolean {
    return this.get(name, versionRange) !== undefined;
  }

  /**
   * Find instance factories matching query
   */
  find(query: QueryOptions): InstanceFactory[] {
    const results: InstanceFactory[] = [];

    for (const versions of this.types.values()) {
      for (const result of versions) {
        const factory = result.type;

        // Filter by category
        if (query.category && factory.category !== query.category) {
          continue;
        }

        // Filter by version range
        if (query.version && !semver.satisfies(factory.version, query.version)) {
          continue;
        }

        // Filter by capability
        if (query.capability) {
          const hasCapability = factory.capabilities.provides.some(cap => {
            if (query.capability!.includes('*')) {
              const pattern = query.capability!.replace(/\*/g, '.*');
              return new RegExp(`^${pattern}$`).test(cap);
            }
            return cap === query.capability;
          });

          if (!hasCapability) {
            continue;
          }
        }

        // Filter by technology stack
        if (query.technology) {
          let matches = true;

          if (query.technology.runtime && factory.technology.runtime !== query.technology.runtime) {
            matches = false;
          }

          if (query.technology.language && factory.technology.language !== query.technology.language) {
            matches = false;
          }

          if (query.technology.framework && factory.technology.framework !== query.technology.framework) {
            matches = false;
          }

          if (query.technology.orm && factory.technology.orm !== query.technology.orm) {
            matches = false;
          }

          if (query.technology.validation && factory.technology.validation !== query.technology.validation) {
            matches = false;
          }

          if (!matches) {
            continue;
          }
        }

        // Filter by tags
        if (query.tags && query.tags.length > 0) {
          const factoryTags = factory.metadata?.tags || [];
          const hasAllTags = query.tags.every(tag => factoryTags.includes(tag));

          if (!hasAllTags) {
            continue;
          }
        }

        results.push(factory);
      }
    }

    return results;
  }

  /**
   * Find instance factories by capability
   */
  findByCapability(capability: string): InstanceFactory[] {
    return this.find({ capability });
  }

  /**
   * Find instance factories by category
   */
  findByCategory(category: InstanceFactory['category']): InstanceFactory[] {
    return this.find({ category });
  }

  /**
   * Get all instance factory names
   */
  getNames(): string[] {
    return Array.from(this.types.keys());
  }

  /**
   * Get total number of instance factories (all versions)
   */
  size(): number {
    let count = 0;
    for (const versions of this.types.values()) {
      count += versions.length;
    }
    return count;
  }

  /**
   * Get number of unique instance factories
   */
  uniqueCount(): number {
    return this.types.size;
  }

  /**
   * Validate an instance factory
   */
  validate(
    factory: InstanceFactory,
    options?: {
      specverseVersion?: string;
      nodeVersion?: string;
      availableCapabilities?: string[];
    }
  ): CompatibilityResult {
    return this.validator.validateComplete(factory, options);
  }

  /**
   * Resolve an instance factory reference
   *
   * Supports formats:
   * - "FastifyPrismaAPI" (latest version)
   * - "FastifyPrismaAPI@1.0.0" (specific version)
   * - "FastifyPrismaAPI@^1.0.0" (version range)
   * - "backend/FastifyPrismaAPI" (with path prefix)
   * - "@org/impl-types/FastifyPrismaAPI" (npm package style)
   */
  resolve(ref: string): InstanceFactory | undefined {
    // Parse reference
    let name = ref;
    let versionRange: string | undefined;

    // Handle @version syntax
    const atIndex = ref.lastIndexOf('@');
    if (atIndex > 0) {
      name = ref.substring(0, atIndex);
      versionRange = ref.substring(atIndex + 1);
    }

    // Handle path prefix (extract last component)
    if (name.includes('/')) {
      const parts = name.split('/');
      name = parts[parts.length - 1];
    }

    return this.get(name, versionRange);
  }

  /**
   * Resolve an implementation type by reference and return metadata
   * Returns the LoadResult which includes filePath for template resolution
   */
  resolveWithMetadata(ref: string): LoadResult | undefined {
    // Parse reference
    let name = ref;
    let versionRange: string | undefined;

    // Handle @version syntax
    const atIndex = ref.lastIndexOf('@');
    if (atIndex > 0) {
      name = ref.substring(0, atIndex);
      versionRange = ref.substring(atIndex + 1);
    }

    // Handle path prefix (extract last component)
    if (name.includes('/')) {
      const parts = name.split('/');
      name = parts[parts.length - 1];
    }

    // Get all versions for this name
    const versions = this.types.get(name);
    if (!versions || versions.length === 0) {
      return undefined;
    }

    // If no version specified, return latest
    if (!versionRange) {
      return versions[0];
    }

    // Find matching version
    for (const result of versions) {
      if (semver.satisfies(result.type.version, versionRange)) {
        return result;
      }
    }

    return undefined;
  }

  /**
   * Clear all loaded implementation types
   */
  clear(): void {
    this.types.clear();
    this.sources = [];
  }

  /**
   * Get statistics about the library
   */
  getStats(): {
    uniqueTypes: number;
    totalVersions: number;
    byType: Record<string, number>;
    byCapability: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byCapability: Record<string, number> = {};

    for (const versions of this.types.values()) {
      for (const result of versions) {
        const factory = result.type;

        // Count by category
        byType[factory.category] = (byType[factory.category] || 0) + 1;

        // Count by capability
        for (const capability of factory.capabilities.provides) {
          byCapability[capability] = (byCapability[capability] || 0) + 1;
        }
      }
    }

    return {
      uniqueTypes: this.uniqueCount(),
      totalVersions: this.size(),
      byType,
      byCapability
    };
  }
}

/**
 * Create a library with default configuration
 */
export async function createDefaultLibrary(projectRoot?: string): Promise<InstanceFactoryLibrary> {
  const library = new InstanceFactoryLibrary();

  // Load from default locations
  const sources: LibrarySource[] = [];

  // Project-local library (highest priority)
  if (projectRoot) {
    sources.push({
      type: 'local',
      path: path.join(projectRoot, 'libs/instance-factories'),
      priority: 100
    });
  }

  // Global SpecVerse library (lower priority)
  // Try to find the @specverse/lang package installation
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // From dist/library/library.js, go up to the package root
  const packageRoot = path.resolve(__dirname, '../..');
  const globalLibPath = path.join(packageRoot, 'libs/instance-factories');

  sources.push({
    type: 'local',
    path: globalLibPath,
    priority: 50
  });

  // Load from sources
  if (sources.length > 0) {
    try {
      await library.loadFromSources(sources);
    } catch (error) {
      // Ignore if directories don't exist yet
      if (error instanceof Error && !error.message.includes('ENOENT')) {
        throw error;
      }
    }
  }

  return library;
}
