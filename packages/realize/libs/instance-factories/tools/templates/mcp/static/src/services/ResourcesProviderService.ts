/**
 * ResourcesProviderService
 * Clean implementation from extracted specification
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';
import { SpecVerseResourceModel } from '../models/SpecVerseResource.js';
import type { ResourceProvider } from '../interfaces/ResourceProvider.js';
import type { SpecVerseResource, MCPToolResult } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ResourcesProviderService implements ResourceProvider {
  private resourceCatalog: Map<string, SpecVerseResourceModel> = new Map();
  private resourcesPath: string;
  private isInitialized = false;

  constructor(resourcesPath?: string) {
    if (resourcesPath) {
      this.resourcesPath = resourcesPath;
    } else {
      // Auto-detect based on directory structure
      // Development: src/services -> ../../resources
      // NPM package: dist/local/services -> ../resources  
      const candidatePaths = [
        join(__dirname, '../resources'),      // NPM package structure
        join(__dirname, '../../resources'),   // Development structure
      ];
      
      this.resourcesPath = candidatePaths[0]; // Default to NPM structure
      
      // Check which path exists (sync check is OK here as it's only during initialization)
      try {
        for (const path of candidatePaths) {
          if (existsSync(path)) {
            this.resourcesPath = path;
            break;
          }
        }
      } catch (error) {
        // Fallback to first candidate if fs check fails
        this.resourcesPath = candidatePaths[0];
      }
    }
  }

  async initializeResources(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Initialize resource catalog with essential resources only
    // Schemas and catalogs are now provided through AI tools for better contextual guidance
    const resources: SpecVerseResource[] = [
      {
        uri: 'specverse://examples/chat-prompts',
        name: 'Chat Prompt Examples',
        description: 'Example prompts for terminal/chat-based AI interactions',
        mimeType: 'text/markdown'
      },
      {
        uri: 'specverse://examples/api-calls',
        name: 'API Integration Examples',
        description: 'Examples for API-based AI integrations',
        mimeType: 'application/javascript'
      }
    ];

    for (const resourceData of resources) {
      const resource = SpecVerseResourceModel.create(resourceData);
      this.resourceCatalog.set(resource.uri, resource);
    }

    this.isInitialized = true;
  }

  async listResources(): Promise<SpecVerseResource[]> {
    await this.initializeResources();
    
    return Array.from(this.resourceCatalog.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
      content: resource.content,
      metadata: resource.metadata
    }));
  }

  async getResourceContent(uri: string): Promise<string> {
    await this.initializeResources();
    
    const resource = this.resourceCatalog.get(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    if (resource.isLoaded()) {
      return resource.content!;
    }

    // Load content from file system
    const filePath = this.resolveResourcePath(uri);
    
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Update resource with loaded content
      const updatedResource = resource.withContent(content);
      this.resourceCatalog.set(uri, updatedResource);
      
      return content;
    } catch (error) {
      throw new Error(`Failed to load resource ${uri}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async readResource(uri: string): Promise<MCPToolResult> {
    try {
      const content = await this.getResourceContent(uri);
      const resource = this.resourceCatalog.get(uri)!;
      
      return {
        content: [{
          type: 'resource',
          resource: {
            uri: resource.uri,
            name: resource.name,
            description: resource.description,
            mimeType: resource.mimeType,
            content
          }
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error reading resource: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }

  private resolveResourcePath(uri: string): string {
    switch (uri) {
      // Schemas and catalogs removed - now provided through AI tools
      case 'specverse://examples/chat-prompts':
        return join(this.resourcesPath, 'examples/chat-prompts/ecommerce-store-example.md');
      case 'specverse://examples/api-calls':
        return join(this.resourcesPath, 'examples/api-calls/orchestrator-workflow-example.js');
      default:
        throw new Error(`Unknown resource URI: ${uri}`);
    }
  }

  isResourceAvailable(uri: string): boolean {
    return this.resourceCatalog.has(uri);
  }

  getCachedResourceCount(): number {
    return Array.from(this.resourceCatalog.values()).filter(r => r.isLoaded()).length;
  }
}