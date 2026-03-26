# Services Factory

Business logic generation with CURED operations and L3 behavior support.

## Definition

| File | Description |
|------|-------------|
| `prisma-services.yaml` | Prisma-backed controllers and services with CRUD and event publishing |

## Generated Output

| Generator | Output | Purpose |
|-----------|--------|---------|
| `controller-generator` | `backend/src/controllers/{model}Controller.ts` | Per-model CURED controllers (Create, Update, Read, Execute, Delete) |
| `service-generator` | `backend/src/services/{service}.ts` | Abstract business logic services (not tied to single model) |
| `behavior-generator` | (imported by above) | L3 behavior generation: preconditions, steps, postconditions, events |

### Controller vs Service

- **Controllers** are model-specific — one per model, managing CURED operations and
  event pub/sub for that model.
- **Services** are cross-cutting — they can interact with multiple models and
  implement business workflows.

### Behavior Generator (L3)

The behavior generator produces method bodies from behavioral metadata:
- **Preconditions** become guard checks (throw on violation)
- **Steps** become ordered business logic
- **Postconditions** become dev-mode assertions
- **publishes/sideEffects** become event publishing calls
- **transactional** wraps in `prisma.$transaction`

This is the third generation layer: L1 (schema) and L2 (CRUD) are handled by
the ORM and controller generators.

## Technology

- **ORM**: @prisma/client ^5.5.0
- **Patterns**: CURED operations, event-driven, transactional

## Capabilities

| Provides | Requires |
|----------|----------|
| `service.controller` | `orm.client` |
| `service.business` | |
| `service.crud` | |

## Configuration

- `validation: true` — input validation enabled
- `eventPublishing: true` — events emitted on state changes
- `errorHandling: "throw"` — exceptions propagate to caller
