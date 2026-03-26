# @specverse/engine-generators

Generate diagrams, documentation, and UML from SpecVerse specifications.

## Purpose

The generators engine produces visual and textual documentation from parsed ASTs. It includes a plugin-based diagram engine that renders Mermaid diagrams (ER, class, event flow, lifecycle, deployment, architecture, manifest), a UML generator, a documentation generator, and an AI view optimizer. Entity modules can register their own diagram plugins, so new entity types automatically contribute diagram types.

## Installation

```bash
npm install @specverse/engine-generators
```

## Dependencies

| Package | Why |
|---------|-----|
| @specverse/types | Shared type definitions (SpecVerseEngine, EngineInfo, etc.) |
| @specverse/engine-entities | Entity registry for auto-discovering diagram plugins |
| @specverse/engine-parser | Parsed AST structures used as generator input |

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `UnifiedDiagramGenerator` | class | Plugin-based diagram generator supporting all diagram types |
| `createPluginsFromRegistry` | function | Creates diagram plugins from entity module declarations |
| `createAllPlugins` | function | Creates all available diagram plugins |
| `AIViewGenerator` | class | Optimizes specs into AI-friendly view structures |
| `UMLGenerator` | class | Generates UML diagrams from specs |
| `DocumentationGenerator` | class | Generates Markdown documentation from specs |
| `BaseDiagramPlugin` | class | Base class for implementing custom diagram plugins |
| `DiagramContext` | class | Shared context passed to diagram plugins during rendering |
| `StyleManager` | class | Manages themes and visual styles for diagrams |
| `MermaidRenderer` | class | Renders diagram models to Mermaid syntax |
| `ERDiagramPlugin` | class | Entity-relationship diagram plugin |
| `ClassDiagramPlugin` | class | Class diagram plugin |
| `EventFlowPlugin` | class | Event flow diagram plugin |
| `LifecyclePlugin` | class | State machine lifecycle diagram plugin |
| `DeploymentPlugin` | class | Deployment topology diagram plugin |
| `ArchitecturePlugin` | class | System architecture diagram plugin |
| `ManifestPlugin` | class | Manifest dependency diagram plugin |
| `engine` | instance | Pre-configured engine adapter for EngineRegistry discovery |

## Usage

```typescript
import { UnifiedDiagramGenerator, createPluginsFromRegistry } from '@specverse/engine-generators';

const generator = new UnifiedDiagramGenerator({
  plugins: createPluginsFromRegistry(),
  theme: 'default',
});

// Generate a single diagram type
const erDiagram = generator.generate(ast, 'er');

// Generate all registered diagram types
const allDiagrams = generator.generateAll(ast); // Map<string, string>
```

## Architecture

```
src/
├── ai-view-generator.ts        # AI-optimized spec view transformation
├── UML-generator.ts             # UML diagram generation
├── documentation-generator.ts   # Markdown documentation generation
└── diagram-engine/              # Plugin-based diagram system
    ├── core/
    │   ├── UnifiedDiagramGenerator.ts  # Orchestrator
    │   ├── BaseDiagramPlugin.ts        # Plugin base class
    │   ├── DiagramContext.ts           # Shared rendering context
    │   └── StyleManager.ts            # Theme management
    ├── plugins/                        # Built-in diagram plugins
    │   ├── er-diagram/
    │   ├── class-diagram/
    │   ├── event-flow/
    │   ├── lifecycle/
    │   ├── architecture/
    │   ├── deployment/
    │   └── manifest/
    ├── renderers/
    │   └── MermaidRenderer.ts         # Mermaid syntax output
    └── types/
        └── index.ts                   # Diagram type definitions
```

## Extension

To add a new diagram type:

1. Create a plugin class extending `BaseDiagramPlugin` in `plugins/your-type/`
2. Register the plugin type in the `PLUGIN_FACTORIES` map in `diagram-engine/index.ts`
3. Add diagram type declarations in your entity module so `createPluginsFromRegistry()` picks them up

Entity modules declare diagram support via `getEntityRegistry().getAllDiagramPlugins()`, allowing new entity types to contribute diagram plugins without modifying this package.

## See Also

- [@specverse/types](../types/) -- shared type definitions
- [@specverse/engine-entities](../entities/) -- entity modules that declare diagram plugins
- [@specverse/engine-realize](../realize/) -- uses generators for AI view optimization during code generation
