# SDKs Instance Factory

Generates typed client SDKs for consuming REST APIs produced by a SpecVerse specification.

## Definitions

- **`python-sdk.yaml`** -- Python SDK with async support (aiohttp + Pydantic)
- **`typescript-sdk.yaml`** -- TypeScript SDK with native fetch (zero runtime dependencies)

## Generators

- `templates/python/sdk-generator.ts` -- Wraps `generate-sdk-python.js` (1000+ lines). Produces a complete Python package: async client class, per-controller resource classes, Pydantic models, exception classes, `setup.py`, and `requirements.txt`.
- `templates/typescript/sdk-generator.ts` -- Wraps `generate-sdk-typescript.js` (900+ lines). Produces a complete npm package: client class, resource classes, TypeScript interfaces, error classes, `package.json`, and `tsconfig.json`.

## Capabilities

| SDK | Provides | Requires |
|---|---|---|
| Python | `sdk.python`, `client.rest.async` | `api.rest`, `api.rest.crud` |
| TypeScript | `sdk.typescript`, `client.rest` | `api.rest`, `api.rest.crud` |

## Default Configuration

Both SDKs include authentication support, automatic retries (3 attempts), and a 30s timeout. The Python SDK defaults to package name `specverse_client`; TypeScript defaults to `@specverse/sdk`.

## Status

Wrapper implementations. Both YAMLs note future TODOs to convert the monolithic JS generators into native TypeScript template generators.
