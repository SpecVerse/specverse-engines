/**
 * Component Type Resolver for v3.4.0
 *
 * Dynamically resolves component types based on v3.4 inference rules
 * instead of hardcoded switch statements.
 *
 * Updated for Phase 2: Uses domain-specific ConfigurationRuleFile format directly
 */

import {
  ConfigurationRuleFile,
  ComponentMappings,
  AttributeComponentMapping,
  RelationshipComponentMapping
} from '../../core/rule-file-types.js';

// Re-export types for backward compatibility
export type AttributeRule = AttributeComponentMapping;
export type RelationshipRule = RelationshipComponentMapping;

export interface ViewPattern {
  pattern: string;
  priority: number;
  components: Record<string, {
    type: string;
    [key: string]: any;
  }>;
}

// Legacy interface for backward compatibility
export interface ComponentMappingRules {
  version: string;
  description: string;
  logical_inference: {
    component_type_mapping: {
      description: string;
      attribute_rules: AttributeComponentMapping[];
      relationship_mapping: RelationshipComponentMapping[];
    };
    automatic_crud_views?: {
      description: string;
      list_view?: ViewPattern;
      detail_view?: ViewPattern;
      form_view?: ViewPattern;
    };
  };
}

export class ComponentTypeResolver {
  private mappings: ComponentMappings | null = null;
  private version: string = '';

  /**
   * Load component mappings from domain-specific format
   */
  loadRulesFromDomainSpecific(ruleFile: ConfigurationRuleFile): void {
    if (ruleFile.ruleFileType !== 'configuration') {
      throw new Error('Invalid rule file type - expected configuration');
    }
    if (ruleFile.category !== 'component-mappings') {
      throw new Error('Invalid category - expected component-mappings');
    }
    this.mappings = ruleFile.mappings as ComponentMappings;
    this.version = ruleFile.version;
  }

  /**
   * Load component mapping rules from legacy JSON format (backward compatibility)
   */
  loadRules(rules: ComponentMappingRules): void {
    this.mappings = {
      description: rules.logical_inference.component_type_mapping.description,
      attributes: rules.logical_inference.component_type_mapping.attribute_rules,
      relationships: rules.logical_inference.component_type_mapping.relationship_mapping
    };
    this.version = rules.version;
  }

  /**
   * Resolve component type for an attribute
   */
  resolveAttributeComponentType(attribute: any): { type: string; properties?: Record<string, any> } {
    if (!this.mappings) {
      throw new Error('Component mapping rules not loaded');
    }

    const attributeRules = this.mappings.attributes;

    // Try to find matching rule
    for (const rule of attributeRules) {
      if (this.matchesAttributeRule(attribute, rule)) {
        return {
          type: rule.componentType,
          properties: rule.properties
        };
      }
    }

    // Default fallback
    return { type: 'input' };
  }

  /**
   * Resolve component type for a relationship
   */
  resolveRelationshipComponentType(relationship: any): { type: string; properties?: Record<string, any> } {
    if (!this.mappings) {
      throw new Error('Component mapping rules not loaded');
    }

    const relationshipRules = this.mappings.relationships;

    // Find matching rule
    for (const rule of relationshipRules) {
      if (relationship.type === rule.relationshipType || relationship.relationshipType === rule.relationshipType) {
        return {
          type: rule.componentType,
          properties: rule.properties
        };
      }
    }

    // Default fallback
    return { type: 'list' };
  }

  /**
   * Get CRUD view pattern components
   * TODO: Update to use domain-specific format view patterns
   */
  getListViewPattern(): Record<string, any> | null {
    if (!this.mappings?.listViewPattern) {
      return null;
    }
    return this.mappings.listViewPattern as Record<string, any>;
  }

  getDetailViewPattern(): Record<string, any> | null {
    if (!this.mappings?.detailViewPattern) {
      return null;
    }
    return this.mappings.detailViewPattern as Record<string, any>;
  }

  getFormViewPattern(): Record<string, any> | null {
    if (!this.mappings?.formViewPattern) {
      return null;
    }
    return this.mappings.formViewPattern as Record<string, any>;
  }

  /**
   * Check if attribute matches a rule
   */
  private matchesAttributeRule(attribute: any, rule: AttributeComponentMapping): boolean {
    // Check attribute type
    const attrType = attribute.type.toLowerCase();
    const ruleType = rule.attributeType.toLowerCase();

    if (attrType !== ruleType) {
      return false;
    }

    // If rule has constraints, check them
    if (rule.constraints) {
      // Check for enum values (has: "values")
      if (rule.constraints.has === 'values') {
        if (!attribute.values && !attribute.enum) {
          return false;
        }
      }

      // Check for minLength constraint
      if (rule.constraints.minLength) {
        const minLength = parseInt(rule.constraints.minLength.replace('>', ''));
        if (!attribute.minLength || attribute.minLength <= minLength) {
          return false;
        }
      }
    }

    // If this is a default rule, only match if no constraints on attribute
    if (rule.default) {
      if (attribute.values || attribute.enum || attribute.minLength > 100) {
        return false;
      }
      return true;
    }

    // If we got here and rule has constraints, we matched them
    if (rule.constraints) {
      return true;
    }

    // Simple type match without constraints
    return true;
  }

  /**
   * Check if rules are loaded
   */
  isLoaded(): boolean {
    return this.mappings !== null;
  }

  /**
   * Get loaded rules version
   */
  getVersion(): string | null {
    return this.version || null;
  }
}
