# Measures Entity Module

Aggregation semantics for computed values over model fields with dimensional breakdowns.

Measures represent metrics, KPIs, and analytics that can be realized as dbt models, Cube.js measures, SQL views, or Looker dimensions.

## Facets

| Facet | Path | Status |
|-------|------|--------|
| Schema | `schema/measures.schema.json` | Implemented |
| Structural conventions | `conventions/measure-processor.ts` | Implemented |
| Behavioural conventions | `behaviour/conventions/grammar.yaml` | Implemented |
| Behaviour (Quint) | `behaviour/rules.qnt`, `behaviour/invariants.qnt` | Implemented |
| Inference rules | `inference/index.ts` | Stub (future: auto-generate from model conventions) |
| Generators | `generators/index.ts` | Implemented |
| Docs | `docs/index.ts` | Implemented |
| Tests | `tests/index.ts` | Implemented |

## Schema Properties

Each measure is keyed by a camelCase name and supports:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `description` | string | no | Human-readable description |
| `source` | string | yes | Model name the measure aggregates over |
| `aggregation` | enum | yes | One of: `sum`, `count`, `avg`, `min`, `max`, `custom` |
| `field` | string | no | Field to aggregate |
| `computation` | string | no | Custom computation expression (for `custom` aggregation) |
| `filter` | string | no | Filter predicate applied before aggregation |
| `dimensions` | string[] | no | Dimensional breakdowns (group-by axes) |
| `format` | string | no | Display format for the computed value |

## Delivery

- Parser: yes
- Inference: no
- Realize: no
- CLI: yes

## Dependencies

- `models` (measures aggregate over model fields and relationships)

## See Also

- `_shared/types.ts` -- `EntityModule`, `EntityConventionProcessor` interfaces
- Potential realization targets: dbt, Cube.js, SQL views, Looker
