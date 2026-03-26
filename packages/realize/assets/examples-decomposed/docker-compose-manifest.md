# Docker Compose Implementation Manifest

This example demonstrates how to implement the basic web application deployment specification (from `06-01-basic-deployment-intro.specly`) using **Docker Compose** for local development and staging environments.

## Overview

The **DockerComposeDeploymentManifest** shows how to translate logical deployment specifications into a **complete Docker Compose stack** with:
- **Container orchestration** for multi-service applications
- **Development-friendly** configurations with hot reloading
- **Production-ready** features like health checks and monitoring

## Key Implementation Mappings

### Components → Docker Services

| SpecVerse Component | Docker Service | Technology Stack |
|-------------------|----------------|-----------------|
| `WebApplication` | `web` service | nginx + custom app |
| `Database` | `database` service | PostgreSQL 15 |
| `Environment` | Network + volumes | Docker Compose |
| Caching | `cache` service | Redis 7 |
| Load Balancing | `proxy` service | nginx reverse proxy |
| Monitoring | `monitoring` service | Prometheus |

### Container Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Reverse Proxy │────│   Web App       │
│   (nginx:alpine)│    │   (nginx:alpine)│
│   Port: 80,443  │    │   Port: 8080    │
└─────────────────┘    └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼─────────┐  ┌────────▼────────┐  ┌─────────▼─────────┐
│   Database      │  │     Cache       │  │   Monitoring      │
│ (postgres:15)   │  │  (redis:7)      │  │ (prometheus)      │
│ Port: 5432      │  │  Port: 6379     │  │ Port: 9090        │
└─────────────────┘  └─────────────────┘  └───────────────────┘
```

## Implementation Features

### 🔄 **Development Workflow**
- **Hot Reloading**: Bind mounts for real-time code changes
- **Database Persistence**: Named volumes for data retention
- **Environment Variables**: `.env` file for configuration
- **Log Aggregation**: Centralized logging with Docker logs

### 🏗️ **Production Features**
- **Health Checks**: All services include proper health monitoring
- **Restart Policies**: Automatic recovery from failures
- **Resource Limits**: Memory and CPU constraints (via Docker limits)
- **Security**: Non-root users and network isolation

### 📊 **Observability Stack**
- **Prometheus**: Metrics collection from all services
- **Health Endpoints**: `/health` checks for service status
- **Centralized Logs**: Docker log drivers for aggregation
- **Network Monitoring**: Container-to-container communication tracking

## Generated Docker Compose File

When implemented, this manifest generates a complete `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@database:5432/webapp
      - REDIS_URL=redis://cache:6379
    volumes:
      - ./app:/var/www/html
      - ./logs:/var/log/nginx
    depends_on:
      - database
      - cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - webapp-network

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=webapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d webapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - webapp-network

  cache:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3
    networks:
      - webapp-network

networks:
  webapp-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
```

## Development vs Production Configuration

### Development Mode
- **Bind Mounts**: Live code editing with `./app:/var/www/html`
- **Port Exposure**: Direct access to all services for debugging
- **Environment Files**: Easy configuration with `.env`
- **Hot Reloading**: Automatic application restarts on code changes

### Production Mode
- **Multi-Stage Builds**: Optimized container images
- **Secrets Management**: External secret injection
- **Reverse Proxy**: nginx for SSL termination and caching
- **Monitoring**: Prometheus metrics and alerting

## AI Implementation Guidance

The manifest includes **specific instructions** for:
- **Environment Management**: Proper use of .env files and secrets
- **Volume Strategy**: Named volumes vs bind mounts
- **Network Security**: Custom networks and service isolation
- **Health Monitoring**: Comprehensive health check implementation
- **Backup Procedures**: Database and volume backup strategies

## Usage Workflow

1. **Development Setup**:
   ```bash
   # Clone repository
   git clone <repo>
   cd project

   # Configure environment
   cp .env.example .env

   # Start development stack
   docker-compose up -d

   # View logs
   docker-compose logs -f web
   ```

2. **Production Deployment**:
   ```bash
   # Build production images
   docker-compose -f docker-compose.prod.yml build

   # Deploy with production config
   docker-compose -f docker-compose.prod.yml up -d

   # Monitor health
   docker-compose ps
   ```

3. **Scaling Services**:
   ```bash
   # Scale web service
   docker-compose up --scale web=3 -d

   # Scale with load balancer
   docker-compose up --scale web=3 --scale proxy=1 -d
   ```

This implementation shows how SpecVerse **manifests provide practical deployment guidance**, enabling teams to move from logical specifications to working containerized applications with minimal configuration overhead.

## Diagrams

<div className="diagram-generated">

### Technology Stack

<Mermaid chart={`
graph TB
  %% Manifest Mapping

  subgraph database_layer["🗄️ DATABASE"]
    direction LR
    tech_postgresql_docker("postgresql<br>docker<br>vlatest")
    tech_redis_docker("redis<br>docker<br>vlatest")
  end

  subgraph infrastructure_layer["🏗️ INFRASTRUCTURE"]
    direction LR
    tech_docker_compose("docker<br>compose<br>vlatest")
  end

  subgraph other_layer["📦 OTHER"]
    direction LR
    tech_nginx_docker("nginx<br>docker<br>vlatest")
    tech_prometheus_docker("prometheus<br>docker<br>vlatest")
  end


  style tech_postgresql_docker fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
  style tech_redis_docker fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
  style tech_docker_compose fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style tech_nginx_docker fill:#F5F5F5,stroke:#333,stroke-width:2px,color:#000
  style tech_prometheus_docker fill:#F5F5F5,stroke:#333,stroke-width:2px,color:#000
`}/>

### Capability Bindings

<Mermaid chart={`
graph LR
  %% Manifest Mapping

  subgraph capabilities_layer["🎯 CAPABILITIES"]
    direction TB
    cap_0{{"web.*<br>(1 impl)"}}
    cap_1{{"database.*<br>(1 impl)"}}
    cap_2{{"cache.*<br>(1 impl)"}}
    cap_3{{"proxy.*<br>(1 impl)"}}
    cap_4{{"monitoring.*<br>(1 impl)"}}
  end

  impl_DockerComposeDeploymentManifest_DockerWebApplication("DockerComposeDeploymentManifest.DockerWebApplication")
  impl_DockerComposeDeploymentManifest_DockerDatabase("DockerComposeDeploymentManifest.DockerDatabase")
  impl_DockerComposeDeploymentManifest_DockerCache("DockerComposeDeploymentManifest.DockerCache")
  impl_DockerComposeDeploymentManifest_DockerReverseProxy("DockerComposeDeploymentManifest.DockerReverseProxy")
  impl_DockerComposeDeploymentManifest_DockerMonitoring("DockerComposeDeploymentManifest.DockerMonitoring")


  %% Relationships
  cap_0 -->|"binds to"| impl_DockerComposeDeploymentManifest_DockerWebApplication
  cap_1 -->|"binds to"| impl_DockerComposeDeploymentManifest_DockerDatabase
  cap_2 -->|"binds to"| impl_DockerComposeDeploymentManifest_DockerCache
  cap_3 -->|"binds to"| impl_DockerComposeDeploymentManifest_DockerReverseProxy
  cap_4 -->|"binds to"| impl_DockerComposeDeploymentManifest_DockerMonitoring

  style cap_0 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerWebApplication fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style cap_1 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerDatabase fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style cap_2 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerCache fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style cap_3 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerReverseProxy fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style cap_4 fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerMonitoring fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
`}/>

### Manifest Mapping

<Mermaid chart={`
graph LR
  %% Manifest Mapping

  subgraph manifests_layer["📋 MANIFESTS (Implementation Mapping)"]
    direction TB
    manifest_DockerComposeDeploymentManifest{{"DockerComposeDeploymentManifest<br>v1.0.0<br>Types: 5 | Behaviors: 3"}}
  end

  subgraph implementation_layer["🔧 IMPLEMENTATION (Technology)"]
    direction TB
    impl_DockerComposeDeploymentManifest_DockerWebApplication("DockerWebApplication<br>docker / compose")
    impl_DockerComposeDeploymentManifest_DockerDatabase("DockerDatabase<br>postgresql / docker")
    impl_DockerComposeDeploymentManifest_DockerCache("DockerCache<br>redis / docker")
    impl_DockerComposeDeploymentManifest_DockerReverseProxy("DockerReverseProxy<br>nginx / docker")
    impl_DockerComposeDeploymentManifest_DockerMonitoring("DockerMonitoring<br>prometheus / docker")
  end


  %% Relationships
  manifest_DockerComposeDeploymentManifest -->|"implements"| impl_DockerComposeDeploymentManifest_DockerWebApplication
  manifest_DockerComposeDeploymentManifest -->|"implements"| impl_DockerComposeDeploymentManifest_DockerDatabase
  manifest_DockerComposeDeploymentManifest -->|"implements"| impl_DockerComposeDeploymentManifest_DockerCache
  manifest_DockerComposeDeploymentManifest -->|"implements"| impl_DockerComposeDeploymentManifest_DockerReverseProxy
  manifest_DockerComposeDeploymentManifest -->|"implements"| impl_DockerComposeDeploymentManifest_DockerMonitoring

  style manifest_DockerComposeDeploymentManifest fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerWebApplication fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerDatabase fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerCache fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerReverseProxy fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
  style impl_DockerComposeDeploymentManifest_DockerMonitoring fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
`}/>

</div>