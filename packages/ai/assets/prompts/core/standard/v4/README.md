# SpecVerse v4 Prompts - Unified Manifest Architecture

## Overview

Version 4 prompts are designed for SpecVerse v3.2.0+, which introduces the unified manifest architecture. The key change is that manifests are now integrated into the main SpecVerse schema using a container format.

## Key Changes from v3

### 1. Unified Container Format
All three layers (Components, Manifests, Deployments) can now be in a single `.specly` file:

```yaml
components:
  MyComponent: { ... }

manifests:
  MyManifest: { ... }

deployments:
  production: { ... }
```

### 2. Protocol-Agnostic Core
The core SpecVerse language remains protocol-agnostic. HTTP-specific concepts like route mapping are now technology extensions:

```yaml
manifests:
  MyManifest:
    # Core manifest (protocol-agnostic)
    implementationTypes: { ... }
    behaviorMappings: { ... }

    # Technology extensions (HTTP-specific)
    routeMapping: [ ... ]  # This is an extension, not core
```

### 3. Backward Compatibility
v4 prompts support both unified (recommended) and separate (legacy) formats.

## Available Prompts

### create.prompt.yaml (v4.0.0)
Generates complete SpecVerse specifications with unified manifest architecture support.

**Key Features:**
- Generates unified format by default
- Properly separates core patterns from technology extensions
- Includes comprehensive manifest integration

### analyse.prompt.yaml (v4.0.0)
Extracts specifications from existing codebases with unified format support.

**Key Features:**
- Extracts into unified container format
- Identifies protocol-specific vs agnostic patterns
- Preserves technology extensions separately

## Usage

These prompts are automatically selected when using:
- `specverse ai create --pver v4`
- `specverse ai analyse --pver v4`

## Migration from v3

To migrate v3 specifications to v4 unified format:

1. Wrap components in `components:` container
2. Move manifests into `manifests:` container
3. Ensure deployments use `deployments:` container
4. Move HTTP route mappings to technology extensions

## Architecture Principles

1. **Components**: Define WHAT the system does (logical architecture)
2. **Manifests**: Define HOW to build it (implementation guidance)
3. **Deployments**: Define WHERE it runs (runtime topology)

All three layers work together but maintain clear separation of concerns.