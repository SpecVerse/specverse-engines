/**
 * Template Engine Registry
 *
 * Manages multiple template engines and provides a unified
 * interface for rendering templates.
 */

import { TypeScriptTemplateEngine } from './typescript-engine.js';
import type {
  TemplateEngine,
  CodeTemplate,
  TemplateContext
} from '../types/index.js';

/**
 * Engine registry configuration
 */
export interface EngineRegistryConfig {
  /** Base directory for resolving template paths */
  baseDir?: string;

  /** Enable caching of loaded modules */
  enableCache?: boolean;

  /** Custom engine implementations */
  customEngines?: Map<string, TemplateEngine>;
}

/**
 * Engine not found error
 */
export class EngineNotFoundError extends Error {
  constructor(public engineType: string) {
    super(`Template engine "${engineType}" not found in registry`);
    this.name = 'EngineNotFoundError';
  }
}

/**
 * Template engine registry
 */
export class TemplateEngineRegistry {
  private engines: Map<string, TemplateEngine> = new Map();
  private config: EngineRegistryConfig;

  constructor(config: EngineRegistryConfig = {}) {
    this.config = config;

    // Register built-in engines
    this.registerDefaultEngines();

    // Register custom engines if provided
    if (config.customEngines) {
      for (const [type, engine] of config.customEngines.entries()) {
        this.register(type, engine);
      }
    }
  }

  /**
   * Register default built-in engines
   */
  private registerDefaultEngines(): void {
    // Register TypeScript engine
    const tsEngine = new TypeScriptTemplateEngine({
      baseDir: this.config.baseDir,
      enableCache: this.config.enableCache
    });
    this.register('typescript', tsEngine);

    // Handlebars and AI engines will be registered in future phases
    // this.register('handlebars', new HandlebarsTemplateEngine(...));
    // this.register('ai', new AITemplateEngine(...));
  }

  /**
   * Register a template engine
   */
  register(type: string, engine: TemplateEngine): void {
    this.engines.set(type, engine);
  }

  /**
   * Get a template engine by type
   */
  get(type: string): TemplateEngine {
    const engine = this.engines.get(type);
    if (!engine) {
      throw new EngineNotFoundError(type);
    }
    return engine;
  }

  /**
   * Check if an engine type is registered
   */
  has(type: string): boolean {
    return this.engines.has(type);
  }

  /**
   * Get all registered engine types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Render a template using the appropriate engine
   */
  async render(
    template: CodeTemplate,
    context: TemplateContext,
    options?: { basePath?: string }
  ): Promise<string> {
    const engine = this.get(template.engine);

    // If basePath is provided and engine is TypeScript, temporarily override baseDir
    if (options?.basePath && 'baseDir' in engine) {
      const originalBaseDir = (engine as any).baseDir;
      (engine as any).baseDir = options.basePath;
      try {
        return await engine.render(template, context);
      } finally {
        (engine as any).baseDir = originalBaseDir;
      }
    }

    return await engine.render(template, context);
  }

  /**
   * Render multiple templates in parallel
   */
  async renderMany(
    templates: Array<{ template: CodeTemplate; context: TemplateContext }>
  ): Promise<string[]> {
    const promises = templates.map(({ template, context }) =>
      this.render(template, context)
    );
    return await Promise.all(promises);
  }

  /**
   * Clear all engine caches
   */
  clearCaches(): void {
    for (const engine of this.engines.values()) {
      if ('clearCache' in engine && typeof engine.clearCache === 'function') {
        engine.clearCache();
      }
    }
  }

  /**
   * Get statistics about registered engines
   */
  getStats(): {
    registeredEngines: string[];
    engineStats: Record<string, any>;
  } {
    const engineStats: Record<string, any> = {};

    for (const [type, engine] of this.engines.entries()) {
      if ('getCacheStats' in engine && typeof engine.getCacheStats === 'function') {
        engineStats[type] = engine.getCacheStats();
      } else {
        engineStats[type] = { cached: false };
      }
    }

    return {
      registeredEngines: this.getRegisteredTypes(),
      engineStats
    };
  }
}

/**
 * Create a default template engine registry
 */
export function createDefaultRegistry(config?: EngineRegistryConfig): TemplateEngineRegistry {
  return new TemplateEngineRegistry(config);
}

/**
 * Global singleton registry (lazy-initialized)
 */
let globalRegistry: TemplateEngineRegistry | null = null;

/**
 * Get the global template engine registry
 */
export function getGlobalRegistry(): TemplateEngineRegistry {
  if (!globalRegistry) {
    globalRegistry = createDefaultRegistry();
  }
  return globalRegistry;
}

/**
 * Set the global template engine registry
 */
export function setGlobalRegistry(registry: TemplateEngineRegistry): void {
  globalRegistry = registry;
}

/**
 * Reset the global registry to null
 */
export function resetGlobalRegistry(): void {
  globalRegistry = null;
}
