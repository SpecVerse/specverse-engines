# orchestrator/

Multi-step workflow coordination with interactive approval gates.

## What It Provides

**`SpecVerseOrchestrator`** -- Central coordinator for AI-powered specification workflows. Key capabilities:

- **`execute(context)`** -- Run a single AI operation (analyse, create, infer, materialise, realize) with automatic prompt enhancement, provider selection, and post-processing (YAML extraction, validation).
- **Convenience methods** -- `analyse(path)`, `create(requirements)`, `infer(specPath)`, `materialise(specPath, framework)`, `realize(specPath, framework)`.
- **`executeWorkflow(definition)`** -- Run multi-step `WorkflowDefinition` with step chaining (previous output feeds next input), conditional execution, error handling (stop/continue/retry), and timing metadata.
- **`estimateCost(operation, requirements)`** -- Pre-flight cost estimation per provider for single or multi-step workflows.
- **Provider management** -- Loads from `ConfigLoader`, supports runtime provider switching via `switchProvider(name)`.

**`InteractiveWorkflow`** -- Manages the interactive (copy-paste) AI workflow:

- `executeWithCollection(options)` -- Displays formatted prompt, then collects response via direct stdin input or file watching with configurable timeout.
- `resumeSession(sessionId)` -- Resumes a previously created interactive session.
- Session persistence to `.specverse/sessions/` and `.specverse/responses/`.

**`runInteractiveWorkflow(prompt, interface, options)`** -- CLI helper that creates an `InteractiveProvider` and runs a single prompt through the interactive workflow.

## Position in the AI Engine

This is the **execution coordination layer**. It consumes commands (prompt pipeline), providers (LLM execution), and config (provider setup) to run complete AI workflows from requirements to generated output.

## Exports

```typescript
export { SpecVerseOrchestrator, InteractiveWorkflow }
```
