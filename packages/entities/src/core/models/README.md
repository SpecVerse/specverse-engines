# Models Entity Module

The foundational entity type in SpecVerse. Models define data structures with attributes, relationships, lifecycles, behaviors, metadata, and profiles.

## Facets

| Facet | Path | Description |
|-------|------|-------------|
| Schema | `schema/models.schema.json` | JSON Schema for validating model definitions in .specly files |
| Conventions (structural) | `conventions/model-processor.ts` | Expands shorthand into full model definitions |
| Conventions (behavioural) | `behaviour/conventions/grammar.yaml` | Behavioural convention grammar |
| Inference | `inference/index.ts` | Entry point for model inference rules |
| Inference rules | `inference/v3.1-controller-rules.json` | Model-to-controller generation rules |
| Inference rules | `inference/v3.1-service-rules.json` | Model-to-service generation rules |
| Behaviour | `behaviour/rules.qnt` | Quint behavioural rules |
| Behaviour | `behaviour/invariants.qnt` | Quint invariants |
| Behaviour | `behaviour/test.qnt`, `behaviour/verify.qnt` | Quint test and verification specs |
| Generators | `generators/index.ts` | Code generator instance factory references |
| Docs | `docs/index.ts` | Documentation references |
| Tests | `tests/index.ts` | Test references |

## Schema Properties

Each model definition supports:

- **description** - Human-readable description
- **extends** - Type inheritance reference
- **profiles** - Attached profile list (runtime state)
- **metadata** - Model metadata specification
- **attributes** - Typed fields with constraints and defaults
- **relationships** - `hasMany`, `hasOne`, `belongsTo`, `manyToMany` with options (cascade, dependent, eager, lazy, optional, through)
- **lifecycles** - State machine definitions with states, transitions, and guards
- **behaviors** - Business rules with preconditions, postconditions, and steps
- **profile-attachment** - Rules for dynamic profile attachment

## Examples

7 examples in `examples/`:

- `basic-model` - Minimal model definition
- `behaviors-with-steps` - Behaviors with step-by-step definitions
- `model-with-behaviors` - Model with business rule behaviors
- `model-with-lifecycle` - Model with lifecycle state machine
- `models-with-relations` - Models with relationship definitions
- `profile-attachment` - Dynamic profile attachment
- `using-profiles` - Profile usage patterns

## Dependencies

Depends on: none (foundational entity type)

## See Also

- [Entity Module Guide](../../../../../../specverse-self/docs/guides/ADDING-AN-ENTITY-TYPE.md)
