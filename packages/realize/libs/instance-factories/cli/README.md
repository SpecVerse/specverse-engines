# CLI Factory

Generates Commander.js CLI applications from spec command definitions.

## Definition

| File | Description |
|------|-------------|
| `commander-js.yaml` | Commander.js v12 CLI with argument parsing, help text, and command routing |

## Generated Output

| Generator | Output | Purpose |
|-----------|--------|---------|
| `cli-entry-generator` | `backend/src/cli/index.ts` | Main CLI entry point — registers all commands from spec |
| `command-generator` | `backend/src/cli/commands/{command}.ts` | Individual command files (one per spec command) |

The entry generator reads the spec's `commands` section and registers each as a
Commander.js command with arguments, flags, and help text. Each command file
delegates to its corresponding service for business logic.

## Technology

- **Framework**: Commander.js ^12.0.0
- **Runtime**: Node.js with tsx for development
- **Language**: TypeScript

## Capabilities

| Provides | Requires |
|----------|----------|
| `cli.commands` | `service.controller` |
| `cli.parser` | |
| `cli.help` | |

## Spec Integration

Commands are defined in the spec with:
- `arguments` — positional parameters
- `flags` — optional switches
- `returns` — output format
- `exitCodes` — process exit codes
- `subcommands` — nested command trees
