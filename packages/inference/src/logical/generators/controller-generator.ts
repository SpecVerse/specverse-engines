/**
 * Controller Generator for V3.1 Logical Inference
 * Generates CURED controllers with relationship-aware operations
 */

import { 
  ModelDefinition,
  ControllerSpec,
  InferenceContext,
  InferenceRule,
  ValidationResult,
  ValidationError,
  LogicalGenerator
} from '../../core/types.js';
import { RuleEngine } from '../../core/rule-engine.js';
import { InferenceContextManager, ContextUtils } from '../../core/context.js';

export interface ControllerGenerationResult {
  controllers: Record<string, ControllerSpec>;
  rulesUsed: number;
  validation: ValidationResult;
}

export class ControllerGenerator implements LogicalGenerator<ModelDefinition, ControllerSpec> {
  name = 'ControllerGenerator';
  
  private ruleEngine: RuleEngine<ModelDefinition, ControllerSpec>;
  private contextManager: InferenceContextManager;
  private rulesLoaded = false;

  constructor(private debug: boolean = false) {
    this.ruleEngine = new RuleEngine<ModelDefinition, ControllerSpec>(debug);
    this.contextManager = new InferenceContextManager(debug);
  }

  /**
   * Load controller inference rules
   */
  async loadRules(rules: InferenceRule<ModelDefinition, ControllerSpec>[]): Promise<ValidationResult> {
    if (this.debug) {
      console.log(`📋 Loading ${rules.length} controller rules`);
    }

    const validation = this.ruleEngine.loadRules('controllers', rules);
    
    if (validation.valid) {
      this.rulesLoaded = true;
      
      if (this.debug) {
        console.log(`✅ Controller rules loaded successfully`);
        const loadedRules = this.ruleEngine.getAllRules();
        const controllerRules = loadedRules.get('controllers') || [];
        console.log(`   Rules by priority: ${controllerRules.map(r => `${r.name}(${r.priority})`).join(', ')}`);
      }
    } else {
      console.error('❌ Failed to load controller rules:', validation.errors);
    }

    return validation;
  }

  /**
   * Check if this generator supports the given input
   */
  supports(input: ModelDefinition, context: InferenceContext): boolean {
    return this.rulesLoaded && input.name !== undefined;
  }

  /**
   * Generate controllers for all models
   */
  async generate(
    models: ModelDefinition[], 
    baseContext: InferenceContext
  ): Promise<ControllerGenerationResult> {
    const controllers: Record<string, ControllerSpec> = {};
    let rulesUsed = 0;
    
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.rulesLoaded) {
      validation.errors.push({
        code: 'RULES_NOT_LOADED',
        message: 'Controller rules not loaded. Call loadRules() first.',
        location: 'ControllerGenerator.generate'
      });
      validation.valid = false;
      return { controllers, rulesUsed, validation };
    }

    try {
      // Generate controller for each model
      for (const model of models) {
        if (this.debug) {
          console.log(`🎯 Generating controller for model: ${model.name}`);
        }

        // Create model-specific context
        const modelContext = ContextUtils.withCurrentModel(baseContext, model, this.contextManager);
        
        // Find matching rules
        const matchingRules = this.ruleEngine.findMatches('controllers', model, modelContext);
        
        if (matchingRules.length === 0) {
          validation.warnings.push({
            code: 'NO_MATCHING_RULES',
            message: `No controller rules matched for model: ${model.name}`,
            location: `model:${model.name}`
          });
          continue;
        }

        // Apply rules to build controller spec
        const controllerName = `${model.name}Controller`;
        let controllerSpec: ControllerSpec = {
          model: model.name,
          description: `Auto-generated controller for ${model.name}`
        };

        // Apply each matching rule and merge results
        for (const rule of matchingRules) {
          try {
            const ruleResult = this.ruleEngine.apply(rule, model, modelContext);
            controllerSpec = this.mergeControllerSpecs(controllerSpec, ruleResult);
            rulesUsed++;

            if (this.debug) {
              console.log(`   ✅ Applied rule: ${rule.name} (${rule.pattern})`);
            }
          } catch (error) {
            validation.errors.push({
              code: 'RULE_APPLICATION_ERROR',
              message: `Failed to apply rule '${rule.name}' to model '${model.name}': ${error instanceof Error ? error.message : String(error)}`,
              location: `model:${model.name}:rule:${rule.name}`
            });
            validation.valid = false;
          }
        }

        // Generate customActions from model behaviors
        if (model.behaviors && model.behaviors.length > 0) {
          const behaviorActions = this.generateActionsFromBehaviors(model);
          if (Object.keys(behaviorActions).length > 0) {
            controllerSpec.customActions = {
              ...controllerSpec.customActions,
              ...behaviorActions
            };

            if (this.debug) {
              console.log(`   🎭 Generated ${Object.keys(behaviorActions).length} actions from behaviors`);
            }
          }
        }

        // Validate generated controller
        const controllerValidation = this.validateControllerSpec(controllerSpec, model);
        validation.errors.push(...controllerValidation.errors);
        validation.warnings.push(...controllerValidation.warnings);
        
        if (!controllerValidation.valid) {
          validation.valid = false;
        } else {
          controllers[controllerName] = controllerSpec;
          
          if (this.debug) {
            console.log(`   🎉 Generated controller: ${controllerName}`);
            console.log(`      CURED ops: ${controllerSpec.cured ? Object.keys(controllerSpec.cured).length : 0}`);
            console.log(`      Custom actions: ${controllerSpec.customActions ? Object.keys(controllerSpec.customActions).length : 0}`);
          }
        }
      }

    } catch (error) {
      validation.errors.push({
        code: 'GENERATION_ERROR',
        message: `Controller generation failed: ${error instanceof Error ? error.message : String(error)}`,
        location: 'ControllerGenerator.generate'
      });
      validation.valid = false;
    }

    if (this.debug) {
      console.log(`🎯 Controller generation complete:`);
      console.log(`   Models processed: ${models.length}`);
      console.log(`   Controllers generated: ${Object.keys(controllers).length}`);
      console.log(`   Rules applied: ${rulesUsed}`);
      console.log(`   Validation: ${validation.valid ? 'PASSED' : 'FAILED'} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`);
    }

    return { controllers, rulesUsed, validation };
  }

  // ===============================
  // Private Implementation
  // ===============================

  /**
   * Generate custom actions from model behaviors
   */
  private generateActionsFromBehaviors(model: ModelDefinition): Record<string, any> {
    const actions: Record<string, any> = {};

    if (!model.behaviors || model.behaviors.length === 0) {
      return actions;
    }

    for (const behavior of model.behaviors) {
      // Add model ID as first parameter for all behavior-based actions
      const parameters: Record<string, string> = {
        id: `UUID required`
      };

      // Add behavior-specific parameters
      // Handle both string and object parameter formats
      if (behavior.parameters) {
        for (const [paramName, paramSpec] of Object.entries(behavior.parameters)) {
          // If paramSpec is already a string, use it directly
          if (typeof paramSpec === 'string') {
            parameters[paramName] = paramSpec;
          } else if (typeof paramSpec === 'object' && paramSpec !== null) {
            // If it's an object, reconstruct the string format
            // Object format: { type: 'Integer', default: 1 } or { type: 'String', required: true }
            const spec = paramSpec as any;
            let paramString = spec.type || 'String';
            if (spec.required) paramString += ' required';
            else if (spec.optional) paramString += ' optional';
            if (spec.default !== undefined) paramString += ` default=${spec.default}`;
            parameters[paramName] = paramString;
          } else {
            // Fallback to String required
            parameters[paramName] = 'String required';
          }
        }
      }

      actions[behavior.name] = {
        description: behavior.description,
        parameters,
        returns: behavior.returns || 'Boolean',
        requires: behavior.requires || [],
        ensures: behavior.ensures || []
      };

      // Add publishes if the behavior defines it
      if (behavior.publishes && behavior.publishes.length > 0) {
        actions[behavior.name].publishes = behavior.publishes;
      }
    }

    return actions;
  }

  /**
   * Merge multiple controller specs together
   */
  private mergeControllerSpecs(base: ControllerSpec, additional: ControllerSpec): ControllerSpec {
    const merged: ControllerSpec = { ...base };

    // Merge CURED operations
    if (additional.cured) {
      merged.cured = { ...merged.cured, ...additional.cured };
    }

    // Merge custom actions
    if (additional.customActions) {
      merged.customActions = { ...merged.customActions, ...additional.customActions };
    }

    // Merge subscriptions
    if (additional.subscribes_to) {
      merged.subscribes_to = { ...merged.subscribes_to, ...additional.subscribes_to };
    }

    // Use more specific description if available
    if (additional.description && additional.description.length > (base.description?.length || 0)) {
      merged.description = additional.description;
    }

    // Prefer explicit model specification
    if (additional.model) {
      merged.model = additional.model;
    }

    return merged;
  }

  /**
   * Validate generated controller specification
   */
  private validateControllerSpec(spec: ControllerSpec, model: ModelDefinition): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check if controller has any operations
    const hasOperations = !!(
      (spec.cured && Object.keys(spec.cured).length > 0) ||
      (spec.customActions && Object.keys(spec.customActions).length > 0)
    );

    if (!hasOperations) {
      validation.warnings.push({
        code: 'EMPTY_CONTROLLER',
        message: `Controller for ${model.name} has no operations`,
        location: `controller:${model.name}Controller`
      });
    }

    // Validate CURED operations
    if (spec.cured) {
      for (const [operation, actionSpec] of Object.entries(spec.cured)) {
        if (!actionSpec.parameters || Object.keys(actionSpec.parameters).length === 0) {
          validation.warnings.push({
            code: 'NO_PARAMETERS',
            message: `CURED operation '${operation}' has no parameters`,
            location: `controller:${model.name}Controller:cured:${operation}`
          });
        }

        if (!actionSpec.returns) {
          validation.errors.push({
            code: 'MISSING_RETURN_TYPE',
            message: `CURED operation '${operation}' missing return type`,
            location: `controller:${model.name}Controller:cured:${operation}`
          });
          validation.valid = false;
        }
      }
    }

    // Validate custom actions
    if (spec.customActions) {
      for (const [actionName, actionSpec] of Object.entries(spec.customActions)) {
        if (!actionSpec.returns) {
          validation.errors.push({
            code: 'MISSING_RETURN_TYPE',
            message: `Custom action '${actionName}' missing return type`,
            location: `controller:${model.name}Controller:customActions:${actionName}`
          });
          validation.valid = false;
        }
      }
    }

    // Check for model consistency
    if (spec.model && spec.model !== model.name) {
      validation.warnings.push({
        code: 'MODEL_MISMATCH',
        message: `Controller model '${spec.model}' doesn't match input model '${model.name}'`,
        location: `controller:${model.name}Controller:model`
      });
    }

    return validation;
  }
}