# _shared

Foundation layer that all entity modules build on. Contains shared schema fragments, convention processors, behavioural types, cross-cutting examples, and the core type re-exports.

## Directory Structure

```
_shared/
├── schema/              Shared JSON Schema fragments and composition tooling
├── processors/          Shared convention processors (reused by entity modules)
├── behaviour/           Shared Quint type definitions and behavioural convention engine
├── examples/            19 cross-cutting examples with metadata and learning paths
├── types.ts             Core type re-exports (EntityModule, EntityConventionProcessor, etc.)
└── manifest.ts          Module manifest loader and validator
```

## schema/

Shared JSON Schema fragments that are composed into the unified SpecVerse schema.

| File | Purpose |
|------|---------|
| `root-structure.json` | Top-level schema: components, deployments, manifests containers |
| `primitives.schema.json` | Primitive type definitions shared across all entity schemas |
| `root.schema.json` | Root-level schema definitions |
| `manifests.schema.json` | Manifest and instance factory schema |
| `instance-factories.schema.json` | Instance factory definitions for technology mapping |
| `compose-schema.ts` | Assembles per-entity schemas + shared fragments into unified schema |
| `compose-runtime.ts` | Runtime schema composition utilities |

The composition script (`compose-schema.ts`) merges all entity-specific schemas with these shared fragments to produce the complete `SPECVERSE-SCHEMA.json`. CI verifies the composed output matches the checked-in schema.

## processors/

Reusable convention processors that entity modules delegate to for common processing patterns.

| Processor | Processes | Used By |
|-----------|-----------|---------|
| `AttributeProcessor` | `email: Email required unique` shorthand into full attribute specs | models, and any entity with typed fields |
| `ExecutableProcessor` | Unified input/output and parameters/returns for executable definitions | services, controllers, commands |
| `LifecycleProcessor` | `draft -> active -> suspended` flow shorthand into state machine specs | models (lifecycle sub-section) |
| `RelationshipProcessor` | `hasMany Post cascade eager` shorthand into relationship specs | models (relationship sub-section) |

All processors extend `AbstractProcessor` from `@specverse/types`.

## behaviour/

Shared behavioural specification infrastructure.

| File | Purpose |
|------|---------|
| `types.qnt` | 262-line Quint module with shared type definitions used by all entity behaviour specs |
| `convention-processor.ts` | Behavioural convention engine: expands human-readable constraints into Quint invariants via pattern matching and template instantiation |

The behavioural convention processor is the counterpart to structural convention processing. Where structural conventions expand `email: Email required unique` into `.specly` definitions, behavioural conventions expand `"models must not be orphaned"` into Quint invariants.

## examples/

19 cross-cutting examples that demonstrate SpecVerse features spanning multiple entity types.

| Path | Purpose |
|------|---------|
| `*.specly` | Source specifications |
| `*.example.yaml` | Expected parse/inference output |
| `*.md` | Per-example documentation |
| `category-order.yaml` | Global category numbering for composed example output (00-15) |
| `common/common-definitions.yaml` | Shared composite types (ContactInfo, PersonName, etc.) used across examples |
| `common/overview.md` | Overview of common definitions |
| `metadata/examples-index.yaml` | Master index of all examples |
| `metadata/learning-paths.yaml` | Curated learning paths through the examples |

These examples are cross-cutting because they exercise multiple entity types together (models + services + events + views, etc.) rather than belonging to a single entity module.

## types.ts

Re-exports core entity module types from `@specverse/types` for backward compatibility:

- `ProcessorContext` -- context passed to convention processors
- `EntityConventionProcessor` -- interface all convention processors implement
- `EntityInferenceRule` -- inference rule definition
- `EntityGenerator` -- generator metadata
- `EntityDiagramPlugin` -- diagram generation plugin
- `EntityDocReference` -- documentation reference
- `EntityTestReference` -- test reference
- `EntityBehaviourSpec` -- behavioural specification
- `EntityModule` -- the main module interface every entity type implements
- `EntityRegistryInterface` -- registry for discovering entity modules

The canonical type definitions live in `@specverse/types/entity-module.ts`; this file re-exports them to avoid breaking existing imports.

## manifest.ts

Loads and validates `module.yaml` manifest files that every entity module must provide. Exports:

- `ModuleManifest` -- typed interface for module.yaml contents
- `ManifestFacets`, `ManifestDelivery`, `ManifestDiagram` -- sub-interfaces
- `loadManifest(path)` -- reads and parses a module.yaml file
- `validateManifest(manifest)` -- returns validation errors (empty array if valid)

## See Also

- Each core module (`../core/models/`, `../core/services/`, etc.) imports from `_shared/processors/`
- Each extension module (`../extensions/*/`) imports types from `_shared/types.ts`
- `compose-schema.ts` is used by CI to verify schema integrity
