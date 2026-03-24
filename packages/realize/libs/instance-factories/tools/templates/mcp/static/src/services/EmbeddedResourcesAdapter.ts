/**
 * EmbeddedResourcesAdapter
 * Handles embedded resources for web deployments
 */

import { SpecVerseResourceModel } from '../models/SpecVerseResource.js';
import type { ResourceProvider } from '../interfaces/ResourceProvider.js';
import type { SpecVerseResource, MCPToolResult } from '../types/index.js';

export interface EmbeddedResourceData {
  content: string;
  mimeType: string;
  size: number;
}

export interface EmbeddedResourcesMap {
  [path: string]: EmbeddedResourceData;
}

export class EmbeddedResourcesAdapter implements ResourceProvider {
  private resourceCatalog: Map<string, SpecVerseResourceModel> = new Map();
  private embeddedResources: EmbeddedResourcesMap;
  private isInitialized = false;

  constructor(embeddedResources: EmbeddedResourcesMap) {
    this.embeddedResources = embeddedResources;
  }

  async initializeResources(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Initialize resource catalog with known resources using embedded content
    const resources: SpecVerseResource[] = [
      {
        uri: 'specverse://schema/json',
        name: 'SpecVerse v3.1 JSON Schema',
        description: 'Complete JSON schema for SpecVerse v3.1 specifications',
        mimeType: 'application/json'
      },
      {
        uri: 'specverse://schema/ai-yaml',
        name: 'SpecVerse v3.1 AI-Optimized Schema',
        description: 'AI-friendly YAML schema with guidance and examples',
        mimeType: 'application/x-yaml'
      },
      {
        uri: 'specverse://prompts/create',
        name: 'Create Prompt Template',
        description: 'Template for generating SpecVerse specifications from requirements',
        mimeType: 'application/x-yaml'
      },
      {
        uri: 'specverse://prompts/analyse',
        name: 'Analysis Prompt Template',
        description: 'Template for extracting specifications from existing code',
        mimeType: 'application/x-yaml'
      },
      {
        uri: 'specverse://prompts/materialise',
        name: 'Implementation Planning Template',
        description: 'Template for creating implementation plans from specifications',
        mimeType: 'application/x-yaml'
      },
      {
        uri: 'specverse://prompts/realize',
        name: 'Code Generation Template',
        description: 'Template for generating source code from specifications',
        mimeType: 'application/x-yaml'
      },
      {
        uri: 'specverse://libraries/catalog',
        name: 'SpecVerse Library Catalog',
        description: 'Complete catalog of available SpecVerse libraries with AI metadata',
        mimeType: 'application/x-yaml'
      },
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

    // Load content from embedded resources
    const resourcePath = this.resolveResourcePath(uri);
    const embeddedResource = this.embeddedResources[resourcePath];
    
    if (!embeddedResource) {
      throw new Error(`Embedded resource not found: ${resourcePath} for URI: ${uri}`);
    }

    // Update resource with loaded content
    const updatedResource = resource.withContent(embeddedResource.content);
    this.resourceCatalog.set(uri, updatedResource);
    
    return embeddedResource.content;
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
      case 'specverse://schema/json':
        return 'schemas/SPECVERSE-SCHEMA.json';
      case 'specverse://schema/ai-yaml':
        return 'schemas/specverse-ai.yaml';
      case 'specverse://prompts/create':
        return 'prompts/create.prompt.yaml';
      case 'specverse://prompts/analyse':
        return 'prompts/analyse.prompt.yaml';
      case 'specverse://prompts/materialise':
        return 'prompts/materialise.prompt.yaml';
      case 'specverse://prompts/realize':
        return 'prompts/realize.prompt.yaml';
      case 'specverse://libraries/catalog':
        return 'libraries/catalog/library-catalog.yaml';
      case 'specverse://examples/chat-prompts':
        return 'examples/chat-prompts/ecommerce-store-example.md';
      case 'specverse://examples/api-calls':
        return 'examples/api-calls/orchestrator-workflow-example.js';
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

  getEmbeddedResourcesInfo(): { count: number; totalSize: number; paths: string[] } {
    const paths = Object.keys(this.embeddedResources);
    const totalSize = Object.values(this.embeddedResources).reduce((sum, res) => sum + res.size, 0);
    
    return {
      count: paths.length,
      totalSize,
      paths
    };
  }
}