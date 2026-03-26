# @specverse/engine-inference

Generate full architecture from minimal model specifications using a rule-based inference engine.

## Purpose

The inference engine transforms a small set of model definitions into a complete application architecture -- controllers, services, events, views, and deployments. It uses JSON rule files auto-discovered from entity modules, so each entity type contributes its own inference rules. The engine also includes a Quint-to-TypeScript transpiler for generating runtime guard functions from formal specifications.

## Installation

```bash
npm install @specverse/engine-inference
```

## Dependencies

| Package | Why |
|---------|-----|
| @specverse/types | Shared type definitions (SpecVerseEngine, InferenceEngine, etc.) |
| @specverse/engine-entities | Entity modules that supply JSON inference rules |
| js-yaml | Serialize inferred architecture to YAML output |

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `ComprehensiveInferenceEngine` | class | Top-level engine that orchestrates core + logical + deployment inference |
| `RuleEngine` | class | Core rule engine that loads and applies JSON rule files |
| `RuleLoader` | class | Discovers and loads rule files from entity modules |
| `LogicalInferenceEngine` | class | Generates controllers, services, events, and views from models |
| `ControllerGenerator` | class | Infers REST controllers from model definitions |
| `ServiceGenerator` | class | Infers service layer from models and relationships |
| `EventGenerator` | class | Infers domain events from lifecycle transitions and behaviors |
| `ViewGenerator` | class | Infers UI views from model attributes and relationships |
| `SpecialistViewExpander` | class | Expands specialist view templates into concrete view specs |
| `InferenceContextManager` | class | Manages shared context across inference passes |
| `SpeclyConverter` | class | Converts between AST and inference model formats |
| `transpileEntityGuards` | function | Scans entity modules for Quint files and transpiles to TypeScript |
| `transpileQuintFile` | function | Transpiles a single Quint spec file to TypeScript guards |
| `generateGuardsModule` | function | Produces a complete TypeScript module from transpiled guards |
| `engine` | instance | Pre-configured engine adapter for EngineRegistry discovery |

## Usage

```typescript
import { ComprehensiveInferenceEngine } from '@specverse/engine-inference';

const engine = new ComprehensiveInferenceEngine({}, false);
await engine.loadRules();

const result = await engine.inferCompleteSpecification(
  models,        // ModelDefinition[] from parsed spec
  'MyApp',       // component name
  'development'  // target environment
);
// result.component contains controllers, services, events, views
// result.deployments contains environment configurations
// result.statistics tracks rules applied per category
```

## Architecture

```
src/
├── core/                    # Rule engine fundamentals
│   ├── rule-engine.ts       #   Load, match, and apply JSON rules
│   ├── rule-loader.ts       #   Discover rule files from entity modules
│   ├── context.ts           #   Shared inference context across passes
│   ├── specly-converter.ts  #   AST ↔ inference format conversion
│   ├── types.ts             #   Core type definitions
│   └── rule-file-types.ts   #   JSON rule file schema types
├── logical/                 # Architecture inference from models
│   ├── logical-engine.ts    #   Orchestrates all generators
│   └── generators/          #   Per-concern generators
│       ├── controller-generator.ts
│       ├── service-generator.ts
│       ├── event-generator.ts
│       ├── view-generator.ts
│       ├── specialist-view-expander.ts
│       ├── promotion-generator.ts
│       └── component-type-resolver.ts
├── deployment/              # Deployment configuration inference
│   └── deployment-generator.ts
├── comprehensive-engine.ts  # Combines core + logical + deployment
└── quint-transpiler.ts      # Quint → TypeScript guard transpilation
```

Rules are JSON files stored in entity modules (e.g., `v3.1-controller-rules.json`, `v3.1-service-rules.json`). The `RuleLoader` auto-discovers them so new entity types automatically contribute inference rules.

## Extension

To add inference rules for a new entity type:

1. Create JSON rule files in the entity module's `rules/logical/` directory
2. Follow the existing naming convention (`v3.1-{concern}-rules.json`)
3. The `RuleLoader` will auto-discover them on next `loadRules()` call

See `docs/guides/ADDING-AN-ENTITY-TYPE.md` for the full 11-step process.

## See Also

- [@specverse/types](../types/) -- shared type definitions
- [@specverse/engine-entities](../entities/) -- entity module system that supplies rules
- [@specverse/engine-realize](../realize/) -- consumes inference output to generate code
- `docs/guides/ADDING-AN-ENTITY-TYPE.md` -- adding new entity types with inference rules
