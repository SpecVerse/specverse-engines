# SpecVerse v3.3 Implementation Types System

**Revolutionary manifest-driven code generation with reusable implementation libraries**

## Overview

The Implementation Types System separates **WHAT** (component specification) from **WHERE** (deployment topology) and **HOW** (technology implementation), enabling:

- 📦 **Reusable Tech Stacks** - Share implementation patterns across projects
- 🔄 **Technology Flexibility** - Swap implementations without changing specs
- 🚀 **Rapid Development** - Generate production-ready code in seconds
- 🌍 **Community-Driven** - Build and share implementation libraries

## Quick Start

### 1. Define Your Implementation Type

```yaml
# libs/instance-factories/backend/fastify-prisma.yaml
name: FastifyPrismaAPI
version: "1.0.0"
type: api-server

capabilities:
  provides:
    - "api.rest"
    - "api.rest.crud"
  requires: []

technology:
  runtime: "node"
  framework: "fastify"
  orm: "prisma"

codeTemplates:
  routes:
    engine: typescript
    generator: "libs/instance-factories/backend/templates/fastify/routes-generator.ts"
    outputPattern: "routes/{controller}.ts"

  services:
    engine: typescript
    generator: "libs/instance-factories/backend/templates/prisma/services-generator.ts"
    outputPattern: "services/{model}.service.ts"
```

### 2. Create Your Manifest

```yaml
# manifest.yaml
specVersion: "3.3.0"
version: "1.0.0"
name: "my-api-project"

implementationTypes:
  - name: "FastifyPrismaAPI"
    source: "libs/instance-factories/backend/fastify-prisma.yaml"
    version: "1.0.0"

capabilityMappings:
  - capability: "api.rest"
    implementationType: "FastifyPrismaAPI"
```

### 3. Define Your Spec with Deployment

```yaml
# spec.specly
components:
  MyAPI:
    version: "1.0.0"
    models:
      User:
        attributes:
          id: UUID required
          name: String required
          email: String required

deployments:
  production:
    version: "1.0.0"
    environment: production
    instances:
      apiServer:
        type: api-server
        advertises: ["api.rest"]
```

### 4. Generate Code

```bash
specverse realize all spec.specly -m manifest.yaml -o generated/
```

## Architecture

### Three-Layer System

```
┌─────────────────────────┐
│   SPECIFICATION         │  Define WHAT you need
│   (spec.specly)         │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   DEPLOYMENT            │  Define WHERE it runs
│   (in spec)             │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   MANIFEST              │  Map HOW to implement
│   (manifest.yaml)       │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   IMPLEMENTATION TYPE   │  Defines tech stack
│   (fastify-prisma.yaml) │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   GENERATED CODE        │  Production-ready code
└─────────────────────────┘
```

## Implementation Type Structure

### Required Fields

```yaml
name: String              # Unique name (e.g., "FastifyPrismaAPI")
version: String           # Semantic version (e.g., "1.0.0")
type: String              # Type category (api-server, database, etc.)
description: String       # Human-readable description

compatibility:
  specverse: String       # Compatible SpecVerse version (e.g., "^3.3.0")
  node: String           # Required Node.js version (optional)

capabilities:
  provides: String[]      # Capabilities this implementation provides
  requires: String[]      # Capabilities this implementation needs

technology:
  runtime: String         # Runtime environment (node, deno, browser)
  language: String        # Programming language (typescript, javascript)
  framework: String       # Primary framework (fastify, express, react)

dependencies:
  runtime: Array          # Runtime dependencies
    - name: String
      version: String
  dev: Array             # Dev dependencies
    - name: String
      version: String

codeTemplates:
  [name]: Object          # Named code templates
    engine: String        # "typescript" | "handlebars" | "ai"
    generator: String     # Path to generator function
    outputPattern: String # Output file pattern with variables
```

### Capability Patterns

Capabilities follow a hierarchical pattern:

- `api.rest` - Basic REST API
- `api.rest.crud` - REST API with CRUD operations
- `api.graphql` - GraphQL API
- `storage.database` - Generic database
- `storage.prisma` - Prisma ORM
- `storage.typeorm` - TypeORM
- `cache.redis` - Redis caching
- `queue.rabbitmq` - RabbitMQ messaging

## Template Generators

### TypeScript Generator Example

```typescript
// templates/fastify/routes-generator.ts
import type { TemplateContext } from '../../../src/realize/types/index.js';

export default function generateFastifyRoutes(context: TemplateContext): string {
  const { controller, model } = context;

  return `
import { FastifyInstance } from 'fastify';
import { ${model.name}Service } from '../services/${model.name}.service.js';

export default async function ${controller.name}Routes(
  fastify: FastifyInstance
) {
  const service = new ${model.name}Service(fastify.prisma);

  // Create
  fastify.post('/', async (request, reply) => {
    const result = await service.create(request.body);
    return reply.status(201).send(result);
  });

  // Retrieve
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await service.retrieve(id);
    return reply.send(result);
  });
}
`;
}
```

### Template Context

The `TemplateContext` provides:

```typescript
{
  spec: AIOptimizedSpec;           // Full specification
  model?: any;                     // Current model
  controller?: any;                // Current controller
  service?: any;                   // Current service
  implType: ImplementationType;    // Implementation type
  instance: any;                   // Deployment instance
  [key: string]: any;              // Additional context
}
```

## Manifest Format

### v3.3 Manifest

```yaml
specVersion: "3.3.0"    # Required: SpecVerse version
version: "1.0.0"        # Required: Manifest version
name: "project-name"    # Required: Project name

implementationTypes:    # Array of implementation type references
  - name: "FastifyPrismaAPI"
    source: "path/to/fastify-prisma.yaml"
    version: "1.0.0"

capabilityMappings:     # Array of capability → implementation mappings
  - capability: "api.rest"
    implementationType: "FastifyPrismaAPI"
  - capability: "storage.database"
    implementationType: "PostgreSQLDatabase"

configuration:          # Global configuration (optional)
  environment: production
  logLevel: info
```

## Creating New Implementation Types

### Step 1: Define Technology Stack

Identify:
- Framework and libraries
- Dependencies and versions
- Capabilities provided/required
- Code templates needed

### Step 2: Create YAML Definition

```yaml
name: YourImplementation
version: "1.0.0"
type: api-server
# ... (see structure above)
```

### Step 3: Write Template Generators

Create TypeScript functions that generate code:

```typescript
export default function generateYourCode(context: TemplateContext): string {
  // Generate code based on context
  return generatedCode;
}
```

### Step 4: Test

```bash
# Test your implementation type
npx tsx libs/instance-factories/test-v33-generation.ts
```

## Examples

### Available Implementation Types

- **FastifyPrismaAPI** (`backend/fastify-prisma.yaml`)
  - Fastify web server
  - Prisma ORM
  - Zod validation
  - JWT authentication
  - Provides: `api.rest`, `api.rest.crud`

### Example Manifests

- **fastify-prisma-manifest.yaml** - Full-stack API with Fastify + Prisma

## CLI Integration

### Generate Code with v3.3

```bash
# Realize all code types
specverse realize all spec.specly -m manifest.yaml -o generated/

# Realize specific types
specverse realize routes spec.specly -m manifest.yaml -o generated/routes
specverse realize services spec.specly -m manifest.yaml -o generated/services
```

## Development

### Project Structure

```
libs/instance-factories/
├── README.md                    # This file
├── backend/
│   ├── fastify-prisma.yaml     # Implementation type definition
│   └── templates/
│       ├── fastify/
│       │   └── routes-generator.ts
│       └── prisma/
│           ├── services-generator.ts
│           └── schema-generator.ts
├── test-v33-generation.ts      # End-to-end test
└── examples/                    # Example specs and manifests
```

### Testing

```bash
# Run end-to-end test
npx tsx libs/instance-factories/test-v33-generation.ts

# Run with custom spec
npx tsx libs/instance-factories/test-v33-generation.ts path/to/spec.specly
```

## Best Practices

### Implementation Types

1. **Single Responsibility** - Each implementation type should have one clear purpose
2. **Version Carefully** - Use semantic versioning for compatibility
3. **Document Capabilities** - Clearly define what capabilities are provided
4. **Test Thoroughly** - Test all templates with various specs

### Manifests

1. **Explicit Mappings** - Map all used capabilities explicitly
2. **Version Lock** - Specify exact versions for reproducibility
3. **Environment-Specific** - Use different manifests for dev/prod
4. **Validate** - Always validate manifests before deployment

### Templates

1. **Type Safety** - Use TypeScript for template generators
2. **Error Handling** - Handle missing context gracefully
3. **Formatting** - Generate clean, formatted code
4. **Comments** - Add helpful comments to generated code

## Troubleshooting

### Common Issues

**Implementation type not found**
```
Solution: Check the source path in manifestation implementationTypes
```

**Capability not resolved**
```
Solution: Ensure capability mapping exists in manifest
```

**Template generator fails**
```
Solution: Check template path is correct and generator exports default function
```

**Generated code has errors**
```
Solution: Verify template context has all required data
```

## Contributing

We welcome contributions of new implementation types!

### Guidelines

1. Follow the structure defined in this README
2. Include comprehensive tests
3. Document all capabilities clearly
4. Provide example manifests
5. Use TypeScript for generators

### Submission Process

1. Create implementation type YAML
2. Write template generators
3. Test end-to-end
4. Submit pull request with documentation

## Resources

- **Implementation Plan**: `docs/implementation-plans/v3.3-implementation/IMPLEMENTATION-TYPES-SYSTEM-PLAN.md`
- **Schema**: `schema/IMPLEMENTATION-TYPE-SCHEMA.json`
- **Examples**: `examples/v33-test/`
- **Core Types**: `src/realize/types/implementation-type.ts`

## License

MIT License - see LICENSE file for details

---

**Status**: ✅ Production Ready (v3.3.0)

Built with ❤️ by the SpecVerse Team
