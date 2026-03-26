/**
 * Interactive LLM Provider for SpecVerse
 * Outputs structured prompts for copy-pasting into web interfaces
 */

import {
  LLMProvider,
  LLMProviderConfig,
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMMessage
} from './llm-provider.js';

export interface InteractiveConfig extends LLMProviderConfig {
  interface?: 'chatgpt' | 'claude' | 'gemini' | 'generic';
  outputFile?: string;
  waitForInput?: boolean;
  formatInstructions?: boolean;
}

interface InteractiveSession {
  id: string;
  timestamp: string;
  interface: string;
  prompt: string;
  expectedResponse?: string;
  status: 'pending' | 'completed' | 'failed';
}

export class InteractiveProvider extends LLMProvider {
  private sessions: Map<string, InteractiveSession> = new Map();
  declare protected config: InteractiveConfig;

  constructor(config: InteractiveConfig) {
    super(config);
    this.validateConfig();
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse> {
    const mergedOptions = this.mergeOptions(options);
    const sessionId = this.generateSessionId();

    // Format the prompt for the specific interface
    const formattedPrompt = this.formatPromptForInterface(mergedOptions);

    // Create session
    const session: InteractiveSession = {
      id: sessionId,
      timestamp: new Date().toISOString(),
      interface: this.config.interface || 'generic',
      prompt: formattedPrompt,
      status: 'pending'
    };

    this.sessions.set(sessionId, session);

    // Output the prompt
    await this.outputPrompt(session);

    if (this.config.waitForInput) {
      // Wait for user input
      const response = await this.waitForUserResponse(sessionId);
      return this.parseUserResponse(response);
    } else {
      // Return instructions for manual completion
      return this.createInstructionalResponse(sessionId);
    }
  }

  async *stream(options: LLMCompletionOptions): AsyncIterable<LLMStreamChunk> {
    // Interactive mode doesn't support real streaming
    // Instead, yield the formatted prompt as a single chunk
    const response = await this.complete(options);

    yield {
      content: response.content,
      finished: true,
      usage: response.usage
    };
  }

  async test(): Promise<boolean> {
    try {
      const testResponse = await this.complete({
        messages: [{ role: 'user', content: 'Say "test" if you can hear me.' }],
        max_tokens: 10,
      });

      // For interactive mode, we consider it successful if we can format the prompt
      return testResponse.content.includes('test') || testResponse.content.includes('copy');
    } catch (error) {
      return false;
    }
  }

  getInfo() {
    return {
      name: 'Interactive',
      version: '1.0.0',
      models: [
        'interactive-chatgpt',
        'interactive-claude',
        'interactive-gemini',
        'interactive-generic',
      ],
      capabilities: [
        'prompt-formatting',
        'multi-interface',
        'manual-completion',
        'session-tracking',
      ],
    };
  }

  /**
   * Get active sessions
   */
  getSessions(): InteractiveSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Mark session as completed with response
   */
  completeSession(sessionId: string, response: string): LLMCompletionResponse {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'completed';
    return this.parseUserResponse(response);
  }

  /**
   * Format prompt for specific interface
   */
  private formatPromptForInterface(options: LLMCompletionOptions): string {
    const messages = options.messages;
    const interface_type = this.config.interface || 'generic';

    let prompt = '';

    switch (interface_type) {
      case 'chatgpt':
        prompt = this.formatForChatGPT(messages, options);
        break;
      case 'claude':
        prompt = this.formatForClaude(messages, options);
        break;
      case 'gemini':
        prompt = this.formatForGemini(messages, options);
        break;
      default:
        prompt = this.formatGeneric(messages, options);
    }

    if (this.config.formatInstructions !== false) {
      prompt = this.addFormatInstructions(prompt, interface_type);
    }

    return prompt;
  }

  private formatForChatGPT(messages: LLMMessage[], options: LLMCompletionOptions): string {
    let prompt = '# SpecVerse AI Assistant Request\n\n';

    // Add system context if present
    const systemMessages = messages.filter(m => m.role === 'system');
    if (systemMessages.length > 0) {
      prompt += '## System Context\n';
      systemMessages.forEach(msg => {
        prompt += `${msg.content}\n\n`;
      });
    }

    // Add conversation
    const conversationMessages = messages.filter(m => m.role !== 'system');
    if (conversationMessages.length > 0) {
      prompt += '## Conversation\n';
      conversationMessages.forEach(msg => {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        prompt += `**${role}:** ${msg.content}\n\n`;
      });
    }

    // Add generation parameters
    prompt += '## Generation Parameters\n';
    prompt += `- Temperature: ${options.temperature || 0.7}\n`;
    prompt += `- Max tokens: ${options.max_tokens || 4000}\n`;
    if (options.stop && options.stop.length > 0) {
      prompt += `- Stop sequences: ${options.stop.join(', ')}\n`;
    }

    return prompt;
  }

  private formatForClaude(messages: LLMMessage[], options: LLMCompletionOptions): string {
    let prompt = '';

    // Claude handles system messages specially
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    if (systemMessages.length > 0) {
      prompt += systemMessages.map(m => m.content).join('\n\n') + '\n\n';
    }

    // Format conversation
    conversationMessages.forEach(msg => {
      if (msg.role === 'user') {
        prompt += `Human: ${msg.content}\n\n`;
      } else {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    });

    if (conversationMessages[conversationMessages.length - 1]?.role !== 'user') {
      prompt += 'Human: Please respond to the above.\n\n';
    }

    return prompt;
  }

  private formatForGemini(messages: LLMMessage[], options: LLMCompletionOptions): string {
    let prompt = '';

    // Gemini format
    messages.forEach(msg => {
      switch (msg.role) {
        case 'system':
          prompt += `System: ${msg.content}\n\n`;
          break;
        case 'user':
          prompt += `User: ${msg.content}\n\n`;
          break;
        case 'assistant':
          prompt += `Model: ${msg.content}\n\n`;
          break;
      }
    });

    return prompt;
  }

  private formatGeneric(messages: LLMMessage[], options: LLMCompletionOptions): string {
    let prompt = '# AI Assistant Request\n\n';

    messages.forEach((msg, index) => {
      prompt += `## Message ${index + 1} (${msg.role})\n`;
      prompt += `${msg.content}\n\n`;
    });

    return prompt;
  }

  private addFormatInstructions(prompt: string, interface_type: string): string {
    let instructions = '\n---\n\n## Instructions for Use\n\n';

    switch (interface_type) {
      case 'chatgpt':
        instructions += '1. Copy the entire prompt above\n';
        instructions += '2. Paste it into ChatGPT\n';
        instructions += '3. Copy the response and paste it back into SpecVerse\n';
        instructions += '4. Use the session ID for tracking: ';
        break;
      case 'claude':
        instructions += '1. Copy the prompt above (excluding system context if separate)\n';
        instructions += '2. Paste it into Claude.ai\n';
        instructions += '3. Copy the response and paste it back into SpecVerse\n';
        instructions += '4. Session ID for tracking: ';
        break;
      case 'gemini':
        instructions += '1. Copy the prompt above\n';
        instructions += '2. Paste it into Google Gemini\n';
        instructions += '3. Copy the response and paste it back into SpecVerse\n';
        instructions += '4. Session ID for tracking: ';
        break;
      default:
        instructions += '1. Copy the prompt above\n';
        instructions += '2. Paste it into your preferred AI interface\n';
        instructions += '3. Copy the response and paste it back into SpecVerse\n';
        instructions += '4. Session ID for tracking: ';
    }

    return prompt + instructions;
  }

  private async outputPrompt(session: InteractiveSession): Promise<void> {
    const separator = '='.repeat(80);

    console.log('\n' + separator);
    console.log(`🤖 SpecVerse Interactive LLM Session`);
    console.log(`📋 Session ID: ${session.id}`);
    console.log(`🎯 Interface: ${session.interface}`);
    console.log(`⏰ Timestamp: ${session.timestamp}`);
    console.log(separator);
    console.log('\n📝 PROMPT TO COPY:\n');
    console.log(session.prompt);
    console.log('\n' + separator);

    // Also write to file if configured
    if (this.config.outputFile) {
      const fs = await import('fs');
      const content = `${separator}\n` +
                    `SpecVerse Interactive LLM Session\n` +
                    `Session ID: ${session.id}\n` +
                    `Interface: ${session.interface}\n` +
                    `Timestamp: ${session.timestamp}\n` +
                    `${separator}\n\n` +
                    `PROMPT:\n${session.prompt}\n\n` +
                    `${separator}\n\n`;

      fs.appendFileSync(this.config.outputFile, content);
      console.log(`📁 Prompt saved to: ${this.config.outputFile}`);
    }
  }

  private async waitForUserResponse(sessionId: string): Promise<string> {
    const readline = await import('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('\n💭 Waiting for AI response...');
      console.log('📋 Paste the AI response below and press Enter twice when done:\n');

      let response = '';
      let emptyLines = 0;

      rl.on('line', (line) => {
        if (line.trim() === '') {
          emptyLines++;
          if (emptyLines >= 2) {
            rl.close();
            resolve(response.trim());
            return;
          }
        } else {
          emptyLines = 0;
        }
        response += line + '\n';
      });
    });
  }

  private parseUserResponse(response: string): LLMCompletionResponse {
    return {
      content: response,
      usage: {
        prompt_tokens: 0, // Not available in interactive mode
        completion_tokens: response.split(' ').length,
        total_tokens: response.split(' ').length,
      },
      finish_reason: 'stop',
      model: `interactive-${this.config.interface || 'generic'}`,
    };
  }

  private createInstructionalResponse(sessionId: string): LLMCompletionResponse {
    const instructions = `Interactive session created: ${sessionId}

To complete this request:
1. Use the formatted prompt displayed above
2. Copy and paste it into your AI interface (${this.config.interface || 'generic'})
3. Copy the response
4. Use specverse.completeSession('${sessionId}', 'response') to process the result

Session tracking is available via specverse.getSessions()`;

    return {
      content: instructions,
      usage: {
        prompt_tokens: 0,
        completion_tokens: instructions.split(' ').length,
        total_tokens: instructions.split(' ').length,
      },
      finish_reason: 'stop',
      model: `interactive-${this.config.interface || 'generic'}`,
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected validateConfig(): void {
    super.validateConfig();

    const validInterfaces = ['chatgpt', 'claude', 'gemini', 'generic'];
    if (this.config.interface && !validInterfaces.includes(this.config.interface)) {
      throw new Error(`Invalid interface: ${this.config.interface}. Must be one of: ${validInterfaces.join(', ')}`);
    }
  }
}

/**
 * Factory function to create Interactive provider
 */
export function createInteractiveProvider(config: {
  interface?: 'chatgpt' | 'claude' | 'gemini' | 'generic';
  outputFile?: string;
  waitForInput?: boolean;
  formatInstructions?: boolean;
}): InteractiveProvider {
  return new InteractiveProvider({
    model: `interactive-${config.interface || 'generic'}`,
    interface: config.interface || 'generic',
    outputFile: config.outputFile,
    waitForInput: config.waitForInput ?? false,
    formatInstructions: config.formatInstructions ?? true,
    timeout: 0, // No timeout for interactive
    retries: 0, // No retries for interactive
  });
}
