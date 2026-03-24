# {{projectName}} - React Frontend

A standalone React SPA built with SpecVerse. Perfect for JAMstack apps, connecting to external APIs, and frontend-first development.

## 🚀 Quick Start

```bash
# 1. Configure your API endpoint
echo "VITE_API_BASE_URL=https://your-api.com" > generated/code/.env

# 2. Generate frontend code
npm run realize:all

# 3. Install dependencies
cd generated/code && npm install

# 4. Start development server
npm run dev

# 5. Open in browser
open http://localhost:5173
```

## 📁 Project Structure

```
{{projectName}}/
├── specs/
│   └── main.specly              # UI specification
├── manifests/
│   └── implementation.yaml      # Frontend-only manifest
├── generated/
│   └── code/                    # Standalone React app
│       ├── src/
│       │   ├── App.tsx          # Root component with routing
│       │   ├── main.tsx         # React entry point
│       │   ├── components/      # View components
│       │   ├── hooks/           # React Query hooks
│       │   └── types/           # TypeScript types
│       ├── index.html           # HTML entry point
│       ├── vite.config.ts       # Vite configuration
│       └── package.json         # Frontend dependencies
└── package.json                 # Workflow scripts
```

## 🛠️ Development Workflow

### 1. Modify Your UI

Edit `specs/main.specly` to define your views and models:

```yaml
models:
  Product:
    attributes:
      name: String required
      price: Decimal required

views:
  ProductListView:
    model: Product
    components:
      ProductGrid: {}
      ProductFilters: {}
```

### 2. Regenerate Code

```bash
npm run realize:all
```

### 3. Run Development Server

```bash
cd generated/code
npm run dev
```

The app will be available at `http://localhost:5173`

## 🌐 Connecting to Your API

### Environment Configuration

Create `.env` in `generated/code/`:

```env
# Required: Your backend API URL
VITE_API_BASE_URL=https://api.example.com

# Optional: API path prefix
VITE_API_PREFIX=/api
```

### Supported API Backends

This frontend can connect to:
- **SpecVerse Backend**: Generated with backend-only template
- **Existing REST APIs**: Any REST API with JSON responses
- **Third-Party APIs**: External services (with CORS configured)
- **Serverless Functions**: AWS Lambda, Vercel Functions, etc.

### API Client

The generated code uses React Query for data fetching:

```typescript
// Auto-generated hook
import { useProduct } from './hooks/useProduct';

function ProductDetail({ id }: { id: string }) {
  const { data, isLoading } = useProduct(id);
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{data.name}</div>;
}
```

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

### Build for Production

```bash
cd generated/code
npm run build
```

This creates an optimized build in `dist/`.

### Deployment Options

The generated frontend can be deployed to:

- **Vercel**: `vercel deploy`
- **Netlify**: Connect to git repository
- **AWS S3 + CloudFront**: Static site hosting
- **GitHub Pages**: Static site hosting
- **Docker**: Serve with nginx

### Environment Variables

Set these in your deployment platform:

```env
VITE_API_BASE_URL=https://your-production-api.com
```

## 🎨 Customization

### Styling

The generated app uses Tailwind CSS by default. Customize in:
- `generated/code/tailwind.config.js`
- `generated/code/src/index.css`

### Routing

Routes are auto-generated from views. Customize in:
- `generated/code/src/App.tsx`

### API Client

API configuration in:
- `generated/code/src/hooks/*` - Generated React Query hooks
- `generated/code/vite.config.ts` - Proxy configuration for development

## 📚 Documentation

### Generate UI Documentation

```bash
npm run generate:docs
npm run generate:diagrams
```

## 🎯 Use Cases

This frontend-only template is ideal for:

- **JAMstack Applications**: Static frontend + API backend
- **Micro-frontends**: Independent frontend deployment
- **Mobile Web Apps**: PWAs connecting to existing APIs
- **Prototyping**: Quick UI development against mock/existing APIs
- **Frontend-First Development**: Design UI before backend is ready

## 🔗 Example Configurations

### Connect to SpecVerse Backend

```env
# Local development
VITE_API_BASE_URL=http://localhost:3000

# Production
VITE_API_BASE_URL=https://api.yourapp.com
```

### Connect to Third-Party API

```env
# JSONPlaceholder (for testing)
VITE_API_BASE_URL=https://jsonplaceholder.typicode.com

# Your API
VITE_API_BASE_URL=https://api.stripe.com
```

## 📖 Learn More

- [SpecVerse Documentation](https://specverse.dev)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Query Documentation](https://tanstack.com/query)

---

Built with ❤️ using [SpecVerse](https://specverse.dev)
