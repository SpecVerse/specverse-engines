# {{projectName}}

A SpecVerse project template with AI-powered inference capabilities.

## Quick Start

1. **Customize the specification** - Edit `specs/main.specly` to define your domain models
2. **Use AI inference** - Run `npm run infer` to generate complete architecture  
3. **Generate diagrams** - Run `npm run generate:diagrams` to visualize your system
4. **Add deployment** - Uncomment deployment sections in `main.specly` for your target scale

## Template Structure

```
{{projectName}}/
├── specs/                   # SpecVerse specifications
│   └── main.specly         # Main specification (start here)
├── deployments/            # Deployment specifications
│   ├── README.md           # Deployment guidance and patterns
│   ├── development.specly  # Development deployment
│   └── production.specly   # Production deployment
├── manifests/              # Implementation manifests
│   ├── README.md           # Manifest documentation and guidance
│   ├── docker-compose.specly # Docker Compose implementation
│   └── kubernetes.specly   # Kubernetes implementation
├── docs/                   # Project documentation
│   ├── diagrams/           # Generated Mermaid diagrams
│   │   └── README.md       # Diagram types and usage
│   ├── api/                # Generated API documentation
│   │   └── README.md       # API documentation guide
│   ├── guides/             # Project-specific guides
│   │   └── README.md       # Guide templates
│   └── example-documentation-template.md
├── generated/              # Generated code and artifacts
│   ├── docs/               # Generated documentation
│   └── README.md           # Generated artifacts guide
├── scripts/                # Build and test scripts
│   └── test-all.sh         # Test runner
├── CLAUDE.md               # AI development guide
├── AI-GUIDE.md             # Comprehensive SpecVerse reference
├── package.json            # npm scripts and metadata
└── .gitignore              # Git ignore patterns
```

## Template Customization

### Basic Item Model
The template includes a generic `Item` model that you should customize for your domain:

```yaml
# Edit specs/main.specly to replace "Item" with your domain concept
models:
  Item:  # <- Change this to your domain entity (User, Product, Order, etc.)
    description: "Basic item in the system - customize for your domain"
    attributes:
      id: UUID required unique auto=uuid4
      name: String required
      description: String optional
      # Add your domain-specific attributes here
```

### Deployment Options

You can define deployments either in the main specification or in separate deployment files:

#### Option 1: Inline Deployments (Simple)
Add deployment sections directly in `specs/main.specly`:

- **Personal/Demo**: SQLite, local auth, single instance  
- **Business**: PostgreSQL, OAuth, 2-3 instances with caching
- **Enterprise**: Multi-tenant, compliance, 5+ instances with monitoring

#### Option 2: Separate Deployment Files (Recommended for Complex Projects)
Create dedicated deployment specifications in the `deployments/` directory:

1. **Rename examples**: `development.specly.example` → `development.specly`
2. **Customize instances**: Modify controllers, storage, security for your needs
3. **Reference library patterns**: Use patterns from `libs/deployments/`
4. **Generate diagrams**: `npm run generate:diagram:deployment`

## Development Commands

### Essential Workflow
- `npm run validate` - Validate your specification
- `npm run infer` - Generate complete architecture with AI  
- `npm run generate:diagrams` - Create visual diagrams

### AI-Powered Generation
- `npm run infer` - Generate complete system architecture from minimal spec
- `npm run infer:minimal` - Generate enhanced but still minimal specification
- `npm run infer:deployment` - Generate complete architecture with deployment configuration
- `npm run infer:deployment:prod` - Generate production deployment configuration
- `npm run generate:diagrams` - Create all visual diagrams (ER, sequence, architecture, lifecycle, deployment)
- `npm run generate:docs` - Generate markdown documentation
- `npm run generate:complete` - Full generation pipeline (infer + diagrams + docs)

### Diagram Generation by Type
- `npm run generate:diagram:er` - Entity-Relationship diagram
- `npm run generate:diagram:event-flow` - Event-flow-layered architecture (topologically sorted)
- `npm run generate:diagram:lifecycle` - State machine lifecycles
- `npm run generate:diagram:deployment` - Deployment topology
- `npm run generate:diagram:architecture` - Model architecture overview

#### Programmatic Diagram API
SpecVerse diagrams can be generated programmatically:

```typescript
import { UnifiedDiagramGenerator, EventFlowPlugin } from '@specverse/lang/diagram-engine';
import { SpecVerseParser } from '@specverse/lang';

const parser = new SpecVerseParser(schema);
const parseResult = parser.parseFile('specs/main.specly');

const generator = new UnifiedDiagramGenerator({
  plugins: [new EventFlowPlugin()],
  theme: 'default'
});

const mermaid = generator.generate(parseResult.ast, 'event-flow-layered', {
  title: 'Event Flow Architecture'
});
```

See [example 11-diagrams documentation](https://github.com/SpecVerse/specverse-lang/tree/main/examples/11-diagrams) for complete API reference.

### Code Generation

SpecVerse includes powerful code generators that create production-ready implementations using the **Implementation Types System**.

#### Quick Start

1. **Configure using Implementation Types** - Edit `manifests/implementation.yaml`:
   ```yaml
   specVersion: "3.3.0"

   # Reference implementation types from library
   implementationTypes:
     - name: "FastifyPrismaAPI"
       source: "@specverse/lang/libs/implementation-types/backend/fastify-prisma.yaml"
       version: "1.0.0"

   # Map capabilities to implementation types
   capabilityMappings:
     - capability: "api.rest"
       implementationType: "FastifyPrismaAPI"
   ```

2. **Generate code**:
   ```bash
   npm run generate:code
   # Output: generated/code/
   ```

#### v3.3 Code Realization Commands

- `npm run realize:all` - Generate **complete runnable project** (ORM + services + routes + scaffolding + main.ts) ✨ **RECOMMENDED**
- `npm run realize:orm` - Generate ORM schemas only (Prisma schema)
- `npm run realize:services` - Generate service layer only
- `npm run realize:routes` - Generate route handlers only

#### What Gets Generated (v3.3 Complete Project) ✨

**Project Scaffolding** (NEW in v3.3):
- `package.json` - Aggregated dependencies from all implementation types
- `tsconfig.json` - Merged TypeScript configuration
- `.env.example` - Environment variables template (grouped by category)
- `.env` - Local environment configuration
- `.gitignore` - Technology-adaptive ignore patterns
- `README.md` - Auto-generated project documentation

**Application Entry Point** (NEW in v3.3):
- `src/main.ts` - Framework-adaptive server initialization (Fastify/Express/NestJS)
  - Auto-registers all routes
  - Configures CORS, logging, error handling
  - Graceful shutdown handling

**ORM Schemas** (`generated/code/prisma/`):
- Metadata primitives (id, audit, softDelete, status, version)
- Model attributes with proper types
- Relationships and foreign keys
- Database-specific annotations

**Service Layer** (`generated/code/src/services/`):
- Unified `validate(data, context)` method for all operations
- CURED operations (Create, Retrieve, Update/Evolve, Destroy)
- Optimistic locking with version checking
- Soft delete filtering
- Event publishing integration

**Controllers** (`generated/code/src/controllers/`):
- Business logic layer (CURED operations)
- Data transformation and validation

**Route Handlers** (`generated/code/src/routes/`):
- HTTP endpoints for all CURED operations
- Single `/validate` endpoint (accepts operation context)
- Request/response handling
- Error handling
- Framework-specific patterns

#### Running the Generated Application

After running `npm run realize:all`:

```bash
cd generated/code
npm install
cp .env.example .env
# Edit .env with your database connection string
npm run db:generate
npm run db:push    # or npm run db:migrate for migrations
npm run dev        # Start development server
```

Your application is now running with:
- ✅ Complete project structure
- ✅ All dependencies installed
- ✅ TypeScript configured
- ✅ Database schema synchronized
- ✅ REST API endpoints ready
- ✅ Auto-generated documentation

#### Metadata Primitives

Add metadata to your models for automatic code generation:

```yaml
models:
  Task:
    metadata:
      id: uuid                # ID strategy: uuid | integer | auto
      audit: true             # Adds createdAt, updatedAt, createdBy, updatedBy
      softDelete: deletedAt   # Soft delete: deletedAt | isDeleted
      status: true            # Lifecycle status field
      version: true           # Optimistic locking
    attributes:
      title: String required
      # ... your attributes
```

**Generated Features:**
- ✅ **Unified Validation** - Single `validate()` method for all operations
- ✅ **Optimistic Locking** - Version checking prevents concurrent updates
- ✅ **Soft Delete** - Automatic filtering of deleted records
- ✅ **Audit Trail** - Automatic timestamps and user tracking
- ✅ **Event Publishing** - Auto-generated events for all operations

**Tech Stack Support:**
- **ORMs**: Prisma, TypeORM
- **Frameworks**: Fastify, Express, NestJS
- **Databases**: PostgreSQL, MySQL, SQLite, MongoDB

See `specs/main.specly` for a complete example with all features.

### Development Tools
- `npm run format` - Format specification files
- `npm run process` - Convert to expanded YAML format
- `npm run build` - Full build (validate + infer)
- `npm test` - Run all tests including code generators

## Prerequisites

You can install SpecVerse tools globally or use them locally:

1. **Global installation** (recommended):
   ```bash
   # Install SpecVerse CLI globally
   npm install -g @specverse/lang
   ```

2. **Local development** (for contributing to SpecVerse):
   ```bash
   # Clone and build the SpecVerse tools
   git clone https://github.com/SpecVerse/specverse-lang.git
   cd specverse-lang
   npm install
   npm run build
   
   # Make tools available globally (optional)
   npm link
   ```

3. **For this project** - No dependencies to install:
   ```bash
   # The npm scripts use the globally installed specverse command
   # If you're using local development, ensure you've run 'npm link' in specverse-lang
   ```

## Getting Started

1. Validate the specification:
   ```bash
   npm run validate        # Validate main.specly file
   ```

2. Use AI inference to expand the specification:
   ```bash
   npm run infer           # Generate complete architecture
   npm run infer:deployment # Generate with deployment configuration
   ```

3. Generate diagrams and documentation:
   ```bash
   npm run generate:diagrams          # Create all visual diagrams
   npm run generate:diagram:event-flow # Event-flow architecture
   npm run generate:docs              # Generate markdown documentation
   ```

4. Process to YAML format (if needed):
   ```bash
   npm run process         # Convert Specly to expanded YAML
   ```

## Specification Format

**Specly DSL (main.specly):**
- Concise, developer-friendly syntax  
- Native SpecVerse format with optimal parsing
- Convention-based with powerful shorthand
- Flow syntax for lifecycles
- Reduced boilerplate (90% less code)

**Processed YAML Output:**
- Generated from Specly using `npm run process`
- Expanded format with all inferred properties
- Useful for integration with other tools
- Complete specification with explicit structure

## Deployment Specifications

SpecVerse supports logical deployment specifications with capability-based architecture:

### Deployment Features
- **Logical Instances**: Controllers, services, views as scalable instances
- **Communication Channels**: PubSub, RPC, Queue, Streaming channels
- **Capability Patterns**: Advertise/use patterns for instance communication
- **Scaling Configuration**: Define instance counts for different environments
- **Deployment Diagrams**: Visual representation of deployment architecture

### Example Deployment
```yaml
deployments:
  production:
    version: "1.0.0"
    environment: production
    instances:
      controllers:
        userController:
          component: "user-management"
          namespace: "user"
          advertises: "*"  # All capabilities
          uses: ["database.*", "cache.*"]
          scale: 4
      communications:
        mainBus:
          namespace: "global"
          capabilities: ["user.*", "order.*"]
          type: "pubsub"
```

## Documentation

### Project Documentation
- `docs/README.md` - Documentation guide and structure
- `docs/example-documentation-template.md` - Template for creating project docs

### SpecVerse Language Reference
For complete language documentation and schema reference:
- **Schema**: `../schema/SPECVERSE-V3.1-SCHEMA.json` (authoritative specification)
- **AI Schema**: `../schema/SPECVERSE-V3.1-SCHEMA-AI.yaml` (AI-friendly format)
- **Guidance**: `../schema/README-AI-GUIDANCE.md` (usage patterns and examples)

### SpecVerse Libraries
This template uses the SpecVerse library system for common types and patterns:
- **Types**: `../libs/types/` (UUID, DateTime, Money, Status, etc.)
- **Deployments**: `../libs/deployments/` (monolith, microservices, enterprise patterns)
- **Manifests**: `../libs/manifests/` (Next.js, PostgreSQL, SQLite implementations)

### External Resources
- [SpecVerse Documentation](https://specverse.org/docs)
- [Language Repository](https://github.com/SpecVerse/specverse-lang)
- [@specverse/lang on npm](https://www.npmjs.com/package/@specverse/lang)