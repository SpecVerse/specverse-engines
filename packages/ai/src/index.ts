/**
 * SpecVerse AI Module
 * Main export point for all AI functionality
 */

export * from './commands/index.js';
export * from './core/ecosystem-prompt-manager.js';
export * from './types/index.js';
export * from './config-loader.js';

// ============================================================================
// Engine adapter — implements SpecVerseEngine for discovery via EngineRegistry
// ============================================================================

import type { SpecVerseEngine, EngineInfo } from '@specverse/types';

export interface AIEngine extends SpecVerseEngine {
  generatePrompt(spec: any, options?: any): Promise<string>;
  suggest(spec: any, context?: string): Promise<any[]>;
  template(name: string, options?: any): Promise<string>;
}

class SpecVerseAIEngine implements AIEngine {
  name = 'ai';
  version = '3.5.2';
  capabilities = ['ai-prompts', 'ai-suggestions', 'ai-templates'];

  private manager: any = null;

  async initialize(config?: any): Promise<void> {
    try {
      const { EcosystemPromptManager } = await import('./core/ecosystem-prompt-manager.js');
      this.manager = new EcosystemPromptManager(config);
    } catch {
      // Manager may not be available in all contexts
    }
  }

  getInfo(): EngineInfo {
    return { name: this.name, version: this.version, capabilities: this.capabilities };
  }

  async generatePrompt(spec: any, options?: any): Promise<string> {
    // Try the full prompt manager first, fall back to simple output
    try {
      if (this.manager?.generateClaudePrompt) {
        return await this.manager.generateClaudePrompt(spec, options);
      }
      if (this.manager?.generateTerminalPrompt) {
        return await this.manager.generateTerminalPrompt(spec, options);
      }
    } catch {
      // Fall through to simple prompt
    }

    // Simple prompt generation from spec structure
    const models = spec?.components?.flatMap?.((c: any) => c.models || []) || [];
    const modelNames = models.map((m: any) => m.name).join(', ');
    return `# AI Implementation Prompt\n\nImplement the following SpecVerse specification with ${models.length} models: ${modelNames}\n\n## Specification\n\n\`\`\`yaml\n${JSON.stringify(spec, null, 2)}\n\`\`\`\n\n## Instructions\n\nGenerate a complete implementation following the specification above.`;
  }

  async suggest(spec: any, _context?: string): Promise<any[]> {
    if (!this.manager) {
      return [{ description: 'AI suggestions require the AI engine to be fully initialized' }];
    }
    return this.manager.suggest?.(spec) || [];
  }

  async template(name: string, options?: any): Promise<string> {
    if (!this.manager) {
      return `# Template: ${name}\n\n// Implementation template not available`;
    }
    return this.manager.loadTemplate?.(name, options) || `# Template: ${name}`;
  }
}

export const engine = new SpecVerseAIEngine();
export default engine;
export { SpecVerseAIEngine };
