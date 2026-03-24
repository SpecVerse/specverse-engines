# Deployments Directory

This directory can be used to organize deployment specifications when you need multiple deployment targets or environment-specific configurations.

## Usage

Deployments can be organized by environment, scale, or target platform:

1. **Environment-based organization**:
   ```
   deployments/
   ├── development.specly
   ├── staging.specly
   └── production.specly
   ```

2. **Scale-based organization**:
   ```
   deployments/
   ├── personal.specly      # Single developer, local database
   ├── team.specly          # Small team, shared database
   ├── business.specly      # Business scale, clustering
   └── enterprise.specly    # Enterprise scale, multi-tenant
   ```

3. **Platform-based organization**:
   ```
   deployments/
   ├── local.specly         # Local development
   ├── cloud.specly         # Cloud deployment (AWS, GCP, Azure)
   ├── kubernetes.specly    # Kubernetes clusters
   └── serverless.specly    # Serverless functions
   ```

## Deployment Patterns

### Based on SpecVerse Library Patterns

You can reference deployment patterns from the SpecVerse library system:

- **Monolith Pattern**: Single-instance deployment (from `libs/deployments/monolith/`)
- **Microservices Pattern**: Service-based deployment (from `libs/deployments/microservices/`)
- **JAMstack Pattern**: Static + API deployment (from `libs/deployments/jamstack/`)
- **Enterprise Pattern**: Multi-tenant, compliance-ready (from `libs/deployments/enterprise/`)

### Example Deployment Structure

```yaml
# deployments/development.specly
components:
  my-app-dev:
    version: "3.1.0"
    
    # Reference library patterns
    import:
      - file: ../../../libs/deployments/monolith/lib/development.yaml
        select: ["development"]
    
    deployments:
      development:
        version: "3.1.0"
        environment: "development"
        
        # Based on monolith development pattern
        instances:
          controllers:
            appController:
              component: "my-app"
              namespace: "api"
              scale: 1
              advertises: ["api.*"]
              uses: ["database.*"]
```

## Instance Types

SpecVerse v3.3 supports these logical instance types:

- **Controllers**: API endpoints, request handlers
- **Services**: Business logic, background processing
- **Views**: UI components, frontend applications
- **Storage**: Databases, caches, file systems
- **Security**: Authentication, authorization, encryption
- **Infrastructure**: Load balancers, CDNs, service mesh
- **Monitoring**: Metrics, logging, alerting, analytics
- **Communications**: Message queues, event buses, RPC channels

## Capability Patterns

Use capability patterns to define instance communication:

```yaml
instances:
  controllers:
    apiController:
      advertises: ["api.*", "auth.*"]     # What this instance provides
      uses: ["database.*", "cache.*"]     # What this instance depends on
```

## Scaling Configuration

Define scaling behavior for different environments:

```yaml
instances:
  controllers:
    webApi:
      scale: 3                          # Number of instances
      advertises: ["api.*"]
      uses: ["database.*"]
      config:
        resources:
          memory: "512Mi"
          cpu: "200m"
        healthCheck:
          path: "/health"
          interval: "30s"
```

## Import Examples

```yaml
# In main.specly, reference deployment specifications
deployments:
  development:
    import:
      - file: deployments/development.specly
        select: ["development"]
  
  production:
    import:
      - file: deployments/production.specly
        select: ["production"]
```

## Best Practices

1. **Environment Separation**: Keep development and production deployments separate
2. **Library Usage**: Reference standard patterns from `libs/deployments/`
3. **Capability Design**: Use clear advertises/uses patterns for dependencies
4. **Scaling Strategy**: Define appropriate scaling for each environment
5. **Security Layering**: Include security instances for authentication and authorization
6. **Monitoring Integration**: Add monitoring instances for production deployments

## See Also

- **Library Patterns**: `../../libs/deployments/` for standard deployment patterns
- **Manifests**: `../manifests/` for technology-specific implementation guidance
- **Main Specification**: `../specs/main.specly` for component definitions