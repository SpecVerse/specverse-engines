# Infrastructure Instance Factory

Generates Docker, Kubernetes, and CI/CD pipeline configurations from a SpecVerse specification.

## Definition

- **`docker-k8s.yaml`** -- Single definition covering Docker, Kubernetes, and GitHub Actions CI/CD.

## Generator

- `templates/docker-k8s/infrastructure-generator.ts` -- Wrapper that delegates to the existing `generate-infrastructure.js` script (650+ lines). Produces multi-stage Dockerfiles, docker-compose files, K8s manifests (deployments, services, ingress), and CI/CD pipelines.

## Capabilities

| Capability | Description |
|---|---|
| `infrastructure.docker` | Multi-stage Dockerfiles (Node 20 Alpine) |
| `infrastructure.kubernetes` | K8s deployments, services, ingress (3 replicas, resource limits) |
| `infrastructure.cicd` | GitHub Actions pipelines (build on push, deploy on tag) |

## Default Configuration

- **Docker**: Multi-stage builds, `node:20-alpine` base image
- **Kubernetes**: `default` namespace, 3 replicas, 100m-500m CPU, 128Mi-512Mi memory
- **CI/CD**: GitHub Actions with build-on-push and deploy-on-tag

## Status

Wrapper implementation. The YAML notes a future TODO to break the monolithic JS script into native TypeScript template generators (Dockerfile, docker-compose, K8s manifests, CI/CD, env config).
