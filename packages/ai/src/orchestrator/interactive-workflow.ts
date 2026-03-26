/**
 * Interactive Provider Workflow Manager
 * Handles the complete interactive AI workflow
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { InteractiveProvider } from '../providers/interactive-provider.js';

export interface InteractiveWorkflowConfig {
  sessionFile?: string;
  responseFile?: string;
  autoWatch?: boolean;
  timeout?: number;
}

export interface SessionResult {
  sessionId: string;
  prompt: string;
  response?: string;
  timestamp: string;
  interface: string;
  status: 'pending' | 'completed' | 'timeout';
}

export class InteractiveWorkflow {
  private provider: InteractiveProvider;
  private config: InteractiveWorkflowConfig;
  private activeSession?: SessionResult;

  constructor(provider: InteractiveProvider, config: InteractiveWorkflowConfig = {}) {
    this.provider = provider;
    this.config = {
      sessionFile: '.specverse/sessions/session.json',
      responseFile: '.specverse/responses/response.txt',
      autoWatch: false,
      timeout: 300000, // 5 minutes
      ...config
    };
  }

  /**
   * Execute interactive workflow with automatic response collection
   */
  async executeWithCollection(options: any): Promise<any> {
    console.log('Starting interactive AI workflow...\n');

    // Step 1: Generate and display prompt
    const response = await this.provider.complete(options);
    const sessions = this.provider.getSessions();
    const session = sessions[sessions.length - 1];

    this.activeSession = {
      sessionId: session.id,
      prompt: session.prompt,
      timestamp: session.timestamp,
      interface: session.interface,
      status: 'pending'
    };

    // Step 2: Save session for reference
    this.saveSession();

    // Step 3: Provide multiple ways to input response
    console.log('\nResponse Collection Options:');
    console.log('1. Paste response directly (press Enter to start)');
    console.log('2. Save response to file and press Enter');
    console.log(`3. Edit file: ${this.config.responseFile}`);
    console.log(`4. Use session API: completeSession("${session.id}", "response")`);

    if (this.config.autoWatch) {
      return this.waitForResponseFile();
    } else {
      return this.waitForDirectInput();
    }
  }

  /**
   * Wait for direct user input
   */
  private async waitForDirectInput(): Promise<any> {
    const readline = await import('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('\nPaste AI response below (press Enter twice when done):\n');

      let response = '';
      let emptyLines = 0;

      rl.on('line', (line) => {
        if (line.trim() === '') {
          emptyLines++;
          if (emptyLines >= 2) {
            rl.close();
            this.completeSession(response.trim());
            resolve(this.createCompletionResponse(response.trim()));
            return;
          }
        } else {
          emptyLines = 0;
        }
        response += line + '\n';
      });
    });
  }

  /**
   * Wait for response file to be created/updated
   */
  private async waitForResponseFile(): Promise<any> {
    const responseFile = this.config.responseFile!;

    console.log(`\nWatching for response in: ${responseFile}`);
    console.log('Save your AI response to this file and it will be automatically processed.\n');

    // Create empty response file if it doesn't exist
    if (!existsSync(responseFile)) {
      writeFileSync(responseFile, '# Paste your AI response here and save the file\n\n');
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkFile = () => {
        if (Date.now() - startTime > this.config.timeout!) {
          reject(new Error('Response timeout - no response received'));
          return;
        }

        try {
          const content = readFileSync(responseFile, 'utf8').trim();

          // Check if file has meaningful content (not just the placeholder)
          if (content &&
              !content.startsWith('#') &&
              content.length > 10) {

            console.log('Response received from file!');
            this.completeSession(content);
            resolve(this.createCompletionResponse(content));
            return;
          }
        } catch (_error) {
          // File doesn't exist or can't be read, continue waiting
        }

        // Check again in 1 second
        setTimeout(checkFile, 1000);
      };

      checkFile();
    });
  }

  /**
   * Complete session with response
   */
  private completeSession(response: string): void {
    if (this.activeSession) {
      this.activeSession.response = response;
      this.activeSession.status = 'completed';
      this.saveSession();

      console.log(`\nSession ${this.activeSession.sessionId} completed`);
      console.log(`Response length: ${response.length} characters`);
    }
  }

  /**
   * Save session data to file
   */
  private saveSession(): void {
    if (this.activeSession && this.config.sessionFile) {
      writeFileSync(
        this.config.sessionFile,
        JSON.stringify(this.activeSession, null, 2)
      );
    }
  }

  /**
   * Create standard completion response
   */
  private createCompletionResponse(content: string): any {
    return {
      content,
      usage: {
        prompt_tokens: 0, // Not available in interactive mode
        completion_tokens: content.split(' ').length,
        total_tokens: content.split(' ').length,
      },
      finish_reason: 'stop',
      model: this.activeSession?.interface || 'interactive',
      sessionId: this.activeSession?.sessionId
    };
  }

  /**
   * Get session history
   */
  getSessionHistory(): SessionResult[] {
    const sessions = this.provider.getSessions();
    return sessions.map(session => ({
      sessionId: session.id,
      prompt: session.prompt,
      timestamp: session.timestamp,
      interface: session.interface,
      status: session.status as any
    }));
  }

  /**
   * Resume a previous session
   */
  async resumeSession(sessionId: string): Promise<any> {
    const sessionFile = `.specverse/sessions/session-${sessionId}.json`;

    if (!existsSync(sessionFile)) {
      throw new Error(`Session file not found: ${sessionFile}`);
    }

    const session = JSON.parse(readFileSync(sessionFile, 'utf8'));

    if (session.status === 'completed') {
      return this.createCompletionResponse(session.response);
    }

    console.log(`Resuming session: ${sessionId}`);
    console.log(`Interface: ${session.interface}`);
    console.log(`Created: ${session.timestamp}\n`);
    console.log('Original prompt:');
    console.log(session.prompt);
    console.log('\n' + '='.repeat(80));

    this.activeSession = session;
    return this.waitForDirectInput();
  }
}

/**
 * Create workflow instance from configuration
 */
export function createInteractiveWorkflow(
  provider: InteractiveProvider,
  config: InteractiveWorkflowConfig = {}
): InteractiveWorkflow {
  return new InteractiveWorkflow(provider, config);
}

/**
 * CLI helper for interactive workflows
 */
export async function runInteractiveWorkflow(
  prompt: string,
  interface_type: 'chatgpt' | 'claude' | 'gemini' | 'generic' = 'chatgpt',
  options: InteractiveWorkflowConfig = {}
): Promise<string> {
  const { InteractiveProvider } = await import('../providers/interactive-provider.js');

  const provider = new InteractiveProvider({
    model: `interactive-${interface_type}`,
    interface: interface_type,
    waitForInput: false,
    formatInstructions: true
  });

  const workflow = new InteractiveWorkflow(provider, options);

  const response = await workflow.executeWithCollection({
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content;
}
