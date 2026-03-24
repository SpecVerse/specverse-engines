# Example 06-01: Basic Deployment Introduction

This example introduces SpecVerse v3.2 deployment specifications, showing how to define logical instances, capability-based architecture, and communication channels for SpecVerse applications using the unified components + deployments architecture.

## Learning Objectives

- Understand v3.2 deployment specification structure with components and deployments
- Define logical instances (controllers, services, views, communications) using convention syntax
- Configure capability-based architecture with advertise/use patterns
- Specify instance scaling and namespace organization
- Build foundation for logical deployment with SpecVerse v3.2

## Key Concepts

### v3.2 Component Structure
```specly
components:
  BasicWebApplication:
    version: "3.2.0"
    description: "Introduction to deployment specifications - simple web application"
    
    export:
      models: [WebApplication, Database, Environment]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, DateTime]
    
    models:
      WebApplication:
        description: "Simple web application component"
        attributes:
          name: String required
          version: String required
          image: String required
          port: Integer default=8080
          replicas: Integer default=1
          status: String default=stopped values=["stopped", "running", "failed"]
```

### v3.2 Deployment Structure
```specly
deployments:
  basicWebApplication:
    description: "Basic web application logical deployment"
    version: "3.2.0"
    environment: development
    
    instances:
      controllers:
        webApplicationController:
          component: "basic-web-application" 
          namespace: "web"
          advertises: "*"  # All behaviors, actions, events
          uses: ["database.*", "environment.*"]
          scale: 1
          
      services:
        databaseService:
          component: "basic-web-application"
          namespace: "data"
          advertises: ["operations.*"]  # Database operations
          uses: ["storage.*", "backup.*"]
          scale: 1
          
      communications:
        mainBus:
          namespace: "global"
          capabilities: [
            "webapplication.create", "webapplication.read",
            "database.connect", "database.query"
          ]
          type: "pubsub"
```

### Logical Instance Architecture
```specly
# Capability-based logical instances, not physical infrastructure
instances:
  controllers:
    webApplicationController:
      component: "basic-web-application" 
      namespace: "web"
      advertises: "*"  # All behaviors, actions, events
      uses: ["database.*", "environment.*"]
      scale: 1
      
  services:
    databaseService:
      component: "basic-web-application"
      namespace: "data"
      advertises: ["operations.*"]  # Database operations
      uses: ["storage.*", "backup.*"]
      scale: 1
      
  views:
    webInterface:
      component: "basic-web-application"
      namespace: "web"
      uses: ["models.*"]  # All CURVED operations for models
      scale: 1
```

### Communication Channels
```specly
# Logical buses that mediate between instances
communications:
  mainBus:
    namespace: "global"
    capabilities: [
      "webapplication.create", "webapplication.read", "webapplication.update",
      "database.connect", "database.query", "database.backup",
      "environment.configure", "environment.validate"
    ]
    type: "pubsub"
    
  dataBus:
    namespace: "data"
    capabilities: ["database.*", "storage.*", "backup.*"]
    type: "rpc"
```

## Capability Management

### Instance Capabilities
Each logical instance can:
- **Advertise capabilities**: What services the instance provides
- **Use capabilities**: What services the instance consumes from channels
- **Scale independently**: Based on load patterns and business requirements

### Capability Patterns
```specly
# Examples of capability patterns:
"*"                    # All behaviors, actions, events
"behaviors.*"          # All model behaviors
"operations.*"         # All service operations  
"User.*"              # All User-related capabilities
"database.connect"     # Specific named capability
```

### Namespace Organization
```specly
# Namespaces provide operational domains:
namespace: "web"       # Web application domain
namespace: "data"      # Data management domain
namespace: "global"    # Cross-cutting concerns
```

## Networking and Security

### Network Policies
```specly
networking:
  policies:
    webToDatabase:
      from:
        - podSelector:
            app: web-application
      to:
        - podSelector:
            app: database
      ports:
        - port: 5432
```

### Security Context
```specly
security:
  podSecurityContext:
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
  securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop: ["ALL"]
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:16.732Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class WebApplication {
        +name: String required
        +version: String required
        +image: String required
        +port: Integer = 8080
        +replicas: Integer = 1
        +status: String = stopped
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Database {
        +name: String required
        +type: String = PostgreSQL
        +version: String required
        +storage: String required
        +backup: Boolean = true
        +highAvailability: Boolean = false
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Environment {
        +name: String required
        +region: String required
        +platform: String = Kubernetes
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class deployment_basicWebApplication {
        <<deployment>>
        namespace: basicWebApplication
        version: 1.0.0
        environment: development
    }
`} />

</div>


## Complete Example

### Specly DSL Format
See [./06-01-basic-deployment-intro.specly](./06-01-basic-deployment-intro.specly) for the complete SpecVerse v3.2 deployment specification.

### Generated: YAML Format
The SpecVerse build system processes the .specly file through:
1. **Convention Processing**: Converts "name: Type modifiers" syntax to structured format
2. **Schema Validation**: Validates against JSON Schema with deployment rules
3. **YAML Generation**: Produces deployable Kubernetes manifests

## Key Features Demonstrated

- **v3.2 Container Format**: Unified components and deployments architecture
- **Convention Syntax**: Human-readable "name: Type modifiers" pattern
- **Infrastructure Definition**: Declarative compute and storage requirements
- **Deployment Strategies**: Rolling updates with health checks
- **Security Configuration**: Pod security contexts and network policies
- **Typed Models**: Strongly-typed deployment configuration

## Deployment Workflow

### Build Phase
1. **Application build**: Create container images
2. **Configuration validation**: Verify deployment specs
3. **Security scanning**: Check for vulnerabilities
4. **Artifact storage**: Store images in registry

### Deploy Phase
1. **Environment preparation**: Set up infrastructure
2. **Configuration deployment**: Apply environment settings
3. **Application deployment**: Deploy using specified strategy
4. **Health verification**: Validate deployment success

### Monitor Phase
1. **Health monitoring**: Continuous health checks
2. **Performance monitoring**: Resource usage tracking
3. **Log aggregation**: Centralized logging
4. **Alerting**: Notification on issues

## Best Practices

### Resource Management
- Define appropriate resource limits
- Use resource quotas for environments
- Monitor resource utilization

### Security
- Use least privilege security contexts
- Implement network policies
- Secure secrets management

### Reliability
- Configure health checks
- Use rolling deployment strategies
- Implement backup and recovery

## Validation

Test this deployment specification:
```bash
specverse validate examples/06-deploy/06-01-basic-deployment-intro.specly
```

## Next Steps

Continue to [Example 06-02: Enhanced Deployment Example](./06-02-enhanced-deployment-example) for advanced deployment patterns including multi-region, auto-scaling, and CI/CD integration.

## Related Examples

- [Example 05-02: SpecVerse App Build](../05-meta/05-02-specverse-app-build) - Build system integration
- [Example 04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog) - Application to deploy
- [Example 03-05: Complete Event Flow](../03-architecture/03-05-complete-event-flow) - System architecture patterns