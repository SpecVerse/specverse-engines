/**
 * Provider Factory for SpecVerse
 * Creates LLM provider instances based on configuration
 */

import { LLMProvider, LLMProviderConfig } from './llm-provider.js';
import { OpenAIProvider, createOpenAIProvider } from './openai-provider.js';
import { AnthropicProvider, createAnthropicProvider } from './anthropic-provider.js';
import { InteractiveProvider, createInteractiveProvider } from './interactive-provider.js';

export interface ProviderFactoryConfig extends LLMProviderConfig {
  type: 'openai' | 'anthropic' | 'azure' | 'local' | 'interactive';
  // Interactive-specific options
  interface?: 'chatgpt' | 'claude' | 'gemini' | 'generic';
  outputFile?: string;
  waitForInput?: boolean;
  formatInstructions?: boolean;
  // OpenAI-specific options
  organization?: string;
  project?: string;
  // Anthropic-specific options
  version?: string;
  // Config-specific options
  enabled?: boolean;
  default?: boolean;
}

export class ProviderFactory {
  /**
   * Create a provider instance based on configuration
   */
  static createProvider(config: ProviderFactoryConfig): LLMProvider {
    switch (config.type) {
      case 'openai':
        return createOpenAIProvider({
          apiKey: config.apiKey!,
          model: config.model,
          organization: config.organization,
          project: config.project,
          baseURL: config.baseURL,
        });

      case 'anthropic':
        return createAnthropicProvider({
          apiKey: config.apiKey!,
          model: config.model,
          version: config.version,
          baseURL: config.baseURL,
        });

      case 'azure':
        // Azure OpenAI uses the same provider as OpenAI with different baseURL
        return createOpenAIProvider({
          apiKey: config.apiKey!,
          model: config.model,
          baseURL: config.baseURL || 'https://your-resource.openai.azure.com',
        });

      case 'local':
        // Local provider (could be Ollama, LM Studio, etc.)
        return createOpenAIProvider({
          apiKey: config.apiKey || 'not-required',
          model: config.model,
          baseURL: config.baseURL || 'http://localhost:11434',
        });

      case 'interactive':
        return createInteractiveProvider({
          interface: config.interface,
          outputFile: config.outputFile,
          waitForInput: config.waitForInput,
          formatInstructions: config.formatInstructions,
        });

      default:
        throw new Error(`Unsupported provider type: ${(config as any).type}`);
    }
  }

  /**
   * Get supported provider types
   */
  static getSupportedTypes(): string[] {
    return ['openai', 'anthropic', 'azure', 'local', 'interactive'];
  }

  /**
   * Check if a provider type is supported
   */
  static isSupported(type: string): boolean {
    return this.getSupportedTypes().includes(type);
  }

  /**
   * Get default configuration for a provider type
   */
  static getDefaultConfig(type: string): Partial<ProviderFactoryConfig> {
    switch (type) {
      case 'openai':
        return {
          type: 'openai',
          model: 'gpt-4',
          timeout: 30000,
          retries: 3,
        };

      case 'anthropic':
        return {
          type: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          timeout: 30000,
          retries: 3,
        };

      case 'azure':
        return {
          type: 'azure',
          model: 'gpt-4',
          timeout: 30000,
          retries: 3,
        };

      case 'local':
        return {
          type: 'local',
          model: 'llama2',
          baseURL: 'http://localhost:11434',
          timeout: 60000,
          retries: 1,
        };

      case 'interactive':
        return {
          type: 'interactive',
          model: 'interactive-generic',
          interface: 'generic',
          waitForInput: false,
          formatInstructions: true,
          timeout: 0,
          retries: 0,
        };

      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }

  /**
   * Create a provider from config object, ensuring type safety
   */
  static createFromConfig(config: Partial<ProviderFactoryConfig> & { type: string; model?: string }): LLMProvider {
    // Apply defaults and validate
    const providerConfig: ProviderFactoryConfig = {
      ...this.getDefaultConfig(config.type),
      ...config
    } as ProviderFactoryConfig;

    this.validateConfig(providerConfig);
    return this.createProvider(providerConfig);
  }

  /**
   * Validate provider configuration
   */
  static validateConfig(config: ProviderFactoryConfig): void {
    if (!config.type) {
      throw new Error('Provider type is required');
    }

    if (!this.isSupported(config.type)) {
      throw new Error(`Unsupported provider type: ${config.type}`);
    }

    // Type-specific validation
    switch (config.type) {
      case 'openai':
      case 'anthropic':
      case 'azure':
        if (!config.apiKey) {
          throw new Error(`API key is required for ${config.type} provider`);
        }
        break;

      case 'interactive':
        if (config.interface && !['chatgpt', 'claude', 'gemini', 'generic'].includes(config.interface)) {
          throw new Error(`Invalid interface for interactive provider: ${config.interface}`);
        }
        break;

      case 'local':
        // Local providers may not need API keys
        break;
    }

    if (!config.model) {
      throw new Error('Model is required');
    }
  }
}
