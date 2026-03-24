# Implementation Manifests

This directory contains **SpecVerse v3.3 Implementation Manifests** that show how to deploy your component specifications to real infrastructure.

## What are Manifests?

Manifests bridge the gap between your logical SpecVerse specifications and concrete technology implementations. They define:

- **Implementation Types**: How logical components map to specific technologies
- **Behavior Mappings**: How model behaviors translate to actual code/API calls
- **Capability Mappings**: How logical capabilities map to implementation types
- **Communication Channels**: How components communicate in the real deployment
- **Technology Configuration**: Framework-specific settings and parameters

## Available Manifests

### `implementation.yaml` ⭐ NEW - v3.3 Code Generation
- **Purpose**: Technology stack configuration for code generation
- **Features**: ORM selection, server framework, metadata strategies
- **Use Case**: Generate production-ready code (services, routes, ORM schemas)
- **Commands**:
  ```bash
  npm run generate:code        # Generate all code
  npm run test:generators      # Generate and verify
  ```

### `docker-compose.specly`
- **Target**: Local development and staging
- **Technology**: Docker Compose
- **Database**: SQLite (development-friendly)
- **Use Case**: Quick local testing and development

### `kubernetes.specly`
- **Target**: Production deployment
- **Technology**: Kubernetes with operators
- **Database**: PostgreSQL with high availability
- **Use Case**: Scalable production deployments

## How to Use

1. **Choose a manifest** that matches your deployment target
2. **Customize the configuration** section for your specific needs
3. **Reference your component** by updating the component source
4. **Deploy using the specified tools** (docker-compose, kubectl, etc.)

## Extending Manifests

You can create additional manifests for other technologies:

- **Cloud Providers**: AWS EKS, GCP GKE, Azure AKS
- **Serverless**: AWS Lambda, Vercel, Netlify
- **Traditional**: VM-based deployments, bare metal
- **Container Platforms**: OpenShift, Rancher, Docker Swarm

## Commands

```bash
# Validate a manifest
specverse validate manifests/docker-compose.specly

# Process a manifest with component context
specverse gen yaml manifests/kubernetes.specly

# Generate deployment documentation
specverse gen docs manifests/kubernetes.specly
```

## Learn More

- **SpecVerse Manifests Documentation**: See the main docs for comprehensive manifest features
- **Examples**: Check `examples/06-deploy/` for more complex manifest patterns
- **Best Practices**: Review the `aiInstructions` in each manifest for implementation guidance