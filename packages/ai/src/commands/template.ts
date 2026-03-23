/**
 * Action 1: Template Retrieval
 * Get raw prompt template for specified operation
 */

import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import type { AIOperation, PromptTemplate, AICommandOptions } from '../types/index.js';
import { resolvePromptPath, validatePromptPath } from '../prompt-loader.js';

export async function getTemplate(operation: AIOperation, options: AICommandOptions = {}): Promise<PromptTemplate> {
  try {
    // Resolve prompt path based on version
    const pver = options.pver || 'v1';
    const promptDir = resolvePromptPath(pver);

    // Validate prompt path and operation
    const validation = validatePromptPath(promptDir, operation);
    if (!validation.valid) {
      throw new Error(`Invalid prompt configuration: ${validation.errors.join(', ')}`);
    }

    // Load template from versioned prompts directory
    const templatePath = join(promptDir, `${operation}.prompt.yaml`);
    const templateContent = await readFile(templatePath, 'utf8');
    const templateData = yaml.load(templateContent) as any;

    // Construct schema paths (always available, even for raw templates)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const schemaDir = resolve(__dirname, '../../../schema');
    const aiSchemaPath = join(schemaDir, 'SPECVERSE-SCHEMA-AI.yaml');
    const referenceExamplePath = join(schemaDir, 'MINIMAL-SYNTAX-REFERENCE.specly');

    // Build comprehensive system prompt from all system sections
    let systemPrompt = '';
    if (templateData.system?.role) {
      systemPrompt += templateData.system.role.trim();
    }
    if (templateData.system?.context) {
      if (systemPrompt) systemPrompt += '\n\n';
      systemPrompt += '## Context\n' + templateData.system.context.trim();
    }
    if (templateData.system?.capabilities) {
      if (systemPrompt) systemPrompt += '\n\n';
      systemPrompt += '## Capabilities\n';
      const toBullet = (item: any) => {
        if (typeof item === 'string') return `- ${item}`;
        if (Array.isArray(item)) return `- ${item.join(', ')}`;
        if (item && typeof item === 'object') {
          const entries = Object.entries(item).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`);
          return `- ${entries.join(', ')}`;
        }
        return `- ${String(item)}`;
      };
      if (Array.isArray(templateData.system.capabilities)) {
        systemPrompt += templateData.system.capabilities.map((c: any) => toBullet(c)).join('\n');
      } else {
        systemPrompt += typeof templateData.system.capabilities === 'string'
          ? templateData.system.capabilities
          : toBullet(templateData.system.capabilities);
      }
    }
    if (templateData.system?.constraints) {
      if (systemPrompt) systemPrompt += '\n\n';
      systemPrompt += '## Constraints\n';
      const toBullet = (item: any) => {
        if (typeof item === 'string') return `- ${item}`;
        if (Array.isArray(item)) return `- ${item.join(', ')}`;
        if (item && typeof item === 'object') {
          const entries = Object.entries(item).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`);
          return `- ${entries.join(', ')}`;
        }
        return `- ${String(item)}`;
      };
      if (Array.isArray(templateData.system.constraints)) {
        systemPrompt += templateData.system.constraints.map((c: any) => toBullet(c)).join('\n');
      } else {
        systemPrompt += typeof templateData.system.constraints === 'string'
          ? templateData.system.constraints
          : toBullet(templateData.system.constraints);
      }
    }

    // Build comprehensive context from includes and examples
    let contextPrompt = '';
    if (templateData.context?.includes) {
      if (Array.isArray(templateData.context.includes)) {
        contextPrompt += '## Includes\n' + templateData.context.includes.map((i: any) => 
          typeof i === 'string' ? `- ${i}` : `- ${Object.keys(i)[0]}: ${Object.values(i)[0]}`
        ).join('\n');
      }
    }
    if (templateData.examples && Array.isArray(templateData.examples)) {
      if (contextPrompt) contextPrompt += '\n\n';
      contextPrompt += '## Examples\n\n';
      templateData.examples.forEach((example: any, index: number) => {
        contextPrompt += `**Example ${index + 1}: ${example.name}**\n`;
        if (example.description) contextPrompt += `${example.description}\n\n`;
        if (example.input?.requirements) {
          contextPrompt += `Requirements: "${example.input.requirements.replace(/\n/g, ' ')}"\n`;
        }
        if (example.output) {
          contextPrompt += `Output:\n\`\`\`yaml\n${example.output.trim()}\n\`\`\`\n`;
        }
        if (example.explanation) {
          contextPrompt += `\nExplanation: ${example.explanation.trim()}\n`;
        }
        contextPrompt += '\n---\n\n';
      });
    }

    // Replace schema path variables (always, even for raw templates)
    const replaceSchemaVars = (text: string): string => {
      return text
        .replace(/\{\{\s*aiSchemaPath\s*\}\}/g, aiSchemaPath)
        .replace(/\{\{\s*referenceExamplePath\s*\}\}/g, referenceExamplePath)
        .replace(/\{\{\s*referenceSchemaPath\s*\}\}/g, referenceExamplePath); // Legacy support
    };

    return {
      name: templateData.name || `${operation}-template`,
      version: templateData.version || '3.1.0',
      system: replaceSchemaVars(systemPrompt || templateData.system || ''),
      user: replaceSchemaVars(templateData.user?.template || templateData.user || ''),
      context: contextPrompt ? replaceSchemaVars(contextPrompt) : '',
      variables: templateData.user?.variables?.map((v: any) => v.name) || []
    };
  } catch (error) {
    throw new Error(`Failed to load template for operation '${operation}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default getTemplate;
