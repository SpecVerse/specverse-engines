# @specverse/types

Shared type definitions for all SpecVerse engine packages — AST types, engine interfaces, entity module types, and processor abstractions.

## Purpose

This is the foundation package of the SpecVerse engine ecosystem. It defines the TypeScript types and interfaces that all other engine packages depend on, ensuring a consistent type contract across the parser, inference, realize, and entity systems. It also breaks the circular dependency between parser and entities by housing processor abstractions here.

## Installation

```bash
npm install @specverse/types
```

## Dependencies

None. This package has zero runtime dependencies — it exports only type definitions and a small utilities module.

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `SpecVerseAST` | type | Root AST node produced by the parser |
| `ComponentSpec`, `ModelSpec` | type | Individual component specifications within the AST |
| `SpecVerseEngine`, `ParserEngine`, `InferenceEngine`, `RealizeEngine` | interface | Engine contracts for the registry discovery system |
| `EngineInfo` | type | Metadata returned by `engine.getInfo()` |
| `ParseResult`, `ParseOptions` | type | Parser input/output types |
| `ProcessorContext`, `AbstractProcessor` | type/class | Processor abstractions shared between parser and entities |
| `EntityModule`, `EntityRegistryInterface` | type | Entity module system contracts |
| `EntityConventionProcessor`, `EntityInferenceRule`, `EntityGenerator` | type | Facet interfaces for entity modules |
| `pluralize` | function | Naive English pluralizer used across engine packages |

## Usage

```typescript
import type { SpecVerseAST, ModelSpec, ParserEngine } from '@specverse/types';

function inspectModels(ast: SpecVerseAST): void {
  for (const [name, model] of Object.entries(ast.models ?? {})) {
    console.log(`Model: ${name}, fields: ${Object.keys(model.attributes ?? {}).length}`);
  }
}
```

## Architecture

```
src/
├── ast.ts             # AST node types (SpecVerseAST, ModelSpec, ComponentSpec, etc.)
├── engine.ts          # Engine interfaces (ParserEngine, InferenceEngine, RealizeEngine)
├── processor.ts       # ProcessorContext and AbstractProcessor (breaks parser ↔ entities cycle)
├── entity-module.ts   # Entity module system types (EntityModule, facet interfaces)
├── utils.ts           # Small shared utilities (pluralize)
└── index.ts           # Barrel re-export
```

## See Also

- [@specverse/engine-entities](../entities/) — Entity module system that implements the types defined here
- [@specverse/engine-parser](../parser/) — Parser engine that produces `SpecVerseAST`
