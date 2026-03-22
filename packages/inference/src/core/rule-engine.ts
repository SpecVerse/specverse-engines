/**
 * Core Rule Engine for V3.1 Inference System
 * Provides pattern matching and rule application for both logical and deployment inference
 */

import { 
  InferenceRule, 
  InferenceContext, 
  ValidationResult, 
  ValidationError,
  ValidationWarning
} from './types.js';
import * as yaml from 'js-yaml';

export class RuleEngine<TInput, TOutput> {
  private rules: Map<string, InferenceRule<TInput, TOutput>[]> = new Map();
  private conditionCache: Map<string, boolean> = new Map();
  
  constructor(private debug: boolean = false) {}
  
  /**
   * Load rules for a specific category (e.g., 'controllers', 'services')
   */
  loadRules(category: string, rules: InferenceRule<TInput, TOutput>[]): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Validate rules before loading
    for (const rule of rules) {
      const ruleValidation = this.validateRule(rule);
      validation.errors.push(...ruleValidation.errors);
      validation.warnings.push(...ruleValidation.warnings);
      
      if (ruleValidation.errors.length > 0) {
        validation.valid = false;
      }
    }
    
    if (validation.valid) {
      // Sort rules by priority (highest first)
      const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
      this.rules.set(category, sortedRules);
      
      if (this.debug) {
        console.log(`Loaded ${rules.length} rules for category: ${category}`);
        console.log(`Rule priorities: ${sortedRules.map(r => `${r.name}:${r.priority}`).join(', ')}`);
      }
    }
    
    return validation;
  }
  
  /**
   * Find all matching rules for input in a category
   */
  findMatches(
    category: string, 
    input: TInput, 
    context: InferenceContext
  ): InferenceRule<TInput, TOutput>[] {
    const categoryRules = this.rules.get(category) || [];
    const matches: InferenceRule<TInput, TOutput>[] = [];
    
    for (const rule of categoryRules) {
      if (this.evaluateCondition(rule, input, context)) {
        matches.push(rule);
        
        if (this.debug) {
          console.log(`Rule matched: ${rule.name} (priority: ${rule.priority})`);
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Apply a rule to generate output
   */
  apply(
    rule: InferenceRule<TInput, TOutput>, 
    input: TInput, 
    context: InferenceContext
  ): TOutput {
    try {
      // Create template context
      const templateContext = this.buildTemplateContext(input, context);
      
      // Apply template based on type
      switch (rule.template.type) {
        case 'handlebars':
          return this.applyHandlebarsTemplate(rule, templateContext);
        case 'json':
          return this.applyJsonTemplate(rule, templateContext);
        case 'yaml':
          return this.applyYamlTemplate(rule, templateContext);
        case 'specly':
          return this.applySpeclyTemplate(rule, templateContext);
        default:
          throw new Error(`Unsupported template type: ${rule.template.type}`);
      }
    } catch (error) {
      throw new Error(`Failed to apply rule '${rule.name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get all loaded rules for debugging
   */
  getAllRules(): Map<string, InferenceRule<TInput, TOutput>[]> {
    return new Map(this.rules);
  }
  
  /**
   * Clear all loaded rules
   */
  clearRules(): void {
    this.rules.clear();
    this.conditionCache.clear();
  }
  
  // ===============================
  // Private Implementation
  // ===============================
  
  private validateRule(rule: InferenceRule<TInput, TOutput>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Validate required fields
    if (!rule.name) {
      result.errors.push({
        code: 'MISSING_NAME',
        message: 'Rule must have a name',
        location: 'rule.name'
      });
    }
    
    if (!rule.pattern) {
      result.errors.push({
        code: 'MISSING_PATTERN',
        message: 'Rule must have a pattern',
        location: 'rule.pattern'
      });
    }
    
    if (!rule.template || !rule.template.content) {
      result.errors.push({
        code: 'MISSING_TEMPLATE',
        message: 'Rule must have template content',
        location: 'rule.template.content'
      });
    }
    
    // Validate priority
    if (typeof rule.priority !== 'number') {
      result.errors.push({
        code: 'INVALID_PRIORITY',
        message: 'Rule priority must be a number',
        location: 'rule.priority'
      });
    }
    
    // Validate condition syntax if present
    if (rule.condition) {
      try {
        // Basic syntax check - attempt to create function
        new Function('input', 'context', `return ${rule.condition}`);
      } catch (error) {
        result.errors.push({
          code: 'INVALID_CONDITION',
          message: `Invalid condition syntax: ${error instanceof Error ? error.message : String(error)}`,
          location: 'rule.condition'
        });
      }
    }
    
    // Validate template type
    const validTemplateTypes = ['handlebars', 'json', 'yaml', 'specly'];
    if (rule.template && !validTemplateTypes.includes(rule.template.type)) {
      result.errors.push({
        code: 'INVALID_TEMPLATE_TYPE',
        message: `Template type must be one of: ${validTemplateTypes.join(', ')}`,
        location: 'rule.template.type'
      });
    }
    
    // Warnings for best practices
    if (!rule.description) {
      result.warnings.push({
        code: 'MISSING_DESCRIPTION',
        message: 'Rule should have a description for documentation',
        location: 'rule.description'
      });
    }
    
    if (rule.priority === 0) {
      result.warnings.push({
        code: 'ZERO_PRIORITY',
        message: 'Rule priority of 0 may cause unexpected ordering',
        location: 'rule.priority'
      });
    }
    
    result.valid = result.errors.length === 0;
    return result;
  }
  
  private evaluateCondition(
    rule: InferenceRule<TInput, TOutput>, 
    input: TInput, 
    context: InferenceContext
  ): boolean {
    if (!rule.condition) {
      return true; // No condition means always matches
    }
    
    const cacheKey = `${rule.name}:${JSON.stringify(input)}:${JSON.stringify(context)}`;
    
    if (this.conditionCache.has(cacheKey)) {
      return this.conditionCache.get(cacheKey)!;
    }
    
    try {
      // Create safe evaluation context
      const evalContext = {
        input,
        context,
        model: context.currentModel,
        relationships: context.relationships,
        // Helper functions for common conditions
        hasParentRelationship: () => {
          return (context.relationships?.parentRelationships?.length || 0) > 0;
        },
        hasChildRelationships: () => {
          return (context.relationships?.childRelationships?.length || 0) > 0;
        },
        hasLifecycle: () => {
          return context.currentModel?.lifecycle !== undefined;
        },
        belongsTo: (targetModel: string) => {
          return context.relationships?.parentRelationships?.some(
            r => r.targetModel === targetModel
          ) || false;
        },
        hasMany: (targetModel: string) => {
          return context.relationships?.childRelationships?.some(
            r => r.name === targetModel
          ) || false;
        }
      };
      
      // Evaluate condition safely
      const conditionFunc = new Function('input', 'context', 'model', 'relationships', 'hasParentRelationship', 'hasChildRelationships', 'hasLifecycle', 'belongsTo', 'hasMany', `
        return ${rule.condition}
      `);
      
      const result = conditionFunc(
        evalContext.input,
        evalContext.context,
        evalContext.model,
        evalContext.relationships,
        evalContext.hasParentRelationship,
        evalContext.hasChildRelationships,
        evalContext.hasLifecycle,
        evalContext.belongsTo,
        evalContext.hasMany
      );
      
      this.conditionCache.set(cacheKey, result);
      return result;
      
    } catch (error) {
      if (this.debug) {
        console.warn(`Condition evaluation failed for rule '${rule.name}': ${error instanceof Error ? error.message : String(error)}`);
      }
      return false;
    }
  }
  
  private buildTemplateContext(input: TInput, context: InferenceContext): any {
    const model = context.currentModel;
    const relationships = context.relationships;
    
    return {
      // Input data
      input,
      model,
      modelName: model?.name,
      
      // Context data
      context,
      version: context.version,
      models: context.models,
      
      // Relationship analysis
      relationships,
      parentRelationships: relationships?.parentRelationships || [],
      childRelationships: relationships?.childRelationships || [],
      manyToManyRelationships: relationships?.manyToManyRelationships || [],
      
      // Naming helpers
      controllerName: model?.name ? `${model.name}Controller` : undefined,
      serviceName: model?.name ? `${model.name}Service` : undefined,
      
      // Common patterns
      curedOps: ['create', 'update', 'retrieve', 'retrieve_many', 'evolve', 'delete'],
      
      // Helper functions for templates
      humanize: (str: any) => {
        if (typeof str !== 'string') {
          return String(str || '');
        }
        return str
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, c => c.toUpperCase())
          .trim();
      },
      
      camelCase: (str: any) => {
        const s = typeof str === 'string' ? str : String(str || '');
        return s.charAt(0).toLowerCase() + s.slice(1);
      },
      
      pascalCase: (str: any) => {
        const s = typeof str === 'string' ? str : String(str || '');
        return s.charAt(0).toUpperCase() + s.slice(1);
      },
      
      pluralize: (str: any) => {
        const s = typeof str === 'string' ? str : String(str || '');
        if (s.endsWith('y')) {
          return s.slice(0, -1) + 'ies';
        }
        if (s.endsWith('s') || s.endsWith('x') || s.endsWith('z') || s.endsWith('ch') || s.endsWith('sh')) {
          return s + 'es';
        }
        return s + 's';
      }
    };
  }
  
  private applyHandlebarsTemplate(rule: InferenceRule<TInput, TOutput>, templateContext: any): TOutput {
    // For now, we'll do a simple template substitution
    // In a full implementation, we'd use the Handlebars library
    let result = Array.isArray(rule.template.content) 
      ? rule.template.content.join('\n') 
      : rule.template.content;
    
    // Ensure result is a string
    if (typeof result !== 'string') {
      throw new Error(`Template content must be string or string array, got ${typeof result} in applyHandlebarsTemplate`);
    }
    
    // Simple variable substitution for common patterns
    result = result.replace(/\{\{modelName\}\}/g, templateContext.modelName || '');
    result = result.replace(/\{\{controllerName\}\}/g, templateContext.controllerName || '');
    result = result.replace(/\{\{serviceName\}\}/g, templateContext.serviceName || '');
    
    // Handle arrays and objects in a basic way
    if (templateContext.parentRelationships?.length > 0) {
      result = result.replace(/\{\{#each parentRelationships\}\}/g, '');
      result = result.replace(/\{\{\/each\}\}/g, '');
      result = result.replace(/\{\{targetModel\}\}/g, templateContext.parentRelationships[0].targetModel);
    }
    
    try {
      // Try to parse as YAML/JSON
      if (result.trim().startsWith('{') || result.trim().includes(':')) {
        return JSON.parse(result) as TOutput;
      }
    } catch {
      // If parsing fails, return as string
    }
    
    return result as TOutput;
  }
  
  private applyJsonTemplate(rule: InferenceRule<TInput, TOutput>, templateContext: any): TOutput {
    try {
      let template = Array.isArray(rule.template.content) 
        ? rule.template.content.join('\n') 
        : rule.template.content;
      
      // Simple variable substitution
      template = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return templateContext[key] || match;
      });
      
      return JSON.parse(template) as TOutput;
    } catch (error) {
      throw new Error(`Failed to parse JSON template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private applyYamlTemplate(rule: InferenceRule<TInput, TOutput>, templateContext: any): TOutput {
    try {
      let template = Array.isArray(rule.template.content) 
        ? rule.template.content.join('\n') 
        : rule.template.content;
      
      // Ensure template is a string
      if (typeof template !== 'string') {
        throw new Error(`Template content must be string or string array, got ${typeof template}`);
      }
      
      // Apply basic variable substitution
      template = template.replace(/\{\{modelName\}\}/g, templateContext.modelName || '');
      template = template.replace(/\{\{controllerName\}\}/g, templateContext.controllerName || '');
      template = template.replace(/\{\{serviceName\}\}/g, templateContext.serviceName || '');
      
      // Handle parent relationships processing
      if (templateContext.relationships?.parentRelationships?.length > 0) {
        const parentRel = templateContext.relationships.parentRelationships[0];
        
        // Process the each loop for parent relationships
        template = template.replace(/\{\{#each relationships\.parentRelationships\}\}/g, '');
        template = template.replace(/\{\{\/each\}\}/g, '');
        
        // Replace context variables
        template = template.replace(/\{\{targetModel\}\}/g, parentRel.targetModel || '');
        template = template.replace(/\{\{\.\.\/modelName\}\}/g, templateContext.modelName || '');
        
        // Handle nested attribute loops
        template = template.replace(/\{\{#each \.\.\/model\.attributes\}\}/g, '');
        // Process the required conditional specifically for attribute loops
        template = template.replace(/\{\{#if required\}\}([^]*?)\{\{\/if\}\}/g, (match, content) => {
          // For attributes, assume required if we're in parent relationship context
          return content;
        });
        template = template.replace(/\{\{name\}\}/g, 'sampleAttribute');
      }
      
      // Handle many-to-many relationships processing
      if (templateContext.relationships?.manyToManyRelationships?.length > 0) {
        const manyToManyRel = templateContext.relationships.manyToManyRelationships[0];
        
        // Process the each loop for many-to-many relationships
        template = template.replace(/\{\{#each relationships\.manyToManyRelationships\}\}/g, '');
        template = template.replace(/\{\{\/each\}\}/g, '');
        
        // Replace context variables
        template = template.replace(/\{\{targetModel\}\}/g, manyToManyRel.targetModel || '');
        template = template.replace(/\{\{\.\.\/modelName\}\}/g, templateContext.modelName || '');
      }

      // Use the shared handlebars processing that handles all conditionals consistently
      template = this.processSpeclyHandlebars(template, templateContext);
      
      // Clean up any double empty lines that might confuse YAML parser
      template = template.replace(/\n\n+/g, '\n\n');
      
      // Template processing completed
      
      // Handlebars processing already done above
      
      // Parse the processed template as YAML
      const result = yaml.load(template) as TOutput;
      return result;
    } catch (error) {
      throw new Error(`Failed to parse YAML template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private applySpeclyTemplate(rule: InferenceRule<TInput, TOutput>, templateContext: any): TOutput {
    try {
      // For controller rules, return a ControllerSpec object instead of a string
      if (rule.pattern === 'StandardCURED') {
        return this.generateCuredControllerSpec(templateContext) as TOutput;
      }
      
      // For service rules, return ServiceSpec objects
      if (rule.pattern === 'ProcessingService') {
        return this.generateProcessingServiceSpec(templateContext) as TOutput;
      }
      if (rule.pattern === 'ValidationService') {
        return this.generateValidationServiceSpec(templateContext) as TOutput;
      }
      
      // For event rules, return EventSpec objects
      if (rule.pattern === 'StandardEvents') {
        return this.generateStandardEventsSpec(templateContext) as TOutput;
      }
      if (rule.pattern === 'RelationshipEvents') {
        return this.generateRelationshipEventsSpec(templateContext) as TOutput;
      }
      
      // For view rules, return ViewSpec objects
      if (rule.pattern === 'EnhancedListView' || rule.pattern === 'AnalyticsView') {
        return this.generateViewSpec(rule.pattern, templateContext) as TOutput;
      }
      
      // For additional service patterns
      if (rule.pattern === 'IntegrationService') {
        return this.generateIntegrationServiceSpec(templateContext) as TOutput;
      }
      if (rule.pattern === 'LifecycleService') {
        return this.generateLifecycleServiceSpec(templateContext) as TOutput;
      }
      if (rule.pattern === 'RelationshipService') {
        return this.generateRelationshipServiceSpec(templateContext) as TOutput;
      }
      
      // For other specly templates, process as string
      let template = Array.isArray(rule.template.content) 
        ? rule.template.content.join('\n') 
        : rule.template.content as string;
      
      // Apply basic variable substitution
      template = template.replace(/\{\{modelName\}\}/g, templateContext.modelName || '');
      template = template.replace(/\{\{controllerName\}\}/g, templateContext.controllerName || '');
      template = template.replace(/\{\{serviceName\}\}/g, templateContext.serviceName || '');
      
      // Process conditionals and loops
      template = this.processSpeclyHandlebars(template, templateContext);
      
      return template as TOutput;
    } catch (error) {
      throw new Error(`Failed to process Specly template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generateCuredControllerSpec(context: any): any {
    const modelName = context.modelName || 'Unknown';
    
    // Build CURED operations spec
    const curedOps: any = {
      create: {
        parameters: {
          data: `${modelName} required`
        },
        returns: modelName,
        requires: [
          `${modelName} data is valid`
        ],
        ensures: [
          `${modelName} created with unique ID`,
          `${modelName} persisted to storage`
        ],
        publishes: [`${modelName}Created`]
      },
      retrieve: {
        parameters: {
          id: 'UUID required'
        },
        returns: modelName,
        requires: [`${modelName} with ID exists`],
        ensures: [`Returns complete ${modelName} details`]
      },
      retrieve_many: {
        parameters: {
          filters: `${modelName}Filter optional`,
          limit: 'Integer default=20',
          offset: 'Integer default=0'
        },
        returns: `Array[${modelName}]`,
        ensures: [
          `Returns paginated list of ${modelName}s`,
          `Applies filters if specified`
        ]
      },
      update: {
        parameters: {
          id: 'UUID required',
          updates: `Object required`
        },
        returns: modelName,
        requires: [
          `${modelName} with ID exists`,
          `Update data is valid`
        ],
        ensures: [
          `${modelName} attributes updated`,
          `Version number incremented`
        ],
        publishes: [`${modelName}Updated`]
      },
      delete: {
        parameters: {
          id: 'UUID required',
          soft: 'Boolean default=true'
        },
        returns: 'Boolean',
        requires: [`${modelName} with ID exists`],
        ensures: [`${modelName} marked as deleted`],
        publishes: [`${modelName}Deleted`]
      },
      validate: {
        parameters: {
          data: `${modelName} required`,
          operation: 'String required'
        },
        returns: 'ValidationResult',
        requires: [
          `Operation is one of: create, update, evolve`,
          `Data structure matches ${modelName} schema`
        ],
        ensures: [
          `Returns validation status and errors`,
          `No side effects - dry run only`
        ]
      }
    };

    // Add dynamic required field validation
    if (context.model?.attributes) {
      const requiredFields = context.model.attributes.filter((attr: any) => attr.required);
      if (requiredFields.length > 0) {
        requiredFields.forEach((attr: any) => {
          curedOps.create.requires.push(`${attr.name} is not empty`);
        });
      }
    }

    // Add lifecycle operations if model has lifecycle
    if (context.model?.lifecycle) {
      curedOps.evolve = {
        parameters: {
          id: 'UUID required',
          from: `${modelName}State required`,
          to: `${modelName}State required`,
          reason: 'String optional'
        },
        returns: modelName,
        requires: [
          `${modelName} with ID exists`,
          `${modelName} current state is 'from' state`,
          `Transition from 'from' to 'to' is valid`
        ],
        ensures: [
          `${modelName} state changed to 'to' state`,
          `State transition logged`
        ],
        publishes: [`${modelName}Evolved`]
      };
    }

    return {
      description: `Auto-generated CURED controller for ${modelName}`,
      model: modelName,
      cured: curedOps
    };
  }

  private generateProcessingServiceSpec(context: any): any {
    const modelName = context.modelName || 'Unknown';
    
    const operations: any = {
      [`handle${modelName}Creation`]: {
        parameters: {
          event: `${modelName}CreatedEvent required`
        },
        returns: 'Void',
        requires: ['Event data is valid'],
        ensures: [
          `${modelName} creation processing completed`,
          'Related systems notified'
        ]
      },
      [`handle${modelName}Update`]: {
        parameters: {
          event: `${modelName}UpdatedEvent required`
        },
        returns: 'Void',
        requires: ['Event data is valid'],
        ensures: [
          `${modelName} update processing completed`,
          'Change propagated to dependent systems'
        ]
      },
      [`validate${modelName}`]: {
        parameters: {
          data: `${modelName} required`,
          validationContext: 'Object optional'
        },
        returns: 'ValidationResult',
        requires: [`${modelName} data is provided`],
        ensures: [
          'Complete validation performed',
          'Business rules checked'
        ]
      },
      [`process${modelName}BusinessRules`]: {
        parameters: {
          id: 'UUID required',
          ruleContext: 'Object required'
        },
        returns: 'BusinessRuleResult',
        requires: [
          `${modelName} exists`,
          'Rule context is valid'
        ],
        ensures: [
          'All applicable business rules processed',
          'Results documented'
        ]
      }
    };

    const subscribes_to: any = {
      [`${modelName}Created`]: `handle${modelName}Creation`,
      [`${modelName}Updated`]: `handle${modelName}Update`
    };

    // Add lifecycle operations if model has lifecycle
    if (context.model?.lifecycle) {
      operations[`handle${modelName}Evolution`] = {
        parameters: {
          event: `${modelName}EvolvedEvent required`
        },
        returns: 'Void',
        requires: ['Lifecycle transition is valid'],
        ensures: [
          'Lifecycle change processed',
          'State-dependent actions triggered'
        ]
      };
      subscribes_to[`${modelName}Evolved`] = `handle${modelName}Evolution`;
    }

    return {
      description: `Handles complex business logic and processing for ${modelName}`,
      subscribes_to,
      operations
    };
  }

  private generateValidationServiceSpec(context: any): any {
    const modelName = context.modelName || 'Unknown';
    
    const operations: any = {
      validateCreate: {
        parameters: {
          data: `${modelName} required`,
          parentContext: 'Object optional'
        },
        returns: 'ValidationResult',
        requires: [`${modelName} data is provided`],
        ensures: [
          'All create validations performed',
          'Parent relationships validated',
          'Business constraints checked'
        ]
      },
      validateUpdate: {
        parameters: {
          id: 'UUID required',
          updates: 'Object required',
          currentState: `${modelName} required`
        },
        returns: 'ValidationResult',
        requires: [
          `${modelName} exists`,
          'Current state is provided'
        ],
        ensures: [
          'All update validations performed',
          'State transition rules checked'
        ]
      },
      validateBusinessRules: {
        parameters: {
          data: `${modelName} required`,
          ruleSet: 'String optional'
        },
        returns: 'BusinessRuleValidationResult',
        ensures: [
          'All business rules validated',
          'Cross-model dependencies checked'
        ]
      }
    };

    // Add lifecycle validation if model has lifecycle
    if (context.model?.lifecycle) {
      operations.validateStateTransition = {
        parameters: {
          id: 'UUID required',
          fromState: 'String required',
          toState: 'String required',
          transitionContext: 'Object optional'
        },
        returns: 'ValidationResult',
        requires: [
          `${modelName} exists`,
          'States are valid'
        ],
        ensures: [
          'Transition rules validated',
          'Prerequisites checked'
        ]
      };
    }

    return {
      description: `Provides comprehensive validation for ${modelName} data`,
      operations
    };
  }

  private generateStandardEventsSpec(context: any): any {
    const modelName = context.modelName || 'Unknown';
    
    const events: any = {};
    
    // Created event
    events[`${modelName}Created`] = {
      description: `${modelName} was created`,
      attributes: {
        id: 'UUID required',
        timestamp: 'DateTime required',
        createdBy: 'UUID required',
        version: 'Integer default=1'
      }
    };

    // Updated event  
    events[`${modelName}Updated`] = {
      description: `${modelName} was updated`,
      attributes: {
        id: 'UUID required',
        changedFields: 'Array required',
        previousValues: 'Object optional',
        newValues: 'Object required',
        timestamp: 'DateTime required',
        updatedBy: 'UUID required',
        version: 'Integer required'
      }
    };

    // Deleted event
    events[`${modelName}Deleted`] = {
      description: `${modelName} was deleted`,
      attributes: {
        id: 'UUID required',
        deletedBy: 'UUID required',
        timestamp: 'DateTime required',
        soft: 'Boolean default=true',
        reason: 'String optional'
      }
    };

    // Add key attributes from model to events
    if (context.model?.attributes) {
      const keyAttributes = context.model.attributes.filter((attr: any) => 
        attr.name === 'name' || attr.name === 'title' || attr.name === 'status'
      );
      
      keyAttributes.forEach((attr: any) => {
        events[`${modelName}Created`].attributes[attr.name] = `${attr.type} required`;
        events[`${modelName}Updated`].attributes[attr.name] = `${attr.type} optional`;
        if (attr.name === 'name') {
          events[`${modelName}Deleted`].attributes[attr.name] = `${attr.type} optional`;
        }
      });
    }

    return events;
  }

  private generateViewSpec(pattern: string, context: any): any {
    const modelName = context.modelName || 'Unknown';
    
    if (pattern === 'EnhancedListView') {
      return {
        [`${modelName}EnhancedListView`]: {
          type: 'list',
          model: modelName,
          description: `Enhanced list view for ${modelName} with advanced filtering`,
          subscribes_to: [
            `${modelName}Created`,
            `${modelName}Updated`,
            `${modelName}Deleted`
          ],
          uiComponents: {
            advancedSearch: {
              type: 'AdvancedSearchInput',
              properties: {
                placeholder: `Search ${modelName}s...`,
                debounce: 300,
                enableSuggestions: true
              }
            },
            advancedFilters: {
              type: 'FilterPanel', 
              properties: {
                model: modelName,
                collapsible: true
              }
            },
            [`${modelName.toLowerCase()}Table`]: {
              type: 'DataTable',
              properties: {
                model: modelName,
                pagination: {
                  enabled: true,
                  pageSize: 25,
                  showSizeSelector: true
                },
                selection: {
                  enabled: true,
                  multiSelect: true
                },
                sorting: {
                  enabled: true,
                  multiColumn: true
                }
              }
            }
          }
        }
      };
    } else if (pattern === 'AnalyticsView') {
      return {
        [`${modelName}AnalyticsView`]: {
          type: 'dashboard',
          model: modelName,
          description: `Analytics and reporting dashboard for ${modelName}`,
          subscribes_to: [
            `${modelName}Created`,
            `${modelName}Updated`,
            `${modelName}Deleted`
          ],
          uiComponents: {
            keyMetrics: {
              type: 'MetricsSummary',
              properties: {
                title: `${modelName} Key Metrics`,
                refreshInterval: 300000
              }
            },
            trendsChart: {
              type: 'TimeSeriesChart',
              properties: {
                title: `${modelName} Trends Over Time`,
                chartType: 'line',
                dateRange: 'last30Days'
              }
            }
          }
        }
      };
    }
    
    return {};
  }

  private processSpeclyHandlebars(template: string, context: any): string {
    // Process {{#if model.lifecycle}} blocks
    template = template.replace(/\{\{#if model\.lifecycle\}\}([^]*?)\{\{\/if\}\}/g, (match, content) => {
      return context.model?.lifecycle ? content : '';
    });
    
    // Process {{#each model.attributes}} blocks  
    template = template.replace(/\{\{#each model\.attributes\}\}([^]*?)\{\{\/each\}\}/g, (match, content) => {
      if (!context.model?.attributes) return '';
      if (typeof content !== 'string') {
        throw new Error(`content in model.attributes each loop is not a string: ${typeof content}`);
      }
      return context.model.attributes.map((attr: any) => {
        return content.replace(/\{\{name\}\}/g, attr.name)
                     .replace(/\{\{type\}\}/g, attr.type)
                     .replace(/\{\{required\}\}/g, attr.required ? 'true' : 'false');
      }).join('');
    });
    
    // Process {{#if required}} blocks within attribute loops
    template = template.replace(/\{\{#if required\}\}([^]*?)\{\{\/if\}\}/g, (match, content) => {
      // This will be processed within the context of each attribute
      return content; // Keep the content, the required check happens in the attribute loop
    });

    // Process {{#each relationships.cascadeDeleteTargets}} blocks
    template = template.replace(/\{\{#each relationships\.cascadeDeleteTargets\}\}([^]*?)\{\{\/each\}\}/g, (match, content) => {
      if (!context.relationships?.cascadeDeleteTargets) return '';
      return context.relationships.cascadeDeleteTargets.map((target: any) => {
        return content.replace(/\{\{this\}\}/g, target);
      }).join('');
    });

    // Process {{#each relationships.parentRelationships}} blocks
    template = template.replace(/\{\{#each relationships\.parentRelationships\}\}([^]*?)\{\{\/each\}\}/g, (match, content) => {
      if (!context.relationships?.parentRelationships) return '';
      return context.relationships.parentRelationships.map((rel: any) => {
        let processedContent = content;
        
        // Ensure content is a string
        if (typeof processedContent !== 'string') {
          throw new Error(`processedContent is not a string: ${typeof processedContent}`);
        }
        
        // Replace relationship-specific variables
        processedContent = processedContent.replace(/\{\{targetModel\}\}/g, rel.targetModel)
                                          .replace(/\{\{\.\.\/modelName\}\}/g, context.modelName || '')
                                          .replace(/\{\{\.\.\/\.\.\/modelName\}\}/g, context.modelName || '');
        
        // Process nested {{#each ../model.attributes}} blocks within this content
        processedContent = processedContent.replace(/\{\{#each \.\.\/model\.attributes\}\}([^]*?)\{\{\/each\}\}/g, (nestedMatch: any, nestedContent: any) => {
          if (!context.model?.attributes) return '';
          if (typeof nestedContent !== 'string') {
            throw new Error(`nestedContent is not a string: ${typeof nestedContent}`);
          }
          return context.model.attributes.map((attr: any) => {
            if (attr.required) {
              return nestedContent.replace(/\{\{name\}\}/g, attr.name)
                                  .replace(/\{\{type\}\}/g, attr.type);
            }
            return '';
          }).join('');
        });
        
        // Process nested {{#if required}} blocks
        processedContent = processedContent.replace(/\{\{#if required\}\}([^]*?)\{\{\/if\}\}/g, (ifMatch: any, ifContent: any) => {
          return ifContent; // Keep content, filtering happens in the attributes loop
        });
        
        return processedContent;
      }).join('');
    });
    
    return template;
  }

  private processHandlebarsInJson(obj: any, context: any): any {
    if (typeof obj === 'string') {
      // Process Handlebars variables
      let result = obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] || match;
      });
      
      // Process Handlebars conditionals and loops (basic implementation)
      result = this.processHandlebarsConditionals(result, context);
      return result;
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.processHandlebarsInJson(item, context));
    } else if (obj && typeof obj === 'object') {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const processedKey = this.processHandlebarsInJson(key, context);
        processed[processedKey] = this.processHandlebarsInJson(value, context);
      }
      return processed;
    }
    return obj;
  }

  private processHandlebarsConditionals(template: string, context: any): string {
    // Basic conditional processing for {{#if}} and {{#each}}
    // This is a simplified version - a full implementation would use the Handlebars library
    
    // Process {{#if model.lifecycle}} blocks
    template = template.replace(/\{\{#if model\.lifecycle\}\}([^]*?)\{\{\/if\}\}/g, (match, content) => {
      return context.model?.lifecycle ? content : '';
    });
    
    // Process {{#each model.attributes}} blocks  
    template = template.replace(/\{\{#each model\.attributes\}\}([^]*?)\{\{\/each\}\}/g, (match, content) => {
      if (!context.model?.attributes) return '';
      return context.model.attributes.map((attr: any) => {
        return content.replace(/\{\{name\}\}/g, attr.name)
                     .replace(/\{\{type\}\}/g, attr.type)
                     .replace(/\{\{required\}\}/g, attr.required);
      }).join('');
    });
    
    return template;
  }

  private convertJsonToSpecly(obj: any): string {
    // Convert processed JSON object to .specly syntax
    let result = '';
    
    if (obj.description) {
      result += `description: "${obj.description}"\n`;
    }
    
    if (obj.model) {
      result += `model: ${obj.model}\n`;
    }
    
    if (obj.actions) {
      result += 'actions:\n';
      for (const [actionName, action] of Object.entries(obj.actions)) {
        result += `  ${actionName}:\n`;
        const actionObj = action as any;
        
        if (actionObj.parameters) {
          result += '    parameters:\n';
          for (const [paramName, paramType] of Object.entries(actionObj.parameters)) {
            result += `      ${paramName}: ${paramType}\n`;
          }
        }
        
        if (actionObj.returns) {
          result += `    returns: ${actionObj.returns}\n`;
        }
        
        if (actionObj.requires && Array.isArray(actionObj.requires)) {
          result += '    requires:\n';
          for (const req of actionObj.requires) {
            result += `      - "${req}"\n`;
          }
        }
        
        if (actionObj.ensures && Array.isArray(actionObj.ensures)) {
          result += '    ensures:\n';
          for (const ens of actionObj.ensures) {
            result += `      - "${ens}"\n`;
          }
        }
        
        if (actionObj.publishes && Array.isArray(actionObj.publishes)) {
          result += '    publishes:\n';
          for (const pub of actionObj.publishes) {
            result += `      - ${pub}\n`;
          }
        }
      }
    }
    
    return result;
  }

  private generateIntegrationServiceSpec(context: any): any {
    const modelName = context.modelName || 'Unknown';
    
    const operations: any = {
      syncToExternalSystems: {
        parameters: {
          event: `${modelName}CreatedEvent required`
        },
        returns: 'IntegrationResult',
        requires: ['External systems are available'],
        ensures: [
          `${modelName} synchronized to all external systems`,
          'Integration status tracked'
        ]
      },
      updateExternalSystems: {
        parameters: {
          event: `${modelName}UpdatedEvent required`
        },
        returns: 'IntegrationResult',
        requires: ['External systems are available'],
        ensures: [
          'Changes synchronized to external systems',
          'Sync conflicts resolved'
        ]
      },
      removeFromExternalSystems: {
        parameters: {
          event: `${modelName}DeletedEvent required`
        },
        returns: 'IntegrationResult',
        ensures: [
          `${modelName} removed from external systems`,
          'Cleanup operations completed'
        ]
      },
      pullFromExternalSystem: {
        parameters: {
          externalSystemId: 'String required',
          lastSyncTime: 'DateTime optional'
        },
        returns: `Array[${modelName}]`,
        requires: ['External system is accessible'],
        ensures: [
          'Latest data retrieved from external system',
          'Sync timestamp updated'
        ]
      },
      pushToExternalSystem: {
        parameters: {
          id: 'UUID required',
          externalSystemId: 'String required',
          forceSync: 'Boolean default=false'
        },
        returns: 'IntegrationResult',
        requires: [
          `${modelName} exists`,
          'External system is accessible'
        ],
        ensures: [
          `${modelName} pushed to external system`,
          'Integration status updated'
        ]
      }
    };

    return {
      description: `Manages external system integration for ${modelName}`,
      subscribes_to: {
        [`${modelName}Created`]: 'syncToExternalSystems',
        [`${modelName}Updated`]: 'updateExternalSystems',
        [`${modelName}Deleted`]: 'removeFromExternalSystems'
      },
      operations
    };
  }

  private generateLifecycleServiceSpec(context: any): any {
    const modelName = context.modelName || 'Unknown';
    
    const operations: any = {
      handleStateChange: {
        parameters: {
          event: `${modelName}EvolvedEvent required`
        },
        returns: 'Void',
        requires: ['State transition is valid'],
        ensures: [
          'State-dependent actions triggered',
          'Transition side-effects processed'
        ]
      },
      validateTransition: {
        parameters: {
          id: 'UUID required',
          fromState: 'String required',
          toState: 'String required',
          context: 'Object optional'
        },
        returns: 'TransitionValidationResult',
        requires: [
          `${modelName} exists`,
          'States are valid lifecycle states'
        ],
        ensures: [
          'Transition prerequisites validated',
          'Business rules checked'
        ]
      },
      getAvailableTransitions: {
        parameters: {
          [`${modelName}Id`]: 'UUID required'
        },
        returns: 'Array[TransitionOption]',
        requires: [`${modelName} exists`],
        ensures: ['Returns all valid transitions from current state']
      },
      getStateHistory: {
        parameters: {
          id: 'UUID required',
          limit: 'Integer default=50'
        },
        returns: 'Array[StateHistoryEntry]',
        requires: [`${modelName} exists`],
        ensures: ['Returns chronological state change history']
      }
    };

    // Add dynamic transition operations if lifecycle exists
    if (context.model?.lifecycle?.transitions) {
      context.model.lifecycle.transitions.forEach((transition: any) => {
        const operationName = `execute${transition.name}Transition`;
        operations[operationName] = {
          parameters: {
            id: 'UUID required',
            reason: 'String optional',
            context: 'Object optional'
          },
          returns: modelName,
          requires: [
            `${modelName} exists`,
            `${modelName} current state is '${transition.from}'`
          ],
          ensures: [
            `${modelName} state changed to '${transition.to}'`,
            'Transition side-effects completed'
          ]
        };
      });
    }

    return {
      description: `Manages lifecycle transitions and state-dependent behavior for ${modelName}`,
      subscribes_to: {
        [`${modelName}Evolved`]: 'handleStateChange'
      },
      operations
    };
  }

  private generateRelationshipServiceSpec(context: any): any {
    const modelName = context.modelName || 'Unknown';
    
    const operations: any = {
      handleChildAdded: {
        parameters: {
          event: 'ChildEntityEvent required'
        },
        returns: 'Void',
        ensures: [
          'Parent relationship established',
          'Relationship integrity maintained'
        ]
      },
      handleChildRemoved: {
        parameters: {
          event: 'ChildEntityEvent required'
        },
        returns: 'Void',
        ensures: [
          'Parent relationship cleaned up',
          'Cascade rules applied'
        ]
      },
      validateRelationshipIntegrity: {
        parameters: {
          id: 'UUID required',
          relationshipType: 'String optional'
        },
        returns: 'IntegrityValidationResult',
        requires: [`${modelName} exists`],
        ensures: [
          'All relationships validated for integrity',
          'Constraint violations identified'
        ]
      },
      repairRelationshipIntegrity: {
        parameters: {
          id: 'UUID required',
          repairOptions: 'RepairOptions required'
        },
        returns: 'RepairResult',
        requires: [
          `${modelName} exists`,
          'Repair options are valid'
        ],
        ensures: [
          'Relationship integrity issues resolved',
          'Repair actions logged'
        ]
      }
    };

    const subscribes_to: any = {};

    // Add child relationship subscriptions
    if (context.relationships?.childRelationships) {
      context.relationships.childRelationships.forEach((rel: any) => {
        subscribes_to[`${rel.targetModel}Created`] = 'handleChildAdded';
        subscribes_to[`${rel.targetModel}Deleted`] = 'handleChildRemoved';
      });
    }

    // Add many-to-many relationship subscriptions and operations
    if (context.relationships?.manyToManyRelationships) {
      context.relationships.manyToManyRelationships.forEach((rel: any) => {
        subscribes_to[`${modelName}AssociatedWith${rel.targetModel}`] = 'handleAssociationAdded';
        subscribes_to[`${modelName}DisassociatedFrom${rel.targetModel}`] = 'handleAssociationRemoved';
        
        operations.handleAssociationAdded = {
          parameters: {
            event: 'AssociationEvent required'
          },
          returns: 'Void',
          ensures: [
            'Association established',
            'Association metadata updated'
          ]
        };
        
        operations.handleAssociationRemoved = {
          parameters: {
            event: 'DisassociationEvent required'
          },
          returns: 'Void',
          ensures: [
            'Association removed',
            'Related data cleaned up'
          ]
        };
      });
    }

    return {
      description: `Manages complex relationships and ensures relationship integrity for ${modelName}`,
      subscribes_to,
      operations
    };
  }

  private generateRelationshipEventsSpec(context: any): any {
    const modelName = context.modelName || 'Unknown';
    const events: any = {};
    
    // Parent relationship events
    if (context.relationships?.parentRelationships) {
      context.relationships.parentRelationships.forEach((rel: any) => {
        const targetModel = rel.targetModel;
        
        // Child created within parent
        events[`${modelName}CreatedIn${targetModel}`] = {
          description: `${modelName} was created within ${targetModel}`,
          attributes: {
            id: 'UUID required',
            [`${targetModel.toLowerCase()}Id`]: 'UUID required',
            [`${targetModel.toLowerCase()}Name`]: 'String optional',
            timestamp: 'DateTime required',
            createdBy: 'UUID required'
          }
        };
        
        // Add name attribute if model has one
        if (context.model?.attributes?.some((attr: any) => attr.name === 'name')) {
          events[`${modelName}CreatedIn${targetModel}`].attributes.name = 'String required';
        }
        
        // Child removed from parent
        events[`${modelName}RemovedFrom${targetModel}`] = {
          description: `${modelName} was removed from ${targetModel}`,
          attributes: {
            id: 'UUID required',
            [`${targetModel.toLowerCase()}Id`]: 'UUID required',
            [`${targetModel.toLowerCase()}Name`]: 'String optional',
            removedBy: 'UUID required',
            timestamp: 'DateTime required',
            reason: 'String optional'
          }
        };
      });
    }
    
    // Child relationship events
    if (context.relationships?.childRelationships) {
      context.relationships.childRelationships.forEach((rel: any) => {
        const targetModel = rel.targetModel || rel.name;
        const relType = rel.type || 'hasMany';
        
        // Child added to parent
        events[`${targetModel}AddedTo${modelName}`] = {
          description: `${targetModel} was added to ${modelName}`,
          attributes: {
            [`${modelName.toLowerCase()}Id`]: 'UUID required',
            [`${targetModel.toLowerCase()}Id`]: 'UUID required',
            relationshipType: `String default=${relType}`,
            addedBy: 'UUID required',
            timestamp: 'DateTime required'
          }
        };
        
        // Child removed from parent
        const removeEvent: any = {
          description: `${targetModel} was removed from ${modelName}`,
          attributes: {
            [`${modelName.toLowerCase()}Id`]: 'UUID required',
            [`${targetModel.toLowerCase()}Id`]: 'UUID required',
            relationshipType: `String default=${relType}`,
            removedBy: 'UUID required',
            timestamp: 'DateTime required'
          }
        };
        
        // Add cascade flag if specified
        if (rel.cascadeDelete) {
          removeEvent.attributes.cascadeTriggered = 'Boolean default=true';
        }
        
        events[`${targetModel}RemovedFrom${modelName}`] = removeEvent;
      });
    }
    
    // Many-to-many relationship events
    if (context.relationships?.manyToManyRelationships) {
      context.relationships.manyToManyRelationships.forEach((rel: any) => {
        const targetModel = rel.targetModel;
        
        // Association created
        events[`${modelName}AssociatedWith${targetModel}`] = {
          description: `${modelName} was associated with ${targetModel}`,
          attributes: {
            [`${modelName.toLowerCase()}Id`]: 'UUID required',
            [`${targetModel.toLowerCase()}Id`]: 'UUID required',
            associationType: 'String default=manyToMany',
            associationData: 'Object optional',
            associatedBy: 'UUID required',
            timestamp: 'DateTime required'
          }
        };
        
        // Association removed
        events[`${modelName}DisassociatedFrom${targetModel}`] = {
          description: `${modelName} was disassociated from ${targetModel}`,
          attributes: {
            [`${modelName.toLowerCase()}Id`]: 'UUID required',
            [`${targetModel.toLowerCase()}Id`]: 'UUID required',
            associationType: 'String default=manyToMany',
            disassociatedBy: 'UUID required',
            timestamp: 'DateTime required',
            reason: 'String optional'
          }
        };
      });
    }
    
    return events;
  }
}