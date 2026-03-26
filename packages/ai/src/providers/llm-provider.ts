/**
 * SpecVerse LLM Provider Interface
 * Abstracts different LLM providers (OpenAI, Anthropic, Azure, local)
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  messages: LLMMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string[];
  stream?: boolean;
}

export interface LLMCompletionResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: 'stop' | 'length' | 'content_filter';
  model?: string;
}

export interface LLMProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model: string;
  timeout?: number;
  retries?: number;
  defaultOptions?: Partial<LLMCompletionOptions>;
}

export interface LLMStreamChunk {
  content: string;
  finished: boolean;
  usage?: LLMCompletionResponse['usage'];
}

/**
 * Abstract base class for LLM providers
 */
export abstract class LLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  /**
   * Complete a conversation with the LLM
   */
  abstract complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse>;

  /**
   * Stream a conversation with the LLM
   */
  abstract stream(options: LLMCompletionOptions): AsyncIterable<LLMStreamChunk>;

  /**
   * Test the provider connection
   */
  abstract test(): Promise<boolean>;

  /**
   * Get provider information
   */
  abstract getInfo(): {
    name: string;
    version: string;
    models: string[];
    capabilities: string[];
  };

  /**
   * Update configuration
   */
  configure(newConfig: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<LLMProviderConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Validate configuration
   */
  protected validateConfig(): void {
    if (!this.config.model) {
      throw new Error('Model is required in provider configuration');
    }
  }

  /**
   * Merge completion options with defaults
   */
  protected mergeOptions(options: LLMCompletionOptions): LLMCompletionOptions {
    return {
      max_tokens: 4000,
      temperature: 0.7,
      top_p: 1.0,
      ...this.config.defaultOptions,
      ...options
    };
  }

  /**
   * Handle provider errors
   */
  protected handleError(error: any): never {
    if (error.response?.status === 401) {
      throw new Error(`Authentication failed for ${this.getInfo().name}: Check API key`);
    } else if (error.response?.status === 429) {
      throw new Error(`Rate limit exceeded for ${this.getInfo().name}: Try again later`);
    } else if (error.response?.status >= 500) {
      throw new Error(`${this.getInfo().name} service error: ${error.message}`);
    } else {
      throw new Error(`${this.getInfo().name} error: ${error.message}`);
    }
  }
}

/**
 * Provider registry for managing multiple providers
 */
export class LLMProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider?: string;

  /**
   * Register a provider
   */
  register(name: string, provider: LLMProvider): void {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  /**
   * Get a provider by name
   */
  get(name?: string): LLMProvider {
    const providerName = name || this.defaultProvider;
    if (!providerName) {
      throw new Error('No LLM provider configured');
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`LLM provider '${providerName}' not found`);
    }

    return provider;
  }

  /**
   * Set default provider
   */
  setDefault(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider '${name}' not registered`);
    }
    this.defaultProvider = name;
  }

  /**
   * List all registered providers
   */
  list(): Array<{ name: string; info: ReturnType<LLMProvider['getInfo']> }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      info: provider.getInfo()
    }));
  }

  /**
   * Test all providers
   */
  async testAll(): Promise<Array<{ name: string; success: boolean; error?: string }>> {
    const results = [];

    for (const [name, provider] of this.providers) {
      try {
        const success = await provider.test();
        results.push({ name, success });
      } catch (error) {
        results.push({
          name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
    this.defaultProvider = undefined;
  }
}

// Export singleton registry
export const llmRegistry = new LLMProviderRegistry();
