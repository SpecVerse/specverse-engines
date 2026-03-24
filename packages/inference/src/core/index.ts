/**
 * V3.1 Inference Engine Core - Entry Point
 * Exports all core functionality for the rule-based inference system
 */

// Core types
export * from './types.js';

// Re-export specific types that were missing in TypeDoc
export type {
  ControllerSpec,
  ServiceSpec,
  EventSpec,
  ViewSpec,
  ModelSpec
} from './types.js';

// Rule file types (for TypeDoc)
export type {
  RuleFileType,
  RuleFile,
  ConfigurationRuleFile,
  ExpansionTemplateRuleFile,
  PatternInferenceRuleFile,
  DeploymentRuleFile,
  LegacyRuleFile,
  ComponentMappings,
  SpecialistViewTemplate,
  ViewPatternMappings,
  InferenceRule as RuleFileInferenceRule,
  AttributeComponentMapping,
  RelationshipComponentMapping,
  ComponentTemplate,
  DeploymentBindingRule,
  DeploymentCapabilityRule,
  DeploymentChannelRule,
  DeploymentInstanceRule,
  DetailViewPattern,
  FormViewPattern,
  ListViewPattern,
  ViewPattern as RuleFileViewPattern
} from './rule-file-types.js';

// Core engine
export { RuleEngine } from './rule-engine.js';

// Rule loading
export { RuleLoader } from './rule-loader.js';

// Context management
export { InferenceContextManager, ContextUtils } from './context.js';

// Default configuration
import { DEFAULT_ENGINE_CONFIG } from './types.js';
export { DEFAULT_ENGINE_CONFIG };

// Specly converter
export { SpeclyConverter } from './specly-converter.js';