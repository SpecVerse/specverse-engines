# Testing Instance Factory

Generates a comprehensive Vitest test suite from a SpecVerse specification, covering unit, integration, and end-to-end tests.

## Definition

- **`vitest-tests.yaml`** -- Single definition for the full test suite (category: `service`).

## Generator

- `templates/vitest/tests-generator.ts` -- Wraps `generate-tests.js` (700+ lines). Produces a complete test directory structure.

## Capabilities

| Capability | Description |
|---|---|
| `testing.unit` | Service-layer unit tests |
| `testing.integration` | Route integration tests |
| `testing.e2e` | End-to-end workflow tests |

## What Gets Generated

- Unit tests for each service
- Integration tests for each route
- End-to-end tests for cross-model workflows
- Test data fixtures
- Prisma and EventBus mocks
- Database and server setup utilities

## Default Configuration

All five generation flags are enabled by default: `generateUnitTests`, `generateIntegrationTests`, `generateE2ETests`, `generateFixtures`, `generateMocks`.

## Dependencies

Vitest 1.x with `@vitest/ui` for interactive test reporting.

## Status

Wrapper implementation. Future TODO to split into dedicated generators per test tier (unit, integration, e2e, fixtures, mocks, setup).
