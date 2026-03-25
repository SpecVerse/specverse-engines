/**
 * ClaudeExecutor
 * Handles Claude Code binary execution for session management
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import type { ClaudeInitOptions, ClaudeExecuteOptions } from './types.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ClaudeExecutor {
  private claudeBin: string;
  private schemaDir: string;

  constructor(config?: { claudeBin?: string; schemaDir?: string }) {
    this.claudeBin = config?.claudeBin || process.env.CLAUDE_BIN || this.detectClaudeBin();

    // Schema directory - relative to this file in dist/cli/session/
    // We need to go up to the package root
    this.schemaDir = config?.schemaDir || join(__dirname, '../../../schema');
  }

  /**
   * Detect Claude Code binary location
   */
  private detectClaudeBin(): string {
    // Try common locations
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const possiblePaths = [
      join(home, '.claude/local/claude'),
      'claude' // Global install via PATH
    ];

    for (const path of possiblePaths) {
      try {
        execSync(`${path} --version`, { stdio: 'pipe' });
        return path;
      } catch { // Binary not at this path — try next
        // Try next path
      }
    }

    // Default to common location
    return join(home, '.claude/local/claude');
  }

  /**
   * Initialize a new Claude Code session with schema loading
   */
  async initialize(options: ClaudeInitOptions): Promise<string> {
    // Build initialization prompt
    const prompt = this.buildInitPrompt(options);

    // Write prompt to temp file
    const tempDir = mkdtempSync(join(tmpdir(), 'claude-init-'));
    const promptFile = join(tempDir, 'init-prompt.txt');
    writeFileSync(promptFile, prompt, 'utf8');

    // Build Claude Code command
    const args: string[] = [
      '--session-id', options.sessionId,
      '--add-dir', this.schemaDir,
      '--add-dir', '.specverse/sessions',
      '--print',
      '--output-format', 'json',
      '--permission-mode', 'acceptEdits',
      '-p', `"${prompt}"`
    ];

    const command = `${this.claudeBin} ${args.join(' ')}`;

    try {
      // Execute Claude Code
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000 // 60 second timeout
      });

      // Verify schemas loaded
      if (!this.verifyInitialization(result)) {
        throw new Error('Failed to initialize session: schemas not loaded');
      }

      return options.sessionId;
    } catch (error: any) {
      throw new Error(`Claude Code initialization failed: ${error.message}`);
    }
  }

  /**
   * Resume existing Claude Code session with new prompt
   */
  async resume(sessionId: string, prompt: string): Promise<string> {
    const args: string[] = [
      '--resume', sessionId,
      '--print',
      '--output-format', 'json',
      '--permission-mode', 'acceptEdits',
      '-p', `"${prompt}"`
    ];

    const command = `${this.claudeBin} ${args.join(' ')}`;

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000 // 5 minute timeout for generation
      });

      return result;
    } catch (error: any) {
      throw new Error(`Claude Code resume failed: ${error.message}`);
    }
  }

  /**
   * Build initialization prompt for schema loading
   */
  private buildInitPrompt(options: ClaudeInitOptions): string {
    const schemaAI = join(this.schemaDir, 'SPECVERSE-SCHEMA-AI.yaml');
    const minimalRef = join(this.schemaDir, 'MINIMAL-SYNTAX-REFERENCE.specly');

    return `You are the SpecVerse AI Session Coordinator.

**Initial Setup** (this session only):
1. Read schema files to load SpecVerse v3.4+ syntax into your context:
   - ${schemaAI}
   - ${minimalRef}

2. Understand your role:
   - You will be resumed between requests to maintain schema context
   - Each resume will include generation requirements
   - You will generate SpecVerse specifications
   - Generated specs will be validated and expanded through inference

3. Session Details:
   - Session ID: ${options.sessionId}
   - Prompt Version: ${options.pver}
   - Schema Caching: Enabled (98% token savings)

**Important**: Report "Schema context loaded and ready" when initialization is complete.`;
  }

  /**
   * Verify initialization was successful
   */
  private verifyInitialization(result: string): boolean {
    // Check for success indicators in the response
    const successIndicators = [
      'schema context loaded',
      'schemas loaded',
      'context loaded',
      'ready',
      'initialization complete'
    ];

    const resultLower = result.toLowerCase();
    return successIndicators.some(indicator => resultLower.includes(indicator));
  }

  /**
   * Check if Claude Code binary is available
   */
  isAvailable(): boolean {
    try {
      execSync(`${this.claudeBin} --version`, { stdio: 'pipe' });
      return true;
    } catch { // Claude binary not available
      return false;
    }
  }

  /**
   * Get Claude Code version
   */
  getVersion(): string | null {
    try {
      const result = execSync(`${this.claudeBin} --version`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return result.trim();
    } catch { // Version check failed
      return null;
    }
  }
}
