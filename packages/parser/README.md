# @specverse/engine-parser

Parse `.specly` files (YAML + Conventions format) into a validated `SpecVerseAST`.

## Purpose

This package is the front door of the SpecVerse pipeline. It reads `.specly` specification files, validates them against a composed JSON Schema, runs entity-module convention processors to expand shorthand into full AST nodes, resolves cross-file imports, and produces a `SpecVerseAST` ready for inference and realization. Schema validation runs twice — once before convention processing (to catch syntax errors early) and once after (to validate the expanded output).

## Installation

```bash
npm install @specverse/engine-parser
```

## Dependencies

| Package | Why |
|---------|-----|
| `@specverse/types` | AST types, engine interfaces, `ParseResult`/`ParseOptions` |
| `@specverse/engine-entities` | Entity module convention processors used during parsing |
| `ajv` | JSON Schema validation (runs twice: pre- and post-convention processing) |
| `ajv-formats` | Format validators for JSON Schema (e.g., `uri`, `date-time`) |
| `js-yaml` | YAML parsing of `.specly` files |

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `UnifiedSpecVerseParser` | class | Main parser — schema validation, convention processing, import resolution |
| `parseSpecVerseFile` | function | Convenience: parse a `.specly` file given file and schema paths |
| `parseSpecVerse` | function | Convenience: parse YAML content string with a schema object |
| `ConventionProcessor` | class | Runs entity-module convention processors over parsed YAML |
| `ImportResolver` | class | Resolves `imports:` directives across `.specly` files with caching |
| `parseNamespace`, `parseReference`, `validateNamespace` | function | Namespace parsing and validation utilities |
| `engine` | `ParserEngine` | Singleton engine instance for `EngineRegistry` discovery |
| `SpecVerseAST`, `ModelSpec`, `ControllerSpec`, ... | type | Re-exported AST types for consumer convenience |
| `ParseOptions`, `ParseResult`, `ValidationError` | type | Parser input/output types |

## Usage

```typescript
import { parseSpecVerseFile } from '@specverse/engine-parser';

const result = parseSpecVerseFile('./my-app.specly', './schema.json');

if (result.errors.length > 0) {
  console.error('Validation errors:', result.errors);
} else {
  console.log(`Parsed ${Object.keys(result.ast.models ?? {}).length} models`);
}
```

## Architecture

```
src/
├── unified-parser.ts          # UnifiedSpecVerseParser — orchestrates the full parse pipeline
├── convention-processor.ts    # Runs entity-module convention processors over raw YAML
├── namespace-utils.ts         # Namespace parsing and reference resolution
├── import-resolver/
│   ├── resolver.ts            # ImportResolver — cross-file import resolution with caching
│   ├── cache.ts               # Import cache for resolved files
│   └── types.ts               # Import resolver type definitions
├── processors/                # Built-in AST processors (one per component type)
│   ├── AbstractProcessor.ts   # Base class for all processors
│   ├── ModelProcessor.ts      # Expands model shorthand (attributes, relationships, lifecycle)
│   ├── ControllerProcessor.ts # Controller convention processing
│   ├── ServiceProcessor.ts    # Service convention processing
│   ├── EventProcessor.ts      # Event convention processing
│   ├── ViewProcessor.ts       # View convention processing
│   ├── DeploymentProcessor.ts # Deployment convention processing
│   ├── AttributeProcessor.ts  # Attribute type expansion
│   ├── RelationshipProcessor.ts # Relationship shorthand expansion
│   ├── LifecycleProcessor.ts  # Lifecycle state machine processing
│   └── ExecutableProcessor.ts # Executable property processing
├── types/
│   ├── ast.ts                 # Local AST type definitions
│   └── views.ts               # View-specific types
└── index.ts                   # Barrel exports + convenience functions + engine adapter
```

### Parse Pipeline

1. **YAML parse** — Read `.specly` content into raw JavaScript objects
2. **Pre-convention schema validation** — Validate raw YAML against composed JSON Schema (catches syntax errors early)
3. **Convention processing** — Entity-module convention processors expand shorthand into full AST nodes
4. **Post-convention schema validation** — Validate expanded output against the same schema (ensures processors produced valid output)
5. **Import resolution** — Resolve `imports:` directives, merge referenced specifications
6. **AST construction** — Produce final `SpecVerseAST` with all components fully expanded

## See Also

- [@specverse/types](../types/) — AST types and engine interfaces
- [@specverse/engine-entities](../entities/) — Entity modules whose convention processors this parser invokes
- [ARCHITECTURE-GUIDE.md](../../docs/guides/ARCHITECTURE-GUIDE.md) — System architecture overview
