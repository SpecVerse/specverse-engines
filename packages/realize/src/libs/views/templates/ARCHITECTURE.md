# View Templates Architecture

**Purpose**: Transform inferred SpecVerse view specifications into framework-specific UI code.

## Directory Structure

```
templates/
├── shared/                              # Framework-agnostic (universal)
│   ├── atomic-components-registry.ts    # All 49 atomic component type definitions
│   └── adapter-types.ts                 # ComponentLibraryAdapter interface
│
├── react/                               # React framework
│   ├── components-generator.ts          # Legacy generator (v1)
│   ├── components-generator-v2.ts       # NEW: Uses adapters + atomic components
│   ├── forms-generator.ts
│   ├── hooks-generator.ts
│   ├── types-generator.ts
│   └── adapters/                        # React UI library adapters
│       ├── shadcn-adapter.ts            # shadcn/ui components
│       ├── mui-adapter.ts               # Material-UI components
│       └── antd-adapter.ts              # Ant Design components
│
├── vue/                                 # Vue framework (FUTURE)
│   ├── components-generator.ts
│   └── adapters/
│       ├── vuetify-adapter.ts
│       ├── element-plus-adapter.ts
│       └── primevue-adapter.ts
│
├── angular/                             # Angular framework (FUTURE)
│   ├── components-generator.ts
│   └── adapters/
│       ├── angular-material-adapter.ts
│       └── primeng-adapter.ts
│
└── svelte/                              # Svelte framework (FUTURE)
    ├── components-generator.ts
    └── adapters/
        └── svelteui-adapter.ts
```

## Architecture Principles

### 1. Framework-Agnostic Core

**`shared/atomic-components-registry.ts`**
- Defines all 49 atomic component types from SpecVerse v3.4.0 schema
- Each component has: type, name, category, description, properties, canHaveChildren
- **Universal** - same definitions used across React, Vue, Angular, Svelte

**`shared/adapter-types.ts`**
- Defines `ComponentLibraryAdapter` interface
- Defines `ComponentMapping` interface
- Defines `RenderContext` interface
- **Universal** - any framework can implement these interfaces

### 2. Framework-Specific Generators

Each framework has its own generator that:
- Reads inferred SpecVerse views (with `uiComponents`)
- Selects appropriate adapter based on config
- Generates framework-specific code using adapter

**Example: React**
- `react/components-generator-v2.ts` generates `.tsx` files
- Uses React hooks, JSX syntax, React patterns
- Imports from `@/components/ui` (shadcn), `@mui/material` (MUI), or `antd`

**Future: Vue**
- `vue/components-generator.ts` generates `.vue` files
- Uses Vue Composition API, Vue template syntax
- Imports from Vuetify, Element Plus, or PrimeVue

### 3. UI Library Adapters

Each adapter implements `ComponentLibraryAdapter` interface and maps all 49 atomic types to specific library components.

**React + shadcn/ui** (`react/adapters/shadcn-adapter.ts`):
```typescript
table: {
  imports: ["import { Table, TableBody, ... } from '@/components/ui/table'"],
  render: (ctx) => `<Table>...</Table>`
}
```

**React + Material-UI** (`react/adapters/mui-adapter.ts`):
```typescript
table: {
  imports: ["import { Table, TableBody, ... } from '@mui/material'"],
  render: (ctx) => `<Table>...</Table>`
}
```

**Vue + Vuetify** (`vue/adapters/vuetify-adapter.ts`):
```typescript
table: {
  imports: ["import { VDataTable } from 'vuetify/components'"],
  render: (ctx) => `<v-data-table>...</v-data-table>`
}
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INFERRED SPEC (from inference engine)                       │
│    views:                                                       │
│      TaskListView:                                              │
│        type: list                                               │
│        uiComponents:                                            │
│          taskTable: { type: table, columns: [...] }            │
├─────────────────────────────────────────────────────────────────┤
│ 2. ATOMIC REGISTRY (framework-agnostic)                        │
│    ATOMIC_COMPONENTS_REGISTRY['table']:                        │
│      - type: 'table'                                            │
│      - category: 'data-display'                                 │
│      - properties: ['columns', 'sortable', ...]                │
├─────────────────────────────────────────────────────────────────┤
│ 3. GENERATOR (framework-specific)                              │
│    react/components-generator-v2.ts:                           │
│      - Reads uiComponents                                       │
│      - Selects adapter (shadcn/mui/antd)                       │
│      - Calls adapter.components['table'].render()              │
├─────────────────────────────────────────────────────────────────┤
│ 4. ADAPTER (library-specific)                                  │
│    react/adapters/shadcn-adapter.ts:                           │
│      - Returns: <Table><TableBody>...</TableBody></Table>      │
│      - With proper imports, props, styling                      │
├─────────────────────────────────────────────────────────────────┤
│ 5. GENERATED CODE (framework + library code)                   │
│    frontend/src/components/TaskListView.tsx                    │
│    - import { Table } from '@/components/ui/table'             │
│    - React component using shadcn/ui Table                     │
└─────────────────────────────────────────────────────────────────┘
```

## Why This Architecture?

### ✅ Framework Agnostic
- Atomic registry is universal
- Support React, Vue, Angular, Svelte from same specs
- Add new frameworks by implementing generator + adapters

### ✅ UI Library Agnostic
- Each framework supports multiple UI libraries
- React: shadcn, MUI, Ant Design, Chakra UI, etc.
- Vue: Vuetify, Element Plus, PrimeVue, etc.
- Users choose their preferred library

### ✅ Maintainable
- Change atomic component definition in ONE place (shared registry)
- Update adapter for library changes (e.g., shadcn/ui v2 → v3)
- No duplication across frameworks

### ✅ Extensible
- Add new atomic component type → update registry + all adapters
- Add new UI library → create new adapter
- Add new framework → create generator + adapters

## Current Status (Phase 3.5.1)

**✅ Complete**:
- `shared/atomic-components-registry.ts` - All 49 types defined
- `shared/adapter-types.ts` - Adapter interfaces
- `react/adapters/shadcn-adapter.ts` - Complete React + shadcn/ui adapter

**⏳ In Progress**:
- `react/adapters/mui-adapter.ts` - React + Material-UI
- `react/adapters/antd-adapter.ts` - React + Ant Design
- `react/components-generator-v2.ts` - Generator using adapters

**📅 Future**:
- Vue framework support
- Angular framework support
- Svelte framework support
- Additional UI libraries for each framework

## Configuration Example

Users specify framework and library in manifest:

```yaml
# manifests/implementation.yaml
instanceFactories:
  - name: "ReactShadcnUI"
    source: "@specverse/lang/libs/instance-factories/views/react-components.yaml"
    config:
      framework: "react"      # Could be: react, vue, angular, svelte
      uiLibrary: "shadcn/ui"  # Could be: shadcn/ui, mui, antd (for React)
```

Generator loads appropriate adapter and generates framework+library-specific code.

---

**Last Updated**: 2025-11-05
**Part of**: v3.4.0 Phase 3.5 - Instance Factories for View Components
