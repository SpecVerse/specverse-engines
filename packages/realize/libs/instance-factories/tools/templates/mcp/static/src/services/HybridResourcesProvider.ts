/**
 * HybridResourcesProvider
 * Unified resources provider that can use file system or embedded resources
 * based on deployment environment
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ResourcesProviderService } from './ResourcesProviderService.js';
import { EmbeddedResourcesAdapter, type EmbeddedResourcesMap } from './EmbeddedResourcesAdapter.js';
import type { ResourceProvider } from '../interfaces/ResourceProvider.js';
import type { SpecVerseResource, MCPToolResult } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface HybridConfig {
  mode: 'auto' | 'filesystem' | 'embedded';
  resourcesPath?: string;
  embeddedResources?: EmbeddedResourcesMap;
}

export class HybridResourcesProvider implements ResourceProvider {
  private provider: ResourcesProviderService | EmbeddedResourcesAdapter;
  private mode: 'filesystem' | 'embedded';

  constructor(config: HybridConfig) {
    this.mode = this.detectMode(config);

    if (this.mode === 'embedded') {
      if (!config.embeddedResources) {
        // For now, create a simple embedded adapter - we'll load resources asynchronously
        this.provider = new EmbeddedResourcesAdapter({});
      } else {
        this.provider = new EmbeddedResourcesAdapter(config.embeddedResources);
      }
    } else {
      this.provider = new ResourcesProviderService(config.resourcesPath);
    }
  }

  private detectMode(config: HybridConfig): 'filesystem' | 'embedded' {
    if (config.mode === 'filesystem') return 'filesystem';
    if (config.mode === 'embedded') return 'embedded';

    // Auto-detection for 'auto' mode
    // Priority 1: Check if embedded resources are explicitly provided
    if (config.embeddedResources) {
      return 'embedded';
    }

    // Priority 2: Check if embedded-resources.js exists (web build indicator)
    if (this.hasEmbeddedResourcesFile()) {
      return 'embedded';
    }

    // Priority 3: Check if we're in a web deployment environment
    if (this.isWebEnvironment()) {
      return 'embedded';
    }

    // Priority 4: Check if resources directory exists for local/development
    const resourcesPath = config.resourcesPath || join(__dirname, '../../resources');
    if (existsSync(resourcesPath)) {
      return 'filesystem';
    }

    // Priority 5: Try to dynamically import embedded resources
    if (this.tryImportEmbeddedResources()) {
      return 'embedded';
    }

    // Default to filesystem for development environments
    return 'filesystem';
  }

  private hasEmbeddedResourcesFile(): boolean {
    try {
      // Check if embedded-resources.js exists in the same directory as the built files
      const embeddedPath = join(dirname(__dirname), 'embedded-resources.js');
      return existsSync(embeddedPath);
    } catch {
      return false;
    }
  }

  private isWebEnvironment(): boolean {
    // Detection heuristics for web environment
    try {
      // Check if we're in a browser-like environment
      if (typeof window !== 'undefined') return true;
      
      // Check if we have embedded resources file (web build indicator)
      return this.hasEmbeddedResourcesFile();
    } catch {
      return false;
    }
  }

  private loadEmbeddedResources(): EmbeddedResourcesMap | null {
    try {
      // Try to load embedded resources from the web build
      const embeddedPath = join(dirname(__dirname), 'embedded-resources.js');
      if (existsSync(embeddedPath)) {
        const content = readFileSync(embeddedPath, 'utf-8');
        
        // Extract the EMBEDDED_RESOURCES object from the file
        // This is a bit hacky but works for the generated embedded-resources.js
        const match = content.match(/export const EMBEDDED_RESOURCES = ({[\s\S]*?});/);
        if (match) {
          // Use eval to parse the object (safe since we generated this file)
          const embeddedResources = eval('(' + match[1] + ')');
          return embeddedResources;
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to load embedded resources:', error);
      return null;
    }
  }

  private async loadEmbeddedResourcesAsync(): Promise<EmbeddedResourcesMap | null> {
    try {
      // Try dynamic import of embedded resources
      const embeddedPath = join(dirname(__dirname), 'embedded-resources.js');
      if (existsSync(embeddedPath)) {
        const embeddedModule = await import(embeddedPath);
        return embeddedModule.EMBEDDED_RESOURCES || null;
      }
      return null;
    } catch (error) {
      console.warn('Dynamic import of embedded resources failed:', error);
      return null;
    }
  }

  private tryImportEmbeddedResources(): any {
    // This is for future async import support
    return this.loadEmbeddedResources();
  }

  async initializeResources(): Promise<void> {
    // If we're in embedded mode but don't have resources loaded yet, try to load them
    if (this.mode === 'embedded' && this.provider instanceof EmbeddedResourcesAdapter) {
      const providerInfo = this.provider.getEmbeddedResourcesInfo();
      if (providerInfo.count === 0) {
        // Try to load embedded resources dynamically
        try {
          const embeddedResources = await this.loadEmbeddedResourcesAsync();
          if (embeddedResources) {
            // Create a new adapter with loaded resources
            this.provider = new EmbeddedResourcesAdapter(embeddedResources);
          }
        } catch (error) {
          console.warn('Failed to load embedded resources, falling back to filesystem:', error);
          // Fall back to filesystem mode
          this.mode = 'filesystem';
          this.provider = new ResourcesProviderService();
        }
      }
    }
    
    return this.provider.initializeResources();
  }

  async listResources(): Promise<SpecVerseResource[]> {
    return this.provider.listResources();
  }

  async getResourceContent(uri: string): Promise<string> {
    return this.provider.getResourceContent(uri);
  }

  async readResource(uri: string): Promise<MCPToolResult> {
    return this.provider.readResource(uri);
  }

  isResourceAvailable(uri: string): boolean {
    return this.provider.isResourceAvailable(uri);
  }

  getCachedResourceCount(): number {
    return this.provider.getCachedResourceCount();
  }

  getMode(): 'filesystem' | 'embedded' {
    return this.mode;
  }

  getProviderInfo(): { mode: string; type: string; resourcesInfo?: any } {
    const info = {
      mode: this.mode,
      type: this.provider.constructor.name,
      resourcesInfo: undefined as any
    };

    // Add provider-specific info
    if (this.provider instanceof EmbeddedResourcesAdapter) {
      info.resourcesInfo = this.provider.getEmbeddedResourcesInfo();
    } else if (this.provider instanceof ResourcesProviderService) {
      info.resourcesInfo = {
        cached: this.provider.getCachedResourceCount()
      };
    }

    return info;
  }
}