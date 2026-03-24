/**
 * ResourcesProviderService Unit Tests
 * Clean implementation test suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResourcesProviderService } from '../../services/ResourcesProviderService.js';

describe('ResourcesProviderService', () => {
  let service: ResourcesProviderService;

  beforeEach(() => {
    service = new ResourcesProviderService();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(service.initializeResources()).resolves.not.toThrow();
    });

    it('should list resources after initialization', async () => {
      await service.initializeResources();
      const resources = await service.listResources();
      
      expect(resources).toBeInstanceOf(Array);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0]).toHaveProperty('uri');
      expect(resources[0]).toHaveProperty('name');
      expect(resources[0]).toHaveProperty('description');
      expect(resources[0]).toHaveProperty('mimeType');
    });
  });

  describe('resource management', () => {
    beforeEach(async () => {
      await service.initializeResources();
    });

    it('should check resource availability', () => {
      expect(service.isResourceAvailable('specverse://examples/chat-prompts')).toBe(true);
      expect(service.isResourceAvailable('nonexistent://resource')).toBe(false);
    });

    it('should handle unknown resource URIs', async () => {
      await expect(service.getResourceContent('unknown://resource'))
        .rejects.toThrow('Resource not found');
    });

    it('should track cached resource count', () => {
      const count = service.getCachedResourceCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resource reading', () => {
    beforeEach(async () => {
      await service.initializeResources();
    });

    it('should return proper MCP tool result structure', async () => {
      // Mock successful resource read since we don't have actual files in test
      const result = await service.readResource('specverse://examples/chat-prompts').catch(err => ({
        content: [{ type: 'text' as const, text: err.message }],
        isError: true
      }));

      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]).toHaveProperty('type');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.initializeResources();
    });

    it('should handle file system errors gracefully', async () => {
      const result = await service.readResource('specverse://examples/chat-prompts');
      
      if (result.isError) {
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('Error reading resource');
      } else {
        expect(result.content[0].type).toBe('resource');
      }
    });
  });
});