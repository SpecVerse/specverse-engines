# types/

All shared AI type definitions for the engine-ai package.

## What It Provides

Core types used across every layer of the AI engine:

**Input types:**
- `UserRequirements` -- User's specification request (requirements text, scale, framework, domain, compliance, technology preferences)
- `AICommandOptions` -- CLI/API options (pver, output, copy, config path)
- `AIOperation` -- Union: `'analyse' | 'create' | 'materialise' | 'realize' | 'infer'`
- `AIConfig` -- YAML config file format for `--config` option

**Pipeline types (progressive refinement):**
- `PromptTemplate` -- Raw template with name, version, system/user/context strings, variable names
- `FilledPrompt` -- Template after `{{variable}}` substitution with resolved variables map
- `EnhancedPrompt` -- Filled prompt enriched with library context, token estimate, cost estimate, and execution options

**Library types:**
- `LibrarySuggestion` -- Single library recommendation (type, name, description, rationale, expansion factor)
- `AILibraryContext` -- Collection of suggestions with total count and reasoning

**Execution types:**
- `ExecutionOption` -- Provider/model/cost for a single execution path
- `CostEstimate` -- Token count, cost-by-provider map, cheapest/fastest options

## Position in the AI Engine

This is the **type foundation**. Every other module (`commands/`, `core/`, `orchestrator/`, `providers/`, `session/`) imports from here. The types mirror the 4-action pipeline: `UserRequirements` -> `PromptTemplate` -> `FilledPrompt` -> `EnhancedPrompt`.

## Exports

```typescript
export type { UserRequirements, PromptTemplate, FilledPrompt, EnhancedPrompt }
export type { LibrarySuggestion, AILibraryContext }
export type { ExecutionOption, CostEstimate }
export type { AIOperation, AICommandOptions, AIConfig }
```
