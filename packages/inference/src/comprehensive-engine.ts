/**
 * V3.1 Comprehensive Inference Engine
 * Orchestrates both logical and deployment inference from minimal models
 */

import { 
  ModelDefinition, 
  LogicalComponentSpec,
  LogicalDeploymentSpec,
  InferenceContext,
  ValidationResult,
  InferenceEngineConfig,
  DEFAULT_ENGINE_CONFIG
} from './core/types.js';
import { LogicalInferenceEngine, LogicalInferenceResult } from './logical/logical-engine.js';
import * as fs from 'fs';
import { DeploymentInferenceGenerator, DeploymentGenerationResult } from './deployment/deployment-generator.js';
import { RuleLoader } from './core/rule-loader.js';
import { InferenceContextManager } from './core/context.js';

export interface ComprehensiveInferenceResult {
  component: LogicalComponentSpec;
  deployments: Record<string, LogicalDeploymentSpec>;
  validation: ValidationResult;
  statistics: {
    modelsProcessed: number;
    controllersGenerated: number;
    servicesGenerated: number;
    eventsGenerated: number;
    viewsGenerated: number;
    deploymentsGenerated: number;
    totalRulesApplied: number;
    processingTimeMs: number;
  };
}

export class ComprehensiveInferenceEngine {
  private logicalEngine: LogicalInferenceEngine;
  private deploymentGenerator: DeploymentInferenceGenerator;
  private ruleLoader: RuleLoader;
  private contextManager: InferenceContextManager;
  private config: InferenceEngineConfig;
  private debug: boolean;

  constructor(
    config: Partial<InferenceEngineConfig> = {},
    debug: boolean = false
  ) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.debug = debug || process.env.NODE_ENV === 'development';
    
    // Initialize engines
    this.logicalEngine = new LogicalInferenceEngine(config, this.debug);
    this.deploymentGenerator = new DeploymentInferenceGenerator(this.debug);
    this.ruleLoader = new RuleLoader(this.debug);
    this.contextManager = new InferenceContextManager(this.debug);

    if (this.debug) {
      console.log('🚀 Comprehensive Inference Engine initialized');
      console.log(`   Logical inference: ${this.config.logical.generateControllers ? 'enabled' : 'disabled'}`);
      console.log(`   Deployment inference: ${this.config.deployment.generateInstances ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Load all inference rules (logical + deployment)
   */
  async loadRules(): Promise<ValidationResult> {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Load logical rules through the logical engine
      const logicalValidation = await this.logicalEngine.loadRules();
      validation.errors.push(...logicalValidation.errors);
      validation.warnings.push(...logicalValidation.warnings);
      if (!logicalValidation.valid) validation.valid = false;

      // Load deployment rules if deployment inference is enabled
      if (this.config.deployment.generateInstances) {
        // Try directory first, fall back to entity registry
        if (fs.existsSync(this.config.rules.deploymentRulesPath)) {
          const { ruleSets, validation: deploymentLoadValidation } = await this.ruleLoader.loadRulesFromDirectory(
            this.config.rules.deploymentRulesPath
          );

          validation.errors.push(...deploymentLoadValidation.errors);
          validation.warnings.push(...deploymentLoadValidation.warnings);
          if (!deploymentLoadValidation.valid) validation.valid = false;
        } else {
          // Directory not available — try entity registry
          const registryResult = await this.ruleLoader.loadRulesFromRegistry();
          if (registryResult.loaded) {
            validation.errors.push(...registryResult.validation.errors);
            validation.warnings.push(...registryResult.validation.warnings);
          }
        }

        // Extract deployment rules and load into generator
        const deploymentRules = this.ruleLoader.getDeploymentRules();
        if (deploymentRules.instances.length > 0) {
          const deploymentValidation = await this.deploymentGenerator.loadRules(deploymentRules.instances);
          validation.errors.push(...deploymentValidation.errors);
          validation.warnings.push(...deploymentValidation.warnings);
          if (!deploymentValidation.valid) validation.valid = false;
        }
      }

    } catch (error) {
      validation.errors.push({
        code: 'COMPREHENSIVE_RULE_LOADING_ERROR',
        message: `Failed to load comprehensive rules: ${error instanceof Error ? error.message : String(error)}`,
        location: 'ComprehensiveInferenceEngine.loadRules'
      });
      validation.valid = false;
    }

    return validation;
  }

  /**
   * Generate complete specification with logical components AND deployment
   */
  async inferCompleteSpecification(
    models: ModelDefinition[],
    componentName: string = 'GeneratedComponent',
    targetEnvironment: 'development' | 'staging' | 'production' = 'development',
    metadata: Record<string, any> = {}
  ): Promise<ComprehensiveInferenceResult> {
    const startTime = Date.now();
    
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Generate logical component specification
      const logicalResult: LogicalInferenceResult = await this.logicalEngine.inferLogicalSpecification(
        models,
        componentName,
        metadata
      );

      validation.errors.push(...logicalResult.validation.errors);
      validation.warnings.push(...logicalResult.validation.warnings);
      if (!logicalResult.validation.valid) validation.valid = false;

      let deployments: Record<string, LogicalDeploymentSpec> = {};
      let deploymentRulesApplied = 0;

      // Step 2: Generate deployment specification if enabled
      if (this.config.deployment.generateInstances && logicalResult.specification) {
        const deploymentContext = this.contextManager.createLogicalContext(models, undefined, {
          componentName,
          environment: { target: targetEnvironment, constraints: {} },
          ...metadata
        });

        const deploymentResult: DeploymentGenerationResult = await this.deploymentGenerator.generate(
          logicalResult.specification,
          deploymentContext
        );

        deployments = deploymentResult.deployments;
        deploymentRulesApplied = deploymentResult.rulesUsed;
        
        validation.errors.push(...deploymentResult.validation.errors);
        validation.warnings.push(...deploymentResult.validation.warnings);
        if (!deploymentResult.validation.valid) validation.valid = false;
      }

      const processingTime = Date.now() - startTime;

      if (this.debug) {
        console.log(`✅ Complete inference finished in ${processingTime}ms`);
        console.log(`   Component: ${componentName}`);
        console.log(`   Models: ${models.length}`);
        console.log(`   Controllers: ${logicalResult.statistics.controllersGenerated}`);
        console.log(`   Services: ${logicalResult.statistics.servicesGenerated}`);
        console.log(`   Events: ${logicalResult.statistics.eventsGenerated}`);
        console.log(`   Views: ${logicalResult.statistics.viewsGenerated}`);
        console.log(`   Deployments: ${Object.keys(deployments).length}`);
        console.log(`   Total rules: ${logicalResult.statistics.rulesApplied + deploymentRulesApplied}`);
      }

      return {
        component: logicalResult.specification,
        deployments,
        validation,
        statistics: {
          modelsProcessed: logicalResult.statistics.modelsProcessed,
          controllersGenerated: logicalResult.statistics.controllersGenerated,
          servicesGenerated: logicalResult.statistics.servicesGenerated,
          eventsGenerated: logicalResult.statistics.eventsGenerated,
          viewsGenerated: logicalResult.statistics.viewsGenerated,
          deploymentsGenerated: Object.keys(deployments).length,
          totalRulesApplied: logicalResult.statistics.rulesApplied + deploymentRulesApplied,
          processingTimeMs: processingTime
        }
      };

    } catch (error) {
      validation.errors.push({
        code: 'COMPREHENSIVE_INFERENCE_ERROR',
        message: `Comprehensive inference failed: ${error instanceof Error ? error.message : String(error)}`,
        location: 'ComprehensiveInferenceEngine.inferCompleteSpecification'
      });
      validation.valid = false;

      return {
        component: {
          name: componentName,
          version: '3.1.0',
          controllers: {},
          services: {},
          events: {},
          views: {},
          models: {}
        },
        deployments: {},
        validation,
        statistics: {
          modelsProcessed: 0,
          controllersGenerated: 0,
          servicesGenerated: 0,
          eventsGenerated: 0,
          viewsGenerated: 0,
          deploymentsGenerated: 0,
          totalRulesApplied: 0,
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Generate only deployment specification from existing component
   */
  async inferDeploymentOnly(
    component: LogicalComponentSpec,
    targetEnvironment: 'development' | 'staging' | 'production' = 'development',
    metadata: Record<string, any> = {}
  ): Promise<{
    deployments: Record<string, LogicalDeploymentSpec>;
    validation: ValidationResult;
    statistics: {
      deploymentsGenerated: number;
      rulesApplied: number;
      processingTimeMs: number;
    };
  }> {
    const startTime = Date.now();
    
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      if (!this.config.deployment.generateInstances) {
        validation.warnings.push({
          code: 'DEPLOYMENT_DISABLED',
          message: 'Deployment inference is disabled in configuration',
          location: 'ComprehensiveInferenceEngine.inferDeploymentOnly'
        });
        
        return {
          deployments: {},
          validation,
          statistics: {
            deploymentsGenerated: 0,
            rulesApplied: 0,
            processingTimeMs: Date.now() - startTime
          }
        };
      }

      const deploymentContext = this.contextManager.createLogicalContext([], undefined, {
        componentName: component.name,
        environment: { target: targetEnvironment, constraints: {} },
        ...metadata
      });

      const deploymentResult = await this.deploymentGenerator.generate(component, deploymentContext);
      
      validation.errors.push(...deploymentResult.validation.errors);
      validation.warnings.push(...deploymentResult.validation.warnings);
      if (!deploymentResult.validation.valid) validation.valid = false;

      return {
        deployments: deploymentResult.deployments,
        validation,
        statistics: {
          deploymentsGenerated: Object.keys(deploymentResult.deployments).length,
          rulesApplied: deploymentResult.rulesUsed,
          processingTimeMs: Date.now() - startTime
        }
      };

    } catch (error) {
      validation.errors.push({
        code: 'DEPLOYMENT_ONLY_ERROR',
        message: `Deployment-only inference failed: ${error instanceof Error ? error.message : String(error)}`,
        location: 'ComprehensiveInferenceEngine.inferDeploymentOnly'
      });
      validation.valid = false;

      return {
        deployments: {},
        validation,
        statistics: {
          deploymentsGenerated: 0,
          rulesApplied: 0,
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get comprehensive engine information
   */
  getEngineInfo(): {
    version: string;
    config: InferenceEngineConfig;
    capabilities: string[];
    loadedRules: {
      logical: {
        controllers: number;
        services: number;
        events: number;
        views: number;
      };
      deployment: {
        instances: number;
        channels: number;
        bindings: number;
      };
    };
  } {
    const logicalInfo = this.logicalEngine.getEngineInfo();
    const deploymentRules = this.ruleLoader.getDeploymentRules();
    
    return {
      version: '3.1.0',
      config: this.config,
      capabilities: [
        'logical_inference',
        'deployment_inference',
        'comprehensive_generation'
      ],
      loadedRules: {
        logical: logicalInfo.loadedRules,
        deployment: {
          instances: deploymentRules.instances.length,
          channels: deploymentRules.channels.length,
          bindings: deploymentRules.bindings.length
        }
      }
    };
  }
}