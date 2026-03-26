# Views Entity Module

The UI layer entity type in SpecVerse. Views define user interface specifications with types, models, subscriptions, UI components, layouts, and properties.

## Facets

| Facet | Path | Description |
|-------|------|-------------|
| Schema | `schema/views.schema.json` | JSON Schema for validating view definitions in .specly files |
| Conventions (structural) | `conventions/view-processor.ts` | Expands shorthand into full view definitions |
| Conventions (behavioural) | `behaviour/conventions/grammar.yaml` | Behavioural convention grammar |
| Inference | `inference/index.ts` | Entry point for view inference rules |
| Inference rules | `inference/v3.1-view-rules.json` | Model-to-view generation rules |
| Inference rules | `inference/v3.4-specialist-view-rules.json` | Specialist view type expansion rules |
| Inference rules | `inference/v3.4-specialist-views.json` | Specialist view definitions |
| Inference rules | `inference/v3.4-view-component-inference.json` | Automatic UI component inference |
| Inference data | `inference/v3.4-component-mappings.json` | Component type mappings |
| Behaviour | `behaviour/rules.qnt` | Quint behavioural rules |
| Behaviour | `behaviour/invariants.qnt` | Quint invariants |
| Generators | `generators/index.ts` | Code generator instance factory references |
| Docs | `docs/index.ts` | Documentation references |
| Tests | `tests/index.ts` | Test references |

## Schema Properties

Each view definition supports:

- **description** - Human-readable description
- **type** - View type: page, list, detail, form, dashboard, modal, dialog, drawer, wizard, split (or custom camelCase)
- **model** - Primary model reference (single or array)
- **tags** - Tags for categorization
- **export** - Whether the view is exported for reuse
- **layout** - Standard or custom layout configuration
- **subscribes_to** - Event subscriptions for reactive updates
- **uiComponents** - Named UI components within the view (tables, forms, buttons, etc.)
- **properties** - View-level feature flags and configuration

## Examples

6 examples in `examples/`:

- `all-specialist-types` - All specialist view types demonstrated
- `automatic-crud-views` - Auto-generated CRUD views from models
- `explicit-override` - Overriding inferred view defaults
- `specialist-dashboard` - Dashboard specialist view
- `test-view-generation` - View generation test case
- `views-and-components` - Views with UI component definitions

## Dependencies

Depends on: `models`, `controllers`

## See Also

- [Entity Module Guide](../../../../../../specverse-self/docs/guides/ADDING-AN-ENTITY-TYPE.md)
