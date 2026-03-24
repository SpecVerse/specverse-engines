# Example 06-02: Enhanced Deployment Example

This comprehensive example demonstrates advanced logical deployment patterns using SpecVerse v3.2, including multi-environment logical instance orchestration, capability-based architecture, communication channels, and sophisticated monitoring through logical service instances with the unified components + deployments architecture.

## Learning Objectives

- Master complex v3.2 logical deployment orchestration patterns
- Design multi-environment logical instance architectures with typed models
- Implement capability-based deployments with SpecVerse convention syntax
- Configure communication channels and namespace organization
- Build comprehensive monitoring through logical service instances
- Create scalable logical architecture patterns

## Deployment Architecture

### v3.2 Component Definition

```specly
components:
  EcommerceStaging:
    version: "3.2.0"
    description: "Enhanced deployment for e-commerce platform with comprehensive deployment features"
    
    export:
      models: [Application, Database, Cache, MonitoringStack, NetworkPolicy]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, DateTime]
    
    models:
      Application:
        description: "E-commerce application component"
        attributes:
          name: String required
          version: String required
          image: String required
          replicas: Integer default=6
          status: String default=stopped values=["stopped", "running", "updating", "failed"]
      
      MonitoringStack:
        description: "Comprehensive monitoring configuration"
        attributes:
          prometheus: Boolean default=true
          grafana: Boolean default=true
          jaeger: Boolean default=true
          retention: String default=30d
          alerting: Boolean default=true
```

### v3.2 Infrastructure as Code

```specly
deployments:
  ecommerceStaging:
    description: "Enhanced e-commerce staging deployment with comprehensive monitoring"
    version: "2.5.0"
    environment: staging
    
    target:
      platform: Kubernetes
      region: us-east-1
      zones: ["us-east-1a", "us-east-1b", "us-east-1c"]
    
    infrastructure:
      compute:
        applicationCluster:
          type: Kubernetes
          nodeCount: 6
          nodeType: m5.xlarge
          autoScaling:
            min: 3
            max: 12
            triggers: 
              - "cpu > 70%"
              - "memory > 80%"
              - "request-rate > 1000/sec"
        
        applicationPods:
          image: specverse/app:v2.5.0
          replicas: 6
          resources:
            requests:
              memory: 512Mi
              cpu: 250m
            limits:
              memory: 1Gi
              cpu: 500m
      
      storage:
        databaseCluster:
          type: PostgreSQL
          version: "15.0"
          instances: 3
          instanceType: r5.2xlarge
          storage:
            type: gp3
            size: 1TB
            encryption: true
```

## Service Mesh Configuration

### v3.2 Istio Service Mesh

```specly
networking:
  serviceMesh:
    type: Istio
    mtls:
      mode: STRICT
      certificateProvider: Istio
      rotationPolicy: "90-days"
    trafficManagement:
      loadBalancing: ROUND_ROBIN
      circuitBreaker:
        consecutiveErrors: 5
        interval: 30
        baseEjectionTime: 30
  
  policies:
    denyAllDefault:
      policyTypes: ["Ingress", "Egress"]
      podSelector: {}
    allowApplicationTraffic:
      ingress:
        - from:
            - namespaceSelector:
                matchLabels:
                  name: application
          ports:
            - protocol: TCP
              port: 8080
```

### Network Architecture

```specly
networking:
  vpc:
    cidrBlock: "10.0.0.0/16"
    subnets:
      public: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
      private: ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
      database: ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]
  
  loadBalancer:
    type: ApplicationLoadBalancer
    ssl: true
    certificateSource: ACM
    healthCheck:
      path: /health
      interval: 30
      timeout: 5
```

## Container Orchestration

### v3.2 Application Deployment

```specly
infrastructure:
  compute:
    applicationPods:
      image: specverse/app:v2.5.0
      replicas: 6
      resources:
        requests:
          memory: 512Mi
          cpu: 250m
        limits:
          memory: 1Gi
          cpu: 500m
      strategy:
        type: RollingUpdate
        rollingUpdate:
          maxSurge: 2
          maxUnavailable: 1
      healthChecks:
        liveness:
          path: /health
          port: 8080
          initialDelay: 30
          period: 10
        readiness:
          path: /ready
          port: 8080
          initialDelay: 5
          period: 5
```

### v3.2 Autoscaling Configuration

```specly
autoscaling:
  horizontal:
    minReplicas: 3
    maxReplicas: 20
    targetCPUUtilization: 70
    targetMemoryUtilization: 80
    customMetrics:
      - type: Pods
        metric: http_requests_per_second
        target: 100
  
  vertical:
    updateMode: Auto
    minAllowed:
      memory: 256Mi
      cpu: 100m
    maxAllowed:
      memory: 2Gi
      cpu: 1000m
```

## Advanced Monitoring & Observability

### v3.2 Comprehensive Monitoring Stack

```specly
monitoring:
  prometheus:
    retention: "30d"
    scrapeInterval: "15s"
    targets:
      - job: kubernetes-pods
        scrapeInterval: "30s"
      - job: kubernetes-nodes
        scrapeInterval: "60s"
      - job: application-metrics
        scrapeInterval: "15s"
  
  grafana:
    dashboards:
      - application-metrics
      - infrastructure-overview
      - business-metrics
  
  jaeger:
    sampling:
      type: probabilistic
      param: 0.1
    storage:
      type: elasticsearch
      retention: "7d"
    collector:
      replicas: 3
```

### v3.2 Alerting Configuration

```specly
monitoring:
  alerting:
    rules:
      critical:
        - alert: HighErrorRate
          expr: "rate(http_requests_total{status=~'5..'}[5m]) > 0.1"
          for: "2m"
          severity: critical
        - alert: ServiceDown
          expr: "up == 0"
          for: "1m"
          severity: critical
      warning:
        - alert: HighMemoryUsage
          expr: "container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8"
          for: "5m"
          severity: warning
    notifications:
      pagerDuty:
        integrationKey: "${PAGERDUTY_KEY}"
        severity: ["critical"]
      slack:
        webhook: "${SLACK_WEBHOOK}"
        channel: "#alerts"
        severity: ["warning", "critical"]
```

## Security Implementation

### v3.2 Security Configuration

```specly
security:
  rbac:
    serviceAccounts:
      - name: specverse-app
        namespace: staging
    clusterRoles:
      - name: specverse-reader
        rules:
          - apiGroups: [""]
            resources: ["pods", "services"]
            verbs: ["get", "list", "watch"]
    roleBindings:
      - name: specverse-app-binding
        subjects:
          - kind: ServiceAccount
            name: specverse-app
            namespace: staging
        roleRef:
          kind: ClusterRole
          name: specverse-reader
  
  podSecurity:
    allowPrivilegeEscalation: false
    requiredDropCapabilities: ["ALL"]
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
```

### v3.2 Secrets Management

```specly
security:
  secrets:
    external:
      provider: "AWS Secrets Manager"
      secrets:
        - name: database-credentials
          secretKey: "staging/database/credentials"
          refreshInterval: "1h"
        - name: api-keys
          secretKey: "staging/api/keys"
          refreshInterval: "24h"
```

## Disaster Recovery

### v3.2 Backup Strategy

```specly
disasterRecovery:
  backup:
    schedule: "0 2 * * *"
    retention:
      daily: 7
      weekly: 4
      monthly: 12
    destination: "s3://staging-backup-bucket/"
  
  crossRegion:
    primary: us-east-1
    secondary: us-west-2
    replicationLag: "< 5 minutes"
    consistencyCheck: daily
  
  failover:
    rto: "2 hours"
    rpo: "30 minutes"
    automatic:
      - "Primary region unavailable > 5 minutes"
      - "Error rate > 25% for 10 minutes"
    testSchedule: monthly
```


## Performance Optimization

### v3.2 Caching Strategy

```specly
caching:
  levels:
    - name: L1
      type: In-memory
      size: 512MB
      ttl: "5 minutes"
    - name: L2
      type: Redis
      ttl: "1 hour"
    - name: L3
      type: Database
  
  warmup:
    strategy: predictive
    triggers:
      - application-start
      - cache-miss-threshold
    patterns:
      - most-accessed-data
      - user-specific-data
```

### v3.2 CDN Configuration

```specly
cdn:
  provider: CloudFront
  distributions:
    staticAssets:
      origin: "s3://staging-static-assets"
      cacheBehaviors:
        - pathPattern: "*.js"
          ttl: "1 day"
        - pathPattern: "*.css"
          ttl: "1 day"
        - pathPattern: "*.png"
          ttl: "1 hour"
    
    apiCache:
      origin: "api-staging.example.com"
      cacheBehaviors:
        - pathPattern: "/api/products/*"
          ttl: "5 minutes"
        - pathPattern: "/api/users/*"
          ttl: "1 minute"
  
  edgeLocations: ["US", "EU"]
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:16.632Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Application {
        +name: String required
        +version: String required
        +image: String required
        +replicas: Integer = 6
        +status: String = stopped
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Database {
        +type: String = PostgreSQL
        +version: String required
        +instances: Integer = 3
        +storage: String required
        +encryption: Boolean = true
        +backup: Boolean = true
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Cache {
        +type: String = Redis
        +cluster: Boolean = true
        +nodes: Integer = 6
        +memory: String required
        +persistence: String = "RDB
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class MonitoringStack {
        +prometheus: Boolean = true
        +grafana: Boolean = true
        +jaeger: Boolean = true
        +retention: String = 30d
        +alerting: Boolean = true
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class NetworkPolicy {
        +name: String required
        +type: String required
        +defaultAction: String = deny
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class deployment_ecommerceStaging {
        <<deployment>>
        namespace: ecommerceStaging
        version: 2.5.0
        environment: staging
    }
`} />

</div>


## Complete Example

### Specly DSL Format
See [./06-02-enhanced-deployment-example.specly](./06-02-enhanced-deployment-example.specly) for the complete SpecVerse v3.2 deployment specification.

### Generated: YAML Format
The SpecVerse build system processes the .specly file through:
1. **Convention Processing**: Converts "name: Type modifiers" syntax to structured format
2. **Schema Validation**: Validates against JSON Schema with deployment rules  
3. **Infrastructure Generation**: Produces Kubernetes manifests, Terraform plans
4. **Monitoring Setup**: Configures Prometheus, Grafana, and Jaeger

## Key Features Demonstrated

- **v3.2 Container Format**: Unified components and deployments architecture
- **Convention Syntax**: Human-readable "name: Type modifiers" pattern
- **Multi-environment orchestration**: Complete deployment pipeline with typed models
- **Infrastructure as code**: Declarative infrastructure with SpecVerse v3.2
- **Service mesh configuration**: Istio integration with structured YAML
- **Comprehensive monitoring**: Prometheus, Grafana, Jaeger stack
- **Security implementation**: RBAC, pod security, secrets management
- **Autoscaling**: Horizontal and vertical pod autoscaling
- **Disaster recovery**: Cross-region backup and failover strategies

## Enterprise Deployment Patterns



## Validation

Test this example:
```bash
specverse validate examples/06-deploy/06-02-enhanced-deployment-example.specly
```

## Next Steps

Continue to [Example 06-01: Basic Deployment Intro](./06-01-basic-deployment-intro) for deployment fundamentals, or explore the complete SpecVerse documentation for advanced patterns.

## Related Examples

- [Example 06-01: Basic Deployment Intro](./06-01-basic-deployment-intro) - Deployment fundamentals
- [Example 05-02: SpecVerse App Build](../05-meta/05-02-specverse-app-build) - Build system integration
- [Example 04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog) - Application to deploy
- [Example 05-01: SpecVerse Meta-Specification](../05-meta/05-01-specverse-meta-specification) - Self-describing systems