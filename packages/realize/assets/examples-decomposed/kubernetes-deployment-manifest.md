# Kubernetes Deployment Implementation Manifest

This example demonstrates how to implement the basic web application deployment specification (from `06-01-basic-deployment-intro.specly`) using **Kubernetes** as the target platform.

## Overview

The **KubernetesDeploymentManifest** shows how to bridge the gap between:
- **Logical deployment specification** (what you want to deploy)
- **Concrete Kubernetes implementation** (how to deploy it with specific K8s resources)

## Key Implementation Mappings

### Components → Kubernetes Resources

| SpecVerse Component | Kubernetes Resource | Technology Stack |
|-------------------|-------------------|-----------------|
| `WebApplication` | `Deployment` + `Service` | nginx + Kubernetes |
| `Database` | `Cluster` (CloudNativePG) | PostgreSQL + Operator |
| `Environment` | `Namespace` + `RBAC` | Kubernetes native |
| Load Balancing | `Ingress` | nginx-ingress + cert-manager |

### Logical Instances → K8s Workloads

- **Controllers** → `Deployment` with configurable replicas and resource limits
- **Storage** → `PostgreSQL Cluster` with persistent volumes and backup
- **Infrastructure** → `Service` + `Ingress` for networking and external access
- **Monitoring** → Ready for Prometheus integration

## Implementation Features

### 🚀 **Production-Ready Configuration**
- **Resource Management**: CPU/memory requests and limits
- **Health Checks**: Liveness and readiness probes
- **Auto-Scaling**: HorizontalPodAutoscaler configuration
- **Security**: NetworkPolicies and PodSecurityStandards

### 🔧 **Operator Integration**
- **CloudNativePG**: For PostgreSQL cluster management
- **cert-manager**: For automatic TLS certificate provisioning
- **nginx-ingress**: For advanced routing and load balancing

### 📊 **Observability**
- **Prometheus Metrics**: Built-in monitoring endpoints
- **Health Endpoints**: `/health` and `/ready` for proper lifecycle management
- **Structured Logging**: Container log aggregation ready

## Generated Kubernetes Manifests

When implemented, this manifest generates:

```yaml
# Web Application Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-application
  namespace: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-application
  template:
    spec:
      containers:
      - name: web
        image: nginx:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

```yaml
# PostgreSQL Cluster
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: webapp-postgres
  namespace: data
spec:
  instances: 1
  primaryUpdateStrategy: unsupervised
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
  storage:
    size: 1Gi
    storageClass: fast-ssd
  monitoring:
    enabled: true
```

## Namespace Organization

The manifest implements proper **namespace isolation**:

- **`web` namespace**: Frontend applications with resource quotas
- **`data` namespace**: Databases and persistent storage
- **Resource Quotas**: CPU and memory limits per namespace
- **Network Policies**: Secure inter-service communication

## AI Implementation Guidance

The manifest includes specific **AI instructions** for:
- Resource management best practices
- Security hardening with NetworkPolicies
- Monitoring and observability setup
- Scaling strategies for production workloads
- Configuration management with ConfigMaps/Secrets

## Usage

1. **Apply the specification**: Use SpecVerse CLI to process the logical deployment
2. **Generate manifests**: The manifest will produce Kubernetes YAML files
3. **Deploy to cluster**: Use `kubectl apply` or GitOps workflow
4. **Monitor deployment**: Leverage built-in health checks and metrics

This implementation demonstrates how SpecVerse **manifests bridge the architecture gap** between logical specifications and concrete infrastructure, enabling teams to maintain consistency across different deployment targets while leveraging platform-specific capabilities.

## Diagrams

<div className="diagram-generated">

### Technology Stack

<Mermaid chart={`
graph TB
  %% Manifest Mapping

  subgraph database_layer["🗄️ DATABASE"]
    direction LR
    tech_postgresql_kubernetes_operator("postgresql<br>kubernetes-operator<br>vlatest")
  end

  subgraph infrastructure_layer["🏗️ INFRASTRUCTURE"]
    direction LR
    tech_kubernetes_deployment("kubernetes<br>deployment<br>vlatest")
    tech_kubernetes_service("kubernetes<br>service<br>vlatest")
    tech_kubernetes_ingress_nginx("kubernetes<br>ingress-nginx<br>vlatest")
  end


  style tech_postgresql_kubernetes_operator fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
  style tech_kubernetes_deployment fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style tech_kubernetes_service fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style tech_kubernetes_ingress_nginx fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
`}/>

### Capability Bindings

<Mermaid chart={`
graph LR
  %% Manifest Mapping

  subgraph capabilities_layer["🎯 CAPABILITIES"]
    direction TB
    cap_0{{"web.*<br>(1 impl)"}}
    cap_1{{"database.*<br>(1 impl)"}}
    cap_2{{"networking.*<br>(1 impl)"}}
    cap_3{{"routing.*<br>(1 impl)"}}
  end

  impl_KubernetesDeploymentManifest_KubernetesWebController("KubernetesDeploymentManifest.KubernetesWebController")
  impl_KubernetesDeploymentManifest_KubernetesDatabase("KubernetesDeploymentManifest.KubernetesDatabase")
  impl_KubernetesDeploymentManifest_KubernetesService("KubernetesDeploymentManifest.KubernetesService")
  impl_KubernetesDeploymentManifest_KubernetesIngress("KubernetesDeploymentManifest.KubernetesIngress")


  %% Relationships
  cap_0 -->|"binds to"| impl_KubernetesDeploymentManifest_KubernetesWebController
  cap_1 -->|"binds to"| impl_KubernetesDeploymentManifest_KubernetesDatabase
  cap_2 -->|"binds to"| impl_KubernetesDeploymentManifest_KubernetesService
  cap_3 -->|"binds to"| impl_KubernetesDeploymentManifest_KubernetesIngress

  style cap_0 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_KubernetesDeploymentManifest_KubernetesWebController fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style cap_1 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_KubernetesDeploymentManifest_KubernetesDatabase fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style cap_2 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_KubernetesDeploymentManifest_KubernetesService fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style cap_3 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_KubernetesDeploymentManifest_KubernetesIngress fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
`}/>

### Manifest Mapping

<Mermaid chart={`
graph LR
  %% Manifest Mapping

  subgraph manifests_layer["📋 MANIFESTS (Implementation Mapping)"]
    direction TB
    manifest_KubernetesDeploymentManifest{{"KubernetesDeploymentManifest<br>v1.0.0<br>Types: 4 | Behaviors: 3"}}
  end

  subgraph implementation_layer["🔧 IMPLEMENTATION (Technology)"]
    direction TB
    impl_KubernetesDeploymentManifest_KubernetesWebController("KubernetesWebController<br>kubernetes / deployment")
    impl_KubernetesDeploymentManifest_KubernetesDatabase("KubernetesDatabase<br>postgresql / kubernetes-operator")
    impl_KubernetesDeploymentManifest_KubernetesService("KubernetesService<br>kubernetes / service")
    impl_KubernetesDeploymentManifest_KubernetesIngress("KubernetesIngress<br>kubernetes / ingress-nginx")
  end


  %% Relationships
  manifest_KubernetesDeploymentManifest -->|"implements"| impl_KubernetesDeploymentManifest_KubernetesWebController
  manifest_KubernetesDeploymentManifest -->|"implements"| impl_KubernetesDeploymentManifest_KubernetesDatabase
  manifest_KubernetesDeploymentManifest -->|"implements"| impl_KubernetesDeploymentManifest_KubernetesService
  manifest_KubernetesDeploymentManifest -->|"implements"| impl_KubernetesDeploymentManifest_KubernetesIngress

  style manifest_KubernetesDeploymentManifest fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_KubernetesDeploymentManifest_KubernetesWebController fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_KubernetesDeploymentManifest_KubernetesDatabase fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_KubernetesDeploymentManifest_KubernetesService fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_KubernetesDeploymentManifest_KubernetesIngress fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
`}/>

</div>