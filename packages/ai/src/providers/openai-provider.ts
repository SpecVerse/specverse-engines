/**
 * OpenAI Provider for SpecVerse
 * Supports GPT-4, GPT-3.5-turbo, and other OpenAI models
 */

import {
  LLMProvider,
  LLMProviderConfig,
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMMessage
} from './llm-provider.js';

export interface OpenAIConfig extends LLMProviderConfig {
  organization?: string;
  project?: string;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string[];
  stream?: boolean;
}

interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export class OpenAIProvider extends LLMProvider {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(config: OpenAIConfig) {
    super(config);
    this.validateConfig();

    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    if ((config as OpenAIConfig).organization) {
      this.headers['OpenAI-Organization'] = (config as OpenAIConfig).organization!;
    }

    if ((config as OpenAIConfig).project) {
      this.headers['OpenAI-Project'] = (config as OpenAIConfig).project!;
    }
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse> {
    const mergedOptions = this.mergeOptions(options);

    const request: OpenAICompletionRequest = {
      model: this.config.model,
      messages: mergedOptions.messages.map(this.convertMessage),
      max_tokens: mergedOptions.max_tokens,
      temperature: mergedOptions.temperature,
      top_p: mergedOptions.top_p,
      stop: mergedOptions.stop,
      stream: false,
    };

    try {
      const response = await this.makeRequest('/chat/completions', request);
      return this.convertResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async *stream(options: LLMCompletionOptions): AsyncIterable<LLMStreamChunk> {
    const mergedOptions = this.mergeOptions(options);

    const request: OpenAICompletionRequest = {
      model: this.config.model,
      messages: mergedOptions.messages.map(this.convertMessage),
      max_tokens: mergedOptions.max_tokens,
      temperature: mergedOptions.temperature,
      top_p: mergedOptions.top_p,
      stop: mergedOptions.stop,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);

            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed: OpenAIStreamResponse = JSON.parse(data);
              const chunk = this.convertStreamChunk(parsed);
              if (chunk) {
                yield chunk;
              }
            } catch (error) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async test(): Promise<boolean> {
    try {
      const response = await this.complete({
        messages: [{ role: 'user', content: 'Say "test" if you can hear me.' }],
        max_tokens: 10,
      });
      return response.content.toLowerCase().includes('test');
    } catch (error) {
      return false;
    }
  }

  getInfo() {
    return {
      name: 'OpenAI',
      version: '1.0.0',
      models: [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4-turbo-preview',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
      ],
      capabilities: [
        'completion',
        'streaming',
        'function-calling',
        'json-mode',
      ],
    };
  }

  private async makeRequest(endpoint: string, data: any): Promise<OpenAICompletionResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } })) as any;
      throw new Error(error.error?.message || response.statusText);
    }

    return response.json() as Promise<OpenAICompletionResponse>;
  }

  private convertMessage(message: LLMMessage): OpenAIMessage {
    return {
      role: message.role,
      content: message.content,
    };
  }

  private convertResponse(response: OpenAICompletionResponse): LLMCompletionResponse {
    const choice = response.choices[0];

    return {
      content: choice.message.content,
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      },
      finish_reason: choice.finish_reason as any,
      model: response.model,
    };
  }

  private convertStreamChunk(response: OpenAIStreamResponse): LLMStreamChunk | null {
    const choice = response.choices[0];

    if (!choice) return null;

    return {
      content: choice.delta.content || '',
      finished: choice.finish_reason !== null,
    };
  }

  protected validateConfig(): void {
    super.validateConfig();

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }
}

/**
 * Factory function to create OpenAI provider
 */
export function createOpenAIProvider(config: {
  apiKey: string;
  model?: string;
  organization?: string;
  project?: string;
  baseURL?: string;
}): OpenAIProvider {
  return new OpenAIProvider({
    model: config.model || 'gpt-4',
    apiKey: config.apiKey,
    organization: config.organization,
    project: config.project,
    baseURL: config.baseURL,
    timeout: 30000,
    retries: 3,
  });
}
