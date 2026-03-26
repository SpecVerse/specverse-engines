# providers/

LLM provider abstraction layer with factory and three implementations.

## What It Provides

**`LLMProvider`** (abstract base class) -- Defines the provider contract:
- `complete(options)` -- Send messages, get a completion response
- `stream(options)` -- Stream completion chunks via `AsyncIterable<LLMStreamChunk>`
- `test()` -- Verify provider connectivity
- `getInfo()` -- Return name, version, models, capabilities

**`LLMProviderRegistry`** -- Registry for managing multiple named providers with a default.

**`ProviderFactory`** -- Creates provider instances from `ProviderFactoryConfig`. Supports types: `openai`, `anthropic`, `azure` (via OpenAI with custom baseURL), `local` (Ollama/LM Studio via OpenAI-compatible API), `interactive`.

### Implementations

- **`OpenAIProvider`** -- GPT-4/3.5-turbo via the OpenAI Chat Completions API. Supports streaming (SSE), organization/project headers. Factory: `createOpenAIProvider()`.

- **`AnthropicProvider`** -- Claude 3 (Opus/Sonnet/Haiku) via the Anthropic Messages API. Handles system message separation, SSE streaming, finish reason mapping. Factory: `createAnthropicProvider()`.

- **`InteractiveProvider`** -- Zero-cost copy-paste provider. Formats prompts for specific interfaces (ChatGPT, Claude, Gemini, generic), tracks sessions, supports `waitForInput` mode for stdin response collection. Factory: `createInteractiveProvider()`.

## Position in the AI Engine

This is the **LLM execution layer**. The orchestrator selects a provider (via config) and calls `complete()` or `stream()` with the enhanced prompt produced by the commands pipeline. The interactive provider enables free execution by formatting prompts for manual copy-paste.

## Exports

```typescript
export { LLMProvider, LLMProviderRegistry, llmRegistry }
export { ProviderFactory, ProviderFactoryConfig }
export { OpenAIProvider, createOpenAIProvider }
export { AnthropicProvider, createAnthropicProvider }
export { InteractiveProvider, createInteractiveProvider }
```
