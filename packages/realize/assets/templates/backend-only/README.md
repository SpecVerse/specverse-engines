# {{projectName}} - Backend API

A standalone REST API service built with SpecVerse. Perfect for microservices, API-first development, and backend services.

## 🚀 Quick Start

```bash
# 1. Generate all code
npm run realize:all

# 2. Install dependencies
cd generated/code && npm install

# 3. Setup database
npm run db:generate
npm run db:push

# 4. Start development server
npm run dev

# 5. Test the API
curl http://localhost:3000/api/products
```

## 📁 Project Structure

```
{{projectName}}/
├── specs/
│   └── main.specly              # Your API specification
├── manifests/
│   └── implementation.yaml      # Backend-only manifest
├── generated/
│   └── code/                    # Generated backend code
│       ├── src/
│       │   ├── main.ts          # Application entry point
│       │   ├── controllers/     # Business logic
│       │   └── routes/          # API routes
│       ├── prisma/
│       │   └── schema.prisma    # Database schema
│       ├── package.json         # Dependencies
│       └── tsconfig.json        # TypeScript config
└── package.json                 # Workflow scripts
```

## 🛠️ Development Workflow

### 1. Modify Your API

Edit `specs/main.specly` to define your models and controllers:

```yaml
models:
  Product:
    attributes:
      name: String required
      price: Decimal required

controllers:
  ProductController:
    model: Product
    cured:
      create: {}
      retrieve: {}
```

### 2. Regenerate Code

```bash
npm run realize:all
```

### 3. Update Database

```bash
cd generated/code
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
```

### 4. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📡 API Endpoints

Based on the default Product model:

- `POST /api/products` - Create a product
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get a product by ID
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `generated/code/`:

```env
DATABASE_URL="postgresql://localhost:5432/{{projectNameKebab}}_dev"
PORT=3000
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### CORS Setup

The backend is configured to accept requests from frontend applications. Update `CORS_ORIGINS` in your `.env` file to match your frontend URL.

## 🧪 Testing

```bash
# Run tests
cd generated/code && npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📦 Deployment

### Standalone Deployment

The generated backend is a standalone Node.js application that can be deployed to:

- **Docker**: Add a Dockerfile to containerize
- **Cloud Platforms**: Deploy to AWS, GCP, Azure, Railway, Render, etc.
- **Kubernetes**: Use the generated code as a microservice

### Environment Setup

Set these environment variables in production:

```env
DATABASE_URL="your-production-database-url"
PORT=8080
CORS_ORIGINS="https://your-frontend-domain.com"
```

## 📚 Documentation

### Generate API Documentation

```bash
npm run generate:docs
npm run generate:diagrams
```

### View Database Schema

```bash
cd generated/code
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555`

## 🎯 Use Cases

This backend-only template is ideal for:

- **Microservices**: Building focused, single-responsibility services
- **API-First Development**: Designing APIs before building frontends
- **Mobile Backends**: Serving iOS, Android, or cross-platform apps
- **Third-Party Integrations**: Providing APIs for external consumers
- **Serverless Functions**: Base code for AWS Lambda, Vercel Functions, etc.

## 🔄 Connecting Frontends

Your frontend applications can connect to this API using:

```typescript
// Frontend configuration
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Fetch products
const response = await fetch(`${API_BASE_URL}/api/products`);
const products = await response.json();
```

## 📖 Learn More

- [SpecVerse Documentation](https://specverse.dev)
- [API Guide](./docs/)
- [Database Migrations](./generated/code/prisma/migrations/)

---

Built with ❤️ using [SpecVerse](https://specverse.dev)
