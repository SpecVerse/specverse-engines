# End-to-End Full-Stack Demo

This directory contains a complete end-to-end demonstration of SpecVerse v3.3 capabilities, showcasing a full-stack task management application.

## Overview

The **Task Management App** is a comprehensive example that demonstrates:

- **Complete Full-Stack Architecture**: Frontend, backend, database, and messaging
- **React Frontend**: Modern React 18+ with TypeScript and hooks
- **Fastify API**: RESTful API with WebSocket support
- **Event-Driven Architecture**: Real-time updates using pub/sub messaging
- **Database Persistence**: PostgreSQL with Prisma ORM
- **Multiple Deployment Environments**: Development and production configurations

## Architecture

### Components

**Models (3):**
- `User` - Application users with authentication
- `Project` - Projects containing multiple tasks
- `Task` - Individual tasks with assignment and status tracking

**Controllers (3):**
- `UserController` - User management REST API
- `ProjectController` - Project management REST API
- `TaskController` - Task management with real-time updates

**Services (2):**
- `NotificationService` - Send notifications to users
- `TaskAssignmentService` - Handle task assignment logic

**Events (4):**
- `TaskCreated` - New task created
- `TaskUpdated` - Task details updated
- `TaskCompleted` - Task marked as completed
- `UserNotified` - User received notification

**Views (3):**
- `TaskListView` - Display and filter tasks
- `TaskDetailView` - Detailed task view with editing
- `ProjectDashboard` - Project overview with statistics

### Technology Stack

#### Development Environment
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Fastify 4 + TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM
- **Events**: In-memory EventEmitter (for development)
- **Validation**: Zod runtime validation

#### Production Environment
- **Frontend**: React (optimized build, CDN-ready)
- **Backend**: Fastify with clustering (4 workers)
- **Database**: PostgreSQL 15 (SSL, connection pooling)
- **Cache**: Redis for session and data caching
- **Events**: RabbitMQ for distributed messaging
- **Validation**: Zod runtime validation
- **Infrastructure**: Docker + Kubernetes + Prometheus monitoring

## Files

```
12-end-to-end/
├── README.md                           # This file
├── 12-01-task-management-app.specly   # Main specification
└── manifests/
    ├── development.yaml                # Development environment manifest
    └── production.yaml                 # Production environment manifest
```

## Usage

### 1. Validate the Specification

```bash
specverse validate examples/12-end-to-end/12-01-task-management-app.specly
```

### 2. Validate the Manifests

```bash
# Development manifest
specverse validate examples/12-end-to-end/manifests/development.yaml

# Production manifest
specverse validate examples/12-end-to-end/manifests/production.yaml
```

### 3. Generate Code (Coming Soon)

Once code generation templates are implemented, you'll be able to generate:

```bash
# Generate all code for development environment
specverse realize examples/12-end-to-end/12-01-task-management-app.specly \
  --manifest examples/12-end-to-end/manifests/development.yaml \
  all

# This will generate:
# - React components and forms (frontend)
# - Fastify routes and server (backend)
# - Prisma schema and migrations (database)
# - Event publishers and subscribers (messaging)
# - Zod validation schemas (validation)
```

### 4. Generate Documentation

```bash
# Generate full documentation
specverse gen docs examples/12-end-to-end/12-01-task-management-app.specly
```

### 5. Generate Diagrams

```bash
# Generate architecture diagrams
specverse gen diagram examples/12-end-to-end/12-01-task-management-app.specly \
  -t er-diagram -o docs/task-app-er.mmd

specverse gen diagram examples/12-end-to-end/12-01-task-management-app.specly \
  -t event-flow-layered -o docs/task-app-events.mmd

specverse gen diagram examples/12-end-to-end/12-01-task-management-app.specly \
  -t deployment-topology -o docs/task-app-deployment.mmd
```

## Features Demonstrated

### ✅ Instance Factories Used

This demo uses **all** the newly implemented instance factories:

1. **ReactComponents** - Frontend UI components
2. **FastifyAPI** - Backend REST API server
3. **PrismaORM** - Database ORM and migrations
4. **PostgreSQL15** - Relational database
5. **RedisCache** - Key-value caching (production only)
6. **EventEmitter** - In-memory events (development)
7. **RabbitMQEvents** - Distributed messaging (production)
8. **ZodValidation** - Runtime validation

### ✅ SpecVerse v3.3 Features

- **Component-based architecture** with clear boundaries
- **CURVED operations** for RESTful APIs (Create, Update, Retrieve, Retrieve_many, Validate, Evolve, Delete)
- **Event-driven communication** with pub/sub messaging
- **Lifecycle management** for Project and Task status
- **Multi-deployment support** (development vs production)
- **Capability-based resolution** through manifests
- **Real-time updates** via event subscriptions
- **Relationship management** (belongsTo, hasMany)
- **Behavioral contracts** (requires, ensures, publishes)

## What This Demonstrates

### Full Development Lifecycle

1. **Design**: Define models, relationships, and behaviors in SpecVerse
2. **Validate**: Ensure specification correctness
3. **Generate**: Create full-stack code from specification
4. **Deploy**: Deploy to development and production environments
5. **Evolve**: Update specification and regenerate code

### Technology Flexibility

The same specification works with different technology stacks by changing the manifest:

- **Development**: In-memory events, local database
- **Production**: RabbitMQ, Redis cache, clustered APIs
- **Future**: Could easily swap React for Vue, Fastify for NestJS, etc.

### Code Generation Scope

Once templates are implemented, this single specification will generate:

- **~2,500+ lines** of TypeScript/React frontend code
- **~1,500+ lines** of TypeScript/Fastify backend code
- **~500+ lines** of Prisma schema and migrations
- **~800+ lines** of event handlers and messaging
- **~400+ lines** of validation schemas
- **Total: ~5,700+ lines** from a 417-line specification

**That's a 13.6x code multiplication factor!**

## Next Steps

This demo is ready for:

1. **Template Implementation**: Create TypeScript generators for each factory
2. **Code Generation Testing**: Verify generated code compiles and runs
3. **Integration Testing**: Test the full stack together
4. **Documentation**: Generate API docs, architecture diagrams, and user guides

## License

MIT - Part of the SpecVerse Language project
