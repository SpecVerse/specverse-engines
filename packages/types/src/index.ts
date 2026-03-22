/**
 * @specverse/types — Shared type definitions for all SpecVerse engines
 *
 * This package contains:
 * - AST types (SpecVerseAST, ComponentSpec, ModelSpec, etc.)
 * - Engine interfaces (SpecVerseEngine, ParserEngine, InferenceEngine, RealizeEngine)
 * - Processor types (ProcessorContext, AbstractProcessor) — breaks parser ↔ entities cycle
 * - Entity module types (EntityModule, EntityRegistryInterface, facet interfaces)
 */

export * from './ast.js';
export * from './engine.js';
export * from './processor.js';
export * from './entity-module.js';
