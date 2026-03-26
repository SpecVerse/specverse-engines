# Conventions Entity Module

Meta-circular entity type that defines how conventions themselves work.

Convention definitions specify grammar rules for how shorthand syntax expands into full definitions across all entity types. This is self-referential: the conventions entity type defines how convention processing works, using the same module pattern as every other entity type in SpecVerse.

## Facets

| Facet | Path | Status |
|-------|------|--------|
| Schema | `schema/conventions.schema.json` | Implemented |
| Structural conventions | `conventions/convention-definition-processor.ts` | Implemented |
| Behavioural conventions | `behaviour/conventions/grammar.yaml` | Implemented |
| Behaviour (Quint) | `behaviour/rules.qnt`, `behaviour/invariants.qnt` | Implemented |
| Inference rules | `inference/index.ts` | Stub (no rules yet) |
| Generators | `generators/index.ts` | Implemented |
| Docs | `docs/index.ts` | Implemented |
| Tests | `tests/index.ts` | Implemented |

## Schema Properties

Each convention definition is keyed by a PascalCase name and supports:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `baseType` | string | yes | The primitive type this convention expands from |
| `description` | string | no | Human-readable description |
| `implies` | object | no | Properties automatically set when this convention is used |
| `when_modified_by` | object | no | Modifier-specific effects (adds, sets, validates) |
| `appliesTo` | string[] | no | Entity types this convention applies to |

### Modifier Effects

Each entry in `when_modified_by` can specify:

- `adds` -- array of additional properties to include
- `sets` -- object of property values to override
- `validates` -- validation rule string

## Delivery

- Parser: yes
- Inference: no
- Realize: no
- CLI: yes

## Dependencies

- `models` (conventions define grammar for model attributes and other entity types)

## See Also

- `_shared/processors/AttributeProcessor.ts` -- consumes convention definitions to expand shorthand
- `_shared/behaviour/convention-processor.ts` -- behavioural convention expansion engine
