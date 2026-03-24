# SpecVerse v3.3 Manifest Examples

This directory contains example manifests demonstrating the v3.3 hybrid mapping system.

## What is a Manifest?

A **manifest** defines **HOW** a deployment is physically implemented by mapping deployment instances to instance factories (technology implementations).

## Architecture Flow

```
Components (WHAT)
    ↓
Deployments (WHERE)
    ↓ deployment reference
Manifests (HOW)
    ↓ hybrid mapping (3-tier priority)
Instance Factories
    ↓ code templates
Generated Code
```

## Hybrid Mapping System

v3.3 introduces a powerful 3-tier resolution system with clear priorities:

### Resolution Priority

1. **instanceMappings** (highest priority)
   - Explicit instance name → instance factory
   - Override everything else for specific instances
   - Example: `analyticsDb` → `MongoDB6`

2. **capabilityMappings** (medium priority)
   - Capability pattern → instance factory
   - Supports wildcards (`api.rest.*`)
   - Example: `api.rest.reports` → `ReportingAPI`

3. **defaultMappings** (lowest priority)
   - Category → instance factory
   - Fallback when no specific mapping found
   - Example: all `controller` instances → `FastifyPrismaAPI`

## Examples

### 01-simple-default-mappings.yaml

**Simplest approach**: Use default mappings for all instances by category.

```yaml
defaultMappings:
  controller: "FastifyPrismaAPI"
  storage: "PostgreSQL15"
```

**When to use:**
- Small projects with consistent technology choices
- All instances of same category use same factory
- Minimal configuration needed

**Resolution example:**
```
Instance: userApi (category: controller)
  → Check instanceMappings: ❌ not found
  → Check capabilityMappings: ❌ not found
  → Check defaultMappings.controller: ✅ FastifyPrismaAPI
```

### 02-capability-mappings.yaml

**Medium complexity**: Different capabilities use different factories.

```yaml
capabilityMappings:
  - capability: "api.rest"
    instanceFactory: "FastifyPrismaAPI"

  - capability: "api.rest.reports"
    instanceFactory: "ReportingAPI"
    configuration:
      caching: true
```

**When to use:**
- Need different implementations for different capabilities
- Pattern-based routing (e.g., all `api.rest.*` → Fastify)
- Capability-specific configuration

**Resolution example:**
```
Instance: reportApi with capability "api.rest.reports"
  → Check instanceMappings: ❌ not found
  → Check capabilityMappings: ✅ matches "api.rest.reports" → ReportingAPI
  → (defaultMappings not checked)
```

### 03-hybrid-mappings.yaml

**Full power**: All three strategies working together.

```yaml
defaultMappings:
  controller: "FastifyPrismaAPI"
  storage: "PostgreSQL15"

capabilityMappings:
  - capability: "api.rest.reports"
    instanceFactory: "ReportingAPI"

instanceMappings:
  - instanceName: "analyticsDb"
    instanceFactory: "MongoDB6"
```

**When to use:**
- Complex applications with mixed technologies
- Need fine-grained control over specific instances
- Different teams/services with different tech preferences

**Resolution examples:**

```
Instance: analyticsDb (category: storage)
  → Check instanceMappings: ✅ "analyticsDb" → MongoDB6
  → (capabilityMappings not checked - instance match takes priority)
  → (defaultMappings not checked)

Instance: reportApi (capability: "api.rest.reports")
  → Check instanceMappings: ❌ not found
  → Check capabilityMappings: ✅ "api.rest.reports" → ReportingAPI
  → (defaultMappings not checked)

Instance: userApi (category: controller, no specific mappings)
  → Check instanceMappings: ❌ not found
  → Check capabilityMappings: ❌ not found
  → Check defaultMappings.controller: ✅ FastifyPrismaAPI
```

## Deployment Specification

All examples reference `blog-api.specly`, which defines:

- **Components**: User, Post, Comment models
- **Deployment**: production environment with multiple instances
  - `userApi` - main REST API (controller)
  - `adminApi` - admin/reporting API (controller)
  - `userDb` - PostgreSQL database (storage)
  - `analyticsDb` - analytics database (storage, can override to MongoDB)
  - `sessionCache` - Redis cache (storage)
  - `validator` - Zod validation (service)

## Using These Examples

### Generate Code with Default Mappings

```bash
specverse realize all blog-api.specly \
  -m examples/manifests/01-simple-default-mappings.yaml
```

### Generate with Capability-Based Routing

```bash
specverse realize all blog-api.specly \
  -m examples/manifests/02-capability-mappings.yaml
```

### Generate with Full Hybrid Mapping

```bash
specverse realize all blog-api.specly \
  -m examples/manifests/03-hybrid-mappings.yaml
```

## Best Practices

### Start Simple, Add Complexity As Needed

1. **Phase 1**: Use `defaultMappings` for all instances
2. **Phase 2**: Add `capabilityMappings` for specialized capabilities
3. **Phase 3**: Use `instanceMappings` for exceptional cases

### When to Use Each Strategy

**defaultMappings:**
- ✅ Consistent technology across all instances of same category
- ✅ Simple projects with unified tech stack
- ✅ Getting started quickly

**capabilityMappings:**
- ✅ Different technologies for different capabilities
- ✅ Pattern-based routing (reports, analytics, admin vs. user APIs)
- ✅ Capability-specific configuration

**instanceMappings:**
- ✅ Exceptional instances that need different technology
- ✅ Migration scenarios (moving one instance to new tech)
- ✅ Per-instance fine-tuning

### Configuration Precedence

Configuration merges in this order (later overrides earlier):

1. Instance factory defaults
2. Global manifest configuration
3. Mapping-specific configuration
4. (Future: instance-level configuration in deployment)

## Migration from v3.2

v3.2 manifests used `implementationTypes` array:

```yaml
# v3.2 (old)
implementationTypes:
  - ref: "backend/fastify-prisma"
    alias: "api"

capabilityMappings:
  - capability: "api.rest"
    implementationType: "api"  # ← used alias
```

v3.3 hybrid mapping is cleaner:

```yaml
# v3.3 (new)
defaultMappings:
  controller: "FastifyPrismaAPI"

# OR for more control
capabilityMappings:
  - capability: "api.rest"
    instanceFactory: "FastifyPrismaAPI"  # ← direct reference
```

## See Also

- [SCHEMA-CONSOLIDATION-PROPOSAL.md](../../docs/implementation-plans/v3.3-implementation/SCHEMA-CONSOLIDATION-PROPOSAL.md) - Architecture details
- [SCHEMA-CONSOLIDATION-ADDENDUM.md](../../docs/implementation-plans/v3.3-implementation/SCHEMA-CONSOLIDATION-ADDENDUM.md) - Hybrid mapping deep dive
- [INSTANCE-FACTORY-EXTENSIBILITY.md](../../docs/implementation-plans/v3.3-implementation/INSTANCE-FACTORY-EXTENSIBILITY.md) - Extensibility patterns

---

**SpecVerse v3.3** - Define once, implement anywhere with hybrid mapping flexibility.
