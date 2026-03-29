/**
 * SpecVerse Generators
 *
 * Export all generator modules + engine adapter for EngineRegistry discovery.
 */

export {
  AIViewGenerator,
  type AIOptimizedSpec,
  type AIOptimizedAttribute,
  type AIOptimizedRelationship,
  type AIOptimizedBehavior,
  type AIOptimizedEndpoint,
  type AIOptimizedSubscription,
  type AIOptimizedModel,
  type AIOptimizedController,
  type AIOptimizedService,
  type AIOptimizedView,
  type AIOptimizedEvent,
  type ServiceOperationHint,
  type GenerationOptions,
  type ManifestConfig
} from './ai-view-generator.js';
export { UMLGenerator, type DiagramOptions } from './UML-generator.js';
export { DocumentationGenerator, type DocumentationOptions } from './documentation-generator.js';

// Diagram engine
export { UnifiedDiagramGenerator } from './diagram-engine/index.js';
export { createPluginsFromRegistry } from './diagram-engine/index.js';
export {
  ERDiagramPlugin,
  ClassDiagramPlugin,
  EventFlowPlugin,
  LifecyclePlugin,
  ArchitecturePlugin,
  DeploymentPlugin,
  ManifestPlugin,
  BaseDiagramPlugin,
  type DiagramType,
} from './diagram-engine/index.js';

// ============================================================================
// Engine adapter — implements SpecVerseEngine for discovery via EngineRegistry
// ============================================================================

import type { SpecVerseEngine, EngineInfo } from '@specverse/types';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { UMLGenerator } from './UML-generator.js';
import { DocumentationGenerator } from './documentation-generator.js';
import { UnifiedDiagramGenerator, createPluginsFromRegistry } from './diagram-engine/index.js';

export interface GeneratorsEngine extends SpecVerseEngine {
  generateDiagrams(ast: any, options?: { type?: string; outputDir?: string; theme?: string }): Promise<Map<string, string>>;
  generateDocs(ast: any, options?: { format?: string }): Promise<string>;
  generateUML(ast: any, options?: { type?: string }): Promise<string>;
}

class SpecVerseGeneratorsEngine implements GeneratorsEngine {
  name = 'generators';
  version = '3.5.2';
  capabilities = ['generate-diagrams', 'generate-docs', 'generate-uml'];

  async initialize(): Promise<void> {
    // Generators are stateless — no initialization needed
  }

  getInfo(): EngineInfo {
    return { name: this.name, version: this.version, capabilities: this.capabilities };
  }

  async generateDiagrams(ast: any, options?: { type?: string; outputDir?: string; theme?: string }): Promise<Map<string, string>> {
    const generator = new UnifiedDiagramGenerator({
      plugins: createPluginsFromRegistry(),
      theme: (options?.theme as any) || 'default',
    });

    if (options?.type && options.type !== 'all') {
      const diagram = generator.generate(ast, options.type as any);
      const result = new Map<string, string>();
      result.set(options.type, diagram);
      return result;
    }

    return generator.generateAll(ast);
  }

  async generateDocs(ast: any, options?: { format?: string }): Promise<string> {
    const generator = new DocumentationGenerator();
    return generator.generate(ast, { format: (options?.format || 'markdown') as any });
  }

  async generateUML(ast: any, options?: { type?: string }): Promise<string> {
    const generator = new UMLGenerator();
    return generator.generate(ast, { type: (options?.type || 'all') as any });
  }
}

export const engine = new SpecVerseGeneratorsEngine();
export default engine;
export { SpecVerseGeneratorsEngine };
