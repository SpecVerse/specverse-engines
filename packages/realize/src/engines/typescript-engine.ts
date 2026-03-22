/**
 * TypeScript Template Engine
 *
 * Executes TypeScript generator functions to produce code.
 * This is the primary template engine for Phase 1.
 */

import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';
import { existsSync } from 'fs';
import type {
  TemplateEngine,
  CodeTemplate,
  TemplateContext,
  ValidationResult
} from '../types/index.js';

/**
 * Generator function signature
 */
export type GeneratorFunction = (context: TemplateContext) => string | Promise<string>;

/**
 * Validator function signature
 */
export type ValidatorFunction = (
  code: string,
  context: TemplateContext
) => ValidationResult | Promise<ValidationResult>;

/**
 * Post-processor function signature
 */
export type PostProcessorFunction = (
  code: string,
  context: TemplateContext
) => string | Promise<string>;

/**
 * Template engine error
 */
export class TemplateEngineError extends Error {
  constructor(
    message: string,
    public templateName?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'TemplateEngineError';
  }
}

/**
 * TypeScript template engine implementation
 */
export class TypeScriptTemplateEngine implements TemplateEngine {
  private generatorCache: Map<string, GeneratorFunction> = new Map();
  private validatorCache: Map<string, ValidatorFunction> = new Map();
  private postProcessorCache: Map<string, PostProcessorFunction> = new Map();
  private baseDir: string;
  private tsxRegistered: boolean = false;

  constructor(options: { baseDir?: string; enableCache?: boolean } = {}) {
    this.baseDir = options.baseDir || process.cwd();
  }

  /**
   * Register tsx to enable TypeScript imports (lazy-loaded)
   */
  private async ensureTsxRegistered(): Promise<void> {
    if (!this.tsxRegistered) {
      try {
        // Resolve tsx from @specverse/lang package's node_modules
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // From dist/realize/engines/ go up to package root
        const packageRoot = path.resolve(__dirname, '../../..');
        const tsxPath = path.join(packageRoot, 'node_modules/tsx/dist/esm/api/index.mjs');

        // Use dynamic import with absolute path
        const tsx = await import(pathToFileURL(tsxPath).href) as any;
        // Register tsx with options to allow node_modules processing
        tsx.register({
          namespace: Math.random().toString(),
          onImport: () => {}
        });
        this.tsxRegistered = true;
      } catch (error) {
        // tsx not available, .ts imports will fail
        console.warn('tsx not available, TypeScript template files may not load');
      }
    }
  }

  /**
   * Render a template with the given context
   */
  async render(template: CodeTemplate, context: TemplateContext): Promise<string> {
    // Validate template
    if (template.engine !== 'typescript') {
      throw new TemplateEngineError(
        `TypeScript engine cannot render template with engine type "${template.engine}"`
      );
    }

    if (!template.generator) {
      throw new TemplateEngineError(
        'TypeScript template requires "generator" path to be specified'
      );
    }

    try {
      // Load and execute generator
      const generator = await this.loadGenerator(template.generator);
      let code = await generator(context);

      // Run validators if specified
      if (template.validators && template.validators.length > 0) {
        for (const validatorPath of template.validators) {
          const validator = await this.loadValidator(validatorPath);
          const result = await validator(code, context);

          if (!result.valid) {
            throw new TemplateEngineError(
              `Validation failed:\n${(result.errors || []).map(e => `  - ${e}`).join('\n')}`,
              template.generator
            );
          }

          // Log warnings if any
          if (result.warnings && result.warnings.length > 0) {
            console.warn(`Validation warnings:\n${result.warnings.map(w => `  - ${w}`).join('\n')}`);
          }
        }
      }

      // Run post-processors if specified
      if (template.postProcessors && template.postProcessors.length > 0) {
        for (const processorPath of template.postProcessors) {
          const processor = await this.loadPostProcessor(processorPath);
          code = await processor(code, context);
        }
      }

      return code;
    } catch (error) {
      if (error instanceof TemplateEngineError) {
        throw error;
      }

      throw new TemplateEngineError(
        `Failed to render template: ${error instanceof Error ? error.message : String(error)}`,
        template.generator,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Load a generator function from a file path
   */
  private async loadGenerator(generatorPath: string): Promise<GeneratorFunction> {
    // Check cache
    if (this.generatorCache.has(generatorPath)) {
      return this.generatorCache.get(generatorPath)!;
    }

    try {
      // Resolve path
      let fullPath = path.isAbsolute(generatorPath)
        ? generatorPath
        : path.join(this.baseDir, generatorPath);

      const DEBUG = process.env.SPECVERSE_DEBUG === 'true';

      if (DEBUG) {
        console.log(`[typescript-engine] Loading generator:`);
        console.log(`  generatorPath: ${generatorPath}`);
        console.log(`  baseDir: ${this.baseDir}`);
        console.log(`  fullPath: ${fullPath}`);
      }

      let module: any;

      // If path is a TypeScript file in libs/, try to load compiled JS from dist/libs/ first
      if (fullPath.includes('/libs/') && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        const jsPath = fullPath.replace('/libs/', '/dist/libs/').replace(/\.tsx?$/, '.js');
        if (DEBUG) console.log(`[typescript-engine] Checking for compiled JS: ${jsPath}`);
        if (existsSync(jsPath)) {
          if (DEBUG) console.log(`[typescript-engine] ✅ Using compiled JS instead of TS`);
          fullPath = jsPath;
        } else {
          if (DEBUG) console.log(`[typescript-engine] ❌ Compiled JS not found, will use TS (may fail in node_modules)`);
        }
      } else {
        if (DEBUG) console.log(`[typescript-engine] Skipping JS check (not a libs/ TypeScript file)`);
      }

      // Try using tsx.tsImport for TypeScript files (bypasses node_modules restriction)
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        try {
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const packageRoot = path.resolve(__dirname, '../../..');
          const tsxPath = path.join(packageRoot, 'node_modules/tsx/dist/esm/api/index.mjs');

          const tsx = await import(pathToFileURL(tsxPath).href) as any;

          // Use tsImport to load TypeScript files from node_modules
          if (tsx.tsImport) {
            module = await tsx.tsImport(fullPath, import.meta.url);
          } else {
            // Fallback to regular import for tsx versions without tsImport
            await this.ensureTsxRegistered();
            const fileUrl = pathToFileURL(fullPath).href;
            module = await import(fileUrl);
          }
        } catch (tsxError) {
          // If tsx fails, try regular import
          await this.ensureTsxRegistered();
          const fileUrl = pathToFileURL(fullPath).href;
          module = await import(fileUrl);
        }
      } else {
        // Regular JavaScript file
        const fileUrl = pathToFileURL(fullPath).href;
        module = await import(fileUrl);
      }

      // Get the generator function (default export or named export)
      const generator = module.default || module.generate || module.generator;

      if (typeof generator !== 'function') {
        throw new Error(
          `Generator module must export a function as default export or named "generate" or "generator"`
        );
      }

      // Cache it
      this.generatorCache.set(generatorPath, generator);

      return generator;
    } catch (error) {
      throw new TemplateEngineError(
        `Failed to load generator from "${generatorPath}": ${error instanceof Error ? error.message : String(error)}`,
        generatorPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Load a validator function from a file path
   */
  private async loadValidator(validatorPath: string): Promise<ValidatorFunction> {
    // Check cache
    if (this.validatorCache.has(validatorPath)) {
      return this.validatorCache.get(validatorPath)!;
    }

    try {
      // Resolve path
      const fullPath = path.isAbsolute(validatorPath)
        ? validatorPath
        : path.join(this.baseDir, validatorPath);

      // Import the module
      const fileUrl = pathToFileURL(fullPath).href;
      const module = await import(fileUrl);

      // Get the validator function
      const validator = module.default || module.validate || module.validator;

      if (typeof validator !== 'function') {
        throw new Error(
          `Validator module must export a function as default export or named "validate" or "validator"`
        );
      }

      // Cache it
      this.validatorCache.set(validatorPath, validator);

      return validator;
    } catch (error) {
      throw new TemplateEngineError(
        `Failed to load validator from "${validatorPath}": ${error instanceof Error ? error.message : String(error)}`,
        validatorPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Load a post-processor function from a file path
   */
  private async loadPostProcessor(processorPath: string): Promise<PostProcessorFunction> {
    // Check cache
    if (this.postProcessorCache.has(processorPath)) {
      return this.postProcessorCache.get(processorPath)!;
    }

    try {
      // Resolve path
      const fullPath = path.isAbsolute(processorPath)
        ? processorPath
        : path.join(this.baseDir, processorPath);

      // Import the module
      const fileUrl = pathToFileURL(fullPath).href;
      const module = await import(fileUrl);

      // Get the processor function
      const processor = module.default || module.process || module.postProcess;

      if (typeof processor !== 'function') {
        throw new Error(
          `Post-processor module must export a function as default export or named "process" or "postProcess"`
        );
      }

      // Cache it
      this.postProcessorCache.set(processorPath, processor);

      return processor;
    } catch (error) {
      throw new TemplateEngineError(
        `Failed to load post-processor from "${processorPath}": ${error instanceof Error ? error.message : String(error)}`,
        processorPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.generatorCache.clear();
    this.validatorCache.clear();
    this.postProcessorCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    generators: number;
    validators: number;
    postProcessors: number;
  } {
    return {
      generators: this.generatorCache.size,
      validators: this.validatorCache.size,
      postProcessors: this.postProcessorCache.size
    };
  }
}
