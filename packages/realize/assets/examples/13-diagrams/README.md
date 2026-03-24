# SpecVerse Diagram Examples

This directory contains comprehensive examples demonstrating all 15 diagram types available in the SpecVerse Unified Diagram Generator.

## 📊 Available Examples

### Event Flow Diagrams (3 types)

| Example | Primary Diagram Types | Description |
|---------|----------------------|-------------|
| [11-01](11-01-event-flow-sequence-demo.specly) | `event-flow-sequence`, `event-flow-layered` | Sequential and layered event flow visualization |
| [11-02](11-02-event-flow-swimlane-demo.specly) | `event-flow-swimlane` | Parallel event processing with swimlane visualization |

### Architecture Diagrams (3 types)

| Example | Primary Diagram Types | Description |
|---------|----------------------|-------------|
| [11-03](11-03-mvc-architecture-demo.specly) | `mvc-architecture` | Complete MVC architecture with Views, Controllers, Services, Models |
| [11-04](11-04-service-architecture-demo.specly) | `service-architecture` | Service layer organization with event-driven dependencies |
| [11-05](11-05-component-dependencies-demo.specly) | `component-dependencies` | Component relationships and event-based communication |

### Lifecycle & State Diagrams (1 type)

| Example | Primary Diagram Types | Description |
|---------|----------------------|-------------|
| [11-06](11-06-lifecycle-demo.specly) | `lifecycle` | State machine lifecycles for Order, Product, Shipment models |

### Model Diagrams (4 types)

| Example | Primary Diagram Types | Description |
|---------|----------------------|-------------|
| [11-07](11-07-profiles-demo.specly) | `profile-attachment`, `model-inheritance`, `er-diagram` | Profile attachments, model inheritance, entity-relationships |

### Deployment & Manifest Diagrams (5 types)

| Example | Primary Diagram Types | Description |
|---------|----------------------|-------------|
| [11-08](11-08-deployment-demo.specly) | `deployment-topology`, `capability-flow`, `manifest-mapping`, `technology-stack`, `capability-bindings` | Complete deployment, capability, and manifest visualization - **generates all 15 diagram types!** |

## 🎯 Quick Start

### Generate a Specific Diagram

```bash
# Generate event flow sequence diagram
specverse gen diagram 11-01-event-flow-sequence-demo.specly -t event-flow-sequence -o output.mmd

# Generate MVC architecture diagram
specverse gen diagram 11-03-mvc-architecture-demo.specly -t mvc-architecture -o mvc.mmd

# Generate lifecycle state machines
specverse gen diagram 11-06-lifecycle-demo.specly -t lifecycle -o lifecycle.mmd
```

### Generate All Diagram Types

```bash
# Generate all possible diagrams from a specification
specverse gen diagram 11-01-event-flow-sequence-demo.specly -o ./output-dir/
```

## 📁 Directory Structure

```
11-diagrams/
├── README.md                                    # This file
├── 11-01-event-flow-sequence-demo.specly      # Event sequence + layered
├── 11-01-event-flow-sequence-demo.md          # Documentation
├── 11-02-event-flow-swimlane-demo.specly      # Event swimlane
├── 11-02-event-flow-swimlane-demo.md          # Documentation
├── 11-03-mvc-architecture-demo.specly          # MVC architecture
├── 11-03-mvc-architecture-demo.md              # Documentation
├── 11-04-service-architecture-demo.specly      # Service architecture
├── 11-04-service-architecture-demo.md          # Documentation
├── 11-05-component-dependencies-demo.specly    # Component dependencies
├── 11-05-component-dependencies-demo.md        # Documentation
├── 11-06-lifecycle-demo.specly                 # Lifecycle state machines
├── 11-06-lifecycle-demo.md                     # Documentation
├── 11-07-profiles-demo.specly                  # Profiles, inheritance, ER
├── 11-07-profiles-demo.md                      # Documentation
├── 11-08-deployment-demo.specly                # Deployment + manifests (ALL 15 TYPES!)
├── 11-08-deployment-demo.md                    # Documentation
└── generated-diagrams/                         # Full generated .mmd files (15 types)
    ├── README.md                               # Generated diagrams guide
    ├── 11-01-event-flow-layered.mmd
    ├── 11-01-event-flow-sequence.mmd
    ├── 11-02-event-flow-swimlane.mmd
    ├── 11-03-mvc-architecture.mmd
    ├── 11-04-service-architecture.mmd
    ├── 11-05-component-dependencies.mmd
    ├── 11-06-lifecycle.mmd
    ├── 11-07-er-diagram.mmd
    ├── 11-07-model-inheritance.mmd
    ├── 11-07-profile-attachment.mmd
    ├── 11-08-capability-bindings.mmd
    ├── 11-08-capability-flow.mmd
    ├── 11-08-deployment-topology.mmd
    ├── 11-08-manifest-mapping.mmd
    └── 11-08-technology-stack.mmd
```

## 📚 Documentation

Each example includes:

1. **`.specly` file**: The source SpecVerse specification
2. **`.md` file**: Comprehensive documentation with:
   - Overview and key features
   - Simplified Mermaid diagram (embedded)
   - Generation commands
   - Use cases and best practices
   - Troubleshooting tips

3. **`generated-diagrams/` directory**: Full, unmodified generated `.mmd` files for direct use

## 🎨 Available Diagram Types

The Unified Diagram Generator supports **ALL 15 diagram types** across 5 categories! 🎉

### 1. Event Flow (3 types) ✅
- `event-flow-layered` - 5-layer architecture with dual event bus ✅ Example: 11-01
- `event-flow-sequence` - Temporal event sequences ✅ Example: 11-01
- `event-flow-swimlane` - Parallel event flows ✅ Example: 11-02

### 2. Model Diagrams (4 types) ✅
- `er-diagram` - Entity-relationship diagram ✅ Example: 11-07
- `lifecycle` - State machine lifecycles ✅ Example: 11-06
- `profile-attachment` - Profile attachments to models ✅ Example: 11-07
- `model-inheritance` - Model inheritance hierarchy ✅ (requires models with `extends` property)

### 3. Architecture (3 types) ✅
- `mvc-architecture` - MVC architecture overview ✅ Example: 11-03
- `service-architecture` - Service layer architecture ✅ Example: 11-04
- `component-dependencies` - Component dependency graph ✅ Example: 11-05

### 4. Deployment (2 types) ✅
- `deployment-topology` - Deployment instance visualization ✅ Example: 11-08
- `capability-flow` - Capability provider/consumer flow ✅ Example: 11-08

### 5. Manifest (3 types) ✅
- `manifest-mapping` - Component → Manifest → Implementation ✅ Example: 11-08
- `technology-stack` - Technology stack by category ✅ Example: 11-08 **FIXED!**
- `capability-bindings` - Capability → Implementation bindings ✅ Example: 11-08 **FIXED!**

## 🚀 How to Access Diagrams

### CLI Usage

#### Basic Generation

```bash
# Generate a single diagram type
specverse gen diagram <file.specly> -t <type> -o <output.mmd>

# Examples
specverse gen diagram 11-01-event-flow-layered-demo.specly -t event-flow-layered -o output.mmd
specverse gen diagram 11-03-mvc-architecture-demo.specly -t mvc-architecture -o mvc.mmd
specverse gen diagram 11-06-lifecycle-demo.specly -t lifecycle -o lifecycle.mmd
```

#### Batch Generation

```bash
# Generate all compatible diagrams from a specification
specverse gen diagram 11-01-event-flow-layered-demo.specly

# This will generate:
# - event-flow-layered.mmd
# - event-flow-sequence.mmd
# - er-diagram.mmd
# - ... (all applicable types)
```

#### With Themes

```bash
# Use different themes
specverse gen diagram 11-01-event-flow-layered-demo.specly -t event-flow-sequence --theme dark
specverse gen diagram 11-03-mvc-architecture-demo.specly -t mvc-architecture --theme forest
```

### Programmatic API

The diagram generator is fully accessible via TypeScript/JavaScript API:

```typescript
import { UnifiedDiagramGenerator, EventFlowPlugin } from '@specverse/lang/diagram-engine';
import { SpecVerseParser } from '@specverse/lang';
import { readFileSync, writeFileSync } from 'fs';

// 1. Parse your specification
const schema = JSON.parse(
  readFileSync('node_modules/@specverse/lang/schema/SPECVERSE-SCHEMA.json', 'utf8')
);
const parser = new SpecVerseParser(schema);
const parseResult = parser.parseFile('11-01-event-flow-layered-demo.specly');

// 2. Create diagram generator with desired plugins
const generator = new UnifiedDiagramGenerator({
  plugins: [
    new EventFlowPlugin(),
    new ERDiagramPlugin(),
    new LifecyclePlugin(),
    new DeploymentPlugin(),
    new ManifestPlugin(),
    new ArchitecturePlugin()
  ],
  theme: 'default'
});

// 3. Generate specific diagram type
const mermaidCode = generator.generate(parseResult.ast, 'event-flow-layered', {
  title: 'Event Flow Architecture',
  direction: 'TD'  // Top-down layout
});

// 4. Save to file
writeFileSync('output.mmd', mermaidCode);
console.log('Diagram generated!');
```

#### Available Plugins and Diagram Types

```typescript
import {
  EventFlowPlugin,      // event-flow-layered, event-flow-sequence, event-flow-swimlane
  ERDiagramPlugin,      // er-diagram
  LifecyclePlugin,      // lifecycle
  DeploymentPlugin,     // deployment-topology, capability-flow
  ManifestPlugin,       // manifest-mapping, technology-stack, capability-bindings
  ArchitecturePlugin    // mvc-architecture, service-architecture, component-dependencies,
                        // profile-attachment, model-inheritance
} from '@specverse/lang/diagram-engine';
```

#### Batch Generation via API

```typescript
// Generate all compatible diagram types
const diagramTypes = [
  'event-flow-layered',
  'event-flow-sequence',
  'er-diagram',
  'lifecycle',
  'mvc-architecture',
  'deployment-topology'
];

for (const type of diagramTypes) {
  try {
    const diagram = generator.generate(parseResult.ast, type);
    writeFileSync(`output-${type}.mmd`, diagram);
    console.log(`✅ Generated ${type}`);
  } catch (error) {
    console.log(`⏭️  Skipped ${type}: ${error.message}`);
  }
}
```

#### Custom Options

```typescript
// Generate with custom options
const diagram = generator.generate(parseResult.ast, 'event-flow-layered', {
  title: 'Custom Event Flow',
  direction: 'LR',           // Left-to-right layout
  includeAttributes: true,   // Show model attributes
  includeBehaviors: true     // Show model behaviors
});
```

## 🔍 Viewing Diagrams

### 1. Mermaid Live Editor
Copy `.mmd` file contents to [mermaid.live](https://mermaid.live) for interactive viewing.

### 2. GitHub
Mermaid diagrams render automatically in GitHub markdown files.

### 3. VSCode
Install "Markdown Preview Mermaid Support" extension.

### 4. Export to Images
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagram.mmd -o diagram.png
```

## 💡 Tips

1. **Start with examples**: Copy and modify these examples for your needs
2. **Read the docs**: Each `.md` file has comprehensive documentation
3. **Use the right diagram**: Choose the diagram type that best fits your use case
4. **Combine diagrams**: Use multiple diagram types for complete documentation
5. **Full diagrams available**: Check `generated-diagrams/` for complete, unmodified outputs

## 🛠️ Validation

All examples are validated and tested:

```bash
# Validate a specification
specverse validate 11-01-event-flow-sequence-demo.specly

# Validate all examples
for file in 11-*.specly; do
  specverse validate $file
done
```

## 📖 Learn More

- **Main Documentation**: See project README for complete diagram generator documentation
- **CLI Help**: Run `specverse gen diagram --help` for all options
- **Schema Reference**: See `schema/SPECVERSE-SCHEMA.json` for specification format

---

**Status**: ✅ All 8 examples complete - **ALL 15 DIAGRAM TYPES WORKING!** 🎉
**Examples**: 8 comprehensive specifications
**Diagram Types**: 15/15 working (100% complete!)
**Generated Files**: 15 functional Mermaid diagrams
**Version**: SpecVerse v3.2.7
**Last Updated**: 2025-10-02

**Recent Fixes**:
- ✅ **profile-attachment** - Fixed to extract `profileAttachment` property from models
- ✅ **model-inheritance** - Fixed to extract `extends` property from models
- ✅ **technology-stack** - **FIXED!** Added manifest parsing to ConventionProcessor
- ✅ **capability-bindings** - **FIXED!** Added manifest parsing to ConventionProcessor
- ✅ **Parser Enhancement** - ConventionProcessor now extracts `manifests` section from specs alongside `components` and `deployments`
