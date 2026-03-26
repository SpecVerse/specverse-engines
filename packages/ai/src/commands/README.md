# commands/

The 4-action prompt pipeline and spec analysis for the AI engine.

## What It Provides

The commands module implements a hierarchical pipeline where each action builds on the previous:

1. **`getTemplate(operation, options)`** -- Loads a raw YAML prompt template for an AI operation (analyse, create, materialise, realize, infer). Resolves versioned prompt files and injects schema paths.

2. **`fillTemplate(operation, requirements, options)`** -- Fills a template with user requirements via `{{variable}}` substitution. Handles operation-specific variables (e.g. directory structure for `analyse`, spec file paths for `materialise`/`realize`).

3. **`suggestLibraries(requirements, options)`** -- Generates library recommendations (deployment, domain, manifest, types) by scoring SpecVerse ecosystem libraries against project context using `LibraryContextGenerator`.

4. **`enhancePrompt(operation, requirements, options)`** -- The most valuable action. Combines filled template + library suggestions + token estimates + cost calculations into an `EnhancedPrompt` with per-provider execution options.

5. **`analyseSpec(ast)`** -- Static analysis of a parsed SpecVerse AST. Inspects models, controllers, services, events, views, and relationships to produce actionable `Suggestion[]` items (missing timestamps, orphan relationships, lifecycle gaps, etc.).

## Position in the AI Engine

This is the **prompt construction layer**. It sits between raw templates on disk and the execution layer (providers/orchestrator). The orchestrator calls `enhancePrompt()` before sending prompts to any LLM provider.

## Exports (via index.ts)

```typescript
export { getTemplate, fillTemplate, suggestLibraries, enhancePrompt, analyseSpec, Suggestion }
```
