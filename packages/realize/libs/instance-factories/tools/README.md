# Tools Instance Factory

Generates two complete developer tool packages from a SpecVerse specification: an MCP (Model Context Protocol) server and a VSCode extension. Unlike most other instance factories, these are **not wrappers** -- they are native TypeScript generators that ship substantial static asset trees.

## Generators

### MCP Server (`templates/mcp/`)

**`mcp-server-generator.ts`** generates a fully functional MCP server by:

1. Copying the `static/` framework (a complete Node.js project with 9 service classes)
2. Extracting tools, resources, and CLI commands from the spec
3. Generating `src/generated/spec-registry.ts` with spec-driven tool/resource registration

The static framework includes:

- **Server**: `mcp-server.ts` -- StdioServerTransport-based MCP server with event handling
- **Controller**: `MCPServerController.ts` -- Request routing and lifecycle management
- **Services**: 9 service classes including `CLIProxyService`, `HybridResourcesProvider`, `OrchestratorBridge`, `LibraryToolsService`, `PromptToolsService`, `EntityModuleService`, and others
- **Deployment targets**: Local (stdio), Web (HTTP), Extension (embedded), Enterprise (Docker)
- **Build scripts**: Per-deployment builders (`build-local.js`, `build-web.js`, `build-extension.js`, `build-enterprise.js`)
- **Tests**: Unit tests for `CLIProxyService` and `ResourcesProviderService`
- **Docs**: Deployment guides (local, web, extension) and hybrid resource system documentation

The generated MCP server exposes tools like `specverse-create`, `specverse-analyse`, `specverse-validate`, `specverse-realize`, and `specverse-suggest`, plus resources for schema, conventions, library catalog, and prompt templates.

**Package**: `@specverse/mcp` v3.5.2, depends on `@modelcontextprotocol/sdk` and `@specverse/lang`.

### VSCode Extension (`templates/vscode/`)

**`vscode-extension-generator.ts`** generates a publishable VSCode extension by:

1. Extracting CLI commands from the spec (with nested subcommand support)
2. Extracting entity type keywords for syntax highlighting
3. Generating `package.json` with commands, keybindings, and contributes
4. Copying static assets and generating an esbuild script

The static assets include:

- **`extension.ts`** -- Extension activation and command registration
- **`syntaxes/specverse.tmLanguage.json`** -- TextMate grammar for `.specly` files
- **`themes/`** -- Four color theme variants (basic, complete, colors, complete-colors)
- **`schemas/specverse-v3-schema.json`** -- JSON Schema for in-editor validation
- **`language-configuration.json`** -- Bracket matching, auto-closing, comment toggling

## Output Structure

```
tools/
  specverse-mcp/          # Complete MCP server project
    src/
      controllers/
      events/
      interfaces/
      models/
      server/
      services/
      generated/          # <-- spec-driven registry (generated)
    scripts/
    docs/
    package.json
    tsconfig.json
  vscode-extension/       # Complete VSCode extension project
    src/extension.ts
    syntaxes/
    themes/
    schemas/
    scripts/build.js
    package.json
```
