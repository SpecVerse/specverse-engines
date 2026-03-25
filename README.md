# specverse-engines

Source of truth for all SpecVerse engine packages. 7 independent npm packages discovered at runtime via EngineRegistry.

## Packages

| Package | Purpose | Lines |
|---------|---------|-------|
| `@specverse/types` | AST types, engine interfaces, shared utilities | ~800 |
| `@specverse/engine-entities` | Entity modules (10 types), EngineRegistry, convention processors | ~10,000 |
| `@specverse/engine-parser` | YAML + Conventions parser, import resolution, schema validation | ~11,000 |
| `@specverse/engine-inference` | Rule engine, 4 core generators + auto-discovered extensions, Quint transpiler | ~13,000 |
| `@specverse/engine-realize` | Code generation, instance factories, asset shipping, tools generation | ~25,000 |
| `@specverse/engine-generators` | Diagrams (12 types), documentation, UML | ~13,000 |
| `@specverse/engine-ai` | Prompts, spec analysis, session management, template loading | ~2,000 |

## Entity Types (10)

**Core**: models, controllers, services, events, views, deployments
**Extensions**: commands, conventions, measures, promotions

Each entity module has 8 facets: schema, conventions, inference, generators, behaviour (Quint), behavioural conventions, docs, tests.

## Commands

```bash
npm run build    # Build all packages
npx vitest run   # Run all tests (1,070+)
```

## See Also

- `specverse-self/docs/GOLDEN-RULES.md` — 27 guiding principles
- `specverse-self/docs/guides/ADDING-AN-ENTITY-TYPE.md` — Entity creation guide
- `specverse-self/docs/guides/ADDING-AN-ENGINE.md` — Engine creation guide
