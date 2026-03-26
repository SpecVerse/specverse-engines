# Services Entity Module

Services define business logic operations with event subscriptions and named operations, encapsulating domain logic that spans multiple models or requires orchestration.

## Facets

| Facet | Path | Description |
|-------|------|-------------|
| Schema | `schema/services.schema.json` | JSON Schema for validating service definitions in .specly files |
| Conventions (structural) | `conventions/service-processor.ts` | Expands shorthand into full service definitions |
| Conventions (behavioural) | `behaviour/conventions/grammar.yaml` | Behavioural convention grammar |
| Inference | `inference/index.ts` | Entry point for service inference rules |
| Behaviour | `behaviour/rules.qnt` | Quint behavioural rules |
| Behaviour | `behaviour/invariants.qnt` | Quint invariants |
| Behaviour | `behaviour/test.qnt`, `behaviour/verify.qnt` | Quint test and verification specs |
| Generators | `generators/index.ts` | Code generator instance factory references |
| Docs | `docs/index.ts` | Documentation references |
| Tests | `tests/index.ts` | Test references |

## Schema Properties

Each service definition supports:

- **description** - Human-readable description
- **subscribes_to** - Event subscriptions pattern
- **operations** - Named operations with executable properties (inputs, outputs, preconditions, postconditions)

## Examples

1 example in `examples/`:

- `services-and-events` - Service definitions with operations and event handling

## Dependencies

Depends on: `models`

## See Also

- [Entity Module Guide](../../../../../../specverse-self/docs/guides/ADDING-AN-ENTITY-TYPE.md)
