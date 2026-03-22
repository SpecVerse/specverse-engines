/**
 * SpecVerse Unified Diagram Engine
 *
 * A comprehensive, extensible diagram generation system for SpecVerse specifications
 *
 * @example
 * ```typescript
 * import { UnifiedDiagramGenerator, EventFlowPlugin } from '@specverse/lang/diagram-engine';
 *
 * const generator = new UnifiedDiagramGenerator({
 *   plugins: [new EventFlowPlugin()],
 *   theme: 'default'
 * });
 *
 * const diagram = generator.generate(ast, 'event-flow-layered');
 * ```
 */

// Core exports
export { UnifiedDiagramGenerator } from './core/UnifiedDiagramGenerator.js';
export { DiagramContext } from './core/DiagramContext.js';
export { StyleManager, styleManager, THEMES } from './core/StyleManager.js';
export { BaseDiagramPlugin } from './core/BaseDiagramPlugin.js';

// Renderer exports
export { MermaidRenderer } from './renderers/MermaidRenderer.js';

// Type exports
export type {
  DiagramType,
  DiagramOptions,
  DiagramGeneratorConfig,
  DiagramPlugin,
  DiagramContext as IDiagramContext,
  OutputFormat,
  ThemeConfig,
  ColorPalette,
  ShapeConfig,
  LayoutConfig,
  MermaidDiagram,
  MermaidNode,
  MermaidEdge,
  Subgraph,
  MermaidRelation,
  MermaidState,
  MermaidTransition,
  MermaidLifecycle,
  ValidationResult
} from './types/index.js';

// Plugin exports
export { EventFlowPlugin } from './plugins/event-flow/EventFlowPlugin.js';
export { ERDiagramPlugin } from './plugins/er-diagram/ERDiagramPlugin.js';
export { ClassDiagramPlugin } from './plugins/class-diagram/ClassDiagramPlugin.js';
export { DeploymentPlugin } from './plugins/deployment/DeploymentPlugin.js';
export { LifecyclePlugin } from './plugins/lifecycle/LifecyclePlugin.js';
export { ManifestPlugin } from './plugins/manifest/ManifestPlugin.js';
export { ArchitecturePlugin } from './plugins/architecture/ArchitecturePlugin.js';

// Plugin registry — maps entity diagram type names to plugin factories
import { EventFlowPlugin as _EventFlowPlugin } from './plugins/event-flow/EventFlowPlugin.js';
import { ERDiagramPlugin as _ERDiagramPlugin } from './plugins/er-diagram/ERDiagramPlugin.js';
import { ClassDiagramPlugin as _ClassDiagramPlugin } from './plugins/class-diagram/ClassDiagramPlugin.js';
import { DeploymentPlugin as _DeploymentPlugin } from './plugins/deployment/DeploymentPlugin.js';
import { LifecyclePlugin as _LifecyclePlugin } from './plugins/lifecycle/LifecyclePlugin.js';
import { ManifestPlugin as _ManifestPlugin } from './plugins/manifest/ManifestPlugin.js';
import { ArchitecturePlugin as _ArchitecturePlugin } from './plugins/architecture/ArchitecturePlugin.js';
import type { DiagramPlugin } from './types/index.js';
import { bootstrapEntityModules, getEntityRegistry } from '@specverse/engine-entities';

const PLUGIN_FACTORIES: Record<string, () => DiagramPlugin> = {
  'er': () => new _ERDiagramPlugin(),
  'class': () => new _ClassDiagramPlugin(),
  'event-flow': () => new _EventFlowPlugin(),
  'lifecycle': () => new _LifecyclePlugin(),
  'architecture': () => new _ArchitecturePlugin(),
  'deployment': () => new _DeploymentPlugin(),
  'manifest': () => new _ManifestPlugin(),
};

/**
 * Create diagram plugins from entity registry declarations.
 * Deduplicates by type name (multiple entities may declare the same plugin type).
 */
export function createPluginsFromRegistry(): DiagramPlugin[] {
  bootstrapEntityModules();
  const declarations = getEntityRegistry().getAllDiagramPlugins();

  const seen = new Set<string>();
  const plugins: DiagramPlugin[] = [];

  for (const decl of declarations) {
    if (!seen.has(decl.type) && PLUGIN_FACTORIES[decl.type]) {
      seen.add(decl.type);
      plugins.push(PLUGIN_FACTORIES[decl.type]());
    }
  }

  return plugins;
}

/**
 * Create all available diagram plugins (convenience for backward compatibility).
 */
export function createAllPlugins(): DiagramPlugin[] {
  return Object.values(PLUGIN_FACTORIES).map(factory => factory());
}
