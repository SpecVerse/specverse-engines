# Instance Factories

Code generation templates for the realize engine. Each factory category produces a specific kind of output from a SpecVerse specification.

## Factory Categories

| Category | Templates | Generates |
|----------|-----------|-----------|
| [applications](applications/) | generic, react | App scaffolding, React frontend (API client, views, routing, sidebar) |
| [cli](cli/) | commander | CLI entry point, command files from spec commands |
| [communication](communication/) | eventemitter | Event bus, publishers, subscribers |
| [controllers](controllers/) | fastify | Fastify route handlers, server with auto-wired routes |
| [infrastructure](infrastructure/) | docker-k8s | Dockerfiles, docker-compose, Kubernetes manifests |
| [orms](orms/) | prisma | Prisma schema from models (relations, types, defaults) |
| [scaffolding](scaffolding/) | generic | package.json, tsconfig, .env, .gitignore, README |
| [sdks](sdks/) | python, typescript | Client SDKs for generated APIs |
| [services](services/) | prisma | CURVED controllers, business logic services, behavior generation |
| [storage](storage/) | mongodb, postgresql, redis | Database configs, Docker setup |
| [testing](testing/) | vitest | Test file generation |
| [tools](tools/) | mcp, vscode | MCP server, VSCode extension (14 commands) |
| [validation](validation/) | zod | Zod validation schemas from model attributes |
| [views](views/) | react, shared | React components (list, detail, form, dashboard), adapters |
| [shared](shared/) | - | Path resolver, reserved words |
| [archived](archived/) | - | Deprecated factory definitions |

## How It Works

```
Specification + Manifest
        |
        v
  [Manifest Loader] ---> resolve capabilities to factories
        |
        v
  [Instance Factory Library] ---> find matching factory YAML
        |
        v
  [Code Generator] ---> call template generator function
        |
        v
  Generated source file
```

Each factory has:
1. **YAML definition** — declares capabilities, technology, and template mappings
2. **Template generators** — TypeScript functions that produce source code from spec context

## Template Generator Pattern

Every generator is a function that receives spec context and returns source code:

```typescript
export function generate(context: {
  spec: any;          // Full SpecVerseAST
  model?: any;        // Current model (if model-scoped)
  controller?: any;   // Current controller
  models?: any[];     // All models in component
  componentName: string;
}): { filePath: string; code: string } {
  // Generate and return source code
}
```

## Adding a New Factory

1. Create a YAML definition in the appropriate category
2. Write template generator(s) in `templates/{technology}/`
3. The realize engine discovers factories by scanning this directory

## See Also

- [Realize Engine README](../../README.md)
- [Architecture Guide](https://github.com/SpecVerse/specverse-self/blob/main/docs/guides/ARCHITECTURE-GUIDE.md)
