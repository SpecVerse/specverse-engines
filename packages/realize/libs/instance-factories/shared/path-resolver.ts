/**
 * Path Resolver Utility for Instance Factories
 *
 * Provides consistent path resolution based on output structure configuration.
 * Supports both standalone and monorepo project structures.
 */

export type OutputStructure = 'standalone' | 'monorepo';

export interface PathResolverConfig {
  outputStructure?: OutputStructure;
  backendDir?: string;
  frontendDir?: string;
  baseDir?: string;
  apiBaseUrl?: string;
}

/**
 * Resolves output path based on structure and target
 */
export function resolvePath(
  relativePath: string,
  target: 'backend' | 'frontend' | 'shared',
  config: PathResolverConfig = {}
): string {
  const {
    outputStructure = 'monorepo',
    backendDir = 'backend',
    frontendDir = 'frontend',
    baseDir = '.'
  } = config;

  // For standalone structure, return path as-is
  if (outputStructure === 'standalone') {
    return baseDir === '.' ? relativePath : `${baseDir}/${relativePath}`;
  }

  // For monorepo structure, prefix with appropriate directory
  const prefix = target === 'backend' ? backendDir : target === 'frontend' ? frontendDir : 'shared';
  return `${prefix}/${relativePath}`;
}

/**
 * Resolves import path for cross-component imports
 */
export function resolveImportPath(
  from: 'backend' | 'frontend',
  to: 'backend' | 'frontend' | 'shared',
  importPath: string,
  config: PathResolverConfig = {}
): string {
  const { outputStructure = 'monorepo' } = config;

  // In standalone mode, imports should be external (via API or npm package)
  if (outputStructure === 'standalone') {
    if (from === 'frontend' && to === 'backend') {
      // Frontend importing from backend - should use API calls, not direct imports
      throw new Error('Frontend cannot directly import from backend in standalone mode. Use API calls.');
    }
    return importPath;
  }

  // In monorepo mode, adjust relative paths based on location
  if (from === to) {
    return importPath; // Same workspace, path unchanged
  }

  // Cross-workspace import in monorepo
  if (from === 'frontend' && to === 'shared') {
    return `../../shared/${importPath}`;
  }
  if (from === 'backend' && to === 'shared') {
    return `../../shared/${importPath}`;
  }

  return importPath;
}

/**
 * Gets API base URL configuration
 */
export function getApiBaseUrl(config: PathResolverConfig & { apiBaseUrl?: string }): string {
  const { outputStructure = 'monorepo', apiBaseUrl } = config;

  // Use configured URL if provided
  if (apiBaseUrl) {
    return apiBaseUrl;
  }

  // Default based on structure
  if (outputStructure === 'standalone') {
    // In standalone mode, expect external API
    return '${VITE_API_BASE_URL}'; // Environment variable placeholder
  }

  // In monorepo mode, default to local backend
  return 'http://localhost:3000';
}

/**
 * Helper to get configuration from template context
 */
export function getPathConfig(context: any): PathResolverConfig {
  return {
    outputStructure: context.configuration?.outputStructure || 'monorepo',
    backendDir: context.configuration?.backendDir || 'backend',
    frontendDir: context.configuration?.frontendDir || 'frontend',
    baseDir: context.configuration?.baseDir || '.',
    apiBaseUrl: context.configuration?.apiBaseUrl
  };
}
