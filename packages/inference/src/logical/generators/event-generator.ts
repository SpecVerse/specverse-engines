/**
 * Event Generator for V3.1 Logical Inference
 * Generates events for CURED operations, lifecycle changes, and relationships
 */

import { 
  ModelDefinition,
  EventSpec,
  InferenceContext,
  InferenceRule,
  ValidationResult,
  LogicalGenerator
} from '../../core/types.js';
import { RuleEngine } from '../../core/rule-engine.js';
import { InferenceContextManager, ContextUtils } from '../../core/context.js';

export interface EventGenerationResult {
  events: Record<string, EventSpec>;
  rulesUsed: number;
  validation: ValidationResult;
}

export class EventGenerator implements LogicalGenerator<ModelDefinition, EventSpec> {
  name = 'EventGenerator';
  
  private ruleEngine: RuleEngine<ModelDefinition, EventSpec>;
  private contextManager: InferenceContextManager;
  private rulesLoaded = false;

  constructor(private debug: boolean = false) {
    this.ruleEngine = new RuleEngine<ModelDefinition, EventSpec>(debug);
    this.contextManager = new InferenceContextManager(debug);
  }

  /**
   * Load event inference rules
   */
  async loadRules(rules: InferenceRule<ModelDefinition, EventSpec>[]): Promise<ValidationResult> {
    if (this.debug) {
      console.log(`📋 Loading ${rules.length} event rules`);
    }

    const validation = this.ruleEngine.loadRules('events', rules);
    
    if (validation.valid) {
      this.rulesLoaded = true;
      
      if (this.debug) {
        console.log(`✅ Event rules loaded successfully`);
      }
    } else {
      console.error('❌ Failed to load event rules:', validation.errors);
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
   * Generate events for all models
   */
  async generate(
    models: ModelDefinition[], 
    baseContext: InferenceContext
  ): Promise<EventGenerationResult> {
    const events: Record<string, EventSpec> = {};
    let rulesUsed = 0;
    
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.rulesLoaded) {
      validation.errors.push({
        code: 'RULES_NOT_LOADED',
        message: 'Event rules not loaded. Call loadRules() first.',
        location: 'EventGenerator.generate'
      });
      validation.valid = false;
      return { events, rulesUsed, validation };
    }

    try {
      // Generate events for each model
      for (const model of models) {
        if (this.debug) {
          console.log(`📢 Generating events for model: ${model.name}`);
        }

        // Create model-specific context
        const modelContext = ContextUtils.withCurrentModel(baseContext, model, this.contextManager);
        
        // Generate standard CURED events
        const standardEvents = this.generateStandardEvents(model, modelContext);
        for (const [eventName, eventSpec] of Object.entries(standardEvents)) {
          events[eventName] = eventSpec;
          rulesUsed++;
        }

        // Generate relationship events
        if (model.relationships && model.relationships.length > 0) {
          const relationshipEvents = this.generateRelationshipEvents(model, modelContext);
          for (const [eventName, eventSpec] of Object.entries(relationshipEvents)) {
            events[eventName] = eventSpec;
            rulesUsed++;
          }
        }

        // Generate lifecycle events
        if (model.lifecycle) {
          const lifecycleEvents = this.generateLifecycleEvents(model, modelContext);
          for (const [eventName, eventSpec] of Object.entries(lifecycleEvents)) {
            events[eventName] = eventSpec;
            rulesUsed++;
          }
        }

        // Generate profile events
        if (model.profiles && model.profiles.length > 0) {
          const profileEvents = this.generateProfileEvents(model, modelContext);
          for (const [eventName, eventSpec] of Object.entries(profileEvents)) {
            events[eventName] = eventSpec;
            rulesUsed++;
          }
        }

        // Apply custom event rules
        const matchingRules = this.ruleEngine.findMatches('events', model, modelContext);
        for (const rule of matchingRules) {
          try {
            const ruleEvents = this.ruleEngine.apply(rule, model, modelContext);
            
            // Handle both single event and multiple events from rules
            if (typeof ruleEvents === 'object' && ruleEvents !== null) {
              if ('description' in ruleEvents) {
                // Single event
                const eventName = this.generateEventName(model, rule);
                events[eventName] = ruleEvents as EventSpec;
                rulesUsed++;
              } else {
                // Multiple events
                for (const [eventName, eventSpec] of Object.entries(ruleEvents)) {
                  events[eventName] = eventSpec as EventSpec;
                  rulesUsed++;
                }
              }
            }
            
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

        if (this.debug) {
          const modelEvents = Object.keys(events).filter(name => name.includes(model.name));
          console.log(`   🎉 Generated ${modelEvents.length} events for ${model.name}`);
        }
      }

      // Validate all generated events
      for (const [eventName, eventSpec] of Object.entries(events)) {
        const eventValidation = this.validateEventSpec(eventSpec, eventName);
        validation.errors.push(...eventValidation.errors);
        validation.warnings.push(...eventValidation.warnings);
        
        if (!eventValidation.valid) {
          validation.valid = false;
        }
      }

    } catch (error) {
      validation.errors.push({
        code: 'GENERATION_ERROR',
        message: `Event generation failed: ${error instanceof Error ? error.message : String(error)}`,
        location: 'EventGenerator.generate'
      });
      validation.valid = false;
    }

    if (this.debug) {
      console.log(`📢 Event generation complete:`);
      console.log(`   Models processed: ${models.length}`);
      console.log(`   Events generated: ${Object.keys(events).length}`);
      console.log(`   Rules applied: ${rulesUsed}`);
      console.log(`   Validation: ${validation.valid ? 'PASSED' : 'FAILED'} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`);
    }

    return { events, rulesUsed, validation };
  }

  // ===============================
  // Private Implementation
  // ===============================

  /**
   * Generate standard CURED events for a model
   */
  private generateStandardEvents(model: ModelDefinition, context: InferenceContext): Record<string, EventSpec> {
    const events: Record<string, EventSpec> = {};
    
    // Created event
    events[`${model.name}Created`] = {
      description: `${model.name} was created`,
      attributes: {
        id: 'UUID required',
        ...this.generateEventAttributes(model, 'created'),
        timestamp: 'DateTime required',
        createdBy: 'UUID required'
      }
    };

    // Updated event
    events[`${model.name}Updated`] = {
      description: `${model.name} was updated`,
      attributes: {
        id: 'UUID required',
        ...this.generateEventAttributes(model, 'updated'),
        changedFields: 'String optional',
        previousValues: 'Object optional',
        timestamp: 'DateTime required',
        updatedBy: 'UUID required'
      }
    };

    // Deleted event
    events[`${model.name}Deleted`] = {
      description: `${model.name} was deleted`,
      attributes: {
        id: 'UUID required',
        name: this.getDisplayNameAttribute(model),
        deletedBy: 'UUID required',
        timestamp: 'DateTime required',
        soft: 'Boolean default=true'
      }
    };

    return events;
  }

  /**
   * Generate relationship-specific events
   */
  private generateRelationshipEvents(model: ModelDefinition, context: InferenceContext): Record<string, EventSpec> {
    const events: Record<string, EventSpec> = {};
    
    if (!model.relationships) return events;

    for (const relationship of model.relationships) {
      const targetModel = relationship.targetModel;
      
      switch (relationship.type) {
        case 'belongsTo':
          // Child created in parent
          events[`${model.name}CreatedIn${targetModel}`] = {
            description: `${model.name} was created within ${targetModel}`,
            attributes: {
              id: 'UUID required',
              [`${targetModel.toLowerCase()}Id`]: 'UUID required',
              [`${targetModel.toLowerCase()}Name`]: 'String optional',
              ...this.generateEventAttributes(model, 'created'),
              timestamp: 'DateTime required'
            }
          };
          break;

        case 'hasMany':
        case 'hasOne':
          // Child added to parent - use PascalCase for event names
          const relationshipNamePascal = this.pascalCase(relationship.name);
          events[`${relationshipNamePascal}AddedTo${model.name}`] = {
            description: `${relationship.name} was added to ${model.name}`,
            attributes: {
              [`${model.name.toLowerCase()}Id`]: 'UUID required',
              [`${relationship.name.toLowerCase()}Id`]: 'UUID required',
              relationshipType: `String default=${relationship.type}`,
              timestamp: 'DateTime required'
            }
          };

          // Child removed from parent
          events[`${relationshipNamePascal}RemovedFrom${model.name}`] = {
            description: `${relationship.name} was removed from ${model.name}`,
            attributes: {
              [`${model.name.toLowerCase()}Id`]: 'UUID required',
              [`${relationship.name.toLowerCase()}Id`]: 'UUID required',
              relationshipType: `String default=${relationship.type}`,
              timestamp: 'DateTime required'
            }
          };
          break;

        case 'manyToMany':
          // Association created
          events[`${model.name}AssociatedWith${targetModel}`] = {
            description: `${model.name} was associated with ${targetModel}`,
            attributes: {
              [`${model.name.toLowerCase()}Id`]: 'UUID required',
              [`${targetModel.toLowerCase()}Id`]: 'UUID required',
              associationData: 'Object optional',
              timestamp: 'DateTime required'
            }
          };

          // Association removed
          events[`${model.name}DisassociatedFrom${targetModel}`] = {
            description: `${model.name} was disassociated from ${targetModel}`,
            attributes: {
              [`${model.name.toLowerCase()}Id`]: 'UUID required',
              [`${targetModel.toLowerCase()}Id`]: 'UUID required',
              timestamp: 'DateTime required'
            }
          };
          break;
      }
    }

    return events;
  }

  /**
   * Generate lifecycle events
   */
  private generateLifecycleEvents(model: ModelDefinition, context: InferenceContext): Record<string, EventSpec> {
    const events: Record<string, EventSpec> = {};
    
    if (!model.lifecycle) return events;

    // General lifecycle evolution event
    events[`${model.name}Evolved`] = {
      description: `${model.name} lifecycle state changed`,
      attributes: {
        id: 'UUID required',
        name: this.getDisplayNameAttribute(model),
        fromState: 'String required',
        toState: 'String required',
        transitionName: 'String required',
        reason: 'String optional',
        timestamp: 'DateTime required',
        triggeredBy: 'UUID required'
      }
    };

    // Specific state transition events
    for (const transition of model.lifecycle.transitions) {
      events[`${model.name}${this.pascalCase(transition.name)}`] = {
        description: `${model.name} transitioned from ${transition.from} to ${transition.to}`,
        attributes: {
          id: 'UUID required',
          name: this.getDisplayNameAttribute(model),
          fromState: `String default=${transition.from}`,
          toState: `String default=${transition.to}`,
          reason: 'String optional',
          timestamp: 'DateTime required',
          triggeredBy: 'UUID required'
        }
      };
    }

    return events;
  }

  /**
   * Generate profile-specific events
   */
  private generateProfileEvents(model: ModelDefinition, context: InferenceContext): Record<string, EventSpec> {
    const events: Record<string, EventSpec> = {};
    
    if (!model.profiles || model.profiles.length === 0) return events;

    // Profile attached event
    events[`ProfileAttachedTo${model.name}`] = {
      description: `Profile was attached to ${model.name}`,
      attributes: {
        [`${model.name.toLowerCase()}Id`]: 'UUID required',
        profileType: 'String required',
        profileData: 'Object required',
        timestamp: 'DateTime required',
        attachedBy: 'UUID required'
      }
    };

    // Profile detached event
    events[`ProfileDetachedFrom${model.name}`] = {
      description: `Profile was detached from ${model.name}`,
      attributes: {
        [`${model.name.toLowerCase()}Id`]: 'UUID required',
        profileType: 'String required',
        timestamp: 'DateTime required',
        detachedBy: 'UUID required'
      }
    };

    // Profile updated event
    events[`ProfileUpdatedOn${model.name}`] = {
      description: `Profile was updated on ${model.name}`,
      attributes: {
        [`${model.name.toLowerCase()}Id`]: 'UUID required',
        profileType: 'String required',
        changedFields: 'String optional',
        previousValues: 'Object optional',
        newValues: 'Object required',
        timestamp: 'DateTime required',
        updatedBy: 'UUID required'
      }
    };

    return events;
  }

  /**
   * Generate event attributes based on model attributes
   */
  private generateEventAttributes(model: ModelDefinition, eventType: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Include key identifying attributes
    for (const attr of model.attributes) {
      if (['name', 'title', 'status', 'type', 'code'].includes(attr.name.toLowerCase())) {
        attributes[attr.name] = `${attr.type} ${attr.required ? 'required' : 'optional'}`;
      }
    }
    
    // For created events, include more data
    if (eventType === 'created') {
      for (const attr of model.attributes) {
        if (!attributes[attr.name] && attr.name !== 'id') {
          attributes[attr.name] = `${attr.type} optional`;
        }
      }
    }
    
    return attributes;
  }

  /**
   * Get display name attribute from model
   */
  private getDisplayNameAttribute(model: ModelDefinition): string {
    const nameAttrs = ['name', 'title', 'displayName', 'label'];
    
    for (const nameAttr of nameAttrs) {
      const found = model.attributes.find(attr => 
        attr.name.toLowerCase() === nameAttr.toLowerCase()
      );
      if (found) {
        return `${found.type} optional`;
      }
    }
    
    return 'String optional';
  }

  /**
   * Generate event name from model and rule
   */
  private generateEventName(model: ModelDefinition, rule: InferenceRule<ModelDefinition, EventSpec>): string {
    switch (rule.pattern) {
      case 'ValidationFailed':
        return `${model.name}ValidationFailed`;
      case 'ProcessingCompleted':
        return `${model.name}ProcessingCompleted`;
      case 'IntegrationEvent':
        return `${model.name}IntegrationEvent`;
      default:
        return `${model.name}CustomEvent`;
    }
  }

  /**
   * Validate generated event specification
   */
  private validateEventSpec(spec: EventSpec, eventName: string): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    if (!spec.description) {
      validation.warnings.push({
        code: 'MISSING_DESCRIPTION',
        message: `Event '${eventName}' missing description`,
        location: `event:${eventName}:description`
      });
    }

    if (!spec.attributes || Object.keys(spec.attributes).length === 0) {
      validation.warnings.push({
        code: 'NO_ATTRIBUTES',
        message: `Event '${eventName}' has no attributes`,
        location: `event:${eventName}:attributes`
      });
    }

    // Validate attributes format
    if (spec.attributes) {
      for (const [attrName, attrSpec] of Object.entries(spec.attributes)) {
        if (typeof attrSpec !== 'string') {
          validation.errors.push({
            code: 'INVALID_ATTRIBUTE_SPEC',
            message: `Event attribute '${attrName}' must be a string specification`,
            location: `event:${eventName}:attributes:${attrName}`
          });
          validation.valid = false;
        }
      }
    }

    // Check for common required attributes
    if (spec.attributes && !spec.attributes.timestamp) {
      validation.warnings.push({
        code: 'MISSING_TIMESTAMP',
        message: `Event '${eventName}' should include a timestamp attribute`,
        location: `event:${eventName}:attributes:timestamp`
      });
    }

    return validation;
  }

  /**
   * Convert string to PascalCase
   */
  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}