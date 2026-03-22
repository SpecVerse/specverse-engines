# SpecVerse Unified Diagram Engine

A comprehensive, extensible diagram generation system for SpecVerse specifications.

## Overview

The Unified Diagram Engine provides a single source of truth for all diagram generation needs across the SpecVerse ecosystem. It uses a plugin architecture to support multiple diagram types while maintaining consistent quality and styling.

## Architecture

```
diagram-engine/
├── core/                    # Core infrastructure
│   ├── UnifiedDiagramGenerator.ts  # Main generator
│   ├── DiagramContext.ts          # Shared context
│   ├── StyleManager.ts            # Theme management
│   └── BaseDiagramPlugin.ts       # Plugin base class
├── plugins/                 # Diagram type plugins
│   ├── event-flow/         # Event flow diagrams
│   ├── er-diagram/         # ER diagrams
│   ├── deployment/         # Deployment diagrams
│   ├── lifecycle/          # State machines
│   ├── manifest/           # Manifest mappings
│   └── architecture/       # Architecture diagrams
├── renderers/              # Output renderers
│   ├── MermaidRenderer.ts  # Mermaid output
│   └── ...                 # Future: PlantUML, Graphviz
├── themes/                 # Theme definitions
└── types/                  # TypeScript types

```

## Quick Start

```typescript
import { UnifiedDiagramGenerator, EventFlowPlugin } from '@specverse/lang/diagram-engine';
import { SpecVerseParser } from '@specverse/lang';

// Create parser and parse specification
const parser = new SpecVerseParser(schema);
const result = parser.parseFile('my-spec.specly');

// Create generator with plugins
const generator = new UnifiedDiagramGenerator({
  plugins: [
    new EventFlowPlugin(),
    new ERDiagramPlugin(),
    new DeploymentPlugin()
  ],
  theme: 'default'
});

// Generate single diagram
const eventFlow = generator.generate(result.ast, 'event-flow-layered', {
  includeEvents: true,
  includeSubscribers: true
});

console.log(eventFlow);

// Generate all diagrams
const allDiagrams = generator.generateAll(result.ast);
for (const [type, diagram] of allDiagrams.entries()) {
  console.log(`=== ${type} ===`);
  console.log(diagram);
}
```

## Supported Diagram Types

### Event Flow Diagrams
- `event-flow-layered` - 5-layer architecture with dual event buses
- `event-flow-sequence` - Temporal workflow sequences
- `event-flow-swimlane` - Parallel flow visualization

### Model Diagrams
- `er-diagram` - Entity-relationship diagrams with intelligent deduplication
- `model-inheritance` - Model inheritance hierarchy
- `profile-attachment` - Profile attachment visualization
- `lifecycle` - State machine diagrams

#### ER Diagram Features

**Relationship Deduplication** (New!)

ER diagrams now automatically deduplicate bidirectional relationships, preventing duplicate lines:

- **hasMany/belongsTo pairs**: Shows only the `hasMany` side
- **hasOne/belongsTo pairs**: Shows only the `hasOne` side
- **manyToMany pairs**: Shows once using alphabetical ordering

```typescript
// Example: Department hasMany Employee + Employee belongsTo Department
// Result: Single line showing "Department ||--o{ Employee"
// (No duplicate "Employee }o--|| Department" line)

const diagram = generator.generate(ast, 'er-diagram', {
  includeAttributes: true,
  includeRelationships: true  // Uses deduplicated relationships
});
```

**Why This Matters:**
- ✅ Cleaner, more readable diagrams
- ✅ Follows UML best practices
- ✅ Prevents visual clutter in complex models
- ✅ Architectural-level deduplication (available to all plugins)

### Architecture Diagrams
- `mvc-architecture` - Model-View-Controller structure
- `service-architecture` - Service interactions
- `component-dependencies` - Component dependency graph

### Deployment Diagrams
- `deployment-topology` - Runtime instance topology
- `capability-flow` - Capability provider/consumer flows
- `environment-comparison` - Multi-environment comparison

### Manifest Diagrams
- `manifest-mapping` - Spec → Implementation mappings
- `technology-stack` - Technology stack visualization
- `capability-bindings` - Capability → Implementation bindings

## Themes

The diagram engine supports multiple built-in themes:

- `default` - Light theme with soft colors
- `dark-mode` - Dark theme for low-light environments
- `colorblind-safe` - Accessible color palette
- `presentation` - High-contrast for presentations

```typescript
// Use a theme
const diagram = generator.generate(ast, 'er-diagram', {
  theme: 'dark-mode'
});

// Register custom theme
generator.registerTheme({
  name: 'my-theme',
  colors: { model: '#custom', ... },
  shapes: { model: 'rounded', ... },
  layout: { rankDir: 'LR', ... }
});
```

## Plugin Development

Create custom diagram plugins by extending `BaseDiagramPlugin`:

```typescript
import { BaseDiagramPlugin, DiagramContext, MermaidDiagram } from '@specverse/lang/diagram-engine';

export class MyCustomPlugin extends BaseDiagramPlugin {
  name = 'my-custom-plugin';
  version = '1.0.0';
  description = 'My custom diagram type';
  supportedTypes = ['my-custom-diagram'];

  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    // Your diagram generation logic
    const diagram = this.createEmptyDiagram('graph', 'TD');

    // Add nodes, edges, subgraphs
    for (const model of context.getAllModels()) {
      diagram.nodes.push({
        id: model.name,
        label: model.name,
        type: 'model',
        color: context.theme.colors.model
      });
    }

    return diagram;
  }

  getDefaultOptions() {
    return {
      includeAttributes: true,
      includeRelationships: true
    };
  }
}

// Register and use
generator.registerPlugin(new MyCustomPlugin());
const diagram = generator.generate(ast, 'my-custom-diagram');
```

## CLI Integration

The diagram engine integrates with the SpecVerse CLI:

```bash
# Generate specific diagram
specverse gen diagram event-flow-layered my-spec.specly

# Generate all diagrams
specverse gen diagram all my-spec.specly --output diagrams/

# List available types
specverse gen diagram --list

# Use custom theme
specverse gen diagram er-diagram my-spec.specly --theme dark-mode
```

## API Reference

### UnifiedDiagramGenerator

```typescript
class UnifiedDiagramGenerator {
  constructor(config: DiagramGeneratorConfig);

  // Plugin management
  registerPlugin(plugin: DiagramPlugin): void;
  unregisterPlugin(type: DiagramType): boolean;
  getAvailableTypes(): DiagramType[];
  isTypeSupported(type: DiagramType): boolean;

  // Diagram generation
  generate(ast: SpecVerseAST, type: DiagramType, options?: DiagramOptions): string;
  generateAll(ast: SpecVerseAST, options?: DiagramOptions): Map<DiagramType, string>;
  generateForPlugin(ast: SpecVerseAST, pluginName: string, options?: DiagramOptions): Map<DiagramType, string>;

  // Validation
  validate(ast: SpecVerseAST, type: DiagramType): ValidationResult;

  // Metadata
  getMetadata(): Array<{ type: DiagramType; plugin: string; description: string }>;
  getOptionsForType(type: DiagramType): Partial<DiagramOptions> | undefined;

  // Theme management
  getAvailableThemes(): string[];
  registerTheme(theme: ThemeConfig): void;
  setDefaultTheme(theme: string | ThemeConfig): void;
}
```

### DiagramContext

```typescript
class DiagramContext {
  ast: SpecVerseAST;
  options: DiagramOptions;
  theme: ThemeConfig;

  // State collections
  nodes: Map<string, MermaidNode>;
  edges: MermaidEdge[];
  subgraphs: Map<string, Subgraph>;
  relations: MermaidRelation[];
  lifecycles: Map<string, MermaidLifecycle>;

  // Query methods
  getAllModels(): ModelSpec[];
  getModelByName(name: string): ModelSpec | undefined;
  getAllControllers(): ControllerSpec[];
  getAllServices(): ServiceSpec[];
  getAllEvents(): EventSpec[];
  getEventSubscribers(eventName: string): Array<...>;
  getEventPublishers(eventName: string): Array<...>;
  getCapabilityProviders(capability: string): any[];
  getCapabilityConsumers(capability: string): any[];

  // Relationship helpers
  getDeduplicatedRelationships(): Array<{
    from: string;
    to: string;
    relationship: RelationshipSpec;
    isCanonical: boolean;
  }>;  // Returns deduplicated bidirectional relationships

  // Utility
  clear(): void;
  clone(): DiagramContext;
}
```

## Development Status

### Phase 1: Core Infrastructure ✅ **COMPLETE**
- [x] Core types and interfaces
- [x] UnifiedDiagramGenerator
- [x] DiagramContext with helper methods
- [x] StyleManager with themes
- [x] MermaidRenderer with validation
- [x] BaseDiagramPlugin
- [x] Public API exports

### Phase 2: Existing Diagram Migration ✅ **COMPLETE**
- [x] ERDiagramPlugin ✅ **COMPLETE** - 3 diagram types, 30 tests passing
- [x] DeploymentPlugin ✅ **COMPLETE** - 2 diagram types, 41 tests passing
- [x] LifecyclePlugin ✅ **COMPLETE** - 1 diagram type, 18 tests passing
- Note: ArchitecturePlugin deferred to Phase 3 (can use existing UML generator)

### Phase 3: New Event Flow Diagrams ✅ **COMPLETE**
- [x] EventFlowPlugin ✅ **COMPLETE** - 3 diagram types (layered, sequence, swimlane), 44 tests passing (27 unit + 17 integration)

### Phase 4: New Manifest Diagrams ✅ **COMPLETE**
- [x] ManifestPlugin ✅ **COMPLETE** - 3 diagram types (manifest-mapping, technology-stack, capability-bindings), 62 tests passing (34 unit + 28 integration)

### Phase 5: Integration & Documentation (Planned)
- [ ] CLI integration
- [ ] VSCode extension integration
- [ ] App-engine integration
- [ ] MCP server integration

## Testing

```bash
# Run tests
npm test src/diagram-engine

# Run specific test suite
npm test src/diagram-engine/__tests__/core/

# Watch mode
npm test -- --watch src/diagram-engine
```

## Contributing

When adding new diagram types:

1. Create plugin in `plugins/` directory
2. Extend `BaseDiagramPlugin`
3. Implement `generate()` method
4. Add tests in `__tests__/`
5. Export from `index.ts`
6. Update documentation

## License

MIT - Part of the SpecVerse project

## Related Documentation

- [Diagram Generator Audit](../../../specverse-app-engine/docs/diagrams/DIAGRAM-GENERATOR-AUDIT.md)
- [Schema Interactions Analysis](../../../specverse-app-engine/docs/diagrams/schema-interactions-analysis.md)
- [SpecVerse Language Documentation](../../docs/)
