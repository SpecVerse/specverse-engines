# Blog API - Manifest Example Specification

**File**: `blog-api.specly`

## Overview

Simple blog platform API specification used to demonstrate v3.3 hybrid manifest mappings and deployment configurations.

## Purpose

This is a **manifest reference example** used by:
- Manifest examples in `06-deploy/`
- v3.3 implementation type demonstrations
- Capability mapping examples
- Deployment configuration testing

## Key Features

- **Simple Models**: User, Post, Comment
- **Clean Architecture**: Minimal dependencies
- **Manifest Testing**: Referenced by multiple manifests
- **Deployment Target**: Used in deployment examples

## Models

### User
- Username and email authentication
- Password hash storage
- Audit timestamps

### Post
- Blog post content
- Title and slug (SEO-friendly URL)
- Publishing workflow (draft, published, archived)
- Author relationship with cascade delete

### Comment
- User-generated content
- Timestamp tracking
- Post and user relationships

## Usage with Manifests

```bash
# Docker Compose deployment
specverse realize all examples/manifests/blog-api.specly \
  -m examples/06-deploy/06-04-docker-compose-manifest.specly

# Kubernetes deployment
specverse realize all examples/manifests/blog-api.specly \
  -m examples/06-deploy/06-03-kubernetes-deployment-manifest.specly

# Cloud-native deployment
specverse realize all examples/manifests/blog-api.specly \
  -m examples/06-deploy/06-05-cloud-native-manifest.specly
```

## Referenced By

This specification is referenced by:
- `06-04-docker-compose-manifest.specly`
- `06-03-kubernetes-deployment-manifest.specly`
- `06-05-cloud-native-manifest.specly`
- Various implementation manifest examples

## Deployment Scenarios

1. **Development**: Docker Compose with local database
2. **Staging**: Kubernetes cluster with managed database
3. **Production**: Cloud-native with auto-scaling
4. **Testing**: In-memory database for unit tests

## Related Examples

- `06-deploy/` - All deployment manifest examples
- `12-v3.3-features/12-01-blog-platform-v3.3.specly` - v3.3 blog features
- `08-service-layer/blog-api.specly` - Service layer version
- `12-end-to-end/manifests/` - Implementation manifests
