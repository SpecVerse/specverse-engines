# core/

3-tier prompt generation for the SpecVerse AI ecosystem.

## What It Provides

**`EcosystemPromptManager`** -- Generates AI prompts tailored to three usage tiers:

- **`generateTerminalPrompt(request, context)`** -- Produces a `TerminalPrompt` optimized for copy-paste into ChatGPT/Claude/Gemini web interfaces. Includes system prompt, library context, example usage with import syntax, copy instructions, and token estimate.

- **`generateClaudePrompt(request, claudeContext)`** -- Produces a `ClaudePrompt` for Claude Code integration with CLAUDE.md instructions, session-aware prompts, file context injection, workflow commands, and library awareness.

- **`generateAPIPrompt(workflowDef, apiContext)`** -- Produces an `APIPrompt` for programmatic orchestrator workflows with structured pipeline instructions, context injection, response handling, and validation criteria.

**`LibraryContextGenerator`** -- Scores and selects relevant SpecVerse ecosystem libraries from `libs/catalog.yaml` based on project context (scale, domain, compliance, technology preferences). Used by both the prompt manager and the `suggestLibraries` command.

## Position in the AI Engine

This is the **prompt intelligence layer**. It sits between configuration/analysis and the commands pipeline. `LibraryContextGenerator` feeds into `suggestLibraries`, while `EcosystemPromptManager` provides the three-tier prompt strategy that the orchestrator dispatches to.

## Exports

```typescript
export { EcosystemPromptManager, LibraryContextGenerator }
export type { EcosystemType, ProjectContext, ClaudeContext, APIContext }
export type { LibraryContext, LibraryGroup, TerminalPrompt, ClaudePrompt, APIPrompt }
```
