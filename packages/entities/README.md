# @specverse/engine-entities

Entity module system — 10 entity types with convention processors, schema fragments, inference rules, generators, and runtime engine discovery.

## Purpose

This package implements the entity module architecture that powers SpecVerse's convention-based processing. Each entity type (models, controllers, services, events, views, deployments, commands, measures, conventions, promotions) is a self-contained module with up to 9 facets. The package also provides the `EngineRegistry` for runtime discovery of engine packages and a bootstrap system that registers all entity modules at startup.

## Installation

```bash
npm install @specverse/engine-entities
```

## Dependencies

| Package | Why |
|---------|-----|
| `@specverse/types` | AST types, engine interfaces, entity module type contracts |
| `js-yaml` | YAML parsing for module manifests and examples |
| `yaml` | YAML serialization for schema composition scripts |

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `EntityRegistry`, `getEntityRegistry`, `resetEntityRegistry` | class/function | Singleton registry holding all registered entity modules |
| `bootstrapEntityModules` | function | Registers all core + extension modules into the registry |
| `getCoreModuleNames`, `getExtensionModuleNames` | function | List core (6) and extension (4) module names |
| `modelsModule`, `controllersModule`, `servicesModule`, `eventsModule`, `viewsModule`, `deploymentsModule` | EntityModule | Core entity modules |
| `commandsModule`, `measuresModule`, `conventionsModule` | EntityModule | Extension entity modules |
| `loadManifest`, `validateManifest` | function | Load and validate `module.yaml` manifests |
| `composeSchemaFromRegistry` | function | Compose a JSON Schema from all registered entity module schema fragments |
| `BehaviouralConventionProcessor` | class | Shared processor for lifecycle and Quint behaviour conventions |
| `EngineRegistry` | class | Runtime engine discovery — find and initialize engine packages |

## Usage

```typescript
import { bootstrapEntityModules, getEntityRegistry } from '@specverse/engine-entities';

// Register all entity modules
bootstrapEntityModules();

// Access a specific module
const registry = getEntityRegistry();
const models = registry.get('models');
console.log(`Models module has ${models.conventions?.length ?? 0} convention processors`);
```

## Architecture

```
src/
├── _bootstrap.ts              # Registers all core + extension modules
├── _registry.ts               # EntityRegistry singleton
├── engine-registry.ts         # EngineRegistry for runtime engine discovery
├── _shared/
│   ├── types.ts               # EntityModule and facet type definitions
│   ├── manifest.ts            # Module manifest loader/validator
│   ├── behaviour/             # BehaviouralConventionProcessor + Quint specs
│   ├── schema/                # Runtime schema composition
│   ├── processors/            # Shared processor utilities
│   └── examples/              # Cross-cutting examples + category-order.yaml
├── core/                      # 6 core entity types
│   ├── models/                #   Each module contains up to 9 facets:
│   ├── controllers/           #   module.yaml, conventions/, schema/,
│   ├── services/              #   inference/, generators/, behaviour/,
│   ├── events/                #   docs/, examples/, tests/
│   ├── views/
│   └── deployments/
└── extensions/                # 4 extension entity types
    ├── commands/
    ├── conventions/
    ├── measures/
    └── promotions/

scripts/
├── compose-schema.cjs                   # Compose JSON Schema from all entity schema fragments
├── compose-inference-rules.cjs          # Compose inference rules from all entity modules
├── generate-meta-specification.js       # Generate meta-specification documentation
├── generate-minimal-syntax-reference.js # Generate minimal syntax reference
└── json-to-yaml-schema.js              # Convert JSON Schema to YAML format
```

### Entity Module Facets (up to 9 per type)

1. **module.yaml** — Manifest declaring the module's facets and metadata
2. **conventions/** — Convention processors that expand shorthand into full AST
3. **schema/** — JSON Schema fragments for validation
4. **inference/** — Rules for the inference engine (JSON rule files)
5. **generators/** — Code/artifact generators
6. **behaviour/** — Quint formal specifications and behavioural constraints
7. **docs/** — Documentation references
8. **examples/** — Per-entity-type example .specly files
9. **tests/** — Test references

## Extension

To add a new entity type:

1. Create a new directory under `src/core/` or `src/extensions/`
2. Add a `module.yaml` manifest declaring the facets this entity type supports
3. Implement the facets you need (convention processor, schema fragment, inference rules, etc.)
4. Export the module from `src/index.ts`
5. Register it in `src/_bootstrap.ts`
6. Run `scripts/compose-schema.cjs` and `scripts/compose-inference-rules.cjs` to regenerate composed artifacts

See the full 11-step guide: [ADDING-AN-ENTITY-TYPE.md](../../docs/guides/ADDING-AN-ENTITY-TYPE.md)

## See Also

- [@specverse/types](../types/) — Type definitions this package implements
- [@specverse/engine-parser](../parser/) — Parser that uses entity convention processors
- [ADDING-AN-ENTITY-TYPE.md](../../docs/guides/ADDING-AN-ENTITY-TYPE.md) — Full entity type creation guide
- [ARCHITECTURE-GUIDE.md](../../docs/guides/ARCHITECTURE-GUIDE.md) — System architecture overview
