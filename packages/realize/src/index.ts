/**
 * SpecVerse Code Realization
 *
 * Main entry point for code generation (realization) from SpecVerse specifications.
 * Transforms minimal specs into production-ready implementations.
 */

// Utilities
export * from './utils/index.js';

// Generators
export * from './generators/index.js';

// Library
export { InstanceFactoryLibrary, createDefaultLibrary } from './library/library.js';
export { createResolver } from './library/resolver.js';

// Code generator
export { createCodeGenerator } from './engines/code-generator.js';

// ============================================================================
// Engine adapter — implements SpecVerseEngine for discovery via EngineRegistry
// ============================================================================

import type { RealizeEngine, EngineInfo, GeneratedOutput } from '@specverse/types';
import { createDefaultLibrary } from './library/library.js';
import { createResolver } from './library/resolver.js';
import { createCodeGenerator } from './engines/code-generator.js';
import { loadManifest } from './utils/manifest-loader.js';

class SpecVerseRealizeEngine implements RealizeEngine {
  name = 'realize';
  version = '3.5.2';
  capabilities = ['realize', 'code-generation', 'manifest-resolution', 'instance-factories'];

  private library: any = null;
  private resolver: any = null;
  private codeGenerator: any = null;
  private initialized = false;

  async initialize(config?: {
    manifestPath?: string;
    workingDir?: string;
  }): Promise<void> {
    const workingDir = config?.workingDir || process.cwd();

    // Load instance factory library
    this.library = await createDefaultLibrary(workingDir);

    // Load and resolve manifest if provided
    if (config?.manifestPath) {
      const manifest = loadManifest(config.manifestPath);
      this.resolver = createResolver(this.library, manifest);
    }

    // Create code generator
    this.codeGenerator = createCodeGenerator();

    this.initialized = true;
  }

  getInfo(): EngineInfo {
    return { name: this.name, version: this.version, capabilities: this.capabilities };
  }

  resolve(capability: string): any {
    if (!this.resolver) throw new Error('Realize engine not initialized with manifest.');
    return this.resolver.resolveCapability(capability);
  }

  async generate(resolved: any, template: string, context: any): Promise<GeneratedOutput> {
    if (!this.codeGenerator) throw new Error('Realize engine not initialized.');
    return this.codeGenerator.generateFromTemplate(resolved, template, context);
  }
}

export const engine = new SpecVerseRealizeEngine();
export default engine;
export { SpecVerseRealizeEngine };
