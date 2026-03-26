# @specverse/engine-realize

Generate production-ready code from SpecVerse specifications using instance factories and manifests.

## Purpose

The realize engine is the final stage of the SpecVerse pipeline. It takes an inferred specification and a manifest (which declares technology choices) and produces runnable code: Fastify routes, Prisma schemas, React components, CLI commands, VSCode extensions, MCP servers, and project scaffolding. Code generation is driven by instance factories -- pluggable template modules organized by concern (ORM, controllers, views, etc.) -- resolved against manifest capability declarations.

## Installation

```bash
npm install @specverse/engine-realize
```

## Dependencies

| Package | Why |
|---------|-----|
| @specverse/types | Shared type definitions (RealizeEngine, GeneratedOutput, etc.) |
| @specverse/engine-parser | Parsed AST structures used as input |
| @specverse/engine-generators | AI view optimization for code generation context |
| ajv / ajv-formats | JSON Schema validation of manifests and instance factories |
| glob | File discovery for instance factory loading |
| js-yaml / yaml | YAML parsing for manifests and specs |
| semver | Version constraint matching for manifest resolution |

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `InstanceFactoryLibrary` | class | Discovers and indexes all available instance factories |
| `createDefaultLibrary` | function | Creates an InstanceFactoryLibrary with built-in factories |
| `createResolver` | function | Creates a resolver that matches manifest capabilities to factories |
| `createCodeGenerator` | function | Creates the template-based code generator |
| `loadManifest` | function | Loads and validates a manifest YAML file |
| `engine` | instance | Pre-configured engine adapter for EngineRegistry discovery |
| `SpecVerseRealizeEngine` | class | Full realize pipeline: resolve, generate, copy assets |

## Usage

```typescript
import { createDefaultLibrary, createResolver, createCodeGenerator } from '@specverse/engine-realize';
import { loadManifest } from '@specverse/engine-realize';

const library = await createDefaultLibrary(process.cwd());
const manifest = loadManifest('./manifest.yaml');
const resolver = createResolver(library, manifest);
const codeGen = createCodeGenerator();

// Resolve a capability to its instance factory
const ormResolved = resolver.resolveCapability('orm.schema');

// Generate code from a template
const output = await codeGen.generateFromTemplate(
  ormResolved, 'schema', { spec, models }, { outputDir: './output' }
);
// output.code contains generated source, output.filePath is the target path
```

## Architecture

```
src/
├── engines/                     # Code generation engines
│   ├── code-generator.ts        #   Template-based code generator
│   ├── engine-registry.ts       #   Engine discovery and registration
│   └── typescript-engine.ts     #   TypeScript-specific generation
├── library/                     # Instance factory system
│   ├── library.ts               #   Factory discovery and indexing
│   ├── resolver.ts              #   Manifest → factory resolution
│   ├── loader.ts                #   Factory file loading
│   └── validator.ts             #   Factory and manifest validation
├── types/                       # Type definitions
│   ├── instance-factory.ts      #   InstanceFactory, TemplateContext types
│   └── unified-mappings.ts      #   Cross-concern mapping types
├── utils/                       # Utilities
│   ├── manifest-loader.ts       #   YAML manifest loading
│   ├── ai-spec-loader.ts        #   AI-optimized spec loading
│   └── mapping-migration.ts     #   Mapping format migration
└── generators/                  # (Deprecated -- use factory system)

libs/instance-factories/         # Code generation templates (shipped with package)
├── controllers/                 #   Fastify route handlers
├── orms/                        #   Prisma schema generation
├── views/                       #   React components, forms, hooks
├── services/                    #   Service layer generation
├── cli/                         #   CLI command generation
├── tools/                       #   VSCode extension, MCP server generators
├── scaffolding/                 #   Project scaffold (package.json, tsconfig, etc.)
├── applications/                #   App entry points (Fastify server wiring)
├── infrastructure/              #   Infrastructure templates
├── testing/                     #   Test generation
├── validation/                  #   Validation helpers
├── sdks/                        #   SDK generation
├── communication/               #   Communication layer
├── storage/                     #   Storage layer
└── shared/                      #   Shared utilities across factories

assets/
├── templates/                   #   Project scaffolding templates (init command)
├── examples/                    #   Example specifications
└── examples-decomposed/         #   Decomposed example variants
```

## Extension

To add a new code generation target:

1. Create an instance factory directory under `libs/instance-factories/your-concern/`
2. Add a factory definition JSON with capability declarations and code templates
3. Register the capability in the manifest schema so manifests can request it
4. The `InstanceFactoryLibrary` will auto-discover the factory on initialization

To add a new manifest capability:

1. Define the capability key (e.g., `messaging.broker`)
2. Create an instance factory that implements the capability
3. Add the capability to the manifest schema in `schema/`

## See Also

- [@specverse/types](../types/) -- shared type definitions
- [@specverse/engine-inference](../inference/) -- produces the inferred spec that realize consumes
- [@specverse/engine-generators](../generators/) -- AI view optimization used during realization
- `docs/guides/ADDING-AN-ENTITY-TYPE.md` -- entity types can contribute instance factories
