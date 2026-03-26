# ORMs Factory

Prisma schema and service generation from spec models.

## Definition

| File | Description |
|------|-------------|
| `prisma.yaml` | Prisma ^5.5 ORM with schema generation and typed client |

## Generated Output

| Generator | Output | Purpose |
|-----------|--------|---------|
| `schema-generator` | `backend/prisma/schema.prisma` | Full Prisma schema from spec models (tables, relations, enums) |
| `services-generator` | (per-model service) | Prisma service classes with ORM integration |

The schema generator reads all spec models, maps SpecVerse types to Prisma types,
generates relation fields (1:1, 1:N, N:M), and produces a complete `schema.prisma`
file. It uses the `pluralize` utility from `@specverse/types` for table naming.

## Technology

- **ORM**: Prisma ^5.5.0
- **Client**: @prisma/client (auto-generated)
- **Default provider**: PostgreSQL (configurable)

## Capabilities

| Provides | Requires |
|----------|----------|
| `orm.prisma` | `storage.database` |
| `orm.schema` | |
| `orm.client` | |
| `database.migrations` | |

## Configuration

- Provider: `postgresql` (default, overridable)
- Relation mode: `foreignKeys`
- Log levels: query, error, warn

## Scripts

```
db:generate  — prisma generate
db:migrate   — prisma migrate dev
db:push      — prisma db push
db:studio    — prisma studio
```

## Environment

Requires `DATABASE_URL` (e.g., `postgresql://user:password@localhost:5432/dbname`)
