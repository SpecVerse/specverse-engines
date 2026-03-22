/**
 * Type definitions for Import Resolver
 */

export interface ImportSpec {
  // One of these will be present
  file?: string;           // Local file path
  from?: string;           // NPM package or URL
  package?: string;        // Explicit NPM package
  namespace?: string;      // Future: custom namespace
  
  // Optional version for packages
  version?: string;
  
  // What to import
  select?: string[];       // Specific types to import
  as?: Record<string, string>; // Type aliases
}

export interface ResolvedImport {
  // Content
  content: string;
  contentType: 'yaml' | 'json';
  
  // Source information
  source: 'file' | 'npm' | 'url' | 'cache' | 'specverse-lib' | 'specverse-registry';
  path?: string;           // File path if local
  url?: string;            // URL if remote
  packageName?: string;    // NPM package name
  version?: string;        // Package version
  libraryName?: string;    // SpecVerse library name
  
  // Cache metadata
  cached?: boolean;
  cacheExpires?: number;
  
  // Parsed content (optional, populated later)
  parsed?: any;
}

export interface ImportResolverOptions {
  // Base path for relative file resolution
  basePath?: string;

  // Cache settings
  cacheDir?: string;
  cacheTTL?: number;       // Default TTL in ms
  offline?: boolean;       // Only use cache, don't fetch

  // NPM settings
  npmRegistry?: string;    // Default: https://registry.npmjs.org

  // SpecVerse Registry settings
  specverseRegistry?: string; // Default: https://specverse-lang-registry-api.vercel.app
  registryFallback?: boolean; // Default: true - fallback to local files if registry fails

  // HTTP settings
  timeout?: number;        // Request timeout in ms
  headers?: Record<string, string>; // Custom headers for URL fetching

  // Debug
  debug?: boolean;
}

export interface CacheOptions {
  ttl?: number;            // Time to live in ms
  etag?: string;           // ETag for conditional requests
  force?: boolean;         // Force cache update
}

export interface CachedItem {
  content: string;
  meta: CacheMetadata;
}

export interface CacheMetadata {
  url: string;
  cached: number;          // Timestamp when cached
  expires: number;         // Timestamp when expires
  etag?: string;           // ETag from server
  contentType?: string;
  size: number;            // Content size in bytes
}