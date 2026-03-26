# @specverse/engine-ai

AI engine for SpecVerse — prompt building, spec analysis, LLM provider abstraction, multi-step orchestration, and session management.

## Purpose

The AI engine powers all AI-related functionality in SpecVerse. It builds library-aware prompts from versioned templates, analyses specifications to suggest improvements, abstracts multiple LLM providers behind a unified interface, coordinates multi-step AI workflows through an orchestrator, and manages persistent Claude Code sessions with schema caching. It sits at the top of the pipeline, consuming parsed ASTs and producing prompts, suggestions, and AI-driven generation results.

## Installation

```bash
npm install @specverse/engine-ai
```

## Dependencies

| Package | Why |
|---------|-----|
| @specverse/types | Shared types — `SpecVerseEngine`, `EngineInfo`, and core interfaces |
| js-yaml | Parse `.specverse.yml` configuration and YAML prompt templates |

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `engine` | `SpecVerseAIEngine` | Singleton engine adapter (implements `SpecVerseEngine`) |
| `getTemplate` | function | Load a versioned prompt template by operation name |
| `fillTemplate` | function | Fill a prompt template with user requirements |
| `suggestLibraries` | function | Suggest SpecVerse libraries based on requirements |
| `enhancePrompt` | function | Combine filled template + library suggestions + cost estimates |
| `analyseSpec` | function | Analyse a parsed AST and return improvement suggestions |
| `EcosystemPromptManager` | class | Central prompt manager for terminal, Claude, and API ecosystems |
| `LLMProvider` | abstract class | Base class for all LLM providers |
| `LLMProviderRegistry` | class | Registry for managing multiple provider instances |
| `ProviderFactory` | class | Creates provider instances from configuration |
| `OpenAIProvider` | class | OpenAI/Azure/local (Ollama) provider |
| `AnthropicProvider` | class | Anthropic Claude provider |
| `InteractiveProvider` | class | Copy-paste provider for web LLM interfaces |
| `SpecVerseOrchestrator` | class | Multi-step workflow coordinator |
| `InteractiveWorkflow` | class | Interactive session workflow manager |
| `ConfigLoader` | class | Loads `.specverse.yml` provider configuration with env var expansion |
| `configLoader` | `ConfigLoader` | Singleton config loader instance |
| `SessionManager` | class | Persistent Claude Code session lifecycle and job queue |
| `Suggestion` | type | Spec analysis suggestion (severity, category, target, description) |
| `SessionInfo` | type | Session metadata (id, status, jobs processed, schemas loaded) |
| `JobRequest` | type | Queued AI generation request |
| `JobStatus` | type | Job lifecycle status (queued/processing/completed/failed) |
| `SpecVerseConfig` | type | Top-level `.specverse.yml` configuration shape |
| `LLMMessage` | type | Chat message (role + content) |
| `LLMCompletionOptions` | type | Request options (messages, temperature, max_tokens, stream) |
| `LLMCompletionResponse` | type | Provider response (content, usage, finish_reason) |
| `LLMProviderConfig` | type | Provider configuration (apiKey, model, baseURL, timeout) |
| `LLMStreamChunk` | type | Streaming response chunk |

## Usage

```typescript
import {
  enhancePrompt,
  analyseSpec,
  ProviderFactory,
  SpecVerseOrchestrator,
  SessionManager
} from '@specverse/engine-ai';

// 1. Build an enhanced prompt with library suggestions and cost estimates
const prompt = await enhancePrompt('create', {
  requirements: 'A guesthouse booking system',
  scale: 'business',
  framework: 'fastify'
});
console.log(prompt.systemPrompt);
console.log(prompt.estimatedTokens);
console.log(prompt.libraryContext.suggestions);

// 2. Analyse a parsed spec for improvement suggestions
const suggestions = analyseSpec(parsedAST);
suggestions.forEach(s => console.log(`[${s.severity}] ${s.target}: ${s.description}`));

// 3. Create an LLM provider and execute
const provider = ProviderFactory.createFromConfig({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4'
});
const response = await provider.complete({
  messages: [
    { role: 'system', content: prompt.systemPrompt },
    { role: 'user', content: prompt.userPrompt }
  ]
});

// 4. Use the orchestrator for multi-step workflows
const orchestrator = new SpecVerseOrchestrator();
await orchestrator.initialize();              // loads .specverse.yml
const result = await orchestrator.materialise('app.specly', 'fastify');

// 5. Manage persistent Claude Code sessions
const sessions = new SessionManager('.specverse/sessions');
const session = await sessions.create({ name: 'my-project', pver: 'v9' });
await sessions.submit({ jobId: 'j1', sessionId: session.sessionId,
  operation: 'create', requirements: 'booking system' });
```

## Architecture

```
src/
├── index.ts                        # Public API — engine adapter + re-exports
├── commands/                       # Prompt pipeline (4 actions)
│   ├── template.ts                 #   Action 1: Load versioned prompt template
│   ├── fill.ts                     #   Action 2: Fill template with requirements
│   ├── suggest.ts                  #   Action 3: Suggest SpecVerse libraries
│   ├── enhance.ts                  #   Action 4: Enhanced prompt (template + libs + cost)
│   └── spec-analyser.ts            #   Spec analysis — model/controller/event suggestions
├── core/
│   └── ecosystem-prompt-manager.ts # Central prompt manager (terminal/claude/api tiers)
├── providers/                      # LLM execution layer
│   ├── llm-provider.ts             #   Abstract base + LLMProviderRegistry
│   ├── openai-provider.ts          #   OpenAI / Azure / local (Ollama, LM Studio)
│   ├── anthropic-provider.ts       #   Anthropic Claude
│   ├── interactive-provider.ts     #   Copy-paste for web interfaces (ChatGPT, Claude, Gemini)
│   └── provider-factory.ts         #   Factory + validation + default configs
├── orchestrator/                   # Multi-step workflow coordination
│   ├── specverse-orchestrator.ts   #   Central coordinator (analyse/create/infer/materialise/realize)
│   └── interactive-workflow.ts     #   Interactive session workflow with response collection
├── config/
│   └── index.ts                    # .specverse.yml loader with env var expansion
├── session/                        # Persistent AI session management
│   ├── session-manager.ts          #   Session lifecycle, job queue, processing
│   ├── claude-executor.ts          #   Claude Code process integration
│   └── types.ts                    #   SessionInfo, JobRequest, JobStatus, etc.
├── types/
│   └── index.ts                    # Shared types (UserRequirements, PromptTemplate, etc.)
├── config-loader.ts                # Legacy config loader (prefer config/)
└── prompt-loader.ts                # Low-level prompt file loader

assets/prompts/                     # Versioned prompt templates
├── core/
│   ├── standard/
│   │   ├── v9/                     #   Current: analyse, create, materialise, realize
│   │   └── archive/v1-v8/          #   Archived previous versions
│   ├── schemas/                    #   prompt.schema.yaml / .json
│   └── base-terminal-prompt.md     #   Base prompt for terminal users
└── templates/                      # Additional prompt templates
```

The prompt pipeline flows through four composable actions:

1. **`getTemplate`** — loads a versioned YAML prompt template (v9 current, v1-v8 archived)
2. **`fillTemplate`** — substitutes `{{variables}}` with user requirements
3. **`suggestLibraries`** — recommends deployment, domain, manifest, and type libraries
4. **`enhancePrompt`** — combines all three into a ready-to-execute prompt with cost estimates

The provider layer abstracts LLM execution so the same prompt can target OpenAI, Anthropic, a local model, or a copy-paste interactive workflow. The orchestrator ties providers to the prompt pipeline for end-to-end AI operations.

## Extension

### Adding a New LLM Provider

1. **Create the provider class** in `src/providers/`. Extend `LLMProvider` and implement the four abstract methods:

```typescript
// src/providers/my-provider.ts
import { LLMProvider, LLMCompletionOptions, LLMCompletionResponse, LLMStreamChunk } from './llm-provider.js';

export class MyProvider extends LLMProvider {
  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse> {
    const merged = this.mergeOptions(options);
    // Call your LLM API here
    return { content: '...', usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
  }

  async *stream(options: LLMCompletionOptions): AsyncIterable<LLMStreamChunk> {
    // Yield streaming chunks from your LLM API
    yield { content: '...', finished: true };
  }

  async test(): Promise<boolean> {
    // Return true if the provider is reachable
    return true;
  }

  getInfo() {
    return {
      name: 'my-provider',
      version: '1.0.0',
      models: ['my-model-v1'],
      capabilities: ['completion', 'streaming']
    };
  }
}

export function createMyProvider(config: { apiKey: string; model: string }) {
  return new MyProvider({ apiKey: config.apiKey, model: config.model });
}
```

2. **Register in the factory**. Add a new case to `ProviderFactory.createProvider()` and `getSupportedTypes()` in `src/providers/provider-factory.ts`:

```typescript
case 'my-provider':
  return createMyProvider({ apiKey: config.apiKey!, model: config.model });
```

3. **Update the factory config type**. Add `'my-provider'` to the `type` union in `ProviderFactoryConfig` and add a default config in `getDefaultConfig()`.

4. **Add validation**. Add type-specific validation in `ProviderFactory.validateConfig()`.

5. **Export from index**. Add the provider export to `src/index.ts`:

```typescript
export { MyProvider } from './providers/my-provider.js';
```

6. **Update config schema**. Add `'my-provider'` to the valid types in `ConfigLoader.validateConfig()` in `src/config/index.ts` so `.specverse.yml` accepts the new type.

Users can then configure the provider in `.specverse.yml`:

```yaml
providers:
  my-llm:
    type: my-provider
    model: my-model-v1
    apiKey: ${MY_PROVIDER_API_KEY}
    enabled: true
```

## See Also

- `@specverse/types` — shared type definitions consumed by all engines
- `@specverse/engine-inference` — rule-based inference engine (no LLM required)
- `@specverse/engine-parser` — parses `.specly` files into the AST that `analyseSpec` inspects
- `docs/guides/ARCHITECTURE-GUIDE.md` — full system architecture
- `assets/prompts/core/CHANGELOG.md` — prompt template version history
