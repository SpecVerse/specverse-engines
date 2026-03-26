# examples/

Usage examples demonstrating the AI engine API.

## What It Provides

**`basic-usage.ts`** -- A runnable example that demonstrates the complete 4-action prompt pipeline:

1. **Action 1**: Retrieve a raw template with `getTemplate('create')`
2. **Action 2**: Fill the template with user requirements via `fillTemplate()`
3. **Action 3**: Get library suggestions via `suggestLibraries()`
4. **Action 4**: Produce the enhanced prompt via `enhancePrompt()` with token estimates and per-provider cost breakdown

Also demonstrates a **workflow integration** example that runs the pipeline across multiple operations (analyse, create, materialise) for a healthcare system with HIPAA compliance.

## How to Run

```bash
# From the ai package root (after build)
node dist/examples/basic-usage.js
```

Or import as a module:

```typescript
import { demonstrateBasicUsage, demonstrateWorkflowIntegration } from '@specverse/ai/examples/basic-usage'
```

## Position in the AI Engine

This is the **documentation-by-example layer**. It shows how the commands, types, and providers fit together without requiring an LLM provider -- all four actions work offline to produce prompts that can be copied to any AI interface for free execution.
