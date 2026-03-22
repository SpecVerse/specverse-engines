/**
 * ERDiagramPlugin - Entity-Relationship diagram generation
 *
 * Supports:
 * - er-diagram: Standard ER diagram with attributes and relationships
 * - profile-attachment: Profile attachment patterns
 */

import { BaseDiagramPlugin } from '../../core/BaseDiagramPlugin.js';
import {
  DiagramType,
  DiagramContext,
  MermaidDiagram,
  MermaidRelation,
  ValidationResult
} from '../../types/index.js';
import { ModelSpec, RelationshipSpec, SpecVerseAST } from '@specverse/types';

export class ERDiagramPlugin extends BaseDiagramPlugin {
  name = 'er-diagram-plugin';
  version = '1.0.0';
  description = 'Entity-Relationship diagrams with profile support';
  supportedTypes: DiagramType[] = ['er-diagram', 'profile-attachment'];

  /**
   * Generate diagram based on type
   */
  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    this.validateType(type);

    switch (type) {
      case 'er-diagram':
        return this.generateERDiagram(context);
      case 'profile-attachment':
        return this.generateProfileAttachmentDiagram(context);
      default:
        throw new Error(`Unsupported diagram type: ${type}`);
    }
  }

  /**
   * Validate AST for ER diagram generation
   */
  validate(ast: SpecVerseAST): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for models
    const allModels = ast.components.flatMap(c => c.models);
    if (allModels.length === 0) {
      errors.push('No models found - ER diagrams require at least one model');
    }

    // Check for circular relationships
    const circularRels = this.detectCircularRelationships(allModels);
    if (circularRels.length > 0) {
      warnings.push(`Circular relationships detected: ${circularRels.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate standard ER diagram
   */
  private generateERDiagram(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('erDiagram');
    diagram.title = context.options.title || 'Entity-Relationship Diagram';

    const allModels = context.getAllModels();

    // Add entities with attributes
    allModels.forEach(model => {
      if (context.options.includeAttributes !== false) {
        // Add model as node (ER diagrams handle this differently)
        const attributes: string[] = [];

        model.attributes.forEach(attr => {
          const type = this.mapToERType(attr.type);
          const modifiers = [];
          if (attr.unique) modifiers.push('UK');
          if (attr.required) modifiers.push('NOT NULL');

          const modifierStr = modifiers.length > 0 ? ` "${modifiers.join(', ')}"` : '';
          attributes.push(`${type} ${attr.name}${modifierStr}`);
        });

        // Store as metadata for renderer
        diagram.nodes.push({
          id: model.name,
          label: model.name,
          type: 'model',
          color: context.theme.colors.model,
          metadata: { attributes }
        });
      }

    });

    // Add relationships (deduplicated to avoid showing bidirectional relationships twice)
    if (context.options.includeRelationships !== false) {
      const deduplicatedRelationships = context.getDeduplicatedRelationships();

      deduplicatedRelationships.forEach(({ from, relationship }) => {
        const relation = this.createRelationship(from, relationship);
        if (relation) {
          diagram.relations = diagram.relations || [];
          diagram.relations.push(relation);
        }
      });

      // Add profile attachment relationships
      allModels.forEach(model => {
        if (model.profileAttachment && model.profileAttachment.profiles) {
          model.profileAttachment.profiles.forEach(baseProfile => {
            diagram.relations = diagram.relations || [];
            diagram.relations.push({
              from: model.name,
              to: baseProfile,
              type: 'belongsTo',  // Profile belongs to base model
              fromCardinality: '}o',
              toCardinality: '||',
              label: 'attaches to'
            });
          });
        }
      });
    }

    return diagram;
  }

  /**
   * Generate profile attachment diagram
   */
  private generateProfileAttachmentDiagram(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'LR');
    diagram.title = context.options.title || 'Profile Attachment Diagram';

    const allModels = context.getAllModels();
    const profileModels = new Set<string>();
    const baseModels = new Map<string, string[]>();

    // Find profile relationships using profileAttachment property OR attachesTo relationship
    allModels.forEach(model => {
      // Method 1: Using profileAttachment property
      if (model.profileAttachment && model.profileAttachment.profiles) {
        profileModels.add(model.name);
        // Each profile can attach to multiple base models
        model.profileAttachment.profiles.forEach(baseName => {
          if (!baseModels.has(baseName)) {
            baseModels.set(baseName, []);
          }
          baseModels.get(baseName)!.push(model.name);
        });
      }

      // Method 2: Using attachesTo relationship type (for test compatibility)
      if (model.relationships && model.relationships.length > 0) {
        const attachesToRels = model.relationships.filter((rel: any) => rel.type === 'attachesTo');
        if (attachesToRels.length > 0) {
          profileModels.add(model.name);
          attachesToRels.forEach((rel: any) => {
            const baseName = rel.target;
            if (!baseModels.has(baseName)) {
              baseModels.set(baseName, []);
            }
            baseModels.get(baseName)!.push(model.name);
          });
        }
      }
    });

    // Add base model subgraph
    if (baseModels.size > 0) {
      diagram.subgraphs.push({
        id: 'core_models',
        label: 'Core Models',
        nodes: Array.from(baseModels.keys())
      });

      baseModels.forEach((profiles, baseName) => {
        diagram.nodes.push({
          id: baseName,
          label: `${baseName}\n(Core)`,
          type: 'model',
          color: context.theme.colors.model,
          shape: 'rounded'
        });
      });
    }

    // Add profile subgraph
    if (profileModels.size > 0) {
      diagram.subgraphs.push({
        id: 'profiles',
        label: 'Profile Models',
        nodes: Array.from(profileModels)
      });

      profileModels.forEach(profileName => {
        diagram.nodes.push({
          id: profileName,
          label: `${profileName}\n(Profile)`,
          type: 'profile',
          color: context.theme.colors.profile,
          shape: 'hexagon'
        });
      });
    }

    // Add attachment edges
    baseModels.forEach((profiles, base) => {
      profiles.forEach(profile => {
        diagram.edges.push({
          from: profile,
          to: base,
          label: 'attaches to',
          type: 'dashed',
          arrow: 'single'
        });
      });
    });

    return diagram;
  }

  /**
   * Helper: Map SpecVerse types to ER diagram types
   */
  private mapToERType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'String': 'string',
      'Text': 'text',
      'Integer': 'int',
      'Number': 'float',
      'Boolean': 'bool',
      'Date': 'date',
      'DateTime': 'datetime',
      'Time': 'time',
      'Email': 'string',
      'URL': 'string',
      'UUID': 'uuid',
      'JSON': 'json'
    };

    return typeMap[type] || 'string';
  }

  /**
   * Helper: Create relationship for ER diagram
   */
  private createRelationship(modelName: string, rel: RelationshipSpec): MermaidRelation | null {
    const cardinality = this.getCardinality(rel);
    if (!cardinality) return null;

    const relation: MermaidRelation = {
      from: modelName,
      to: rel.target,
      type: rel.type as 'hasMany' | 'hasOne' | 'belongsTo' | 'manyToMany',
      fromCardinality: cardinality.from,
      toCardinality: cardinality.to,
      label: rel.type
    };

    // Add cascade annotation if present
    if (rel.cascade) {
      relation.metadata = { cascade: rel.cascade };
    }

    // Add through table annotation if present
    if (rel.through) {
      relation.metadata = { ...relation.metadata, through: rel.through };
    }

    return relation;
  }

  /**
   * Helper: Get cardinality notation for relationship
   */
  private getCardinality(rel: RelationshipSpec): { from: string; to: string } | null {
    switch (rel.type) {
      case 'hasMany':
        return { from: '||', to: 'o{' };
      case 'hasOne':
        return { from: '||', to: '||' };
      case 'belongsTo':
        return { from: '}o', to: '||' };
      case 'manyToMany':
        return { from: '}o', to: 'o{' };
      default:
        return null;
    }
  }

  /**
   * Helper: Detect circular relationships
   */
  private detectCircularRelationships(models: ModelSpec[]): string[] {
    const circular: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (modelName: string, path: string[]): void => {
      if (recursionStack.has(modelName)) {
        circular.push(path.concat(modelName).join(' -> '));
        return;
      }

      if (visited.has(modelName)) return;

      visited.add(modelName);
      recursionStack.add(modelName);

      const model = models.find(m => m.name === modelName);
      if (model) {
        model.relationships.forEach(rel => {
          detectCycle(rel.target, [...path, modelName]);
        });
      }

      recursionStack.delete(modelName);
    };

    models.forEach(model => {
      if (!visited.has(model.name)) {
        detectCycle(model.name, []);
      }
    });

    return circular;
  }

  /**
   * Get default options for ER diagrams
   */
  getDefaultOptions() {
    return {
      includeAttributes: true,
      includeRelationships: true,
      title: 'Entity-Relationship Diagram'
    };
  }
}
