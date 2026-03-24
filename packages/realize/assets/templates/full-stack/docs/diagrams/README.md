# Generated Diagrams

This directory contains auto-generated Mermaid diagrams from your SpecVerse specification.

## Diagram Types

### Entity-Relationship (er-diagram)
Shows models, attributes, and relationships.

**Generate**: `npm run generate:diagram:er`
**Best For**: Understanding data structure

### Event-Flow-Layered (event-flow-layered)
Shows event-driven architecture with topological sorting.

**Generate**: `npm run generate:diagram:event-flow`
**Best For**: Understanding event flow and component dependencies
**Features**:
- Dynamic layer assignment based on dependency depth
- Topological sorting for proper component ordering
- Color-coded domain vs application events
- Simplified labels showing event counts (↑ publishes, ↓ subscribes)

### Lifecycle (lifecycle)
Shows state machine transitions for model lifecycles.

**Generate**: `npm run generate:diagram:lifecycle`
**Best For**: Understanding state transitions

### Deployment (deployment-topology)
Shows deployment instances and capability mappings.

**Generate**: `npm run generate:diagram:deployment`
**Best For**: Understanding deployment architecture

### Model Architecture (model-architecture)
Shows component relationships and dependencies.

**Generate**: `npm run generate:diagram:architecture`
**Best For**: High-level system overview

## Viewing Diagrams

Mermaid diagrams can be viewed in:
- **GitHub**: Automatically rendered in .md files
- **VSCode**: Use Markdown Preview Mermaid Support extension
- **Mermaid Live Editor**: https://mermaid.live/
- **Documentation Sites**: Most support Mermaid rendering

## Programmatic Generation

```typescript
import { UnifiedDiagramGenerator, EventFlowPlugin } from '@specverse/lang/diagram-engine';
import { SpecVerseParser } from '@specverse/lang';
import { readFileSync, writeFileSync } from 'fs';

// 1. Parse your specification
const schema = JSON.parse(
  readFileSync('node_modules/@specverse/lang/schema/SPECVERSE-SCHEMA.json', 'utf8')
);
const parser = new SpecVerseParser(schema);
const parseResult = parser.parseFile('specs/main.specly');

// 2. Create diagram generator with desired plugins
const generator = new UnifiedDiagramGenerator({
  plugins: [
    new EventFlowPlugin(),
    new ERDiagramPlugin(),
    new LifecyclePlugin(),
    new DeploymentPlugin()
  ],
  theme: 'default'
});

// 3. Generate specific diagram type
const mermaidCode = generator.generate(parseResult.ast, 'event-flow-layered', {
  title: 'Event Flow Architecture',
  direction: 'TD'
});

// 4. Save to file
writeFileSync('docs/diagrams/event-flow-layered.mmd', mermaidCode);
```

See [example 11-diagrams documentation](https://github.com/SpecVerse/specverse-lang/tree/main/examples/11-diagrams) for complete API reference and more examples
