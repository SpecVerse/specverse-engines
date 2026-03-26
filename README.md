# specverse-engines

Source of truth for all SpecVerse engine packages. 7 independent npm packages published to the `@specverse` scope, discovered at runtime via EngineRegistry.

**Version**: 4.0.0 | **Published**: 26 March 2026

## Packages

| Package | npm | Purpose |
|---------|-----|---------|
| [`@specverse/types`](packages/types/) | [![npm](https://img.shields.io/npm/v/@specverse/types)](https://www.npmjs.com/package/@specverse/types) | AST types, engine interfaces, shared utilities |
| [`@specverse/engine-entities`](packages/entities/) | [![npm](https://img.shields.io/npm/v/@specverse/engine-entities)](https://www.npmjs.com/package/@specverse/engine-entities) | Entity modules (10 types, 9 facets), EngineRegistry, compose scripts |
| [`@specverse/engine-parser`](packages/parser/) | [![npm](https://img.shields.io/npm/v/@specverse/engine-parser)](https://www.npmjs.com/package/@specverse/engine-parser) | YAML + Conventions parser, import resolution, schema validation |
| [`@specverse/engine-inference`](packages/inference/) | [![npm](https://img.shields.io/npm/v/@specverse/engine-inference)](https://www.npmjs.com/package/@specverse/engine-inference) | Rule engine, architecture generation, Quint transpiler |
| [`@specverse/engine-realize`](packages/realize/) | [![npm](https://img.shields.io/npm/v/@specverse/engine-realize)](https://www.npmjs.com/package/@specverse/engine-realize) | Code generation via instance factories and manifests |
| [`@specverse/engine-generators`](packages/generators/) | [![npm](https://img.shields.io/npm/v/@specverse/engine-generators)](https://www.npmjs.com/package/@specverse/engine-generators) | Diagrams (12+ Mermaid types), documentation, UML |
| [`@specverse/engine-ai`](packages/ai/) | [![npm](https://img.shields.io/npm/v/@specverse/engine-ai)](https://www.npmjs.com/package/@specverse/engine-ai) | AI prompts, LLM providers, orchestration, session management |

## Pipeline

```
.specly file
    |
    v
[engine-parser] -----> SpecVerseAST
    |                       |
    | (convention           |
    |  processors from      v
    |  engine-entities) [engine-inference] ---> Full Architecture
    |                       |                   (controllers, services,
    |                       |                    events, views, deployments)
    |                       v
    |               [engine-realize] ---------> Generated Code
    |                   |                       (Fastify, Prisma, React,
    |                   |                        CLI, VSCode, MCP)
    |                   v
    |           [engine-generators] ----------> Diagrams, Docs, UML
    |
    v
[engine-ai] ---------------------------------> Prompts, Suggestions,
                                                LLM Execution, Workflows
```

## Entity Types (10)

**Core** (6): models, controllers, services, events, views, deployments

**Extensions** (4): commands, conventions, measures, promotions

Each entity module has **9 facets**: schema, conventions, inference, generators, behaviour (Quint), behavioural conventions, docs, tests, examples.

## Quick Start

```bash
npm install @specverse/engine-parser @specverse/engine-inference @specverse/engine-realize
```

```typescript
import { UnifiedSpecVerseParser } from '@specverse/engine-parser';
import { ComprehensiveInferenceEngine } from '@specverse/engine-inference';

const parser = new UnifiedSpecVerseParser(schema);
const result = parser.parse(specContent, 'specly');
const inferred = inferenceEngine.infer(result.ast);
```

## Development

```bash
git clone https://github.com/SpecVerse/specverse-engines.git
cd specverse-engines
npm install
npm run build    # Build all 7 packages
npx vitest run   # Run all tests
```

## Guides

- [Adding an Entity Type](https://github.com/SpecVerse/specverse-self/blob/main/docs/guides/ADDING-AN-ENTITY-TYPE.md) — 11-step guide
- [Adding an Engine](https://github.com/SpecVerse/specverse-self/blob/main/docs/guides/ADDING-AN-ENGINE.md) — Engine creation guide
- [Architecture Guide](https://github.com/SpecVerse/specverse-self/blob/main/docs/guides/ARCHITECTURE-GUIDE.md) — Full system architecture
- [Golden Rules](https://github.com/SpecVerse/specverse-self/blob/main/docs/GOLDEN-RULES.md) — 27 guiding principles

## License

MIT
