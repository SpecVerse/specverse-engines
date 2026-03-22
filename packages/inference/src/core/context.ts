/**
 * Context management for V3.1 Inference Engine
 * Provides shared context and relationship analysis for inference rules
 */

import {
  InferenceContext,
  ModelDefinition,
  RelationshipDefinition,
  RelationshipAnalysis
} from './types.js';

/**
 * Relationship type classification — maps relationship type strings to their
 * semantic role. New relationship types can be added here without changing
 * the analysis logic.
 */
type RelRole = 'parent' | 'child' | 'sibling';
const RELATIONSHIP_ROLES: Record<string, RelRole> = {
  'belongsTo':  'parent',
  'hasMany':    'child',
  'hasOne':     'child',
  'manyToMany': 'sibling',
};

/** Relationship types that indicate the current model is a parent (owns children) */
const PARENT_TYPES = new Set(
  Object.entries(RELATIONSHIP_ROLES).filter(([_, r]) => r === 'child').map(([t]) => t)
);
/** Relationship types that indicate the current model is a child (belongs to parent) */
const CHILD_TYPES = new Set(
  Object.entries(RELATIONSHIP_ROLES).filter(([_, r]) => r === 'parent').map(([t]) => t)
);
/** Relationship types that are bidirectional peers */
const SIBLING_TYPES = new Set(
  Object.entries(RELATIONSHIP_ROLES).filter(([_, r]) => r === 'sibling').map(([t]) => t)
);

export class InferenceContextManager {
  constructor(private debug: boolean = false) {}
  
  /**
   * Create inference context for logical inference
   */
  createLogicalContext(
    models: ModelDefinition[], 
    currentModel?: ModelDefinition,
    metadata: Record<string, any> = {}
  ): InferenceContext {
    const relationships = currentModel ? this.analyzeModelRelationships(currentModel, models) : undefined;
    
    const context: InferenceContext = {
      version: 'v3.1',
      models,
      currentModel,
      relationships,
      metadata: {
        ...metadata,
        inference_type: 'logical',
        timestamp: new Date().toISOString()
      }
    };
    
    if (this.debug && currentModel) {
      console.log(`Created logical context for model: ${currentModel.name}`);
      this.logRelationshipAnalysis(relationships);
    }
    
    return context;
  }
  
  /**
   * Create inference context for deployment inference
   */
  createDeploymentContext(
    models: ModelDefinition[],
    environment: {
      target: 'development' | 'staging' | 'production';
      constraints: Record<string, any>;
    },
    metadata: Record<string, any> = {}
  ): InferenceContext {
    const context: InferenceContext = {
      version: 'v3.1',
      models,
      environment,
      metadata: {
        ...metadata,
        inference_type: 'deployment',
        timestamp: new Date().toISOString()
      }
    };
    
    if (this.debug) {
      console.log(`Created deployment context for environment: ${environment.target}`);
      console.log(`Models: ${models.map(m => m.name).join(', ')}`);
    }
    
    return context;
  }
  
  /**
   * Analyze relationships for a specific model
   */
  analyzeModelRelationships(model: ModelDefinition, allModels: ModelDefinition[]): RelationshipAnalysis {
    const analysis: RelationshipAnalysis = {
      parentRelationships: [],
      childRelationships: [],
      siblingRelationships: [],
      manyToManyRelationships: [],
      cascadeDeleteTargets: []
    };
    
    // Direct relationships from the model — classified by role
    if (model.relationships) {
      for (const relationship of model.relationships) {
        const role = RELATIONSHIP_ROLES[relationship.type];
        if (role === 'parent') {
          analysis.parentRelationships.push(relationship);
        } else if (role === 'child') {
          analysis.childRelationships.push(relationship);
          if (relationship.cascadeDelete) {
            analysis.cascadeDeleteTargets.push(relationship.targetModel);
          }
        } else if (role === 'sibling') {
          analysis.manyToManyRelationships.push(relationship);
        }
      }
    }
    
    // Find reverse relationships (other models that reference this model)
    for (const otherModel of allModels) {
      if (otherModel.name === model.name || !otherModel.relationships) {
        continue;
      }
      
      for (const relationship of otherModel.relationships) {
        if (relationship.targetModel === model.name) {
          const role = RELATIONSHIP_ROLES[relationship.type];

          if (role === 'parent') {
            // Other model belongs to this model → this model has children
            analysis.childRelationships.push({
              name: otherModel.name,
              type: 'hasMany',
              targetModel: otherModel.name,
              foreignKey: relationship.foreignKey,
              cascadeDelete: relationship.cascadeDelete
            });
            if (relationship.cascadeDelete) {
              analysis.cascadeDeleteTargets.push(otherModel.name);
            }
          } else if (role === 'child') {
            // Other model has this model → this model belongs to other
            analysis.parentRelationships.push({
              name: otherModel.name,
              type: 'belongsTo',
              targetModel: otherModel.name,
              foreignKey: relationship.foreignKey
            });
          } else if (role === 'sibling') {
            // Bidirectional many-to-many
            if (!analysis.manyToManyRelationships.some(r => r.targetModel === otherModel.name)) {
              analysis.manyToManyRelationships.push({
                name: otherModel.name,
                type: 'manyToMany',
                targetModel: otherModel.name
              });
            }
          }
        }
      }
    }
    
    // Find sibling relationships (models that share the same parent)
    const parentModels = analysis.parentRelationships.map(r => r.targetModel);
    for (const parentModelName of parentModels) {
      for (const otherModel of allModels) {
        if (otherModel.name === model.name || !otherModel.relationships) {
          continue;
        }
        
        const hasSharedParent = otherModel.relationships.some(
          r => r.type === 'belongsTo' && r.targetModel === parentModelName
        );
        
        if (hasSharedParent) {
          const siblingRelationship: RelationshipDefinition = {
            name: otherModel.name,
            type: 'belongsTo', // Sibling through shared parent
            targetModel: otherModel.name
          };
          analysis.siblingRelationships.push(siblingRelationship);
        }
      }
    }
    
    // Remove duplicates
    analysis.cascadeDeleteTargets = [...new Set(analysis.cascadeDeleteTargets)];
    
    return analysis;
  }
  
  /**
   * Check if a model has specific relationship patterns
   */
  hasRelationshipPattern(model: ModelDefinition, pattern: string): boolean {
    if (!model.relationships) return false;

    // Data-driven pattern detection using relationship role sets
    switch (pattern) {
      case 'hasParent':
        return model.relationships.some(r => CHILD_TYPES.has(r.type));
      case 'hasChildren':
        return model.relationships.some(r => PARENT_TYPES.has(r.type));
      case 'hasManyToMany':
        return model.relationships.some(r => SIBLING_TYPES.has(r.type));
      case 'hasCascadeDelete':
        return model.relationships.some(r => r.cascadeDelete === true);
      case 'isRootEntity':
        return !model.relationships.some(r => CHILD_TYPES.has(r.type));
      case 'isLeafEntity':
        return !model.relationships.some(r => PARENT_TYPES.has(r.type));
      default:
        return false;
    }
  }
  
  /**
   * Get related models by relationship type
   */
  getRelatedModels(
    model: ModelDefinition, 
    relationshipType: 'parent' | 'child' | 'sibling' | 'manyToMany',
    allModels: ModelDefinition[]
  ): ModelDefinition[] {
    const analysis = this.analyzeModelRelationships(model, allModels);
    const relatedModelNames: string[] = [];
    
    switch (relationshipType) {
      case 'parent':
        relatedModelNames.push(...analysis.parentRelationships.map(r => r.targetModel));
        break;
      case 'child':
        relatedModelNames.push(...analysis.childRelationships.map(r => r.targetModel));
        break;
      case 'sibling':
        relatedModelNames.push(...analysis.siblingRelationships.map(r => r.targetModel));
        break;
      case 'manyToMany':
        relatedModelNames.push(...analysis.manyToManyRelationships.map(r => r.targetModel));
        break;
    }
    
    return allModels.filter(m => relatedModelNames.includes(m.name));
  }
  
  /**
   * Calculate inference complexity score for a model
   */
  calculateComplexityScore(model: ModelDefinition, allModels: ModelDefinition[]): number {
    let score = 1; // Base score
    
    // Add points for attributes
    score += model.attributes.length * 0.5;
    
    // Add points for relationships
    if (model.relationships) {
      score += model.relationships.length * 2;
      
      // Extra points for complex relationships
      const manyToManyCount = model.relationships.filter(r => r.type === 'manyToMany').length;
      score += manyToManyCount * 3;
      
      const cascadeCount = model.relationships.filter(r => r.cascadeDelete).length;
      score += cascadeCount * 2;
    }
    
    // Add points for lifecycle
    if (model.lifecycle) {
      score += model.lifecycle.states.length * 1.5;
      score += model.lifecycle.transitions.length * 2;
    }
    
    // Add points for profiles
    if (model.profiles) {
      score += model.profiles.length * 1.5;
    }
    
    return Math.round(score);
  }
  
  // ===============================
  // Private Implementation
  // ===============================
  
  private logRelationshipAnalysis(analysis?: RelationshipAnalysis): void {
    if (!analysis) return;
    
    console.log('  Relationship Analysis:');
    console.log(`    Parents: ${analysis.parentRelationships.map(r => r.targetModel).join(', ') || 'none'}`);
    console.log(`    Children: ${analysis.childRelationships.map(r => r.targetModel).join(', ') || 'none'}`);
    console.log(`    Many-to-Many: ${analysis.manyToManyRelationships.map(r => r.targetModel).join(', ') || 'none'}`);
    console.log(`    Cascade Deletes: ${analysis.cascadeDeleteTargets.join(', ') || 'none'}`);
  }
}

/**
 * Utility functions for common context operations
 */
export class ContextUtils {
  /**
   * Create a model-specific context from a general context
   */
  static withCurrentModel(
    baseContext: InferenceContext, 
    currentModel: ModelDefinition,
    contextManager: InferenceContextManager
  ): InferenceContext {
    const relationships = contextManager.analyzeModelRelationships(currentModel, baseContext.models);
    
    return {
      ...baseContext,
      currentModel,
      relationships,
      metadata: {
        ...baseContext.metadata,
        current_model: currentModel.name
      }
    };
  }
  
  /**
   * Extract common naming patterns from context
   */
  static extractNames(context: InferenceContext): {
    modelName?: string;
    controllerName?: string;
    serviceName?: string;
    pluralModelName?: string;
  } {
    const modelName = context.currentModel?.name;
    
    if (!modelName) {
      return {};
    }
    
    return {
      modelName,
      controllerName: `${modelName}Controller`,
      serviceName: `${modelName}Service`,
      pluralModelName: ContextUtils.pluralize(modelName)
    };
  }
  
  /**
   * Simple pluralization (could be enhanced with proper library)
   */
  private static pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    }
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
        str.endsWith('ch') || str.endsWith('sh')) {
      return str + 'es';
    }
    return str + 's';
  }
}