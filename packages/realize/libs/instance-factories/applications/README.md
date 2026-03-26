# Applications Factory

Full application scaffolding for backend and frontend entry points.

## Definitions

| File | Description |
|------|-------------|
| `generic-app.yaml` | Backend entry point — adapts to framework choice (defaults to Fastify) |
| `react-app.yaml` | Complete React SPA with Vite, React Router, and TanStack Query |

## Generated Output

### Generic Backend (`generic/`)

| Generator | Output | Purpose |
|-----------|--------|---------|
| `main-generator` | `backend/src/main.ts` | Application entry point (detects framework from manifest) |
| `backend-package-json-generator` | `backend/package.json` | Backend dependencies and scripts |
| `backend-tsconfig-generator` | `backend/tsconfig.json` | TypeScript configuration |
| `backend-env-generator` | `backend/.env` | Environment variables |

### React Frontend (`react/`)

| Generator | Output | Purpose |
|-----------|--------|---------|
| `app-tsx-generator` | `frontend/src/App.tsx` | Root component with sidebar navigation grouped by model |
| `main-tsx-generator` | `frontend/src/main.tsx` | React DOM render entry |
| `vite-config-generator` | `frontend/vite.config.ts` | Vite bundler config with API proxy |
| `package-json-generator` | `frontend/package.json` | Frontend dependencies |
| `tsconfig-generator` | `frontend/tsconfig.json` | TypeScript config |
| `index-html-generator` | `frontend/index.html` | HTML shell |
| `index-css-generator` | `frontend/src/index.css` | Base styles |
| `api-client-generator` | `frontend/src/lib/apiClient.ts` | HTTP client for backend API |
| `api-types-generator` | `frontend/src/types/api.ts` | TypeScript types from spec models |
| `use-api-hooks-generator` | `frontend/src/hooks/useApi.ts` | React Query data-fetching hooks |
| `view-list-generator` | `frontend/src/components/views/ListView.tsx` | List view component |
| `view-detail-generator` | `frontend/src/components/views/DetailView.tsx` | Detail view component |
| `view-form-generator` | `frontend/src/components/views/FormView.tsx` | Form view component |
| `view-dashboard-generator` | `frontend/src/components/views/DashboardView.tsx` | Dashboard view component |
| `view-router-generator` | `frontend/src/components/views/StandardViewRouter.tsx` | View routing |
| `pattern-adapter-generator` | `frontend/src/lib/react-pattern-adapter.tsx` | Pattern adapter for dynamic rendering |
| `tailwind-adapter-wrapper-generator` | `frontend/src/lib/tailwind-adapter-generator.ts` | Tailwind CSS adapter |
| `field-helpers-generator` | `frontend/src/utils/field-helpers.ts` | Form field utilities |
| `relationship-field-generator` | `frontend/src/components/fields/RelationshipField.tsx` | Relationship field component |

## Technology

- **Backend**: Node.js, TypeScript, Fastify (default)
- **Frontend**: React 18, Vite 5, React Router 6, TanStack Query 5
- **Structure**: Monorepo (`backend/` + `frontend/`)
