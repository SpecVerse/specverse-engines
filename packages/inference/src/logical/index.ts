/**
 * V3.1 Logical Inference Engine - Entry Point
 * Exports logical inference capabilities and generators
 */

// Main logical engine
export { LogicalInferenceEngine } from './logical-engine.js';
export type { LogicalInferenceResult } from './logical-engine.js';

// Generators
export { ControllerGenerator } from './generators/controller-generator.js';
export { EventGenerator } from './generators/event-generator.js';
export { ServiceGenerator } from './generators/service-generator.js';
export { ViewGenerator } from './generators/view-generator.js';

// Export generator result types that were missing in TypeDoc
export type { ControllerGenerationResult } from './generators/controller-generator.js';
export type { EventGenerationResult } from './generators/event-generator.js';
export type { ServiceGenerationResult } from './generators/service-generator.js';
export type { ViewGenerationResult } from './generators/view-generator.js';

// Export generator helper types (for TypeDoc)
export { ComponentTypeResolver } from './generators/component-type-resolver.js';
export type { ComponentMappingRules, ViewPattern } from './generators/component-type-resolver.js';
export { SpecialistViewExpander } from './generators/specialist-view-expander.js';
export type { SpecialistViewRules, SpecialistViewDefinition } from './generators/specialist-view-expander.js';