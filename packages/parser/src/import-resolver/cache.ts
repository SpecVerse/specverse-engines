/**
 * Local cache for URL imports
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { CachedItem, CacheMetadata, CacheOptions } from './types.js';

export class LocalCache {
  private cacheDir: string;
  private defaultTTL: number;

  constructor(cacheDir?: string, defaultTTL?: number) {
    this.cacheDir = cacheDir || path.join(os.homedir(), '.specverse', 'cache');
    this.defaultTTL = defaultTTL || 24 * 60 * 60 * 1000; // 24 hours default
  }

  /**
   * Get cached content for a URL
   */
  async get(url: string): Promise<CachedItem | null> {
    const hash = this.hashUrl(url);
    const cachePath = path.join(this.cacheDir, hash);
    const metaPath = `${cachePath}.meta`;

    try {
      // Check if cache files exist
      await fs.access(cachePath);
      await fs.access(metaPath);

      // Read metadata
      const metaContent = await fs.readFile(metaPath, 'utf8');
      const meta: CacheMetadata = JSON.parse(metaContent);

      // Check if expired
      if (Date.now() > meta.expires) {
        await this.remove(url);
        return null;
      }

      // Read content
      const content = await fs.readFile(cachePath, 'utf8');

      return {
        content,
        meta
      };
    } catch (error) {
      // Cache miss or error reading cache
      return null;
    }
  }

  /**
   * Store content in cache
   */
  async put(url: string, content: string, options?: CacheOptions): Promise<void> {
    // Ensure cache directory exists
    await fs.mkdir(this.cacheDir, { recursive: true });

    const hash = this.hashUrl(url);
    const cachePath = path.join(this.cacheDir, hash);
    const metaPath = `${cachePath}.meta`;

    const ttl = options?.ttl || this.defaultTTL;
    const now = Date.now();

    const meta: CacheMetadata = {
      url,
      cached: now,
      expires: now + ttl,
      etag: options?.etag,
      contentType: this.detectContentType(url, content),
      size: Buffer.byteLength(content, 'utf8')
    };

    // Write content and metadata
    await fs.writeFile(cachePath, content, 'utf8');
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  }

  /**
   * Remove cached content
   */
  async remove(url: string): Promise<void> {
    const hash = this.hashUrl(url);
    const cachePath = path.join(this.cacheDir, hash);
    const metaPath = `${cachePath}.meta`;

    try {
      await fs.unlink(cachePath);
      await fs.unlink(metaPath);
    } catch (error) {
      // Ignore errors if files don't exist
    }
  }

  /**
   * Clear all cached content
   */
  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        await fs.unlink(filePath);
      }
    } catch (error) {
      // Ignore if cache directory doesn't exist
    }
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<{
    size: number;
    count: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const metaFiles = files.filter(f => f.endsWith('.meta'));
      
      let totalSize = 0;
      let oldest: number | null = null;
      let newest: number | null = null;

      for (const metaFile of metaFiles) {
        const metaPath = path.join(this.cacheDir, metaFile);
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const meta: CacheMetadata = JSON.parse(metaContent);
        
        totalSize += meta.size;
        
        if (oldest === null || meta.cached < oldest) {
          oldest = meta.cached;
        }
        if (newest === null || meta.cached > newest) {
          newest = meta.cached;
        }
      }

      return {
        size: totalSize,
        count: metaFiles.length,
        oldestEntry: oldest,
        newestEntry: newest
      };
    } catch (error) {
      return {
        size: 0,
        count: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
  }

  /**
   * Get the cache directory path
   */
  getCacheDir(): string {
    return this.cacheDir;
  }

  /**
   * List all cached URLs
   */
  async list(): Promise<Array<{ url: string; cached: number; expires: number; size: number }>> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const metaFiles = files.filter(f => f.endsWith('.meta'));
      const entries = [];

      for (const metaFile of metaFiles) {
        const metaPath = path.join(this.cacheDir, metaFile);
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const meta: CacheMetadata = JSON.parse(metaContent);
        
        entries.push({
          url: meta.url,
          cached: meta.cached,
          expires: meta.expires,
          size: meta.size
        });
      }

      return entries;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate hash for URL (used as filename)
   */
  private hashUrl(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  /**
   * Detect content type from URL or content
   */
  private detectContentType(url: string, content: string): string {
    // Check URL extension
    if (url.endsWith('.json')) return 'json';
    if (url.endsWith('.yaml') || url.endsWith('.yml')) return 'yaml';
    
    // Try to detect from content
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    
    // Default to YAML
    return 'yaml';
  }
}