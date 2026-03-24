# SpecVerse AI Development Guide

This guide helps AI assistants work with SpecVerse projects across any domain.

## Project Context

**SpecVerse Version**: v3.1.0
**AI Operations**: `analyse` (extract from implementations) and `create` (generate from prompts)

**See `INPUT.md` in each directory for domain-specific test case details and customizations.**

## SpecVerse v3.1 Quick Reference

### Convention Syntax
```yaml
# Use this pattern for 90% of attributes:
attributeName: TypeName modifiers

# Examples:
email: Email required unique
name: String required
age: Integer min=0 max=150
status: String default=active values=["pending","active","inactive"]
totalAmount: Money currency=USD
```

### Common Types
- `String` - Text data (names, descriptions)
- `Integer` - Numbers (capacity, counts)
- `UUID` - Unique identifiers
- `Email` - Email addresses
- `DateTime` - Timestamps (createdAt, updatedAt)
- `Date` - Dates only (checkIn, checkOut)
- `Boolean` - True/false flags
- `Money` - Currency values (pricing, payments)
- `URL` - Web addresses

### Common Modifiers
- `required` - Field must be provided
- `optional` - Field is optional (default)
- `unique` - Must be unique across records
- `auto=uuid4` - Auto-generate UUID
- `auto=now` - Auto-timestamp
- `default=value` - Default value
- `min=n` / `max=n` - Numeric bounds
- `values=[...]` - Enumerated options
- `searchable` - Index for searching

## AI Inference Capabilities

SpecVerse v3.1 can automatically infer and generate:

1. **Controllers**: CURED operations (Create, Update, Retrieve, Evolve, Delete)
2. **Services**: Business logic, validation, integration services
3. **Events**: Lifecycle events, relationship events, business events
4. **Views**: List views, detail views, forms, analytics dashboards
5. **Types**: Request/response types, filters, common definitions
6. **Deployments**: Logical instances with capability-based architecture
7. **Manifests**: Implementation guidance with technology mappings

### Expansion Patterns by Scale
- **Demo/Personal**: 4x expansion (60→240, 200→800 lines)
- **Business**: 4x expansion (350→1,400 lines)
- **Enterprise**: 8x expansion (500→4,000+ lines)

## AI Operation Patterns

### For `analyse` Operations (Implementation Analysis)
**Input**: Existing codebase with authentication, database, APIs
**Focus**: Extract the *business logic* and *domain models*, not implementation details
**Output**: Clean SpecVerse specification that captures the essence

**Key Extraction Patterns**:
- Database schemas → SpecVerse models
- API endpoints → Controller actions
- Business rules → Behaviors and lifecycles
- User roles → RBAC modeling
- Integrations → Service definitions

### For `create` Operations (Natural Language)
**Input**: User requirements in natural language
**Focus**: Transform user intent into appropriate scale architecture
**Output**: Complete specification matching user scale and needs

**Key Creation Patterns**:
- User terminology → Domain models
- Business requirements → Technical architecture
- Scale indicators → Deployment complexity
- Compliance needs → Security and audit features

## Development Workflow

### Standard AI Workflow
1. **Read INPUT.md**: Understand the specific test case and domain
2. **Analyze/Create**: Use appropriate AI operation based on input type
3. **Validate**: Ensure output validates with SpecVerse schema
4. **Infer**: Use AI inference to expand to complete architecture
5. **Generate**: Create diagrams and documentation

### Template Customization Approach
- **Don't modify templates**: Let AI operations customize `specs/main.specly`
- **Start with generic**: AI will transform `Item` → domain models
- **Scale appropriately**: AI will add complexity based on input scale
- **Preserve user intent**: Maintain terminology and requirements from input

## Deployment Specifications

SpecVerse v3.1 supports logical deployment specifications with capability-based architecture:

### Basic Deployment Structure
```yaml
deployments:
  development:  # Deployment name
    version: "1.0.0"
    environment: development  # or production, staging, etc.
    instances:
      controllers:
        ComponentController:
          component: "ComponentName"
          namespace: "api"
          advertises: "*"  # All capabilities
          uses: ["database.*", "cache.*"]
          scale: 2
      services:
        ComponentService:
          component: "ComponentName"
          namespace: "services"
          advertises: ["process.*", "validate.*"]
          uses: ["database.*"]
          scale: 3
      views:
        webInterface:
          component: "ComponentName"
          namespace: "web"
          uses: ["api.*", "services.*"]
          scale: 1
      communications:
        mainBus:
          namespace: "global"
          capabilities: ["*"]
          type: "pubsub"  # or rpc, queue, streaming
      storage:
        mainDatabase:
          component: "ComponentName"
          namespace: "data"
          type: "relational"  # or document, keyvalue, cache, file, blob, queue, search
          advertises: ["persistence.*", "query.*"]
          persistence: "durable"  # or session, cache, temporary
          consistency: "strong"   # or eventual, weak
          scale: 2
          backup: true
          encryption: true
      security:
        authSystem:
          component: "ComponentName"
          namespace: "auth"
          type: "authentication"  # or authorization, encryption, audit, firewall, scanning, secrets, identity
          provider: "oauth"       # or saml, jwt, ldap, local, external, cloud, enterprise
          scope: "global"         # or component, namespace, instance, user, role
          advertises: ["auth.*", "identity.*"]
          policies: ["require-2fa", "session-timeout"]
          encryption: "strong"    # or none, basic, enterprise
          auditLevel: "detailed"  # or none, basic, comprehensive
```

### Deployment Scales

**Personal/Demo Scale:**
```yaml
deployments:
  personal:
    instances:
      controllers:
        simpleAPI: { component: "ComponentName", scale: 1 }
      storage:
        localDB: 
          component: "ComponentName"
          type: "relational"
          persistence: "durable"
          scale: 1
      security:
        simpleAuth:
          component: "ComponentName"
          type: "authentication"
          provider: "local"
          scope: "component"
```

**Commercial Scale:**
```yaml
deployments:
  production:
    instances:
      controllers:
        apiController: { component: "ComponentName", scale: 3 }
      services:
        authService: { component: "ComponentName", scale: 2 }
      storage:
        mainDB: 
          component: "ComponentName"
          type: "relational"
          persistence: "durable"
          consistency: "strong"
          scale: 2
          backup: true
        cache:
          component: "ComponentName"
          type: "keyvalue"
          persistence: "cache"
          scale: 1
      security:
        oauthAuth:
          component: "ComponentName"
          type: "authentication"
          provider: "oauth"
          scope: "global"
          policies: ["session-management"]
        rbacAuth:
          component: "ComponentName"
          type: "authorization"
          provider: "local"
          scope: "component"
          policies: ["role-based"]
```

**Enterprise Scale:**
```yaml
deployments:
  enterprise:
    instances:
      controllers:
        apiGateway: { component: "ComponentName", scale: 10 }
      services:
        authService: { component: "ComponentName", scale: 5 }
      storage:
        primaryDB:
          component: "ComponentName"
          type: "relational"
          persistence: "durable"
          consistency: "strong"
          scale: 5
          replication: 2
          backup: true
          encryption: true
        distributedCache:
          component: "ComponentName"
          type: "keyvalue"
          persistence: "cache"
          consistency: "eventual"
          scale: 3
      security:
        enterpriseAuth:
          component: "ComponentName"
          type: "authentication"
          provider: "enterprise"
          scope: "global"
          policies: ["sso", "mfa", "compliance"]
          protocols: ["saml", "oauth2", "openid"]
          encryption: "enterprise"
          auditLevel: "comprehensive"
      monitoring:
        appMonitoring:
          component: "ComponentName"
          namespace: "monitoring"
          type: "metrics"           # metrics, logging, tracing, alerting, analytics, profiling, uptime, synthetic
          provider: "prometheus"   # prometheus, grafana, datadog, newrelic, splunk, elasticsearch, jaeger, zipkin, sentry, rollbar, cloudwatch, stackdriver, azure-monitor, local
          scope: "component"       # global, component, namespace, instance, service, request
          retention: "medium"      # short, medium, long, permanent
          resolution: "high"       # high, medium, low
          sampling: 1.0           # 0.0 to 1.0
          advertises: ["metrics.*"]
          dashboards: ["overview", "errors"]
          alerts: ["high-error-rate", "service-down"]
          aggregation: true
          realtime: false
      infrastructure:
        apiGateway:
          component: "ComponentName"
          namespace: "gateway"
          type: "gateway"           # gateway, loadbalancer, proxy, cdn, dns, registry, mesh, ingress
          provider: "nginx"         # aws, gcp, azure, cloudflare, vercel, netlify, kubernetes, istio, envoy, nginx, traefik, consul, local
          tier: "regional"          # edge, regional, global, local
          redundancy: "basic"       # none, basic, high, enterprise
          advertises: ["routing.*"]
          protocols: ["http", "https"]
          healthChecks: true
          autoScaling: false
```

### Auto-Generation
Deployments can be auto-generated using the `--deployment` flag:
```bash
# Generate deployment for development
specverse infer specs/main.specly --deployment --environment development

# Generate deployment for production  
specverse infer specs/main.specly --deployment --environment production
```

## Manifest System

SpecVerse v3.1 manifests provide implementation guidance with DRY architecture:

### Modern Manifest Structure
```yaml
specVersion: "3.1.0"
name: "ProjectName Implementation Manifest"
version: "1.0.0"

# Import standardized definitions
import:
  - library: "@specverse/standards/nextjs"
    select: ["controller", "view", "authentication"]
  - library: "@specverse/standards/databases"
    select: ["postgresql"]

# Define implementation types (DRY pattern)
implementationTypes:
  nextjs-api:
    extends: "@nextjs/controller"
    localExtensions:
      appRouterVersion: "14"
      renderingMode: "SSR"

# Map logical deployments to implementations
logicalDeployment:
  instances:
    controllers:
      ComponentController: "nextjs-api"

# Define capability mappings
capabilityMappings:
  - capability: "api.*"
    implementationType: "nextjs-api"
    capabilityType: "advertises"
    namespace: "web"

# Communication channels
communicationChannels:
  - channelName: "mainBus"
    implementationType: "nextjs-rpc"
    namespace: "global"
    capabilities: ["api.*"]
```

## Validation and Quality

### Success Criteria
- **Domain Accuracy**: Models reflect the intended domain
- **Scale Appropriateness**: Complexity matches intended use case
- **Schema Compliance**: Output validates with SpecVerse v3.1 schema
- **User Intent Preservation**: Original requirements clearly addressed
- **Expansion Ratio**: Meets target expansion patterns

### Common Pitfalls
- **Over-engineering**: Don't add enterprise features to simple use cases
- **Under-engineering**: Don't skip required features for target scale
- **Generic models**: Ensure models reflect specific domain
- **Authentication complexity**: Match auth complexity to scale

## AI Prompting Best Practices

When working with any domain:

1. **Reference INPUT.md**: Always start with the specific test case requirements
2. **Preserve user terminology**: User language matters for scale and intent
3. **Focus on domain**: Business domain models, not generic abstractions  
4. **Scale appropriately**: Personal ≠ Enterprise complexity
5. **Include required features**: Domain-specific requirements are critical
6. **Validate early**: Check schema compliance before expansion

### AI Prompting Tips

When asking an AI to help with any project:

1. **Reference guidance files**: "Follow the guidelines in AI-GUIDE.md and INPUT.md"
2. **Use convention syntax**: "Use SpecVerse convention syntax"
3. **Start minimal**: "Create minimal models, let inference expand"
4. **Business focus**: "Focus on business logic, not implementation"
5. **Include deployments**: "Add deployment specification for target environment"
6. **Create manifests**: "Generate v3.1.0 manifest with standardized imports"

## Schema Reference

For complete SpecVerse v3.1 schema with AI guidance, see:
- Local: `docs/ai-guidance/SPECVERSE-V3.1-SCHEMA-AI.yaml`
- Convention examples and patterns included
- Comprehensive type and modifier reference

---
*SpecVerse v3.1 - AI-Powered Specification Language*
*Universal AI Development Guide*