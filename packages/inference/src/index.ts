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
    const models = ast.components?.flatMap((c: any) => c.models) || [];
    const result = await this._engine.inferCompleteSpecification(
      models, ast.components?.[0]?.name, options?.targetEnvironment || 'development'
    );
    return {
      component: result.component,
      deployments: result.deployments,
      yaml: '',
      validation: result.validation,
      statistics: result.statistics,
    };
  }
}

export const engine = new SpecVerseInferenceEngine();
export default engine;