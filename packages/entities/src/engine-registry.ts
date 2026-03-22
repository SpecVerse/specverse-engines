/**
 * Engine Registry — Runtime discovery and management of SpecVerse engines.
 *
 * Engines are independent packages that implement the SpecVerseEngine interface.
 * The registry discovers them from:
 *   1. Explicitly registered engines (programmatic)
 *   2. Node modules matching @specverse/engine-* pattern (auto-discovery)
 *   3. Configuration-specified engine packages
 *
 * This parallels how InstanceFactoryLibrary discovers instance factories,
 * but for engines (parser, inference, realize) instead of code generators.
 */

import type { SpecVerseEngine, EngineInfo } from '@specverse/types';

export interface EngineRegistryOptions {
  /** Additional package names to try loading as engines */
  additionalEngines?: string[];
  /** Disable auto-discovery of @specverse/engine-* packages */
  disableAutoDiscovery?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

export class EngineRegistry {
  private engines: Map<string, SpecVerseEngine> = new Map();
  private capabilityIndex: Map<string, string> = new Map(); // capability -> engine name
  private options: EngineRegistryOptions;

  constructor(options: EngineRegistryOptions = {}) {
    this.options = options;
  }

  /**
   * Register an engine explicitly.
   */
  register(engine: SpecVerseEngine): void {
    this.engines.set(engine.name, engine);

    // Index capabilities
    for (const capability of engine.capabilities) {
      this.capabilityIndex.set(capability, engine.name);
    }

    if (this.options.debug) {
      console.log(`[EngineRegistry] Registered engine: ${engine.name} v${engine.version} (${engine.capabilities.join(', ')})`);
    }
  }

  /**
   * Discover and register engines from node_modules.
   * Tries to import @specverse/engine-* packages and any additional configured packages.
   */
  async discover(): Promise<void> {
    const packagesToTry: string[] = [
      ...(this.options.additionalEngines || []),
    ];

    // Auto-discover @specverse/engine-* packages
    if (!this.options.disableAutoDiscovery) {
      const knownEnginePackages = [
        '@specverse/engine-parser',
        '@specverse/engine-inference',
        '@specverse/engine-realize',
      ];
      packagesToTry.push(...knownEnginePackages);
    }

    for (const packageName of packagesToTry) {
      try {
        const mod = await import(packageName);
        const engine: SpecVerseEngine | undefined =
          mod.default || mod.engine || mod.createEngine?.();

        if (engine && engine.name && engine.capabilities) {
          this.register(engine);
        }
      } catch {
        // Package not installed — skip silently
        if (this.options.debug) {
          console.log(`[EngineRegistry] Package not found: ${packageName}`);
        }
      }
    }
  }

  /**
   * Get an engine by name.
   */
  getEngine(name: string): SpecVerseEngine | undefined {
    return this.engines.get(name);
  }

  /**
   * Get the engine that provides a specific capability.
   */
  getEngineForCapability(capability: string): SpecVerseEngine | undefined {
    const engineName = this.capabilityIndex.get(capability);
    if (engineName) {
      return this.engines.get(engineName);
    }
    return undefined;
  }

  /**
   * Check if a capability is available from any registered engine.
   */
  hasCapability(capability: string): boolean {
    return this.capabilityIndex.has(capability);
  }

  /**
   * Get all registered engines.
   */
  getAllEngines(): SpecVerseEngine[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get info about all registered engines.
   */
  getRegistryInfo(): { engines: EngineInfo[]; capabilities: string[] } {
    return {
      engines: this.getAllEngines().map(e => e.getInfo()),
      capabilities: Array.from(this.capabilityIndex.keys()),
    };
  }

  /**
   * Get the number of registered engines.
   */
  get size(): number {
    return this.engines.size;
  }
}
