# {{projectName}} - Claude Code Development Guide

This file provides Claude-specific guidance for working with this SpecVerse project.

## Project Overview

**Project**: {{projectName}}
**Component**: {{componentName}}
**Type**: SpecVerse Specification

**For comprehensive SpecVerse guidance, see `AI-GUIDE.md`**

## Claude Code Specific Features

### File Operations
- **Read specifications**: Use Read tool to examine `specs/main.specly`
- **Edit specifications**: Use Edit tool to modify models and deployments  
- **Run validation**: Use Bash tool with `specverse validate specs/main.specly`
- **Generate artifacts**: Use Bash tool with `specverse generate` commands

### Development Workflow with Claude Code
1. **Read current spec**: `specs/main.specly`
2. **Understand requirements**: Check project documentation
3. **Make targeted changes**: Use Edit tool for specific modifications
4. **Validate changes**: Run `specverse validate` 
5. **Generate outputs**: Create diagrams, docs as needed

### Common Claude Code Tasks

#### Adding Models
```bash
# Read current spec
# Use Edit tool to add new models
# Validate with: specverse validate specs/main.specly
```

#### Generating Documentation
```bash
specverse gen docs specs/main.specly --output docs/
```

#### Creating Diagrams
```bash
# Generate all diagrams
specverse gen diagram specs/main.specly --output docs/diagrams/

# Generate specific diagram types
specverse gen diagram specs/main.specly -t er-diagram -o docs/diagrams/er.mmd
specverse gen diagram specs/main.specly -t event-flow-layered -o docs/diagrams/events.mmd
specverse gen diagram specs/main.specly -t lifecycle -o docs/diagrams/lifecycle.mmd
specverse gen diagram specs/main.specly -t deployment-topology -o docs/diagrams/deploy.mmd
```

#### Event-Flow Diagrams
The event-flow-layered diagram type uses topological sorting to visualize:
- Models publishing events
- Services subscribing to events
- Controllers orchestrating flows
- Views consuming data

Example: `npm run generate:diagram:event-flow`

#### Running Inference
```bash
specverse infer specs/main.specly -o specs/{{projectNameKebab}}-complete.specly
```

#### Working with Manifests (v3.3)
```bash
# Implementation manifest (default)
manifests/implementation.yaml

# Platform-specific manifests
manifests/docker-compose.specly  # Development with Docker
manifests/kubernetes.specly      # Production with Kubernetes

# Generate code using manifest
specverse realize specs/main.specly --manifest manifests/implementation.yaml
```

**Manifest v3.3 Format**: All manifests now use the v3.3 format with:
- `specVersion: "3.3.0"` (REQUIRED)
- `deployment:` section (REQUIRED - references spec and deployment name)
- `defaultMappings:` for technology stack defaults
- `capabilityMappings:` for capability-to-factory mappings (using `instanceFactory` field)
- `configuration:` section for platform-specific settings

## Claude Code Best Practices

### When Reading Files
- Always read `specs/main.specly` first to understand current state
- Check for existing models, relationships, and deployments
- Look for TODOs or placeholder content

### When Making Changes  
- Use Edit tool for precise modifications
- Preserve existing structure and formatting
- Follow SpecVerse convention syntax
- Validate immediately after changes

### When Running Commands
- Use descriptive descriptions for Bash commands
- Check command output for errors
- Run validation after structural changes

## Quick Reference

### Essential Commands
```bash
# Validate specification
specverse validate specs/main.specly

# Generate complete architecture
specverse infer specs/main.specly -o specs/expanded.specly

# Generate all diagrams
specverse gen uml specs/main.specly

# Generate deployment diagram
specverse gen uml specs/main.specly
```

### File Structure
```
{{projectName}}/
├── CLAUDE.md               # This file
├── AI-GUIDE.md            # Reference to comprehensive guide
├── README.md              # Project overview
├── specs/
│   └── main.specly        # Main specification (v3.3)
├── manifests/
│   ├── implementation.yaml    # Implementation manifest (v3.3)
│   ├── docker-compose.specly  # Docker deployment manifest (v3.3)
│   └── kubernetes.specly      # Kubernetes deployment manifest (v3.3)
└── docs/                  # Generated documentation
    └── diagrams/          # Generated diagrams
```

---
*Generated for SpecVerse - AI-Powered Specification Language*
*Claude Code Integration Guide*