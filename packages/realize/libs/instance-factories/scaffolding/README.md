# Scaffolding Factory

Project-level configuration files that adapt to manifest choices.

## Definition

| File | Description |
|------|-------------|
| `generic-scaffold.yaml` | Generic project scaffolding — aggregates requirements from all factories |

## Generated Output

| Generator | Output | Purpose |
|-----------|--------|---------|
| `package-json-generator` | `package.json` | Root package.json aggregating deps from all implementation types |
| `tsconfig-generator` | `tsconfig.json` | TypeScript configuration |
| `tsconfig-react-generator` | `tsconfig.react.json` | React-specific TypeScript config |
| `env-generator` | `.env` | Environment variables with values |
| `env-example-generator` | `.env.example` | Environment variable template (safe to commit) |
| `gitignore-generator` | `.gitignore` | Git ignore rules |
| `readme-generator` | `README.md` | Project README with tech stack and setup instructions |

The package.json generator is the key file — it walks all instance factories in
the manifest, aggregates their `requirements.dependencies` sections, and merges
them into a single `package.json` with combined scripts, dependencies, and
devDependencies.

## Technology

- **Runtime**: Node.js ^18.0.0
- **Language**: TypeScript
- **License**: MIT (default)

## Capabilities

| Provides | Requires |
|----------|----------|
| `project.scaffold` | (none) |
| `project.package.json` | |
| `project.tsconfig` | |
| `project.gitignore` | |
| `project.env` | |

## How It Works

Unlike other factories that generate domain-specific code, the scaffolding factory
generates project infrastructure. It reads the full manifest to understand which
other factories are in use, then aggregates their requirements into unified
project files.
