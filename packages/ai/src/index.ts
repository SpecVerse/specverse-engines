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

  async initialize(config?: { catalogPath?: string; provider?: string }): Promise<void> {
    try {
      const { EcosystemPromptManager } = await import('./core/ecosystem-prompt-manager.js');
      this.manager = new EcosystemPromptManager(config?.catalogPath);
    } catch (error) {
      console.warn(`AI engine initialization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getInfo(): EngineInfo {
    return { name: this.name, version: this.version, capabilities: this.capabilities };
  }

  async generatePrompt(spec: any, _options?: any): Promise<string> {
    const components = spec?.components || [];
    const lines: string[] = [];

    lines.push('# SpecVerse Implementation Prompt');
    lines.push('');
    lines.push('Implement the following specification. The spec is declarative — it defines WHAT, not HOW.');
    lines.push('');

    for (const component of components) {
      lines.push(`## Component: ${component.name}`);
      if (component.description) lines.push(`\n${component.description}`);
      lines.push('');

      // Models
      const models = component.models || [];
      if (models.length > 0) {
        lines.push(`### Models (${models.length})`);
        lines.push('');
        for (const model of models) {
          lines.push(`#### ${model.name}`);
          if (model.description) lines.push(model.description);
          const attrs = model.attributes || [];
          if (attrs.length > 0) {
            lines.push('');
            lines.push('| Attribute | Type | Required | Unique |');
            lines.push('|-----------|------|----------|--------|');
            for (const attr of attrs) {
              lines.push(`| ${attr.name} | ${attr.type || 'String'} | ${attr.required ? 'yes' : 'no'} | ${attr.unique ? 'yes' : 'no'} |`);
            }
          }
          const rels = model.relationships || [];
          if (rels.length > 0) {
            lines.push('');
            lines.push('**Relationships:**');
            for (const rel of rels) {
              lines.push(`- ${rel.name}: ${rel.type} ${rel.target}`);
            }
          }
          lines.push('');
        }
      }

      // Controllers
      const controllers = component.controllers || [];
      if (controllers.length > 0) {
        lines.push(`### Controllers (${controllers.length})`);
        for (const ctrl of controllers) {
          lines.push(`- **${ctrl.name}** → ${ctrl.modelReference || ctrl.model || 'unknown model'}`);
        }
        lines.push('');
      }

      // Services
      const services = component.services || [];
      if (services.length > 0) {
        lines.push(`### Services (${services.length})`);
        for (const svc of services) {
          lines.push(`- **${svc.name}**`);
          if (svc.operations) {
            for (const [opName, op] of Object.entries(svc.operations as Record<string, any>)) {
              lines.push(`  - ${opName}: ${op.description || ''}`);
            }
          }
        }
        lines.push('');
      }

      // Events
      const events = component.events || [];
      if (events.length > 0) {
        lines.push(`### Events (${events.length})`);
        for (const evt of events) {
          lines.push(`- **${evt.name}**`);
        }
        lines.push('');
      }
    }

    lines.push('## Implementation Guidelines');
    lines.push('');
    lines.push('1. Create database models matching the attribute and relationship specifications');
    lines.push('2. Implement CRUD controllers for each controller listed');
    lines.push('3. Add service methods as specified, with proper error handling');
    lines.push('4. Wire event handlers for cross-model communication');
    lines.push('5. Follow the relationship types: belongsTo (FK on this model), hasMany (FK on related model), hasOne, manyToMany');
    lines.push('');

    return lines.join('\n');
  }

  async suggest(spec: any, _context?: string): Promise<any[]> {
    const { analyseSpec } = await import('./commands/spec-analyser.js');
    return analyseSpec(spec);
  }

  async template(operation: string, options?: any): Promise<string> {
    try {
      const { getTemplate } = await import('./commands/template.js');
      const tmpl = await getTemplate(operation as any, { pver: options?.pver || 'default' });
      const lines: string[] = [];
      lines.push(`# ${tmpl.name}`);
      lines.push(`Version: ${tmpl.version}`);
      lines.push('');
      if (tmpl.system) {
        lines.push('## System Prompt');
        lines.push(tmpl.system);
        lines.push('');
      }
      if (tmpl.context) {
        lines.push('## Context');
        lines.push(tmpl.context);
        lines.push('');
      }
      if (tmpl.user) {
        lines.push('## User Prompt Template');
        lines.push(tmpl.user);
        lines.push('');
      }
      if (tmpl.variables && tmpl.variables.length > 0) {
        lines.push('## Variables');
        tmpl.variables.forEach((v: string) => lines.push(`- {{${v}}}`));
      }
      return lines.join('\n');
    } catch (error) {
      // Template loading failed (prompts not available) — return a useful default
      return `# Template: ${operation}\n\nPrompt templates are not available. Install prompts with: specverse init\n\nError: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

export const engine = new SpecVerseAIEngine();
export default engine;
export { SpecVerseAIEngine };
