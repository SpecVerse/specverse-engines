# Controllers Factory

Fastify REST API route handlers and server bootstrap generation.

## Definition

| File | Description |
|------|-------------|
| `fastify.yaml` | Fastify v4 REST API server with CORS, Helmet, and rate limiting |

## Generated Output

| Generator | Output | Purpose |
|-----------|--------|---------|
| `routes-generator` | `backend/src/routes/{controller}.ts` | Per-model route handler with CRUD endpoints |
| `meta-routes-generator` | `backend/src/routes/MetaRoutes.ts` | Meta API for spec/view metadata (serves frontend) |
| `server-generator` | `backend/src/server.ts` | Server bootstrap — registers all model routes |

The routes generator reads each controller from the spec and creates Fastify route
handlers. The server generator auto-imports and registers all model route files.
Meta routes expose spec and view metadata for the view-renderer architecture.

## Technology

- **Framework**: Fastify ^4.24.0
- **Middleware**: @fastify/cors, @fastify/helmet, @fastify/rate-limit
- **Language**: TypeScript with tsx for development

## Capabilities

| Provides | Requires |
|----------|----------|
| `api.rest` | `storage.database` |
| `api.rest.crud` | `validation.runtime` |
| `api.websocket` | |

## Configuration

- Server: port 3000, host 0.0.0.0, trust proxy, structured logging
- CORS: origin true, credentials true
- Rate limit: 100 requests per minute
- Scripts: `dev` (tsx watch), `start` (node dist)
