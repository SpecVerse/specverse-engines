// Shared processors — imported from original locations (will move to _shared/ in Phase B)
import { AbstractProcessor } from '@specverse/types';
import { AttributeProcessor } from '../../../_shared/processors/AttributeProcessor.js';
import { LifecycleProcessor } from '../../../_shared/processors/LifecycleProcessor.js';
import { ExecutableProcessor } from '../../../_shared/processors/ExecutableProcessor.js';
// Model-specific processor — co-located in this entity module
import { RelationshipProcessor } from './relationship-processor.js';
import { ModelSpec, AttributeSpec, RelationshipSpec, LifecycleSpec, ExecutablePropertiesSpec, ProfileAttachmentSpec } from '@specverse/types';

export class ModelProcessor extends AbstractProcessor<any, ModelSpec[]> {
  private attributeProcessor: AttributeProcessor;
  private relationshipProcessor: RelationshipProcessor;
  private lifecycleProcessor: LifecycleProcessor;
  private executableProcessor: ExecutableProcessor;

  constructor(context: any) {
    super(context);
    this.attributeProcessor = new AttributeProcessor(context);
    this.relationshipProcessor = new RelationshipProcessor(context);
    this.lifecycleProcessor = new LifecycleProcessor(context);
    this.executableProcessor = new ExecutableProcessor(context);
  }

  process(modelsData: any): ModelSpec[] {
    const models = Object.entries(modelsData).map(([modelName, modelDef]: [string, any]) => {
      const attributes: AttributeSpec[] = [];
      const relationships: RelationshipSpec[] = [];
      const lifecycles: LifecycleSpec[] = [];
      const behaviors: { [name: string]: ExecutablePropertiesSpec } = {};
      
      // Process attributes
      if (modelDef.attributes) {
        for (const [attrName, attrDef] of Object.entries(modelDef.attributes)) {
          attributes.push(this.attributeProcessor.process(attrName, attrDef));
        }
      }
      
      // Process relationships
      if (modelDef.relationships) {
        for (const [relName, relDef] of Object.entries(modelDef.relationships)) {
          relationships.push(this.relationshipProcessor.process(relName, relDef));
        }
      }
      
      // Process lifecycles
      if (modelDef.lifecycles) {
        for (const [lifecycleName, lifecycleDef] of Object.entries(modelDef.lifecycles)) {
          lifecycles.push(this.lifecycleProcessor.process(lifecycleName, lifecycleDef));
        }
      }
      
      // Process behaviors
      if (modelDef.behaviors) {
        for (const [behaviorName, behaviorDef] of Object.entries(modelDef.behaviors)) {
          behaviors[behaviorName] = this.executableProcessor.process(behaviorDef, `Model ${modelName}, Behavior ${behaviorName}`);
        }
      }
      
      // Add built-in profile management behaviors
      this.addProfileBehaviors(behaviors);
      
      // Process profile attachment
      let profileAttachment: ProfileAttachmentSpec | undefined = undefined;
      if (modelDef['profile-attachment']) {
        profileAttachment = this.parseProfileAttachment(modelDef['profile-attachment']);
      }

      // Expand metadata into synthetic attributes (v3.3+)
      const expandedAttributes = this.expandModelMetadata(
        modelName,
        modelDef.metadata,
        attributes,
        lifecycles
      );

      return {
        name: modelName,
        description: modelDef.description,
        extends: modelDef.extends,
        profiles: modelDef.profiles || [],
        metadata: modelDef.metadata,
        attributes: expandedAttributes,
        relationships,
        lifecycles,
        behaviors,
        profileAttachment
      };
    });
    
    return this.resolveInheritance(models);
  }

  private addProfileBehaviors(behaviors: { [name: string]: ExecutablePropertiesSpec }): void {
    behaviors['attachProfile'] = {
      description: 'Attach a profile to this model instance',
      parameters: {
        profileName: {
          name: 'profileName',
          type: 'String',
          required: true,
          unique: false
        }
      },
      returns: 'Boolean',
      requires: ['Profile exists and is compatible with this model'],
      ensures: ['Profile is attached', 'Profile attributes are available']
    };
    
    behaviors['detachProfile'] = {
      description: 'Detach a profile from this model instance',
      parameters: {
        profileName: {
          name: 'profileName',
          type: 'String',
          required: true,
          unique: false
        }
      },
      returns: 'Boolean',
      requires: ['Profile is currently attached'],
      ensures: ['Profile is detached', 'Profile attributes are no longer available']
    };
    
    behaviors['hasProfile'] = {
      description: 'Check if a profile is attached to this model instance',
      parameters: {
        profileName: {
          name: 'profileName',
          type: 'String',
          required: true,
          unique: false
        }
      },
      returns: 'Boolean'
    };
  }

  private parseProfileAttachment(profileDef: any): ProfileAttachmentSpec {
    return {
      profiles: profileDef.profiles || [],
      conditions: profileDef.conditions,
      priority: profileDef.priority || 0
    };
  }

  // ================================================================
  // INHERITANCE RESOLUTION
  // ================================================================

  /**
   * Resolve single inheritance chains - merge attributes, relationships, behaviors
   * from parent models into child models
   */
  private resolveInheritance(models: ModelSpec[]): ModelSpec[] {
    // Create a map for quick model lookup
    const modelMap = new Map<string, ModelSpec>();
    models.forEach(model => modelMap.set(model.name, model));
    
    // Create a new array for resolved models
    const resolvedModels: ModelSpec[] = [];
    
    // Process each model
    for (const model of models) {
      if (model.extends) {
        // Resolve inheritance for this model
        const resolvedModel = this.resolveModelInheritance(model, modelMap, new Set<string>());
        resolvedModels.push(resolvedModel);
      } else {
        // No inheritance, add as-is
        resolvedModels.push(model);
      }
    }
    
    return resolvedModels;
  }
  
  /**
   * Recursively resolve inheritance for a single model
   */
  private resolveModelInheritance(
    model: ModelSpec, 
    modelMap: Map<string, ModelSpec>,
    visited: Set<string>
  ): ModelSpec {
    // Prevent infinite recursion
    if (visited.has(model.name)) {
      console.warn(`Circular inheritance detected for model ${model.name}`);
      return model;
    }
    visited.add(model.name);
    
    if (!model.extends) {
      return model;
    }
    
    // Extract parent model name (handle both local and cross-component references)
    const parentName = model.extends.includes('.') 
      ? model.extends.split('.').pop()! 
      : model.extends;
    
    const parentModel = modelMap.get(parentName);
    if (!parentModel) {
      console.warn(`Parent model ${model.extends} not found for ${model.name}`);
      return model;
    }
    
    // Recursively resolve parent first
    const resolvedParent = this.resolveModelInheritance(parentModel, modelMap, new Set(visited));
    
    // Merge parent properties into child
    return {
      ...model,
      // Child overrides parent attributes of same name
      attributes: this.mergeAttributes(resolvedParent.attributes, model.attributes),
      // Merge relationships (child can override parent relationships)
      relationships: this.mergeRelationships(resolvedParent.relationships, model.relationships),
      // Merge lifecycles (child can add new ones or override)
      lifecycles: this.mergeLifecycles(resolvedParent.lifecycles, model.lifecycles),
      // Merge behaviors (child can override parent behaviors)
      behaviors: this.mergeBehaviors(resolvedParent.behaviors, model.behaviors),
      // Note: profiles are NOT inherited - they are instance-specific
      // Note: profileAttachment is NOT inherited - it defines what this model can attach to
    };
  }
  
  /**
   * Merge parent and child attributes - child overrides parent
   */
  private mergeAttributes(
    parentAttrs: AttributeSpec[], 
    childAttrs: AttributeSpec[]
  ): AttributeSpec[] {
    // Create a map of child attributes for quick lookup
    const childAttrMap = new Map<string, AttributeSpec>();
    childAttrs.forEach(attr => childAttrMap.set(attr.name, attr));
    
    // Start with parent attributes
    const merged: AttributeSpec[] = [];
    
    // Add parent attributes that aren't overridden
    for (const parentAttr of parentAttrs) {
      if (!childAttrMap.has(parentAttr.name)) {
        merged.push(parentAttr);
      }
    }
    
    // Add all child attributes (including overrides)
    merged.push(...childAttrs);
    
    return merged;
  }
  
  /**
   * Merge parent and child relationships - child overrides parent
   */
  private mergeRelationships(
    parentRels: RelationshipSpec[],
    childRels: RelationshipSpec[]
  ): RelationshipSpec[] {
    // Same logic as attributes
    const childRelMap = new Map<string, RelationshipSpec>();
    childRels.forEach(rel => childRelMap.set(rel.name, rel));
    
    const merged: RelationshipSpec[] = [];
    
    for (const parentRel of parentRels) {
      if (!childRelMap.has(parentRel.name)) {
        merged.push(parentRel);
      }
    }
    
    merged.push(...childRels);
    
    return merged;
  }
  
  /**
   * Merge parent and child lifecycles - child can add new or override
   */
  private mergeLifecycles(
    parentLifecycles: LifecycleSpec[],
    childLifecycles: LifecycleSpec[]
  ): LifecycleSpec[] {
    const childLifecycleMap = new Map<string, LifecycleSpec>();
    childLifecycles.forEach(lc => childLifecycleMap.set(lc.name, lc));
    
    const merged: LifecycleSpec[] = [];
    
    for (const parentLc of parentLifecycles) {
      if (!childLifecycleMap.has(parentLc.name)) {
        merged.push(parentLc);
      }
    }
    
    merged.push(...childLifecycles);
    
    return merged;
  }
  
  /**
   * Merge parent and child behaviors - child overrides parent
   */
  private mergeBehaviors(
    parentBehaviors: { [name: string]: ExecutablePropertiesSpec },
    childBehaviors: { [name: string]: ExecutablePropertiesSpec }
  ): { [name: string]: ExecutablePropertiesSpec } {
    // Start with parent behaviors, then override with child
    return {
      ...parentBehaviors,
      ...childBehaviors
    };
  }

  // ================================================================
  // METADATA EXPANSION (v3.3+)
  // ================================================================

  /**
   * Expand model metadata into synthetic attributes
   * Transforms metadata declarations (id, audit, softDelete, etc.) into concrete attributes
   */
  private expandModelMetadata(
    modelName: string,
    metadata: any,
    attributes: AttributeSpec[],
    lifecycles: LifecycleSpec[]
  ): AttributeSpec[] {
    if (!metadata) {
      return attributes;
    }

    const syntheticAttributes: AttributeSpec[] = [];

    // 1. Expand ID field
    if (metadata.id) {
      const idAttr = this.expandIdField(metadata.id);
      syntheticAttributes.push(idAttr);
    }

    // 2. Expand audit fields (timestamps + user tracking)
    if (metadata.audit) {
      const auditAttrs = this.expandAuditFields(metadata.audit);
      syntheticAttributes.push(...auditAttrs);
    }

    // 3. Expand soft delete fields
    if (metadata.softDelete) {
      const softDeleteAttrs = this.expandSoftDeleteFields(metadata.softDelete);
      syntheticAttributes.push(...softDeleteAttrs);
    }

    // 4. Expand status field (from lifecycle or explicit)
    if (metadata.status) {
      const statusAttr = this.expandStatusField(metadata.status, lifecycles);
      if (statusAttr) {
        syntheticAttributes.push(statusAttr);
      }
    }

    // 5. Expand version field (optimistic locking)
    if (metadata.version) {
      const versionAttr = this.expandVersionField(metadata.version);
      syntheticAttributes.push(versionAttr);
    }

    // Check for conflicts with user-defined attributes
    const userAttrNames = new Set(attributes.map(a => a.name));
    for (const syntheticAttr of syntheticAttributes) {
      if (userAttrNames.has(syntheticAttr.name)) {
        this.addWarning(
          `Model ${modelName}: Synthetic attribute '${syntheticAttr.name}' conflicts with user-defined attribute. User attribute takes precedence.`
        );
      }
    }

    // Return synthetic attributes first, then user attributes (so user attributes can override)
    return [...syntheticAttributes, ...attributes];
  }

  /**
   * Expand ID field based on strategy
   */
  private expandIdField(idConfig: any): AttributeSpec {
    // Handle simple string form: id: "uuid"
    if (typeof idConfig === 'string') {
      return this.createIdAttribute('id', idConfig);
    }

    // Handle advanced object form: id: { type: "uuid", name: "userId" }
    const name = idConfig.name || 'id';
    const type = idConfig.type || 'auto';
    return this.createIdAttribute(name, type);
  }

  /**
   * Create ID attribute based on type
   */
  private createIdAttribute(name: string, type: string): AttributeSpec {
    const baseAttr: AttributeSpec = {
      name,
      type: '',
      required: true,
      unique: true
    };

    switch (type) {
      case 'uuid':
        return { ...baseAttr, type: 'UUID', auto: 'auto' };
      case 'integer':
        return { ...baseAttr, type: 'Integer', auto: 'auto' };
      case 'auto':
        // Platform decides (usually UUID)
        return { ...baseAttr, type: 'UUID', auto: 'auto' };
      case 'manual':
        // User must provide ID
        return { ...baseAttr, type: 'String' };
      case 'composite':
        // Composite key - no single ID field generated here
        // (would require multiple fields, handled separately)
        return { ...baseAttr, type: 'String' };
      default:
        return { ...baseAttr, type: 'UUID', auto: 'auto' };
    }
  }

  /**
   * Expand audit fields (timestamps + user tracking)
   */
  private expandAuditFields(auditConfig: any): AttributeSpec[] {
    const attributes: AttributeSpec[] = [];

    // Handle simple boolean form: audit: true
    if (auditConfig === true) {
      // Default: both timestamps and users
      attributes.push(
        { name: 'createdAt', type: 'Timestamp', required: true, unique: false, auto: 'auto' },
        { name: 'updatedAt', type: 'Timestamp', required: true, unique: false, auto: 'auto' },
        { name: 'createdBy', type: 'String', required: false, unique: false, auto: 'auto' },
        { name: 'updatedBy', type: 'String', required: false, unique: false, auto: 'auto' }
      );
      return attributes;
    }

    // Handle advanced object form
    const timestamps = auditConfig.timestamps !== false; // Default true
    const users = auditConfig.users !== false; // Default true
    const timestampNames = auditConfig.timestampNames || {};
    const userNames = auditConfig.userNames || {};

    if (timestamps) {
      attributes.push(
        {
          name: timestampNames.created || 'createdAt',
          type: 'Timestamp',
          required: true,
          unique: false,
          auto: 'auto'
        },
        {
          name: timestampNames.updated || 'updatedAt',
          type: 'Timestamp',
          required: true,
          unique: false,
          auto: 'auto'
        }
      );
    }

    if (users) {
      attributes.push(
        {
          name: userNames.created || 'createdBy',
          type: 'String',
          required: false,
          unique: false,
          auto: 'auto'
        },
        {
          name: userNames.updated || 'updatedBy',
          type: 'String',
          required: false,
          unique: false,
          auto: 'auto'
        }
      );
    }

    return attributes;
  }

  /**
   * Expand soft delete fields
   */
  private expandSoftDeleteFields(softDeleteConfig: any): AttributeSpec[] {
    const attributes: AttributeSpec[] = [];

    // Handle simple boolean form: softDelete: true
    if (softDeleteConfig === true) {
      attributes.push(
        { name: 'deletedAt', type: 'Timestamp', required: false, unique: false },
        { name: 'isDeleted', type: 'Boolean', required: true, unique: false, default: 'false' }
      );
      return attributes;
    }

    // Handle advanced object form
    const fieldNames = softDeleteConfig.fieldNames || {};
    attributes.push(
      {
        name: fieldNames.deletedAt || 'deletedAt',
        type: 'Timestamp',
        required: false,
        unique: false
      },
      {
        name: fieldNames.isDeleted || 'isDeleted',
        type: 'Boolean',
        required: true,
        unique: false,
        default: 'false'
      }
    );

    return attributes;
  }

  /**
   * Expand status field from lifecycle or explicit values
   */
  private expandStatusField(statusConfig: any, lifecycles: LifecycleSpec[]): AttributeSpec | null {
    // Handle simple string form: status: "lifecycleName"
    if (typeof statusConfig === 'string') {
      const lifecycle = lifecycles.find(lc => lc.name === statusConfig);
      if (lifecycle && lifecycle.states.length > 0) {
        return {
          name: 'status',
          type: 'String',
          required: true,
          unique: false,
          default: lifecycle.states[0], // First state is default
          values: lifecycle.states
        };
      }
      // Lifecycle not found - warning already issued elsewhere
      return null;
    }

    // Handle advanced object form
    const fieldName = statusConfig.field || 'status';

    // Option 1: Derive from lifecycle
    if (statusConfig.lifecycle) {
      const lifecycle = lifecycles.find(lc => lc.name === statusConfig.lifecycle);
      if (lifecycle && lifecycle.states.length > 0) {
        return {
          name: fieldName,
          type: 'String',
          required: true,
          unique: false,
          default: lifecycle.states[0],
          values: lifecycle.states
        };
      }
    }

    // Option 2: Explicit values
    if (statusConfig.values && Array.isArray(statusConfig.values)) {
      return {
        name: fieldName,
        type: 'String',
        required: true,
        unique: false,
        default: statusConfig.values[0],
        values: statusConfig.values
      };
    }

    return null;
  }

  /**
   * Expand version field for optimistic locking
   */
  private expandVersionField(versionConfig: any): AttributeSpec {
    // Handle simple boolean form: version: true
    if (versionConfig === true) {
      return {
        name: 'version',
        type: 'Integer',
        required: true,
        unique: false,
        default: '1',
        auto: 'auto'
      };
    }

    // Handle advanced object form
    const fieldName = versionConfig.field || 'version';
    const fieldType = versionConfig.type === 'timestamp' ? 'Timestamp' : 'Integer';

    const attr: AttributeSpec = {
      name: fieldName,
      type: fieldType,
      required: true,
      unique: false,
      auto: 'auto'
    };

    // Only add default for Integer type
    if (fieldType === 'Integer') {
      attr.default = '1';
    }

    return attr;
  }
}