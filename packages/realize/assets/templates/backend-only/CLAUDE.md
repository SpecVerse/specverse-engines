# {{projectName}} - Backend API Development Guide

Backend-only SpecVerse project for API development.

## Project Type

**Backend API Only** - No frontend generation
- REST API with Fastify
- PostgreSQL + Prisma ORM
- Standalone deployment structure

## Quick Commands

```bash
# Generate backend code
npm run realize:all

# Setup and run
cd generated/code
npm install
npm run db:generate
npm run db:push
npm run dev

# Test API
curl http://localhost:3000/api/products
```

## File Structure

```
{{projectName}}/
├── specs/main.specly              # API specification
├── manifests/implementation.yaml  # Backend-only manifest
└── generated/code/                # Standalone backend
    ├── src/                       # Source code
    ├── prisma/                    # Database schema
    └── package.json               # Backend dependencies
```

## Development Workflow

1. **Edit API Spec**: Modify `specs/main.specly`
2. **Regenerate**: Run `npm run realize:all`
3. **Update DB**: Run `npm run db:generate && npm run db:push`
4. **Test**: Use curl, Postman, or your frontend

## Key Features

- **Standalone Structure**: All code in root (no frontend/ or backend/ subdirs)
- **CORS Enabled**: Configured for frontend connections
- **Environment Variables**: Uses .env for configuration
- **Production Ready**: Can be deployed independently

## CORS Configuration

The backend accepts requests from frontends. Set in `.env`:

```env
CORS_ORIGINS="http://localhost:5173,https://your-frontend.com"
```

## Deployment

This generates a standalone Node.js API that can deploy to:
- Docker containers
- Cloud platforms (AWS, GCP, Azure)
- Serverless (with minor modifications)
- Kubernetes as a microservice

---

For comprehensive SpecVerse guidance, see the main [SpecVerse CLAUDE.md](https://github.com/SpecVerse/specverse-lang/blob/main/CLAUDE.md)
