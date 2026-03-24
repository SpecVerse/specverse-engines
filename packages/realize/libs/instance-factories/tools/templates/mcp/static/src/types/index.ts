/**
 * Clean Implementation - Core Types
 * Generated from extracted SpecVerse specification
 */

export interface SpecVerseResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface LibrarySuggestion {
  name: string;
  path: string;
  type: 'deployment' | 'domain' | 'manifest' | 'type' | 'standard';
  description: string;
  ai_description: string;
  expansion_factor: number;
  complexity_level: 'low' | 'medium' | 'high';
  best_for: string[];
}

export interface StandardPrompt {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  system_role: string;
  system_context: string;
  system_capabilities: string[];
  system_constraints: string[];
  user_template: string;
  max_tokens: number;
  temperature: number;
}

export interface LibraryCatalog {
  version: string;
  generated_at: Date;
  generated_from: string;
  ai_optimization: boolean;
  total_libraries: number;
  deployments: Record<string, LibrarySuggestion>;
  domains: Record<string, LibrarySuggestion>;
  manifests: Record<string, LibrarySuggestion>;
  types: Record<string, LibrarySuggestion>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: SpecVerseResource;
  }>;
  isError?: boolean;
}

export interface PromptContext {
  requirements?: string;
  scale?: 'personal' | 'business' | 'enterprise';
  preferredTech?: string;
  projectType?: string;
  frameworkHint?: string;
  targetFramework?: string;
  deploymentType?: string;  // Added for Phase 3
  implementationScope?: string;  // Added for Phase 3
}

// Event Types
export interface ServerStartedEvent {
  mode: string;
  port?: number;
  pid: number;
}

export interface ToolCalledEvent {
  toolName: string;
  arguments: Record<string, any>;
  executionTime: number;
}

export interface ResourceRequestedEvent {
  uri: string;
  requestTime: Date;
}

export interface ErrorOccurredEvent {
  operation: string;
  error: string;
  context?: Record<string, any>;
}

// Configuration Types
export type MCPServerMode = 'local' | 'remote';

export interface MCPServerConfig {
  mode: MCPServerMode;
  port?: number;
  host?: string;
  logging?: boolean;
  resources_path?: string;
  workingDirectory?: string;
  features?: {
    orchestrator?: boolean;
  };
}