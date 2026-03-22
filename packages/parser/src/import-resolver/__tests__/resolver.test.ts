/**
 * Tests for ImportResolver
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImportResolver } from '../resolver.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ImportResolver', () => {
  let resolver: ImportResolver;
  let testDir: string;
  let cacheDir: string;

  beforeEach(async () => {
    // Create test directory
    testDir = path.join(os.tmpdir(), 'specverse-test-' + Date.now());
    cacheDir = path.join(testDir, 'cache');
    await fs.mkdir(testDir, { recursive: true });

    resolver = new ImportResolver({
      basePath: testDir,
      cacheDir,
      debug: false
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('File Resolution', () => {
    it('should resolve relative file paths', async () => {
      // Create a test file
      const testFile = path.join(testDir, 'test.yaml');
      const testContent = 'test: content';
      await fs.writeFile(testFile, testContent);

      const result = await resolver.resolve({
        file: './test.yaml'
      }, testDir);

      expect(result.content).toBe(testContent);
      expect(result.source).toBe('file');
      expect(result.contentType).toBe('yaml');
      expect(result.path).toBe(testFile);
    });

    it('should resolve absolute file paths', async () => {
      const testFile = path.join(testDir, 'absolute.yaml');
      const testContent = 'absolute: test';
      await fs.writeFile(testFile, testContent);

      const result = await resolver.resolve({
        file: testFile
      });

      expect(result.content).toBe(testContent);
      expect(result.source).toBe('file');
    });

    it('should detect JSON files', async () => {
      const testFile = path.join(testDir, 'test.json');
      const testContent = '{"test": "json"}';
      await fs.writeFile(testFile, testContent);

      const result = await resolver.resolve({
        file: './test.json'
      }, testDir);

      expect(result.contentType).toBe('json');
    });

    it('should throw error for non-existent files', async () => {
      await expect(resolver.resolve({
        file: './non-existent.yaml'
      }, testDir)).rejects.toThrow('Failed to read file');
    });
  });

  describe('NPM Package Resolution', () => {
    // Note: These tests would require mock packages or actual npm packages
    // For now, we'll test the detection logic

    it('should identify NPM packages', () => {
      const isNpmPackage = (resolver as any).isNpmPackage;
      
      expect(isNpmPackage.call(resolver, '@specverse/standards')).toBe(true);
      expect(isNpmPackage.call(resolver, '@company/package')).toBe(true);
      expect(isNpmPackage.call(resolver, 'lodash')).toBe(true);
      expect(isNpmPackage.call(resolver, './relative/path')).toBe(false);
      expect(isNpmPackage.call(resolver, '../relative/path')).toBe(false);
      expect(isNpmPackage.call(resolver, 'https://example.com')).toBe(false);
    });

    it('should handle package resolution errors gracefully', async () => {
      await expect(resolver.resolve({
        package: 'non-existent-package-xyz-123'
      })).rejects.toThrow('Failed to resolve NPM package');
    });
  });

  describe('URL Resolution', () => {
    it('should identify URLs', () => {
      const isUrl = (resolver as any).isUrl;
      
      expect(isUrl.call(resolver, 'https://example.com/file.yaml')).toBe(true);
      expect(isUrl.call(resolver, 'http://example.com/file.yaml')).toBe(true);
      expect(isUrl.call(resolver, './relative/path')).toBe(false);
      expect(isUrl.call(resolver, '@package/name')).toBe(false);
    });

    // Note: Actual URL fetching would require mocking fetch
    // or using a real URL in integration tests
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      const stats = await resolver.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('count');
      expect(stats.count).toBe(0); // Empty cache initially
    });

    it('should list cached items', async () => {
      const cached = await resolver.listCached();
      
      expect(Array.isArray(cached)).toBe(true);
      expect(cached.length).toBe(0); // Empty cache initially
    });

    it('should clear cache', async () => {
      await resolver.clearCache();
      const stats = await resolver.getCacheStats();
      expect(stats.count).toBe(0);
    });
  });

  describe('Content Type Detection', () => {
    it('should detect content type from extension', () => {
      const detectContentType = (resolver as any).detectContentType;
      
      expect(detectContentType.call(resolver, 'file.json', '')).toBe('json');
      expect(detectContentType.call(resolver, 'file.yaml', '')).toBe('yaml');
      expect(detectContentType.call(resolver, 'file.yml', '')).toBe('yaml');
      expect(detectContentType.call(resolver, 'file.specly', '')).toBe('yaml');
    });

    it('should detect content type from content', () => {
      const detectContentType = (resolver as any).detectContentType;
      
      expect(detectContentType.call(resolver, 'unknown', '{"test": true}')).toBe('json');
      expect(detectContentType.call(resolver, 'unknown', '[1, 2, 3]')).toBe('json');
      expect(detectContentType.call(resolver, 'unknown', 'key: value')).toBe('yaml');
    });
  });

  describe('Integration Scenarios', () => {
    it('should resolve multiple import types', async () => {
      // Create local file
      const localFile = path.join(testDir, 'local.yaml');
      await fs.writeFile(localFile, 'local: content');

      // Test file resolution
      const fileResult = await resolver.resolve({
        file: './local.yaml'
      }, testDir);
      expect(fileResult.source).toBe('file');

      // Test from with relative path (backward compatibility)
      const fromResult = await resolver.resolve({
        from: './local.yaml'
      }, testDir);
      expect(fromResult.source).toBe('file');
    });

    it('should handle offline mode', async () => {
      const offlineResolver = new ImportResolver({
        basePath: testDir,
        cacheDir,
        offline: true
      });

      // URL should fail in offline mode
      await expect(offlineResolver.resolve({
        from: 'https://example.com/test.yaml'
      })).rejects.toThrow('Offline mode');
    });
  });
});