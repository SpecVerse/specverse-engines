# Events Entity Module

Events define domain events with typed attributes and schema versioning, enabling event-driven communication between controllers, services, and views.

## Facets

| Facet | Path | Description |
|-------|------|-------------|
| Schema | `schema/events.schema.json` | JSON Schema for validating event definitions in .specly files |
| Conventions (structural) | `conventions/event-processor.ts` | Expands shorthand into full event definitions |
| Conventions (behavioural) | `behaviour/conventions/grammar.yaml` | Behavioural convention grammar |
| Inference | `inference/index.ts` | Entry point for event inference rules |
| Inference rules | `inference/v3.1-event-rules.json` | Event generation rules from models and services |
| Behaviour | `behaviour/rules.qnt` | Quint behavioural rules |
| Behaviour | `behaviour/invariants.qnt` | Quint invariants |
| Generators | `generators/index.ts` | Code generator instance factory references |
| Docs | `docs/index.ts` | Documentation references |
| Tests | `tests/index.ts` | Test references |

## Schema Properties

Each event definition supports:

- **description** - Human-readable description
- **attributes** - Typed payload fields carried by the event
- **version** - Event schema version number (integer, minimum 1)
- **previousVersions** - Previous schema versions for compatibility tracking, each with version number, compatibility mode (backward, forward, full, none), and deprecation info

## Examples

No examples directory (events are typically inferred from models and services rather than authored directly).

## Dependencies

Depends on: `models`, `services`

## See Also

- [Entity Module Guide](../../../../../../specverse-self/docs/guides/ADDING-AN-ENTITY-TYPE.md)
