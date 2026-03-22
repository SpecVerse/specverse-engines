/**
 * Code Generator
 *
 * Orchestrates code generation using instance factories,
 * template engines, and configuration.
 */

import path from 'path';
import { TemplateEngineRegistry, createDefaultRegistry } from './engine-registry.js';
import type {
  ResolvedImplementation,
  TemplateContext,
  CodeTemplate
} from '../types/index.js';

/**
 * Generated code output
 */
export interface GeneratedOutput {
  /** Generated code content */
  code: string;

  /** Output file path */
  filePath: string;

  /** Template that was used */
  templateName: string;

  /** Instance factory that was used */
  instanceFactory: string;
}

/**
 * Code generation options
 */
export interface CodeGenerationOptions {
  /** Base output directory */
  outputDir?: string;

  /** Template engine registry (defaults to global) */
  engineRegistry?: TemplateEngineRegistry;

  /** Dry run (don't write files, just return code) */
  dryRun?: boolean;

  /** Additional context to merge */
  additionalContext?: Record<string, any>;
}

/**
 * Code generator orchestrator
 */
export class CodeGenerator {
  private engineRegistry: TemplateEngineRegistry;
  private outputDir: string;

  constructor(options: CodeGenerationOptions = {}) {
    this.engineRegistry = options.engineRegistry || createDefaultRegistry();
    this.outputDir = options.outputDir || process.cwd();
  }

  /**
   * Generate code for a specific template
   */
  async generateFromTemplate(
    resolved: ResolvedImplementation,
    templateName: string,
    context: Partial<TemplateContext>,
    options: CodeGenerationOptions = {}
  ): Promise<GeneratedOutput> {
    // Get template from instance factory
    const template = resolved.instanceFactory.codeTemplates[templateName];
    if (!template) {
      throw new Error(
        `Template "${templateName}" not found in instance factory "${resolved.instanceFactory.name}"`
      );
    }

    // Build complete context with default template variables
    const fullContext: TemplateContext = {
      spec: context.spec,
      factory: resolved.instanceFactory,
      model: context.model,
      controller: context.controller,
      service: context.service,
      instance: resolved.instance,
      // Default directory variables for monorepo structure
      workspaceRoot: process.cwd(),
      backendDir: 'backend',
      frontendDir: 'frontend',
      ...(resolved.configuration || {}),
      ...(options.additionalContext || {}),
      ...context
    };

    // Render template with basePath for template file resolution
    const code = await this.engineRegistry.render(
      template,
      fullContext,
      { basePath: resolved.basePath }
    );

    // Resolve output path
    const filePath = this.resolveOutputPath(template, fullContext, options.outputDir);

    return {
      code,
      filePath,
      templateName,
      instanceFactory: resolved.instanceFactory.name
    };
  }

  /**
   * Generate code for all templates in an instance factory
   */
  async generateAll(
    resolved: ResolvedImplementation,
    context: Partial<TemplateContext>,
    options: CodeGenerationOptions = {}
  ): Promise<GeneratedOutput[]> {
    const outputs: GeneratedOutput[] = [];
    const templateNames = Object.keys(resolved.instanceFactory.codeTemplates);

    for (const templateName of templateNames) {
      try {
        const output = await this.generateFromTemplate(
          resolved,
          templateName,
          context,
          options
        );
        outputs.push(output);
      } catch (error) {
        console.error(
          `Failed to generate from template "${templateName}": ${error instanceof Error ? error.message : String(error)}`
        );
        // Continue with other templates
      }
    }

    return outputs;
  }

  /**
   * Generate code for multiple resolved implementations
   */
  async generateForDeployment(
    resolved: ResolvedImplementation[],
    context: Partial<TemplateContext>,
    options: CodeGenerationOptions = {}
  ): Promise<Map<string, GeneratedOutput[]>> {
    const outputsByCapability = new Map<string, GeneratedOutput[]>();

    for (const impl of resolved) {
      const outputs = await this.generateAll(impl, context, options);
      outputsByCapability.set(impl.capability, outputs);
    }

    return outputsByCapability;
  }

  /**
   * Resolve output path from template pattern
   *
   * Supports variable substitution:
   * - {controller} → context.controller.name
   * - {model} → context.model.name
   * - {service} → context.service.name
   * - {operation} → context.operation
   * - etc.
   */
  private resolveOutputPath(
    template: CodeTemplate,
    context: TemplateContext,
    outputDir?: string
  ): string {
    const baseDir = outputDir || this.outputDir;

    // If outputDir looks like a file (has an extension), use it directly
    if (outputDir && /\.\w+$/.test(outputDir)) {
      return outputDir;
    }

    let pattern = template.outputPattern;

    // Replace directory structure variables (for monorepo support)
    const outputStructure = context.outputStructure || context.configuration?.outputStructure || 'monorepo';
    const frontendDir = outputStructure === 'standalone' ? '.' : (context.frontendDir || context.configuration?.frontendDir || 'frontend');
    const backendDir = outputStructure === 'standalone' ? '.' : (context.backendDir || context.configuration?.backendDir || 'backend');

    pattern = pattern.replace(/\{frontendDir\}/g, frontendDir);
    pattern = pattern.replace(/\{backendDir\}/g, backendDir);

    // Replace variables
    pattern = pattern.replace(/\{controller\}/g, this.getContextValue(context, 'controller', 'name'));
    pattern = pattern.replace(/\{model\}/g, this.getContextValue(context, 'model', 'name'));
    pattern = pattern.replace(/\{service\}/g, this.getContextValue(context, 'service', 'name'));
    pattern = pattern.replace(/\{operation\}/g, this.getContextValue(context, 'operation'));
    pattern = pattern.replace(/\{instance\}/g, this.getContextValue(context, 'instance', 'name'));
    pattern = pattern.replace(/\{view\.name\}/g, this.getContextValue(context, 'view', 'name'));
    pattern = pattern.replace(/\{view\}/g, this.getContextValue(context, 'view', 'name'));

    // Replace configuration variables (e.g., {config.outputDir})
    pattern = pattern.replace(/\{config\.([^}]+)\}/g, (_, key) => {
      return String(context[key] || '');
    });

    // Resolve to absolute path
    return path.join(baseDir, pattern);
  }

  /**
   * Get a value from context, supporting nested properties
   */
  private getContextValue(
    context: TemplateContext,
    key: string,
    nestedKey?: string
  ): string {
    const value = context[key];
    if (!value) return '';

    if (nestedKey && typeof value === 'object') {
      return String((value as any)[nestedKey] || '');
    }

    return String(value);
  }

  /**
   * Get the template engine registry
   */
  getEngineRegistry(): TemplateEngineRegistry {
    return this.engineRegistry;
  }

  /**
   * Set the output directory
   */
  setOutputDir(dir: string): void {
    this.outputDir = dir;
  }

  /**
   * Get the output directory
   */
  getOutputDir(): string {
    return this.outputDir;
  }
}

/**
 * Create a code generator with default configuration
 */
export function createCodeGenerator(options?: CodeGenerationOptions): CodeGenerator {
  return new CodeGenerator(options);
}
