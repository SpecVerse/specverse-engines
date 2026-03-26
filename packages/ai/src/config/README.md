# config/

Configuration loader for `.specverse.yml` provider and feature settings.

## What It Provides

**`ConfigLoader`** -- Loads SpecVerse AI configuration from YAML files with the following capabilities:

- **File discovery**: Searches up the directory tree for `.specverse.yml`, `.specverse.yaml`, `specverse.config.yml`, or `specverse.config.yaml`.
- **Environment variable expansion**: Supports `${VAR_NAME:-default}` syntax in YAML values.
- **Environment overrides**: Auto-applies `SPECVERSE_<PROVIDER>_API_KEY` and `SPECVERSE_DEFAULT_PROVIDER` from env.
- **Provider management**: `getProviderConfig(name?)` resolves the default/enabled provider with model defaults. `getEnabledProviders()` lists all active providers.
- **Validation**: Ensures provider types are valid (`openai`, `anthropic`, `azure`, `local`, `interactive`) and default provider references exist.

**`SpecVerseConfig`** interface covers:
- `providers` -- Named provider configs with type, API key, model, and interface settings
- `defaults` -- Default provider, model, temperature, max_tokens
- `prompts` -- Custom prompt directory and named prompts
- `outputs` -- Output directory, format, diagram settings
- `features` -- Toggle inference, streaming, caching

## Position in the AI Engine

This is the **configuration layer**. The orchestrator and provider factory consume `ConfigLoader` to determine which LLM providers to instantiate and how to configure them.

## Exports

```typescript
export { ConfigLoader, SpecVerseConfig, configLoader }
```
