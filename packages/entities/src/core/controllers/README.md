# Controllers Entity Module

Controllers define API endpoints with CURED operations (Create, Update, Retrieve, Retrieve_many, Validate, Evolve, Delete), custom actions, and event subscriptions.

## Facets

| Facet | Path | Description |
|-------|------|-------------|
| Schema | `schema/controllers.schema.json` | JSON Schema for validating controller definitions in .specly files |
| Conventions (structural) | `conventions/controller-processor.ts` | Expands shorthand into full controller definitions |
| Conventions (behavioural) | `behaviour/conventions/grammar.yaml` | Behavioural convention grammar |
| Inference | `inference/index.ts` | Entry point for controller inference rules |
| Behaviour | `behaviour/rules.qnt` | Quint behavioural rules |
| Behaviour | `behaviour/invariants.qnt` | Quint invariants |
| Behaviour | `behaviour/test.qnt`, `behaviour/verify.qnt` | Quint test and verification specs |
| Generators | `generators/index.ts` | Code generator instance factory references |
| Docs | `docs/index.ts` | Documentation references |
| Tests | `tests/index.ts` | Test references |

## Schema Properties

Each controller definition supports:

- **model** - Reference to the model this controller manages
- **description** - Human-readable description
- **subscribes_to** - Event subscriptions pattern
- **cured** - CURED operation definitions (create, retrieve, retrieve_many, update, evolve, delete, validate), each with executable properties
- **actions** - Custom actions beyond standard CURED operations, each with executable properties

## Examples

1 example in `examples/`:

- `controllers-and-actions` - Controller definitions with custom actions

## Dependencies

Depends on: `models`

## See Also

- [Entity Module Guide](../../../../../../specverse-self/docs/guides/ADDING-AN-ENTITY-TYPE.md)
