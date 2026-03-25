/**
 * V3.1 Logical Inference Engine
 * Orchestrates the generation of complete logical specifications from minimal models
 */

import { 
  ModelDefinition, 
  LogicalComponentSpec, 
  InferenceContext,
  ValidationResult,
  InferenceEngineConfig,
  DEFAULT_ENGINE_CONFIG
} from '../core/types.js';
import { RuleEngine } from '../core/rule-engine.js';
import { RuleLoader } from '../core/rule-loader.js';
import { InferenceContextManager } from '../core/context.js';
import { ControllerGenerator } from './generators/controller-generator.js';
import { ServiceGenerator } from './generators/service-generator.js';
import { EventGenerator } from './generators/event-generator.js';
import { ViewGenerator } from './generators/view-generator.js';
import * as fs from 'fs';

export interface LogicalInferenceResult {
  specification: LogicalComponentSpec;
  validation: ValidationResult;
  statistics: {
    modelsProcessed: number;
    controllersGenerated: number;
    servicesGenerated: number;
    eventsGenerated: number;
    viewsGenerated: number;
    rulesApplied: number;
    processingTimeMs: number;
  };
}

export class LogicalInferenceEngine {
  private ruleLoader: RuleLoader;
  private contextManager: InferenceContextManager;
  // Registry of generators keyed by category name (replaces hardcoded fields)
  private generators: Map<string, { generator: any; configKey: string }> = new Map();
  private config: InferenceEngineConfig;

  constructor(
    config: Partial<InferenceEngineConfig> = {},
    debug: boolean = false
  ) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    const debugMode = debug || process.env.NODE_ENV === 'development';

    // Initialize core components
    this.ruleLoader = new RuleLoader(debugMode);
    this.contextManager = new InferenceContextManager(debugMode);

    // Register generators — data-driven, extensible via this map
    this.generators.set('controllers', { generator: new ControllerGenerator(debugMode), configKey: 'generateControllers' });
    this.generators.set('services', { generator: new ServiceGenerator(debugMode), configKey: 'generateServices' });
    this.generators.set('events', { generator: new EventGenerator(debugMode), configKey: 'generateEvents' });
    this.generators.set('views', { generator: new ViewGenerator(debugMode), configKey: 'generateViews' });

    // Extension entity generators — auto-discovered at runtime
    // Call discoverExtensionGenerators() after construction to load them
    this.discoverExtensionGenerators(debugMode);

    if (debugMode) {
      console.log('🚀 Logical Inference Engine initialized');
      console.log(`   Configuration: ${JSON.stringify(this.config.logical, null, 2)}`);
    }
  }

  /**
   * Register an additional generator for extension entity types.
   */
  registerGenerator(category: string, generator: any, configKey: string): void {
    this.generators.set(category, { generator, configKey });
  }

  /**
   * Auto-discover extension entity generators from the generators/ directory.
   * Scans for files matching *-generator.js that aren't core generators.
   */
  private discoverExtensionGenerators(debugMode: boolean): void {
    try {
      const generatorsDir = new URL('./generators/', import.meta.url);
      const generatorsDirPath = generatorsDir.pathname;

      if (!fs.existsSync(generatorsDirPath)) return;

      const coreGenerators = new Set(['controller-generator', 'service-generator', 'event-generator', 'view-generator',
                                       'component-type-resolver', 'specialist-view-expander']);

      for (const file of fs.readdirSync(generatorsDirPath)) {
        if (!file.endsWith('-generator.js')) continue;
        const baseName = file.replace('.js', '');
        if (coreGenerators.has(baseName)) continue;

        const category = baseName.replace(/-generator$/, '') + 's';
        const configKey = `generate${category.charAt(0).toUpperCase() + category.slice(1)}`;

        // Queue async discovery — will be resolved before first generate() call
        this._pendingExtGenerators.push({ file, category, configKey, debugMode });
      }
    } catch {
      // Discovery not available in all contexts
    }
  }

  private _pendingExtGenerators: Array<{ file: string; category: string; configKey: string; debugMode: boolean }> = [];

  /**
   * Load any pending extension generators (async, called before first inference run)
   */
  private async loadPendingExtGenerators(): Promise<void> {
    if (this._pendingExtGenerators.length === 0) return;

    const pending = this._pendingExtGenerators;
    this._pendingExtGenerators = [];

    for (const { file, category, configKey, debugMode } of pending) {
      try {
        const mod = await import(new URL(`./generators/${file}`, import.meta.url).href);
        const GeneratorClass = mod.PromotionGenerator || mod.default ||
          Object.values(mod).find((v: any) => typeof v === 'function' && v.prototype?.generate);
        if (GeneratorClass && typeof GeneratorClass === 'function') {
          const generator = new (GeneratorClass as any)(debugMode);
          this.generators.set(`_ext_${category}`, { generator, configKey });
          if (debugMode) console.log(`   Discovered extension generator: ${category}`);
        }
      } catch {
        // Generator not loadable — skip
      }
    }
  }

  /**
   * Load inference rules from configuration
   */
  async loadRules(): Promise<ValidationResult> {
    const startTime = Date.now();
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Try loading from configured directory first (build-time composed files).
      // Fall back to entity registry if directory doesn't exist (runtime approach).
      let loadedFromDir = false;
      if (fs.existsSync(this.config.rules.logicalRulesPath)) {
        const { ruleSets, validation: loadValidation } = await this.ruleLoader.loadRulesFromDirectory(
          this.config.rules.logicalRulesPath
        );

        validation.errors.push(...loadValidation.errors);
        validation.warnings.push(...loadValidation.warnings);

        if (!loadValidation.valid) {
          validation.valid = false;
          return validation;
        }
        loadedFromDir = true;
      }

      if (!loadedFromDir) {
        // Directory not available — try entity registry (runtime approach)
        const registryResult = await this.ruleLoader.loadRulesFromRegistry();
        if (!registryResult.loaded) {
          validation.errors.push({
            code: 'NO_RULES_SOURCE',
            message: `Rules directory not found (${this.config.rules.logicalRulesPath}) and entity registry not available`,
            location: 'loadRules'
          });
          validation.valid = false;
          return validation;
        }
        validation.errors.push(...registryResult.validation.errors);
        validation.warnings.push(...registryResult.validation.warnings);
      }

      // Extract and load rules into generators
      const logicalRules = this.ruleLoader.getLogicalRules();

      // Load rules into each registered generator
      for (const [category, { generator, configKey }] of this.generators) {
        const rules = (logicalRules as any)[category];
        if ((this.config.logical as any)[configKey] !== false && rules && rules.length > 0) {
          const ruleValidation = await generator.loadRules(rules);
          validation.errors.push(...ruleValidation.errors);
          validation.warnings.push(...ruleValidation.warnings);
          if (!ruleValidation.valid) validation.valid = false;
        }
      }

      // NOTE: Component mapping rules loading moved below specialist view rules
      // to use the smart loading pattern (domain-specific first, then legacy fallback)

      // Load specialist view rules (v3.4.0 Phase 3)
      // Try domain-specific format first, fall back to legacy format
      try {
        const { readFileSync } = await import('fs');
        const { join } = await import('path');
        const { isExpansionTemplateFile } = await import('../core/rule-file-types.js');

        // Try domain-specific format (v3.4-specialist-views.json)
        try {
          const domainSpecificPath = join(this.config.rules.logicalRulesPath, 'v3.4-specialist-views.json');
          const domainSpecificContent = readFileSync(domainSpecificPath, 'utf8');
          const domainSpecificRules = JSON.parse(domainSpecificContent);

          if (isExpansionTemplateFile(domainSpecificRules)) {
            (this.generators.get('views')!.generator as ViewGenerator).loadSpecialistViewRulesFromDomainSpecific(domainSpecificRules);
            console.log(`📋 Loaded v3.4 specialist views (domain-specific): ${(this.generators.get('views')!.generator as ViewGenerator)['specialistExpander'].getAvailableTypes().length} types`);
          }
        } catch {
          // Fall back to legacy format (v3.4-specialist-view-rules.json)
          const legacyPath = join(this.config.rules.logicalRulesPath, 'v3.4-specialist-view-rules.json');
          const legacyContent = readFileSync(legacyPath, 'utf8');
          const legacyRules = JSON.parse(legacyContent);
          (this.generators.get('views')!.generator as ViewGenerator).loadSpecialistViewRules(legacyRules);
          console.log(`📋 Loaded v3.4 specialist view rules (legacy): ${(this.generators.get('views')!.generator as ViewGenerator)['specialistExpander'].getAvailableTypes().length} types`);
        }
      } catch (error) {
        // Specialist view rules are optional - fallback to hardcoded dashboard generation
        console.log(`ℹ️  v3.4 specialist view rules not found, using legacy dashboard generation`);
      }

      // Load component mapping rules (v3.4.0 Phase 2)
      // Try domain-specific format first, fall back to legacy format
      try {
        const { readFileSync } = await import('fs');
        const { join } = await import('path');
        const { isConfigurationFile } = await import('../core/rule-file-types.js');

        // Try domain-specific format (v3.4-component-mappings.json)
        try {
          const domainSpecificPath = join(this.config.rules.logicalRulesPath, 'v3.4-component-mappings.json');
          const domainSpecificContent = readFileSync(domainSpecificPath, 'utf8');
          const domainSpecificRules = JSON.parse(domainSpecificContent);

          if (isConfigurationFile(domainSpecificRules)) {
            (this.generators.get('views')!.generator as ViewGenerator).loadComponentMappingsFromDomainSpecific(domainSpecificRules);
            console.log(`📋 Loaded v3.4 component mappings (domain-specific): ${domainSpecificRules.version}`);
          }
        } catch {
          // Fall back to legacy format (v3.4-view-component-inference.json)
          try {
            const legacyPath = join(this.config.rules.logicalRulesPath, 'v3.4-view-component-inference.json');
            const legacyContent = readFileSync(legacyPath, 'utf8');
            const legacyRules = JSON.parse(legacyContent);
            (this.generators.get('views')!.generator as ViewGenerator).loadComponentMappings(legacyRules);
            console.log(`📋 Loaded v3.4 component mappings (legacy): ${legacyRules.version}`);
          } catch {
            console.log(`ℹ️  v3.4 component mappings not found, using defaults`);
          }
        }
      } catch (error) {
        // Component mappings are optional
        console.log(`ℹ️  v3.4 component mappings not found, using defaults`);
      }

      const loadTime = Date.now() - startTime;
      console.log(`📋 Rules loaded in ${loadTime}ms`);
      console.log(`   Controllers: ${logicalRules.controllers.length} rules`);
      console.log(`   Services: ${logicalRules.services.length} rules`);
      console.log(`   Events: ${logicalRules.events.length} rules`);
      console.log(`   Views: ${logicalRules.views.length} rules`);

    } catch (error) {
      validation.errors.push({
        code: 'RULE_LOADING_ERROR',
        message: `Failed to load rules: ${error instanceof Error ? error.message : String(error)}`,
        location: this.config.rules.logicalRulesPath
      });
      validation.valid = false;
    }

    return validation;
  }

  /**
   * Generate complete logical specification from models
   */
  async inferLogicalSpecification(
    models: ModelDefinition[],
    componentName: string = 'GeneratedComponent',
    metadata: Record<string, any> = {}
  ): Promise<LogicalInferenceResult> {
    // Load any auto-discovered extension generators (async one-time)
    await this.loadPendingExtGenerators();

    const startTime = Date.now();
    let rulesApplied = 0;

    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Create base specification
      const specification: LogicalComponentSpec = {
        name: componentName,
        version: '3.1.0',
        description: `Auto-generated component with ${models.length} models`,
        controllers: {},
        services: {},
        events: {},
        views: {},
        models: {},
        commonDefinitions: {}
      };

      // Create base context
      const baseContext = this.contextManager.createLogicalContext(models, undefined, {
        componentName,
        ...metadata
      });

      // Generate all registered categories (controllers, services, events, views, etc.)
      for (const [category, { generator, configKey }] of this.generators) {
        if ((this.config.logical as any)[configKey] !== false) {
          const result = await generator.generate(models, baseContext);

          if (category.startsWith('_ext_')) {
            // Extension generators return multiple categories — merge into existing
            for (const [key, value] of Object.entries(result)) {
              if (key === 'rulesUsed' || key === 'validation') continue;
              const existing = (specification as any)[key] || {};
              (specification as any)[key] = { ...existing, ...(value as any) };
            }
          } else {
            // Core generators return { [category]: Record<string, Spec>, ... }
            (specification as any)[category] = result[category];
          }
          rulesApplied += result.rulesUsed;
          validation.errors.push(...result.validation.errors);
          validation.warnings.push(...result.validation.warnings);
          if (!result.validation.valid) validation.valid = false;
        }
      }

      // Generate model specifications from input models
      for (const model of models) {
        specification.models[model.name] = {
          description: `Auto-generated model specification for ${model.name}`,
          attributes: this.convertAttributesToSpecs(model.attributes),
          relationships: model.relationships ? this.convertRelationshipsToSpecs(model.relationships) : undefined,
          lifecycles: model.lifecycle ? { [model.lifecycle.name]: this.convertLifecycleToSpec(model.lifecycle) } : undefined,
          behaviors: model.behaviors ? this.convertBehaviorsToSpecs(model.behaviors) : undefined
        };
      }

      // Generate common type definitions if enabled
      if (this.config.logical.generateTypes) {
        specification.commonDefinitions = await this.generateCommonDefinitions(models, specification);
      }

      const processingTime = Date.now() - startTime;

      return {
        specification,
        validation,
        statistics: {
          modelsProcessed: models.length,
          controllersGenerated: Object.keys(specification.controllers).length,
          servicesGenerated: Object.keys(specification.services).length,
          eventsGenerated: Object.keys(specification.events).length,
          viewsGenerated: Object.keys(specification.views).length,
          rulesApplied,
          processingTimeMs: processingTime
        }
      };

    } catch (error) {
      validation.errors.push({
        code: 'INFERENCE_ERROR',
        message: `Inference failed: ${error instanceof Error ? error.message : String(error)}`,
        location: 'LogicalInferenceEngine.inferLogicalSpecification'
      });
      validation.valid = false;

      return {
        specification: {
          name: componentName,
          version: '3.1.0',
          controllers: {},
          services: {},
          events: {},
          views: {},
          models: {}
        },
        validation,
        statistics: {
          modelsProcessed: 0,
          controllersGenerated: 0,
          servicesGenerated: 0,
          eventsGenerated: 0,
          viewsGenerated: 0,
          rulesApplied,
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get inference statistics and health information
   */
  getEngineInfo(): {
    version: string;
    config: InferenceEngineConfig;
    loadedRules: {
      controllers: number;
      services: number;
      events: number;
      views: number;
    };
    generators: string[];
  } {
    const logicalRules = this.ruleLoader.getLogicalRules();
    
    return {
      version: '3.1.0',
      config: this.config,
      loadedRules: {
        controllers: logicalRules.controllers.length,
        services: logicalRules.services.length,
        events: logicalRules.events.length,
        views: logicalRules.views.length
      },
      generators: [
        'ControllerGenerator',
        'ServiceGenerator', 
        'EventGenerator',
        'ViewGenerator'
      ]
    };
  }

  // ===============================
  // Private Implementation
  // ===============================

  private convertAttributesToSpecs(attributes: any[]): Record<string, string> {
    const specs: Record<string, string> = {};

    for (const attr of attributes) {
      const typeModifiers = [];
      if (attr.required) typeModifiers.push('required');
      if (attr.unique) typeModifiers.push('unique');
      if (attr.auto) {
        typeModifiers.push(`auto=${attr.auto}`);
      }
      if (attr.default !== undefined) {
        typeModifiers.push(`default=${attr.default}`);
      }

      specs[attr.name] = `${attr.type}${typeModifiers.length > 0 ? ' ' + typeModifiers.join(' ') : ''}`;
    }

    return specs;
  }

  private convertRelationshipsToSpecs(relationships: any[]): Record<string, any> {
    const specs: Record<string, any> = {};
    
    for (const rel of relationships) {
      specs[rel.name] = {
        name: rel.name,
        type: rel.type,
        target: rel.targetModel,
        cascade: rel.cascadeDelete || false
      };
    }
    
    return specs;
  }

  private convertLifecycleToSpec(lifecycle: any): any {
    return {
      states: lifecycle.states,
      transitions: lifecycle.transitions.reduce((acc: any, transition: any) => {
        acc[transition.name] = {
          from: transition.from,
          to: transition.to
        };
        return acc;
      }, {})
    };
  }

  private convertBehaviorsToSpecs(behaviors: any[]): Record<string, any> {
    const specs: Record<string, any> = {};

    for (const behavior of behaviors) {
      const behaviorSpec: any = {};

      if (behavior.description) {
        behaviorSpec.description = behavior.description;
      }

      if (behavior.parameters && Object.keys(behavior.parameters).length > 0) {
        behaviorSpec.parameters = { ...behavior.parameters };
      }

      if (behavior.returns) {
        behaviorSpec.returns = behavior.returns;
      }

      if (behavior.requires && behavior.requires.length > 0) {
        behaviorSpec.requires = [...behavior.requires];
      }

      if (behavior.ensures && behavior.ensures.length > 0) {
        behaviorSpec.ensures = [...behavior.ensures];
      }

      if (behavior.publishes && behavior.publishes.length > 0) {
        behaviorSpec.publishes = [...behavior.publishes];
      }

      specs[behavior.name] = behaviorSpec;
    }

    return specs;
  }

  private async generateCommonDefinitions(
    models: ModelDefinition[], 
    specification: LogicalComponentSpec
  ): Promise<Record<string, any>> {
    const definitions: Record<string, any> = {};
    
    // Generate request/response types for each model
    for (const model of models) {
      // Create Request type
      definitions[`${model.name}CreateRequest`] = {
        type: 'object',
        description: `Request to create ${model.name}`,
        properties: this.convertAttributesToSpecs(
          model.attributes.filter(attr => attr.name !== 'id')
        )
      };

      // Update Request type
      definitions[`${model.name}UpdateRequest`] = {
        type: 'object', 
        description: `Request to update ${model.name}`,
        properties: {
          id: 'UUID required',
          ...this.convertAttributesToSpecs(
            model.attributes.filter(attr => attr.name !== 'id')
              .map(attr => ({ ...attr, required: false }))
          )
        }
      };

      // Filter type
      definitions[`${model.name}Filter`] = {
        type: 'object',
        description: `Filter criteria for ${model.name} listings`,
        properties: this.generateFilterProperties(model)
      };
    }
    
    return definitions;
  }

  private generateFilterProperties(model: ModelDefinition): Record<string, string> {
    const properties: Record<string, string> = {};
    
    for (const attr of model.attributes) {
      switch (attr.type.toLowerCase()) {
        case 'string':
        case 'text':
          properties[`${attr.name}Contains`] = 'String optional';
          break;
        case 'number':
        case 'integer':
        case 'money':
          properties[`${attr.name}Min`] = `${attr.type} optional`;
          properties[`${attr.name}Max`] = `${attr.type} optional`;
          break;
        case 'boolean':
          properties[attr.name] = 'Boolean optional';
          break;
        case 'datetime':
          properties[`${attr.name}From`] = 'DateTime optional';
          properties[`${attr.name}To`] = 'DateTime optional';
          break;
        default:
          properties[attr.name] = `${attr.type} optional`;
      }
    }
    
    return properties;
  }
}