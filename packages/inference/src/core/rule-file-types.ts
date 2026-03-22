/**
 * Domain-Specific Rule File Type Definitions
 *
 * Defines the structure for different types of inference rule files.
 * Each rule file type serves a specific purpose and has an optimized structure.
 */

// ============================================================================
// Base Types
// ============================================================================

export type RuleFileType = 'pattern-inference' | 'configuration' | 'expansion-template' | 'deployment';

export interface BaseRuleFile {
  ruleFileType: RuleFileType;
  version: string;
  description?: string;
}

// ============================================================================
// Pattern-Based Inference Rules (v3.1 style)
// ============================================================================

/**
 * Pattern-based inference rules for conditional code generation.
 * Used for controllers, services, events, and base views.
 */
export interface PatternInferenceRuleFile extends BaseRuleFile {
  ruleFileType: 'pattern-inference';
  category: 'controllers' | 'services' | 'events' | 'views';
  rules: InferenceRule[];
}

export interface InferenceRule {
  name: string;
  pattern: string;
  condition: string;
  priority: number;
  description: string;
  template: {
    type: 'yaml' | 'json' | 'specly' | 'handlebars';
    content: string | string[];
  };
}

// ============================================================================
// Configuration-Based Mappings
// ============================================================================

/**
 * Configuration files for lookup-based mappings.
 * Used for component type mappings and view patterns.
 */
export interface ConfigurationRuleFile extends BaseRuleFile {
  ruleFileType: 'configuration';
  category: 'component-mappings' | 'view-patterns';
  mappings: ComponentMappings | ViewPatternMappings;
}

export interface ComponentMappings {
  description: string;
  attributes: AttributeComponentMapping[];
  relationships: RelationshipComponentMapping[];
  listViewPattern?: ListViewPattern;
  detailViewPattern?: DetailViewPattern;
  formViewPattern?: FormViewPattern;
}

export interface AttributeComponentMapping {
  attributeType: string;
  constraints?: {
    has?: string;
    minLength?: string;
    maxLength?: string;
    pattern?: string;
  };
  default?: boolean;
  componentType: string;
  properties?: Record<string, any>;
  description: string;
}

export interface RelationshipComponentMapping {
  relationshipType: 'belongsTo' | 'hasOne' | 'hasMany' | 'manyToMany';
  componentType: string;
  properties?: Record<string, any>;
  description: string;
}

export interface ListViewPattern {
  searchBar: { type: string; properties?: Record<string, any> };
  filterPanel: { type: string; properties?: Record<string, any> };
  table: { type: string; properties?: Record<string, any> };
  actionToolbar: { type: string; properties?: Record<string, any> };
}

export interface DetailViewPattern {
  header: { type: string; properties?: Record<string, any> };
  card: { type: string; properties?: Record<string, any> };
  tabs?: { type: string; properties?: Record<string, any> };
  actions: { type: string; properties?: Record<string, any> };
}

export interface FormViewPattern {
  header: { type: string; properties?: Record<string, any> };
  form: { type: string; properties?: Record<string, any> };
  actions: { type: string; properties?: Record<string, any> };
}

export interface ViewPatternMappings {
  description: string;
  patterns: Record<string, ViewPattern>;
}

export interface ViewPattern {
  description: string;
  components: Record<string, { type: string; properties?: Record<string, any> }>;
}

// ============================================================================
// Expansion Templates
// ============================================================================

/**
 * Expansion templates for specialist views.
 * Defines how abstract view types expand to atomic components.
 */
export interface ExpansionTemplateRuleFile extends BaseRuleFile {
  ruleFileType: 'expansion-template';
  category: 'specialist-views';
  templates: Record<string, SpecialistViewTemplate>;
}

export interface SpecialistViewTemplate {
  description: string;
  components: ComponentTemplate[];
}

export interface ComponentTemplate {
  name: string;
  type: string;
  for?: string; // "each metric", "each chart", "each column"
  properties?: Record<string, any>;
}

// ============================================================================
// Deployment Inference Rules
// ============================================================================

/**
 * Deployment inference rules for generating deployment topology.
 * Used for instances, channels, capabilities, and bindings.
 */
export interface DeploymentRuleFile extends BaseRuleFile {
  ruleFileType: 'deployment';
  deployment_inference: {
    instances?: DeploymentInstanceRule[];
    channels?: DeploymentChannelRule[];
    capabilities?: DeploymentCapabilityRule[];
    bindings?: DeploymentBindingRule[];
  };
}

export interface DeploymentInstanceRule {
  name: string;
  pattern: string;
  condition: string;
  priority: number;
  description: string;
  template: {
    type: 'yaml' | 'json' | 'specly' | 'handlebars';
    content: string | string[];
  };
}

export interface DeploymentChannelRule {
  name: string;
  pattern: string;
  condition: string;
  priority: number;
  description: string;
  template: {
    type: 'yaml' | 'json' | 'specly' | 'handlebars';
    content: string | string[];
  };
}

export interface DeploymentCapabilityRule {
  name: string;
  pattern: string;
  condition: string;
  priority: number;
  description: string;
  template: {
    type: 'yaml' | 'json' | 'specly' | 'handlebars';
    content: string | string[];
  };
}

export interface DeploymentBindingRule {
  name: string;
  pattern: string;
  condition: string;
  priority: number;
  description: string;
  template: {
    type: 'yaml' | 'json' | 'specly' | 'handlebars';
    content: string | string[];
  };
}

// ============================================================================
// Legacy Format Support (Backward Compatibility)
// ============================================================================

/**
 * Legacy format (v3.1) with logical_inference wrapper.
 * Supported for backward compatibility.
 */
export interface LegacyRuleFile {
  version: string;
  description?: string;
  logical_inference: {
    [category: string]: InferenceRule[] | any;
  };
}

// ============================================================================
// Union Type for All Rule Files
// ============================================================================

export type RuleFile =
  | PatternInferenceRuleFile
  | ConfigurationRuleFile
  | ExpansionTemplateRuleFile
  | DeploymentRuleFile
  | LegacyRuleFile;

// ============================================================================
// Type Guards
// ============================================================================

export function isPatternInferenceFile(file: any): file is PatternInferenceRuleFile {
  return file.ruleFileType === 'pattern-inference';
}

export function isConfigurationFile(file: any): file is ConfigurationRuleFile {
  return file.ruleFileType === 'configuration';
}

export function isExpansionTemplateFile(file: any): file is ExpansionTemplateRuleFile {
  return file.ruleFileType === 'expansion-template';
}

export function isDeploymentFile(file: any): file is DeploymentRuleFile {
  return file.ruleFileType === 'deployment';
}

export function isLegacyRuleFile(file: any): file is LegacyRuleFile {
  return !file.ruleFileType && file.logical_inference !== undefined;
}

// ============================================================================
// Format Detection Utilities
// ============================================================================

export function detectRuleFileType(content: any): RuleFileType | 'legacy' {
  if (content.ruleFileType) {
    return content.ruleFileType;
  }

  // Legacy detection - check for either logical_inference OR deployment_inference
  if (content.logical_inference) {
    // Check if it's v3.4 configuration-based (has object categories)
    for (const category in content.logical_inference) {
      const categoryData = content.logical_inference[category];

      if (category === 'component_type_mapping' || category === 'specialist_views') {
        return 'legacy'; // v3.4 legacy format
      }

      if (Array.isArray(categoryData)) {
        return 'legacy'; // v3.1 legacy format
      }
    }
  }

  // Also check for deployment_inference (legacy format for deployment rules)
  if (content.deployment_inference) {
    return 'legacy';
  }

  throw new Error('Unable to detect rule file type - missing ruleFileType field');
}

export function migrateLegacyToNewFormat(legacy: LegacyRuleFile): RuleFile[] {
  const result: RuleFile[] = [];

  for (const category in legacy.logical_inference) {
    const categoryData = legacy.logical_inference[category];

    // v3.1 pattern-based rules (arrays)
    if (Array.isArray(categoryData)) {
      result.push({
        ruleFileType: 'pattern-inference',
        version: legacy.version,
        description: legacy.description,
        category: category as any,
        rules: categoryData
      });
    }
    // v3.4 component mappings
    else if (category === 'component_type_mapping') {
      result.push({
        ruleFileType: 'configuration',
        version: legacy.version,
        description: legacy.description,
        category: 'component-mappings',
        mappings: categoryData
      });
    }
    // v3.4 specialist views
    else if (category === 'specialist_views') {
      result.push({
        ruleFileType: 'expansion-template',
        version: legacy.version,
        description: legacy.description,
        category: 'specialist-views',
        templates: categoryData
      });
    }
  }

  return result;
}
