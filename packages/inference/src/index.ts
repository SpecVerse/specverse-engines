/**
 * V3.1 Inference Engine - Entry Point
 * Exports complete inference engine functionality
 */

// Core inference engine
export * from './core/index.js';

// Logical inference capabilities
export * from './logical/index.js';

// Deployment inference capabilities
export * from './deployment/index.js';

// Comprehensive inference engine
export { ComprehensiveInferenceEngine } from './comprehensive-engine.js';
export type { ComprehensiveInferenceResult } from './comprehensive-engine.js';

// Quint → TypeScript transpiler
export { transpileEntityGuards, transpileQuintFile, generateGuardsModule, type TranspiledGuard } from './quint-transpiler.js';
export { transpileActions, generateActionsModule, type TranspiledAction } from './quint-transpiler.js';

// ============================================================================
// Engine adapter — implements SpecVerseEngine for discovery via EngineRegistry
// ============================================================================

import type { InferenceEngine, EngineInfo, ValidationResult, InferenceOptions, InferenceResult } from '@specverse/types';
import { ComprehensiveInferenceEngine } from './comprehensive-engine.js';

class SpecVerseInferenceEngine implements InferenceEngine {
  name = 'inference';
  version = '3.5.2';
  capabilities = ['infer', 'logical-inference', 'deployment-inference', 'rule-engine'];

  private _engine: ComprehensiveInferenceEngine | null = null;

  async initialize(config?: { options?: any; debug?: boolean }): Promise<void> {
    this._engine = new ComprehensiveInferenceEngine(config?.options || {}, config?.debug || false);
  }

  getInfo(): EngineInfo {
    return { name: this.name, version: this.version, capabilities: this.capabilities };
  }

  async loadRules(): Promise<ValidationResult> {
    if (!this._engine) throw new Error('Inference engine not initialized.');
    return this._engine.loadRules();
  }

  async infer(ast: any, options?: InferenceOptions): Promise<InferenceResult> {
    if (!this._engine) throw new Error('Inference engine not initialized.');
    await this._engine.loadRules();

    // Convert AST ModelSpec[] to inference ModelDefinition[]
    const astModels = ast.components?.flatMap((c: any) => c.models) || [];
    const models = astModels.map((model: any) => ({
      name: model.name,
      attributes: (model.attributes || []).map((attr: any) => ({
        name: attr.name,
        type: attr.type || 'String',
        required: attr.required || false,
        unique: attr.unique || false,
        default: attr.default,
        auto: attr.auto,
      })),
      relationships: (model.relationships || []).map((rel: any) => ({
        name: rel.name,
        type: rel.type,
        targetModel: rel.target,
        cascadeDelete: rel.cascade || false,
      })),
      lifecycle: model.lifecycles?.[0] ? {
        name: model.lifecycles[0].name,
        states: model.lifecycles[0].states || [],
        transitions: Object.entries(model.lifecycles[0].transitions || {}).map(([name, trans]: [string, any]) => ({
          name, from: trans.from, to: trans.to, conditions: trans.condition ? [trans.condition] : [],
        })),
      } : undefined,
      behaviors: model.behaviors ? Object.entries(model.behaviors).map(([name, b]: [string, any]) => ({
        name, description: b.description, parameters: b.parameters, returns: b.returns,
        requires: b.requires, ensures: b.ensures, publishes: b.publishes,
      })) : [],
      profiles: [],
      metadata: model.metadata || {},
    }));

    // Collect extension entity data (promotions, etc.) from components
    const extensionData: Record<string, any> = {};
    for (const component of ast.components || []) {
      if (component.promotions) extensionData.promotions = component.promotions;
    }

    const result = await this._engine.inferCompleteSpecification(
      models, ast.components?.[0]?.name, options?.targetEnvironment || 'development', extensionData
    );
    // Serialize to YAML format
    const yaml = await import('js-yaml');
    const specOutput: any = { components: {} };
    const componentName = ast.components?.[0]?.name || 'Generated';
    specOutput.components[componentName] = {
      version: ast.components?.[0]?.version || '3.5.2',
      description: ast.components?.[0]?.description,
      ...result.component,
    };
    if (result.deployments && Object.keys(result.deployments).length > 0) {
      specOutput.deployments = result.deployments;
    }
    const yamlOutput = yaml.dump(specOutput, { lineWidth: -1, noRefs: true });

    return {
      component: result.component,
      deployments: result.deployments,
      yaml: yamlOutput,
      validation: result.validation,
      statistics: {
        ...result.statistics,
        rulesApplied: result.statistics.totalRulesApplied,
      },
    };
  }
}

export const engine = new SpecVerseInferenceEngine();
export default engine;