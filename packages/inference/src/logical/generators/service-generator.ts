/**
 * Service Generator for V3.1 Logical Inference
 * Generates services with event subscriptions and business operations
 */

import { 
  ModelDefinition,
  ServiceSpec,
  InferenceContext,
  InferenceRule,
  ValidationResult,
  LogicalGenerator
} from '../../core/types.js';
import { RuleEngine } from '../../core/rule-engine.js';
import { InferenceContextManager, ContextUtils } from '../../core/context.js';

export interface ServiceGenerationResult {
  services: Record<string, ServiceSpec>;
  rulesUsed: number;
  validation: ValidationResult;
}

export class ServiceGenerator implements LogicalGenerator<ModelDefinition, ServiceSpec> {
  name = 'ServiceGenerator';
  
  private ruleEngine: RuleEngine<ModelDefinition, ServiceSpec>;
  private contextManager: InferenceContextManager;
  private rulesLoaded = false;

  constructor(private debug: boolean = false) {
    this.ruleEngine = new RuleEngine<ModelDefinition, ServiceSpec>(debug);
    this.contextManager = new InferenceContextManager(debug);
  }

  /**
   * Load service inference rules
   */
  async loadRules(rules: InferenceRule<ModelDefinition, ServiceSpec>[]): Promise<ValidationResult> {
    if (this.debug) {
      console.log(`📋 Loading ${rules.length} service rules`);
    }

    const validation = this.ruleEngine.loadRules('services', rules);
    
    if (validation.valid) {
      this.rulesLoaded = true;
      
      if (this.debug) {
        console.log(`✅ Service rules loaded successfully`);
      }
    } else {
      console.error('❌ Failed to load service rules:', validation.errors);
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
   * Generate services for all models
   */
  async generate(
    models: ModelDefinition[], 
    baseContext: InferenceContext
  ): Promise<ServiceGenerationResult> {
    const services: Record<string, ServiceSpec> = {};
    let rulesUsed = 0;
    
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.rulesLoaded) {
      validation.errors.push({
        code: 'RULES_NOT_LOADED',
        message: 'Service rules not loaded. Call loadRules() first.',
        location: 'ServiceGenerator.generate'
      });
      validation.valid = false;
      return { services, rulesUsed, validation };
    }

    try {
      // Generate services for each model
      for (const model of models) {
        if (this.debug) {
          console.log(`🔧 Generating services for model: ${model.name}`);
        }

        // Create model-specific context
        const modelContext = ContextUtils.withCurrentModel(baseContext, model, this.contextManager);
        
        // Find matching rules
        const matchingRules = this.ruleEngine.findMatches('services', model, modelContext);
        
        if (matchingRules.length === 0) {
          if (this.debug) {
            console.log(`   ⚠️  No service rules matched for model: ${model.name}`);
          }
          continue;
        }

        // Apply rules to generate services
        for (const rule of matchingRules) {
          try {
            const serviceSpec = this.ruleEngine.apply(rule, model, modelContext);
            const serviceName = this.generateServiceName(model, rule);
            
            // Validate and store service
            const serviceValidation = this.validateServiceSpec(serviceSpec, model, serviceName);
            validation.errors.push(...serviceValidation.errors);
            validation.warnings.push(...serviceValidation.warnings);
            
            if (serviceValidation.valid) {
              services[serviceName] = serviceSpec;
              rulesUsed++;
              
              if (this.debug) {
                console.log(`   ✅ Generated service: ${serviceName} (${rule.pattern})`);
                if (serviceSpec.subscribes_to) {
                  console.log(`      Subscriptions: ${Object.keys(serviceSpec.subscribes_to).join(', ')}`);
                }
                if (serviceSpec.operations) {
                  console.log(`      Operations: ${Object.keys(serviceSpec.operations).join(', ')}`);
                }
              }
            } else {
              validation.valid = false;
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
      }

      // Generate cross-cutting services (notification, audit, etc.)
      const crossCuttingServices = await this.generateCrossCuttingServices(models, baseContext);
      for (const [serviceName, serviceSpec] of Object.entries(crossCuttingServices)) {
        services[serviceName] = serviceSpec;
        rulesUsed++;
      }

    } catch (error) {
      validation.errors.push({
        code: 'GENERATION_ERROR',
        message: `Service generation failed: ${error instanceof Error ? error.message : String(error)}`,
        location: 'ServiceGenerator.generate'
      });
      validation.valid = false;
    }

    if (this.debug) {
      console.log(`🔧 Service generation complete:`);
      console.log(`   Models processed: ${models.length}`);
      console.log(`   Services generated: ${Object.keys(services).length}`);
      console.log(`   Rules applied: ${rulesUsed}`);
      console.log(`   Validation: ${validation.valid ? 'PASSED' : 'FAILED'} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`);
    }

    return { services, rulesUsed, validation };
  }

  // ===============================
  // Private Implementation
  // ===============================

  /**
   * Generate service name based on model and rule
   */
  private generateServiceName(model: ModelDefinition, rule: InferenceRule<ModelDefinition, ServiceSpec>): string {
    switch (rule.pattern) {
      case 'ProcessingService':
        return `${model.name}ProcessingService`;
      case 'IntegrationService':
        return `${model.name}IntegrationService`;
      case 'LifecycleService':
        return `${model.name}LifecycleService`;
      case 'RelationshipService':
        return `${model.name}RelationshipService`;
      default:
        return `${model.name}Service`;
    }
  }

  /**
   * Generate cross-cutting services that work across all models
   */
  private async generateCrossCuttingServices(
    models: ModelDefinition[], 
    context: InferenceContext
  ): Promise<Record<string, ServiceSpec>> {
    const services: Record<string, ServiceSpec> = {};

    // DISABLED: Infrastructure services (Notification and Audit)
    // These should be implemented as cross-cutting concerns via deployment instances
    // rather than being auto-generated for every component

    // Previously generated NotificationService and AuditService here
    // Removed to reduce inference output and allow explicit infrastructure definition

    return services;
  }

  /**
   * Generate notification subscriptions for all model events
   */
  private generateNotificationSubscriptions(models: ModelDefinition[]): Record<string, string> {
    const subscriptions: Record<string, string> = {};
    
    for (const model of models) {
      // Standard CRUD events
      subscriptions[`${model.name}Created`] = 'handleCreationNotification';
      subscriptions[`${model.name}Updated`] = 'handleUpdateNotification';
      subscriptions[`${model.name}Deleted`] = 'handleDeletionNotification';
      
      // Lifecycle events
      if (model.lifecycle) {
        subscriptions[`${model.name}Evolved`] = 'handleLifecycleNotification';
      }
    }
    
    return subscriptions;
  }

  /**
   * Generate audit subscriptions for all model events
   */
  private generateAuditSubscriptions(models: ModelDefinition[]): Record<string, string> {
    const subscriptions: Record<string, string> = {};
    
    for (const model of models) {
      // Standard CRUD events
      subscriptions[`${model.name}Created`] = 'recordCreation';
      subscriptions[`${model.name}Updated`] = 'recordUpdate';
      subscriptions[`${model.name}Deleted`] = 'recordDeletion';
      
      // Lifecycle events
      if (model.lifecycle) {
        subscriptions[`${model.name}Evolved`] = 'recordLifecycleChange';
      }
    }
    
    return subscriptions;
  }

  /**
   * Validate generated service specification
   */
  private validateServiceSpec(spec: ServiceSpec, model: ModelDefinition, serviceName: string): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check if service has any functionality
    const hasFunctionality = !!(
      (spec.operations && Object.keys(spec.operations).length > 0) ||
      (spec.subscribes_to && Object.keys(spec.subscribes_to).length > 0)
    );

    if (!hasFunctionality) {
      validation.warnings.push({
        code: 'EMPTY_SERVICE',
        message: `Service ${serviceName} has no operations or subscriptions`,
        location: `service:${serviceName}`
      });
    }

    // Validate operations
    if (spec.operations) {
      for (const [operationName, operationSpec] of Object.entries(spec.operations)) {
        if (!operationSpec.returns) {
          validation.errors.push({
            code: 'MISSING_RETURN_TYPE',
            message: `Service operation '${operationName}' missing return type`,
            location: `service:${serviceName}:operations:${operationName}`
          });
          validation.valid = false;
        }

        if (!operationSpec.parameters || Object.keys(operationSpec.parameters).length === 0) {
          validation.warnings.push({
            code: 'NO_PARAMETERS',
            message: `Service operation '${operationName}' has no parameters`,
            location: `service:${serviceName}:operations:${operationName}`
          });
        }
      }
    }

    // Validate subscriptions
    if (spec.subscribes_to) {
      for (const [eventName, handlerMethod] of Object.entries(spec.subscribes_to)) {
        if (!handlerMethod || typeof handlerMethod !== 'string') {
          validation.errors.push({
            code: 'INVALID_HANDLER',
            message: `Invalid handler method for event '${eventName}'`,
            location: `service:${serviceName}:subscribes_to:${eventName}`
          });
          validation.valid = false;
        }

        // Check if handler method exists in operations
        if (spec.operations && !spec.operations[handlerMethod]) {
          validation.warnings.push({
            code: 'MISSING_HANDLER_OPERATION',
            message: `Handler method '${handlerMethod}' not found in service operations`,
            location: `service:${serviceName}:subscribes_to:${eventName}`
          });
        }
      }
    }

    return validation;
  }
}