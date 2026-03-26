# Deployments Entity Module

Deployments define logical instance configurations with capability-based architecture, mapping component definitions (controllers, services, views) to deployment instances with scaling, communication channels, and infrastructure concerns.

## Facets

| Facet | Path | Description |
|-------|------|-------------|
| Schema | `schema/deployments.schema.json` | JSON Schema for validating deployment definitions in .specly files |
| Conventions (structural) | `conventions/deployment-processor.ts` | Expands deployment shorthand and capabilities |
| Conventions (behavioural) | `behaviour/conventions/grammar.yaml` | Behavioural convention grammar |
| Inference | `inference/index.ts` | Entry point for deployment inference rules |
| Inference rules | `inference/v3.1-deployment-rules.json` | Component-to-deployment instance generation rules |
| Behaviour | `behaviour/rules.qnt` | Quint behavioural rules |
| Behaviour | `behaviour/invariants.qnt` | Quint invariants |
| Generators | `generators/index.ts` | Code generator instance factory references |
| Docs | `docs/index.ts` | Documentation references |
| Tests | `tests/index.ts` | Test references |

## Schema Properties

Each deployment definition supports:

- **version** - Semantic version (required)
- **description** - Human-readable description
- **environment** - Target environment identifier
- **instances** - Instance configuration sections:
  - **controllers** - Controller instance scaling and configuration
  - **services** - Service instance scaling and configuration
  - **views** - View instance deployment targets
  - **communications** - Communication channel definitions (message queues, event buses)
  - **storage** - Storage instance configuration (databases, caches, file stores)
  - **security** - Security instance configuration (authentication, authorization)
  - **infrastructure** - Infrastructure concerns (load balancers, DNS, CDN)
  - **monitoring** - Monitoring and observability configuration

## Examples

2 examples in `examples/`:

- `basic-deployment-intro` - Minimal deployment configuration
- `enhanced-deployment-example` - Full-featured deployment with capabilities

## Dependencies

Depends on: `models`, `controllers`, `services`, `events`, `views`

## See Also

- [Entity Module Guide](../../../../../../specverse-self/docs/guides/ADDING-AN-ENTITY-TYPE.md)
