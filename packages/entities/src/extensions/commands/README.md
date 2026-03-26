# Commands Entity Module

CLI command specifications for defining command-line interfaces declaratively.

## Facets

| Facet | Path | Status |
|-------|------|--------|
| Schema | `schema/commands.schema.json` | Implemented |
| Structural conventions | `conventions/command-processor.ts` | Implemented |
| Behavioural conventions | `behaviour/conventions/grammar.yaml` | Implemented |
| Behaviour (Quint) | `behaviour/rules.qnt`, `behaviour/invariants.qnt` | Implemented |
| Inference rules | `inference/index.ts` | Stub (no rules yet) |
| Generators | `generators/index.ts` | Implemented |
| Docs | `docs/index.ts` | Implemented |
| Tests | `tests/index.ts` | Implemented |

## Schema Properties

Each command is keyed by name and supports:

| Property | Type | Description |
|----------|------|-------------|
| `description` | string | Human-readable description |
| `arguments` | object | Named arguments with type, required, positional, description, default |
| `flags` | object | CLI flags (`--name` pattern) with type, default, description, alias |
| `returns` | string | Return type |
| `exitCodes` | object | Numeric exit code to description mapping |
| `subcommands` | object | Nested subcommand definitions |

## Delivery

- Parser: yes
- Inference: no
- Realize: no
- CLI: yes

## Dependencies

- `models` (extends model definitions with CLI interface)

## See Also

- `_shared/processors/ExecutableProcessor.ts` -- shared parameter/return processing
- `_shared/types.ts` -- `EntityModule`, `EntityConventionProcessor` interfaces
- The specverse-self spec uses commands extensively to define the SpecVerse CLI itself
