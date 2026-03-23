/**
 * AI Command Types and Interfaces
 */

export interface UserRequirements {
  requirements: string;
  scale?: 'personal' | 'business' | 'enterprise';
  framework?: string;
  domain?: string;
  compliance?: string[];
  technology_preferences?: string[];
}

export interface PromptTemplate {
  name: string;
  version: string;
  system: string;
  user: string;
  context?: string;
  variables?: string[];
}

export interface FilledPrompt {
  systemPrompt: string;
  userPrompt: string;
  contextPrompt?: string;
  variables: Record<string, any>;
}

export interface LibrarySuggestion {
  type: 'deployment' | 'domain' | 'manifest' | 'types';
  name: string;
  description: string;
  rationale: string;
  expansion_factor?: number;
  compliance?: string[];
}

export interface AILibraryContext {
  suggestions: LibrarySuggestion[];
  total: number;
  reasoning: string;
}

export interface EnhancedPrompt extends FilledPrompt {
  libraryContext: AILibraryContext;
  estimatedTokens: number;
  estimatedCost?: Record<string, number>; // Cost by provider
  executionOptions: ExecutionOption[];
}

export interface ExecutionOption {
  provider: 'openai' | 'anthropic' | 'local' | 'interactive';
  model?: string;
  estimatedCost?: number;
  description: string;
}

export interface CostEstimate {
  estimatedTokens: number;
  costByProvider: Record<string, number>;
  cheapestOption: string;
  fastestOption: string;
}

export type AIOperation = 'analyse' | 'create' | 'materialise' | 'realize' | 'infer';

export interface AICommandOptions {
  requirements?: string;
  scale?: 'personal' | 'business' | 'enterprise';
  framework?: string;
  domain?: string;
  compliance?: string[];
  technology_preferences?: string[];
  pver?: string;
  output?: string;
  copy?: boolean;
  config?: string;
}

/**
 * AI Config File Format (YAML)
 * Used with --config option to provide requirements and library context
 */
export interface AIConfig {
  requirements?: string;
  scale?: 'personal' | 'business' | 'enterprise';
  framework?: string;
  domain?: string;
  compliance?: string[];
  technology?: string[];
  libraries?: string[];
}