/**
 * Anthropic Provider for SpecVerse
 * Supports Claude 3 (Opus, Sonnet, Haiku) and other Anthropic models
 */

import {
  LLMProvider,
  LLMProviderConfig,
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMMessage
} from './llm-provider.js';

export interface AnthropicConfig extends LLMProviderConfig {
  version?: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicCompletionRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
}

interface AnthropicCompletionResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamResponse {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  message?: {
    id: string;
    type: 'message';
    role: 'assistant';
    content: any[];
    model: string;
    stop_reason?: string;
    stop_sequence?: string;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  content_block?: {
    type: 'text';
    text: string;
  };
  delta?: {
    type: 'text_delta';
    text: string;
    stop_reason?: string;
    stop_sequence?: string;
  };
  usage?: {
    output_tokens: number;
  };
}

export class AnthropicProvider extends LLMProvider {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(config: AnthropicConfig) {
    super(config);
    this.validateConfig();

    this.baseURL = config.baseURL || 'https://api.anthropic.com';
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey!,
      'anthropic-version': (config as AnthropicConfig).version || '2023-06-01',
    };
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse> {
    const mergedOptions = this.mergeOptions(options);
    const { systemMessage, userMessages } = this.separateMessages(mergedOptions.messages);

    const request: AnthropicCompletionRequest = {
      model: this.config.model,
      max_tokens: mergedOptions.max_tokens || 4000,
      messages: userMessages,
      system: systemMessage,
      temperature: mergedOptions.temperature,
      top_p: mergedOptions.top_p,
      stop_sequences: mergedOptions.stop,
      stream: false,
    };

    try {
      const response = await this.makeRequest('/v1/messages', request);
      return this.convertResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async *stream(options: LLMCompletionOptions): AsyncIterable<LLMStreamChunk> {
    const mergedOptions = this.mergeOptions(options);
    const { systemMessage, userMessages } = this.separateMessages(mergedOptions.messages);

    const request: AnthropicCompletionRequest = {
      model: this.config.model,
      max_tokens: mergedOptions.max_tokens || 4000,
      messages: userMessages,
      system: systemMessage,
      temperature: mergedOptions.temperature,
      top_p: mergedOptions.top_p,
      stop_sequences: mergedOptions.stop,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } })) as any;
        throw new Error(error.error?.message || response.statusText);
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

            try {
              const parsed: AnthropicStreamResponse = JSON.parse(data);
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
      name: 'Anthropic',
      version: '1.0.0',
      models: [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1',
        'claude-2.0',
        'claude-instant-1.2',
      ],
      capabilities: [
        'completion',
        'streaming',
        'long-context',
        'function-calling',
      ],
    };
  }

  private async makeRequest(endpoint: string, data: any): Promise<AnthropicCompletionResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } })) as any;
      throw new Error(error.error?.message || response.statusText);
    }

    return response.json() as Promise<AnthropicCompletionResponse>;
  }

  private separateMessages(messages: LLMMessage[]): {
    systemMessage?: string;
    userMessages: AnthropicMessage[]
  } {
    let systemMessage: string | undefined;
    const userMessages: AnthropicMessage[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // Anthropic handles system messages separately
        systemMessage = systemMessage
          ? `${systemMessage}\n\n${message.content}`
          : message.content;
      } else {
        userMessages.push({
          role: message.role as 'user' | 'assistant',
          content: message.content,
        });
      }
    }

    return { systemMessage, userMessages };
  }

  private convertResponse(response: AnthropicCompletionResponse): LLMCompletionResponse {
    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    return {
      content,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finish_reason: this.mapFinishReason(response.stop_reason),
      model: response.model,
    };
  }

  private convertStreamChunk(response: AnthropicStreamResponse): LLMStreamChunk | null {
    switch (response.type) {
      case 'content_block_delta':
        return {
          content: response.delta?.text || '',
          finished: false,
        };

      case 'message_stop':
        return {
          content: '',
          finished: true,
          usage: response.message?.usage ? {
            prompt_tokens: response.message.usage.input_tokens,
            completion_tokens: response.message.usage.output_tokens,
            total_tokens: response.message.usage.input_tokens + response.message.usage.output_tokens,
          } : undefined,
        };

      default:
        return null;
    }
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }

  protected validateConfig(): void {
    super.validateConfig();

    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // Validate model format
    const validModels = this.getInfo().models;
    if (!validModels.includes(this.config.model)) {
      console.warn(`Warning: Model '${this.config.model}' is not in the known models list`);
    }
  }
}

/**
 * Factory function to create Anthropic provider
 */
export function createAnthropicProvider(config: {
  apiKey: string;
  model?: string;
  version?: string;
  baseURL?: string;
}): AnthropicProvider {
  return new AnthropicProvider({
    model: config.model || 'claude-3-sonnet-20240229',
    apiKey: config.apiKey,
    version: config.version,
    baseURL: config.baseURL,
    timeout: 30000,
    retries: 3,
  });
}
