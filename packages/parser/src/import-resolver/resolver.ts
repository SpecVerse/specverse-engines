/**
 * Import Resolver for SpecVerse v3.1
 * 
 * Resolves imports from:
 * 1. Local files (relative or absolute paths)
 * 2. NPM packages (using Node.js resolution)
 * 3. URLs (with local caching)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalCache } from './cache.js';
import {
  ImportSpec,
  ResolvedImport,
  ImportResolverOptions,
  CacheOptions
} from './types.js';

export class ImportResolver {
  private cache: LocalCache;
  private options: ImportResolverOptions;
  private debug: boolean;

  constructor(options?: ImportResolverOptions) {
    this.options = {
      basePath: process.cwd(),
      cacheDir: options?.cacheDir,
      cacheTTL: options?.cacheTTL || 24 * 60 * 60 * 1000, // 24 hours
      offline: options?.offline || false,
      npmRegistry: options?.npmRegistry || 'https://registry.npmjs.org',
      specverseRegistry: options?.specverseRegistry ||
                        process.env.SPECVERSE_REGISTRY ||
                        'https://specverse-lang-registry-api.vercel.app',
      registryFallback: options?.registryFallback !== false, // Default true
      timeout: options?.timeout || 30000, // 30 seconds
      headers: options?.headers || {},
      debug: options?.debug || false,
      ...options
    };

    this.cache = new LocalCache(this.options.cacheDir, this.options.cacheTTL);
    this.debug = this.options.debug || false;
  }

  /**
   * Resolve an import specification
   */
  async resolve(importSpec: ImportSpec, basePath?: string): Promise<ResolvedImport> {
    const resolveBasePath = basePath || this.options.basePath || process.cwd();

    if (this.debug) {
      console.log('[ImportResolver] Resolving:', importSpec, 'from', resolveBasePath);
    }

    // 1. Local file resolution
    if (importSpec.file) {
      return this.resolveFile(importSpec.file, resolveBasePath);
    }

    // 2. Check if it's a URL
    if (importSpec.from && this.isUrl(importSpec.from)) {
      return this.resolveUrl(importSpec.from);
    }

    // 3. For SpecVerse libraries, try local files first, then registry as fallback
    if (importSpec.from && importSpec.from.startsWith('@specverse/')) {
      try {
        return await this.resolveSpecVerseLibrary(importSpec.from);
      } catch (localError) {
        if (this.debug) {
          console.log('[ImportResolver] Local SpecVerse library resolution failed, trying registry:', (localError as Error).message || 'Unknown error');
        }
        // Fall through to registry resolution
        try {
          return await this.resolveFromRegistry(importSpec.from);
        } catch (registryError) {
          if (this.debug) {
            console.log('[ImportResolver] Registry resolution also failed:', (registryError as Error).message || 'Unknown error');
          }
          // Fall through to NPM resolution
        }
      }
    }

    // 4. Try SpecVerse registry for other non-local imports
    if (importSpec.from && !importSpec.from.startsWith('./') && !importSpec.from.startsWith('../') && !importSpec.from.startsWith('@specverse/')) {
      try {
        return await this.resolveFromRegistry(importSpec.from);
      } catch (registryError) {
        if (this.debug) {
          console.log('[ImportResolver] Registry resolution failed, trying NPM:', (registryError as Error).message || 'Unknown error');
        }
        // Fall through to NPM resolution
      }
    }

    // 5. NPM package resolution
    if (importSpec.package || (importSpec.from && this.isNpmPackage(importSpec.from))) {
      return this.resolveNpmPackage(importSpec);
    }

    // 6. Try as relative file (backward compatibility)
    if (importSpec.from && (importSpec.from.startsWith('./') || importSpec.from.startsWith('../'))) {
      return this.resolveFile(importSpec.from, resolveBasePath);
    }

    throw new Error(`Cannot resolve import: ${JSON.stringify(importSpec)}`);
  }

  /**
   * Resolve a local file
   */
  private async resolveFile(filePath: string, basePath: string): Promise<ResolvedImport> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(basePath, filePath);

    if (this.debug) {
      console.log('[ImportResolver] Resolving file:', absolutePath);
    }

    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      const contentType = this.detectContentType(absolutePath, content);

      return {
        content,
        contentType,
        source: 'file',
        path: absolutePath
      };
    } catch (error: any) {
      throw new Error(`Failed to read file '${filePath}': ${error.message}`);
    }
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }


  /**
   * Resolve a SpecVerse built-in library
   */
  private async resolveSpecVerseLibrary(libraryName: string): Promise<ResolvedImport> {
    if (this.debug) {
      console.log('[ImportResolver] Resolving SpecVerse library:', libraryName);
    }

    // Try local files first, then fall back to registry
    try {
      return await this.resolveLocalSpecVerseLibrary(libraryName);
    } catch (localError: any) {
      if (this.debug) {
        console.log(`[ImportResolver] Local library resolution failed: ${localError.message}`);
      }

      // Fall back to registry if enabled
      if (this.options.specverseRegistry && this.options.registryFallback !== false) {
        try {
          return await this.resolveFromRegistry(libraryName);
        } catch (registryError: any) {
          if (this.debug) {
            console.log(`[ImportResolver] Registry resolution also failed: ${registryError.message}`);
          }
          throw new Error(`Failed to resolve SpecVerse library '${libraryName}': local resolution failed (${localError.message}), registry resolution failed (${registryError.message})`);
        }
      } else {
        throw localError;
      }
    }
  }

  /**
   * Resolve a SpecVerse library from local files
   */
  private async resolveLocalSpecVerseLibrary(libraryName: string): Promise<ResolvedImport> {
    if (this.debug) {
      console.log('[ImportResolver] Resolving local SpecVerse library:', libraryName);
    }

    // Map SpecVerse library names to local files
    const libraryMap: { [key: string]: string } = {
      '@specverse/primitives': 'libs/components/primitives/lib/index.yaml',
      '@specverse/business': 'libs/components/business/lib/index.yaml',
      '@specverse/system': 'libs/components/system/lib/index.yaml',
      '@specverse/deployments/monolith': 'libs/deployments/monolith/lib/index.yaml',
      '@specverse/deployments/microservices': 'libs/deployments/microservices/lib/index.yaml',
      '@specverse/deployments/enterprise': 'libs/deployments/enterprise/lib/index.yaml',
      '@specverse/deployments/jamstack': 'libs/deployments/jamstack/lib/index.yaml',
      '@specverse/components/ecommerce': 'libs/components/ecommerce/lib/index.yaml',
      '@specverse/components/healthcare': 'libs/components/healthcare/lib/index.yaml',
      '@specverse/components/business': 'libs/components/business/lib/index.yaml',
      '@specverse/components/system': 'libs/components/system/lib/index.yaml',
      '@specverse/manifests/nextjs': 'libs/manifests/nextjs/lib/index.yaml',
      '@specverse/manifests/postgresql': 'libs/manifests/postgresql/lib/index.yaml',
      '@specverse/manifests/sqlite': 'libs/manifests/sqlite/lib/index.yaml',
      '@specverse/manifests/oauth': 'libs/manifests/oauth/lib/index.yaml',
    };

    const libraryPath = libraryMap[libraryName];
    if (!libraryPath) {
      throw new Error(`Unknown SpecVerse library: ${libraryName}`);
    }

    // Normalize path separators for Windows compatibility
    const normalizedLibraryPath = libraryPath.replace(/\//g, path.sep);

    // Try these paths in order:
    // 1. node_modules/@specverse/lang/libs/... (for npm installed package)  
    // 2. ./libs/... (for local development)
    // 3. ../libs/... (if running from subdirectory)
    // 4. ../../libs/... (if running from deeper subdirectory)
    const basePath = this.options.basePath || process.cwd();
    const possiblePaths = [
      path.resolve(basePath, 'node_modules', '@specverse', 'lang', normalizedLibraryPath),
      path.resolve(basePath, normalizedLibraryPath),
      path.resolve(basePath, '..', normalizedLibraryPath),
      path.resolve(basePath, '..', '..', normalizedLibraryPath),
      // Try from dist directory structure (dist/parser/import-resolver -> libs/)
      path.resolve(basePath, 'dist', '..', normalizedLibraryPath)
    ];
    
    if (this.debug) {
      console.log('[ImportResolver] Base path:', this.options.basePath || process.cwd());
      console.log('[ImportResolver] Original library path:', libraryPath);
      console.log('[ImportResolver] Normalized library path:', normalizedLibraryPath);
      console.log('[ImportResolver] Platform:', process.platform);
      console.log('[ImportResolver] Path separator:', path.sep);
    }
    
    let absolutePath: string | null = null;
    for (const testPath of possiblePaths) {
      if (this.debug) {
        console.log('[ImportResolver] Trying path:', testPath);
      }
      
      const exists = await this.fileExists(testPath);
      if (this.debug) {
        console.log(`[ImportResolver] Path exists check for ${testPath}: ${exists}`);
      }
      
      if (exists) {
        absolutePath = testPath;
        if (this.debug) {
          console.log('[ImportResolver] Found library at:', absolutePath);
        }
        break;
      } else if (this.debug) {
        console.log('[ImportResolver] Path not found:', testPath);
        // Try to list directory contents to understand what's available
        try {
          const parentDir = path.dirname(testPath);
          const parentExists = await this.fileExists(parentDir);
          console.log(`[ImportResolver] Parent directory ${parentDir} exists: ${parentExists}`);
          if (parentExists) {
            const fs = await import('fs/promises');
            const contents = await fs.readdir(parentDir);
            console.log(`[ImportResolver] Parent directory contents:`, contents);
          }
        } catch (error: any) {
          console.log(`[ImportResolver] Could not inspect parent directory:`, error.message);
        }
      }
    }
    
    if (!absolutePath) {
      // Enhanced error message for debugging Windows CI issues
      const errorDetails = [
        `Failed to find SpecVerse library '${libraryName}'`,
        `Expected at: ${libraryPath}`,
        `Platform: ${process.platform}`,
        `Working directory: ${this.options.basePath || process.cwd()}`,
        `Searched paths:`,
        ...possiblePaths.map(p => `  - ${p}`)
      ].join('\n');
      throw new Error(errorDetails);
    }
    
    if (this.debug) {
      console.log('[ImportResolver] Resolving SpecVerse library to:', absolutePath);
    }

    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      const contentType = this.detectContentType(absolutePath, content);

      return {
        content,
        contentType,
        source: 'specverse-lib',
        path: absolutePath,
        libraryName
      };
    } catch (error: any) {
      throw new Error(`Failed to read SpecVerse library '${libraryName}': ${error.message}`);
    }
  }

  /**
   * Resolve an NPM package
   */
  private async resolveNpmPackage(importSpec: ImportSpec): Promise<ResolvedImport> {
    const packageName = importSpec.package || importSpec.from;
    if (!packageName) {
      throw new Error('Package name is required');
    }

    if (this.debug) {
      console.log('[ImportResolver] Resolving NPM package:', packageName);
    }

    try {
      // Use createRequire for ES modules compatibility
      const { createRequire } = await import('module');
      const require = createRequire(`file://${process.cwd()}/package.json`);
      const resolved = require.resolve(packageName, {
        paths: [this.options.basePath || process.cwd()]
      });

      // Find package root
      const packageRoot = await this.findPackageRoot(resolved);
      
      // Find SpecVerse entry point
      const specverseMain = await this.findSpecverseMain(packageRoot, packageName);

      // Read the content
      const content = await fs.readFile(specverseMain, 'utf8');
      const contentType = this.detectContentType(specverseMain, content);

      // Get package version
      const packageJsonPath = path.join(packageRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      return {
        content,
        contentType,
        source: 'npm',
        path: specverseMain,
        packageName,
        version: packageJson.version
      };
    } catch (error: any) {
      // If offline mode and package not found, check cache
      if (this.options.offline) {
        const cacheKey = `npm:${packageName}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return {
            content: cached.content,
            contentType: cached.meta.contentType as 'yaml' | 'json',
            source: 'cache',
            packageName,
            cached: true
          };
        }
      }

      throw new Error(`Failed to resolve NPM package '${packageName}': ${error.message}`);
    }
  }

  /**
   * Resolve a URL
   */
  private async resolveUrl(url: string): Promise<ResolvedImport> {
    if (this.debug) {
      console.log('[ImportResolver] Resolving URL:', url);
    }

    // Check cache first
    const cached = await this.cache.get(url);
    if (cached) {
      if (this.debug) {
        console.log('[ImportResolver] Using cached content for:', url);
      }
      return {
        content: cached.content,
        contentType: cached.meta.contentType as 'yaml' | 'json',
        source: 'cache',
        url,
        cached: true,
        cacheExpires: cached.meta.expires
      };
    }

    // If offline mode, throw error
    if (this.options.offline) {
      throw new Error(`Offline mode: Cannot fetch URL '${url}'`);
    }

    try {
      // Fetch the URL
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeout!);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SpecVerse-ImportResolver/3.1.0',
          'Accept': 'application/yaml, application/json, text/yaml, text/plain',
          ...this.options.headers
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      const contentType = this.detectContentType(url, content);

      // Cache the content
      const cacheOptions: CacheOptions = {
        ttl: this.options.cacheTTL,
        etag: response.headers.get('etag') || undefined
      };
      await this.cache.put(url, content, cacheOptions);

      return {
        content,
        contentType,
        source: 'url',
        url
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout fetching URL '${url}'`);
      }
      throw new Error(`Failed to fetch URL '${url}': ${error.message}`);
    }
  }

  /**
   * Find package root directory
   */
  private async findPackageRoot(resolvedPath: string): Promise<string> {
    let currentDir = path.dirname(resolvedPath);
    
    while (currentDir !== path.dirname(currentDir)) {
      try {
        await fs.access(path.join(currentDir, 'package.json'));
        return currentDir;
      } catch {
        currentDir = path.dirname(currentDir);
      }
    }
    
    throw new Error(`Could not find package root for ${resolvedPath}`);
  }

  /**
   * Find SpecVerse main file in package
   */
  private async findSpecverseMain(packageRoot: string, packageName: string): Promise<string> {
    const packageJsonPath = path.join(packageRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    // Check for specverse field in package.json
    if (packageJson.specverse) {
      if (typeof packageJson.specverse === 'string') {
        return path.join(packageRoot, packageJson.specverse);
      }
      if (packageJson.specverse.main) {
        return path.join(packageRoot, packageJson.specverse.main);
      }
    }

    // Check common locations
    const candidates = [
      'index.yaml',
      'index.yml',
      'index.specly',
      'specverse.yaml',
      'specverse.yml',
      'specs/index.yaml',
      'specs/main.specly'
    ];

    for (const candidate of candidates) {
      const candidatePath = path.join(packageRoot, candidate);
      try {
        await fs.access(candidatePath);
        return candidatePath;
      } catch {
        // Continue to next candidate
      }
    }

    throw new Error(`Could not find SpecVerse entry point in package '${packageName}'`);
  }

  /**
   * Resolve from SpecVerse Registry
   */
  private async resolveFromRegistry(libraryName: string): Promise<ResolvedImport> {
    if (this.debug) {
      console.log('[ImportResolver] Resolving from registry:', libraryName);
    }

    // Convert @specverse/library format to registry library name
    const registryLibraryName = this.convertToRegistryName(libraryName);

    // Try multiple version strategies
    const versionStrategies = ['3.1.0', '3.0.0', 'latest'];
    let registryUrl: string | null = null;
    let result: any = null;

    for (const version of versionStrategies) {
      registryUrl = `${this.options.specverseRegistry}/api/libraries/${encodeURIComponent(registryLibraryName)}/versions/${version}/content`;

      if (this.debug) {
        console.log(`[ImportResolver] Trying registry URL: ${registryUrl}`);
      }

      try {
        // Use special registry resolution instead of generic URL resolution
        const registryResult = await this.resolveRegistryContent(registryUrl);
        if (registryResult) {
          if (this.debug) {
            console.log(`[ImportResolver] Successfully resolved with version: ${version}`);
          }
          result = registryResult;
          break;
        }
      } catch (error: any) {
        if (this.debug) {
          console.log(`[ImportResolver] Version ${version} failed: ${error.message}`);
        }
        continue;
      }
    }

    if (!result) {
      throw new Error(`Failed to resolve library '${libraryName}' from registry: no version found`);
    }

    return {
      ...result,
      source: 'specverse-registry',
      libraryName,
      url: registryUrl
    };
  }

  /**
   * Resolve content from registry URL (handles JSON wrapper)
   */
  private async resolveRegistryContent(registryUrl: string): Promise<ResolvedImport | null> {
    if (this.debug) {
      console.log('[ImportResolver] Resolving registry content:', registryUrl);
    }

    // Check cache first
    const cached = await this.cache.get(registryUrl);
    if (cached) {
      if (this.debug) {
        console.log('[ImportResolver] Using cached registry content for:', registryUrl);
      }
      return {
        content: cached.content,
        contentType: cached.meta.contentType as 'yaml' | 'json',
        source: 'cache',
        url: registryUrl,
        cached: true,
        cacheExpires: cached.meta.expires
      };
    }

    // If offline mode, throw error
    if (this.options.offline) {
      throw new Error(`Offline mode: Cannot fetch registry URL '${registryUrl}'`);
    }

    try {
      // Fetch the registry URL
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeout!);

      const response = await fetch(registryUrl, {
        signal: controller.signal,
        headers: this.options.headers
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse the JSON response from registry
      const registryResponse = await response.json() as any;

      // Extract the actual SpecVerse content from the JSON wrapper
      if (!registryResponse.content) {
        throw new Error('Registry response missing content field');
      }

      const content = registryResponse.content as string;
      const contentType = this.detectContentType('', content);

      if (this.debug) {
        console.log('[ImportResolver] Registry content sample:', content.substring(0, 200) + '...');
        console.log('[ImportResolver] Content type:', contentType);
      }

      // Cache the extracted content (not the JSON wrapper)
      const cacheOptions: CacheOptions = {
        ttl: this.options.cacheTTL,
        etag: response.headers.get('etag') || undefined
      };
      await this.cache.put(registryUrl, content, cacheOptions);

      if (this.debug) {
        console.log('[ImportResolver] Cached and returning extracted content');
      }

      return {
        content,
        contentType,
        source: 'specverse-registry',
        url: registryUrl
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout fetching registry URL '${registryUrl}'`);
      }
      throw new Error(`Failed to fetch registry URL '${registryUrl}': ${error.message}`);
    }
  }

  /**
   * Convert @specverse/library names to registry library names
   */
  private convertToRegistryName(libraryName: string): string {
    // Map common @specverse/* names to registry names
    const libraryNameMap: { [key: string]: string } = {
      '@specverse/primitives': 'domains-primitives-address-yaml-addresslibrary',
      '@specverse/business': 'domains-business-employee-yaml-employeelibrary',
      '@specverse/system': 'domains-system-configuration-yaml-configurationlibrary',
      '@specverse/healthcare': 'domains-healthcare-patient-yaml-patientlibrary',
      '@specverse/ecommerce': 'domains-ecommerce-order-yaml-orderlibrary',
    };

    // Try direct mapping first
    if (libraryNameMap[libraryName]) {
      return libraryNameMap[libraryName];
    }

    // Convert @specverse/category/name to registry format
    const match = libraryName.match(/^@specverse\/([^/]+)(?:\/(.+))?$/);
    if (match) {
      const [, category, subcategory] = match;
      if (subcategory) {
        // @specverse/healthcare/patient -> domains-healthcare-patient-yaml-patientlibrary
        return `domains-${category}-${subcategory}-yaml-${subcategory}library`;
      } else {
        // @specverse/primitives -> try to find a representative library
        return libraryNameMap[libraryName] || `domains-${category}-library`;
      }
    }

    // Fallback - use as-is (might work for exact registry names)
    return libraryName.replace('@specverse/', '');
  }

  /**
   * Check if string is a URL
   */
  private isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
  }

  /**
   * Check if string looks like an NPM package
   */
  private isNpmPackage(str: string): boolean {
    // Scoped packages
    if (str.startsWith('@') && str.includes('/')) {
      return true;
    }
    
    // Regular packages (not relative paths)
    if (!str.startsWith('.') && !str.startsWith('/') && !this.isUrl(str)) {
      return true;
    }

    return false;
  }

  /**
   * Detect content type from path or content
   */
  private detectContentType(pathOrUrl: string, content: string): 'yaml' | 'json' {
    // Check file extension
    if (pathOrUrl.endsWith('.json')) return 'json';
    if (pathOrUrl.endsWith('.yaml') || pathOrUrl.endsWith('.yml') || pathOrUrl.endsWith('.specly')) return 'yaml';

    // Try to detect from content
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }

    // Default to YAML
    return 'yaml';
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.stats();
  }

  /**
   * List cached URLs
   */
  async listCached() {
    return this.cache.list();
  }

  /**
   * Get the cache directory path
   */
  getCacheDir(): string {
    return this.cache.getCacheDir();
  }
}