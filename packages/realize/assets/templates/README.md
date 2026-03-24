# SpecVerse Templates

This directory contains starter templates for different project types. Each template provides a complete, working specification and manifest configuration for specific use cases.

## Available Templates

### 1. Default Template (Fullstack Monorepo)

**Location**: `templates/default/`

**Use Case**: Full-stack applications with frontend and backend in a monorepo structure

**Architecture**:
- **Backend**: Fastify + Prisma + PostgreSQL
- **Frontend**: React + Vite + React Router + React Query
- **Structure**: npm workspaces with `backend/` and `frontend/` directories
- **Communication**: Frontend connects to local backend via environment variables

**Generated Structure**:
```
generated/code/
├── package.json           # Root workspace configuration
├── backend/
│   ├── package.json       # Backend dependencies
│   ├── tsconfig.json      # Backend TypeScript config
│   ├── src/
│   │   ├── main.ts        # Fastify server entry point
│   │   ├── routes/        # REST API routes
│   │   └── services/      # Business logic services
│   └── prisma/
│       └── schema.prisma  # Database schema
└── frontend/
    ├── package.json       # Frontend dependencies
    ├── tsconfig.json      # Frontend TypeScript config
    ├── vite.config.ts     # Vite configuration
    ├── index.html         # HTML entry point
    └── src/
        ├── main.tsx       # React entry point
        ├── App.tsx        # Root component with routing
        └── components/    # React components from views
```

**Quick Start**:
```bash
# Initialize project
specverse init MyApp

# Or explicitly specify default template
specverse init MyApp --template default

# Navigate to project
cd MyApp

# Generate code
npm run realize:all

# Install dependencies
cd generated/code
npm install

# Setup database
npm run db:generate
npm run db:push

# Start development servers (both in parallel)
npm run dev

# Or start individually
npm run dev:backend   # http://localhost:3000
npm run dev:frontend  # http://localhost:5173
```

**Key Features**:
- Complete CURED operations for all models
- Automatic React Router setup from views
- React Query data fetching with caching
- TypeScript throughout
- Database migrations and seeding
- CORS configured for local development

---

### 2. Backend-Only Template

**Location**: `templates/backend-only/`

**Use Case**: Microservices, API-only services, or when frontend is separate project

**Architecture**:
- **Backend**: Fastify + Prisma + PostgreSQL
- **Structure**: Standalone (all files in root, no subdirectories)
- **Deployment**: Can be deployed independently as microservice
- **CORS**: Configurable via environment variable for frontend integration

**Generated Structure**:
```
generated/code/
├── package.json           # Standalone backend package
├── tsconfig.json          # Backend TypeScript config
├── src/
│   ├── main.ts            # Fastify server entry point
│   ├── routes/            # REST API routes
│   └── services/          # Business logic services
├── prisma/
│   └── schema.prisma      # Database schema
└── .env.example           # Environment variables template
```

**Quick Start**:
```bash
# Initialize backend-only project
specverse init MyAPI --template backend-only

# Navigate to project
cd MyAPI

# Generate code
npm run realize:all

# Install dependencies
cd generated/code
npm install

# Setup database
npm run db:generate
npm run db:push

# Start server
npm run dev  # http://localhost:3000
```

**Configuration**:
```env
# .env file
DATABASE_URL=postgresql://user:password@localhost:5432/myapi
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,https://your-frontend.com
```

**Key Features**:
- Complete REST API with CURED operations
- Standalone deployment structure
- Environment-based CORS configuration
- Optimized for microservices architecture
- No frontend dependencies

**Typical Use Cases**:
- Microservices in distributed systems
- API services for mobile apps
- Backend for JAMstack applications
- Standalone data services

---

### 3. Frontend-Only Template

**Location**: `templates/frontend-only/`

**Use Case**: JAMstack applications, SPAs connecting to external APIs, frontend-first development

**Architecture**:
- **Frontend**: React + Vite + React Router + React Query
- **Structure**: Standalone (all files in root, no subdirectories)
- **API**: Connects to external API via environment variable
- **Deployment**: Static hosting (Vercel, Netlify, S3, etc.)

**Generated Structure**:
```
generated/code/
├── package.json           # Standalone frontend package
├── tsconfig.json          # Frontend TypeScript config
├── vite.config.ts         # Vite configuration
├── index.html             # HTML entry point
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Root component with routing
│   ├── index.css          # Global styles
│   └── components/        # React components from views
└── .env.example           # Environment variables template
```

**Quick Start**:
```bash
# Initialize frontend-only project
specverse init MyFrontend --template frontend-only

# Navigate to project
cd MyFrontend

# Generate code
npm run realize:all

# Install dependencies
cd generated/code
npm install

# Configure API endpoint
cp .env.example .env
# Edit .env: VITE_API_BASE_URL=https://your-api.com

# Start dev server
npm run dev  # http://localhost:5173
```

**Configuration**:
```env
# .env file
VITE_API_BASE_URL=https://api.example.com
VITE_API_PREFIX=/api
```

**Key Features**:
- React Router with auto-generated routes from views
- React Query for API data fetching and caching
- TypeScript type safety throughout
- Hot Module Replacement (HMR) with Vite
- Optimized production builds
- No backend dependencies

**Deployment Options**:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **AWS S3 + CloudFront**: Static hosting
- **GitHub Pages**: Static site hosting
- **Any CDN**: Just serve the `dist/` folder

**Typical Use Cases**:
- JAMstack applications
- Frontend for existing APIs
- Static site generation
- Progressive Web Apps (PWAs)
- Prototyping with mock APIs

---

## Template Comparison

| Feature | Default (Fullstack) | Backend-Only | Frontend-Only |
|---------|-------------------|--------------|---------------|
| **Structure** | Monorepo (workspaces) | Standalone | Standalone |
| **Backend** | ✅ Fastify + Prisma | ✅ Fastify + Prisma | ❌ |
| **Frontend** | ✅ React + Vite | ❌ | ✅ React + Vite |
| **Database** | ✅ PostgreSQL | ✅ PostgreSQL | ❌ (External API) |
| **Deployment** | Full-stack hosting | Microservice/API | Static hosting |
| **Use Case** | Integrated apps | API services | JAMstack/SPAs |
| **npm Workspaces** | ✅ | ❌ | ❌ |
| **CORS Setup** | Auto-configured | Env variable | N/A (client-only) |

## Customizing Templates

### Modifying Specifications

Each template has a `specs/main.specly` file that you can customize:

```yaml
# Example: Add a new model
models:
  Product:
    attributes:
      name: String required
      price: Decimal required

  # Add your own model
  Order:
    attributes:
      orderNumber: String required unique
      totalAmount: Decimal required
      status: String values=["pending", "shipped", "delivered"]
    relationships:
      product: belongsTo Product
```

After modifying specs:
```bash
npm run realize:all  # Regenerate code
```

### Customizing Instance Factories

Edit `manifests/implementation.yaml` to change technology choices:

```yaml
capabilityMappings:
  # Change ORM
  - capability: "orm.schema"
    instanceFactory: "TypeORM"  # Instead of PrismaORM

  # Change API framework
  - capability: "api.rest"
    instanceFactory: "ExpressAPI"  # Instead of FastifyAPI
```

### Output Structure Configuration

You can change between monorepo and standalone structures:

```yaml
configuration:
  outputStructure: "standalone"  # or "monorepo"
  frontendDir: "."               # or "frontend"
  backendDir: "."                # or "backend"
```

## Development Workflow

### Fullstack (Default Template)

```bash
# Terminal 1: Backend development
cd generated/code
npm run dev:backend

# Terminal 2: Frontend development
npm run dev:frontend

# Or run both together
npm run dev
```

### Backend-Only

```bash
cd generated/code

# Development
npm run dev

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Create migration
npm run db:studio      # Open Prisma Studio

# Testing
npm test
npm run test:watch
npm run test:coverage

# Production
npm run build
npm start
```

### Frontend-Only

```bash
cd generated/code

# Development
npm run dev

# Production build
npm run build
npm run preview  # Preview production build

# Testing
npm run lint
npm run lint:fix
```

## Environment Variables

### Default (Fullstack)

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
API_PORT=3000
API_HOST=localhost
CORS_ORIGINS=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_PREFIX=/api
```

### Backend-Only

```env
DATABASE_URL=postgresql://user:password@localhost:5432/myapi
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGINS=*
```

### Frontend-Only

```env
VITE_API_BASE_URL=https://api.example.com
VITE_API_PREFIX=/api
```

## Creating Custom Templates

To create your own template:

1. **Create directory structure**:
```bash
mkdir templates/my-template
mkdir templates/my-template/specs
mkdir templates/my-template/manifests
```

2. **Add specification** (`specs/main.specly`):
```yaml
components:
  {{componentName}}:
    version: "1.0.0"
    models:
      # Your models here
```

3. **Add manifest** (`manifests/implementation.yaml`):
```yaml
manifests:
  {{projectNameKebab}}Implementation:
    specVersion: "3.3.0"
    configuration:
      outputStructure: "standalone"  # or "monorepo"
    capabilityMappings:
      # Your instance factory mappings
```

4. **Add documentation** (`README.md`, `CLAUDE.md`)

5. **Use your template**:
```bash
specverse init MyProject --template my-template
```

## Troubleshooting

### Port Conflicts

**Backend port already in use**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
API_PORT=3001
```

**Frontend port already in use**:
```bash
# Vite will auto-increment to next available port (5174, 5175, etc.)
# Or specify in vite.config.ts
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres

# Reset database
npm run db:push -- --force-reset

# View database
npm run db:studio
```

### Module Resolution Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For monorepo, also clear workspace caches
rm -rf backend/node_modules frontend/node_modules
npm install
```

### TypeScript Errors

```bash
# Regenerate types from Prisma schema
npm run db:generate

# Check TypeScript config
npm run typecheck
```

## Best Practices

### 1. Use Template Variables

Template placeholders are automatically replaced during `specverse init`:
- `{{componentName}}` → Component name (PascalCase)
- `{{projectName}}` → Project name (as provided)
- `{{projectNameKebab}}` → Project name (kebab-case)

### 2. Keep Specs Clean

Only define what's necessary in specs. The AI inference engine will generate:
- Controllers for models with API exposure
- Services with business logic
- Views for UI components
- CURED operations automatically

### 3. Use Environment Variables

Never hardcode:
- Database URLs
- API endpoints
- CORS origins
- Port numbers

Always use `.env` files with `.env.example` as template.

### 4. Follow Workspace Patterns

**Monorepo** (default template):
- Use workspace scripts: `npm run dev:backend`, `npm run dev:frontend`
- Shared dependencies at root level
- Independent configs per workspace

**Standalone** (backend-only, frontend-only):
- All dependencies in single package.json
- Simpler deployment
- Better for microservices/JAMstack

### 5. Regeneration Workflow

When updating specs:
```bash
# 1. Modify specs/main.specly
vim specs/main.specly

# 2. Regenerate code
npm run realize:all

# 3. Update database if models changed
cd generated/code
npm run db:generate
npm run db:push
```

---

## Additional Resources

- **SpecVerse Documentation**: https://docs.specverse.dev
- **Language Reference**: See `/Volumes/Dev24/GitHub/SpecVerse/specverse-lang/CLAUDE.md`
- **Instance Factories**: See `libs/instance-factories/` for available technologies
- **Examples**: See `examples/` for more complex specifications

## Support

- **Issues**: https://github.com/SpecVerse/specverse-lang/issues
- **Discussions**: https://github.com/SpecVerse/specverse-lang/discussions
- **Discord**: https://discord.gg/specverse
