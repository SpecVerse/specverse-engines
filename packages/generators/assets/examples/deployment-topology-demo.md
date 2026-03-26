# Example 11-08: Deployment and Manifest Diagrams

**Demonstrates**: Deployment topology, capability flow, and manifest diagrams

## Overview

This comprehensive example demonstrates deployment infrastructure, capability-based architecture, and implementation manifests. Shows how logical specifications map to physical deployment and technology choices.

## Diagram Types Demonstrated

### 1. Deployment Topology (`deployment-topology`)
Visualizes deployment instances, their capabilities, and how they're organized across environments.

### 2. Capability Flow (`capability-flow`)
Shows capability providers (advertises) and consumers (uses) with data flow patterns.

### 3. Manifest Diagrams
- **manifest-mapping**: Component → Manifest → Implementation mapping
- **technology-stack**: Technology choices organized by category
- **capability-bindings**: How capabilities bind to implementations

## Example Scenario

**Complete System Architecture** including:
- **Components**: User Management, Product Catalog, Order Processing
- **Deployments**: Development, staging, production environments
- **Instances**: Controllers, services, views with capability patterns
- **Manifests**: Technology stack and implementation choices

## Key Features

### Deployment Instances
```yaml
deployments:
  production:
    environment: production
    instances:
      UserController:
        type: controller
        advertises: [user-crud, authentication]
        uses: [database, cache]
```

### Capability Patterns
- **Advertises**: What capabilities an instance provides
- **Uses**: What capabilities an instance requires
- **Bindings**: How capabilities connect to implementations

### Manifest Mapping
Shows how abstract specifications map to concrete technologies:
- Component → Manifest → Technology Stack
- Controllers → Express.js/FastAPI/Spring Boot
- Services → Business logic implementations
- Data → PostgreSQL/MongoDB/Redis

## Generated Diagrams

All diagrams available in `generated-diagrams/11-08-*.mmd`:

1. **deployment-topology.mmd** - Infrastructure layout
2. **capability-flow.mmd** - Capability provider/consumer graph
3. **manifest-mapping.mmd** - Component to implementation mapping
4. **technology-stack.mmd** - Technology choices by category
5. **capability-bindings.mmd** - Capability implementation bindings

Plus all other standard diagrams (ER, lifecycle, events, etc.)

## Generation

```bash
# Generate deployment topology
specverse gen diagram 11-08-deployment-demo.specly -t deployment-topology

# Generate capability flow
specverse gen diagram 11-08-deployment-demo.specly -t capability-flow

# Generate manifest mapping
specverse gen diagram 11-08-deployment-demo.specly -t manifest-mapping

# Generate technology stack
specverse gen diagram 11-08-deployment-demo.specly -t technology-stack

# Generate capability bindings
specverse gen diagram 11-08-deployment-demo.specly -t capability-bindings

# Generate ALL 15 diagram types
specverse gen diagram 11-08-deployment-demo.specly
```

## Use Cases

### Deployment Diagrams
1. **Infrastructure Planning**: Visualize deployment architecture
2. **Environment Comparison**: See differences between dev/staging/prod
3. **Capacity Planning**: Understand instance distribution
4. **Security Review**: Identify capability boundaries

### Manifest Diagrams
1. **Technology Selection**: Document technology choices
2. **Stack Visualization**: See complete technology stack
3. **Onboarding**: Help new developers understand tech stack
4. **Migration Planning**: Plan technology upgrades

## Best Practices

### Deployment
1. **Environment Isolation**: Clear separation between environments
2. **Capability Boundaries**: Well-defined service interfaces
3. **Scaling Strategy**: Design for horizontal scaling
4. **Monitoring**: Include observability capabilities

### Manifests
1. **Technology Documentation**: Keep stack documentation current
2. **Version Tracking**: Document technology versions
3. **Dependency Management**: Track all dependencies
4. **Implementation Patterns**: Document architectural patterns

## Architecture Patterns

### Capability-Based Architecture
- **Loose Coupling**: Services communicate via capabilities
- **Service Discovery**: Capabilities enable dynamic discovery
- **Polyglot Support**: Different implementations for same capability
- **Testing**: Mock capabilities for testing

### Deployment Strategies
- **Blue-Green**: Multiple environment support
- **Canary**: Gradual rollout capabilities
- **Multi-Region**: Geographic distribution
- **Disaster Recovery**: Failover instances

---

**Note**: This example contains the most comprehensive specification, generating all 15 diagram types

**See**: `generated-diagrams/11-08-*.mmd` for full generated Mermaid diagrams
