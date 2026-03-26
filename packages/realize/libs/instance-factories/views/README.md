# Views Factory

React component generation from spec views with adapter support and routing.

## Definition

| File | Description |
|------|-------------|
| `react-components.yaml` | React 18 components with TypeScript, hooks, forms, and routing |

## Generated Output

### Components (`react/`)

| Generator | Output | Purpose |
|-----------|--------|---------|
| `components-generator` | `frontend/src/components/{view}.tsx` | Direct React components from spec views (uses real model attributes) |
| `forms-generator` | `frontend/src/components/forms/{model}Form.tsx` | Form components with react-hook-form and Zod validation |
| `hooks-generator` | `frontend/src/hooks/use{model}.ts` | Custom hooks for data fetching and mutations |
| `types-generator` | `frontend/src/types/{model}.ts` | TypeScript interfaces from spec models |
| `app-generator` | `frontend/src/App.tsx` | Root component with React Query and Router setup |
| `router-generator` | `frontend/src/router.tsx` | React Router v6 routes from spec views |
| `router-generic-generator` | (alternative router) | Generic routing variant |
| `main-tsx-generator` | `frontend/src/main.tsx` | React DOM render entry |
| `vite-config-generator` | `frontend/vite.config.ts` | Vite bundler configuration |
| `index-html-generator` | `frontend/index.html` | HTML shell |
| `index-css-generator` | `frontend/src/index.css` | Base styles |
| `frontend-package-json-generator` | `frontend/package.json` | Frontend dependencies |
| `spec-json-generator` | (spec metadata) | Serialized spec for frontend consumption |
| `views-metadata-generator` | (view metadata) | View definitions for runtime rendering |

### Adapters (`react/adapters/`)

| Adapter | UI Library |
|---------|-----------|
| `shadcn-adapter` | shadcn/ui |
| `mui-adapter` | Material UI |
| `antd-adapter` | Ant Design |

### Shared Infrastructure (`shared/`)

- `base-generator` — Abstract base class for all component generators
- `adapter-types` — TypeScript types for UI library adapters
- `property-mapper` — Maps spec properties to component props
- `syntax-mapper` — Maps spec syntax to framework-specific JSX
- `atomic-components-registry` — Registry of atomic UI components
- `component-metadata` — Component metadata extraction
- `composite-patterns` — Composite pattern support (master-detail, wizard, etc.)
- `pattern-validator` — Validates view patterns against spec

### Runtime (`runtime/`)

- `runtime-view-renderer` — Dynamic view renderer from spec metadata

## Technology

- **Framework**: React ^18.2.0 with TypeScript
- **Routing**: React Router ^6.18.0
- **Data**: TanStack React Query ^5.0.0
- **Forms**: react-hook-form ^7.48.0 + Zod ^3.22.0
- **Bundler**: Vite ^5.0.0
- **Styling**: Tailwind CSS (BEM class naming)
