/**
 * ResourceProvider Interface
 * Common interface for resource providers (filesystem, embedded, hybrid)
 */

import type { SpecVerseResource, MCPToolResult } from '../types/index.js';

export interface ResourceProvider {
  initializeResources(): Promise<void>;
  listResources(): Promise<SpecVerseResource[]>;
  getResourceContent(uri: string): Promise<string>;
  readResource(uri: string): Promise<MCPToolResult>;
  isResourceAvailable(uri: string): boolean;
  getCachedResourceCount(): number;
}