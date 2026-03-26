# Validation Instance Factory

Generates Zod runtime validation schemas from SpecVerse model definitions, with optional JSON Schema output for Fastify integration.

## Definition

- **`zod.yaml`** -- Single definition (category: `service`, no external dependencies required).

## Generator

- `templates/zod/validation-generator.ts` -- Wraps `generate-validation.js`. Produces per-model validation files.

## Capabilities

| Capability | Description |
|---|---|
| `validation.runtime` | Zod schemas for runtime type checking |
| `validation.zod` | Zod-specific schema generation |
| `validation.jsonschema` | JSON Schema output (for Fastify route validation) |

## Output Pattern

```
src/validation/{model}.validation.ts
```

Each file contains Zod schema definitions with inferred TypeScript types, plus optional JSON Schema equivalents.

## Default Configuration

- **Framework**: Zod 3.22+
- **JSON Schema generation**: Enabled
- **Strip unknown keys**: Enabled
- **Abort early**: Disabled (collect all errors)

## Status

Wrapper implementation. Future TODO to split into dedicated generators for Zod schemas, JSON Schemas, and validation helper functions.
