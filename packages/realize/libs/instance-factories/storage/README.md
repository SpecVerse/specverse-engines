# Storage Instance Factory

Generates database connection configuration and Docker Compose files for three storage backends.

## Definitions

- **`mongodb.yaml`** -- MongoDB 6 with sharding and replication support
- **`postgresql.yaml`** -- PostgreSQL 15 with production-tuned settings
- **`redis.yaml`** -- Redis 7 for caching and session management

## Generators

Each backend has two generators under `templates/{backend}/`:

| Generator | Output Pattern | Purpose |
|---|---|---|
| `config-generator.ts` | `config/database.{instance}.ts` | Connection config with pool settings |
| `docker-generator.ts` | `docker/{service}.{instance}.yml` | Docker Compose service definition |

## Capabilities

| Backend | Provides |
|---|---|
| MongoDB | `storage.database`, `storage.database.document`, `storage.database.nosql` |
| PostgreSQL | `storage.database`, `storage.database.relational`, `storage.database.sql` |
| Redis | `storage.cache`, `storage.cache.memory`, `storage.session` |

## Default Configuration

- **MongoDB**: Pool 2-10, replication off by default, daily backups at 2am (7-day retention)
- **PostgreSQL**: Pool 2-10, 256MB shared buffers, 100 max connections, daily backups
- **Redis**: 256MB max memory, LRU eviction, AOF persistence, hourly backups

All backends use environment variables for credentials (`${DB_HOST}`, `${REDIS_PASSWORD}`, etc.).
