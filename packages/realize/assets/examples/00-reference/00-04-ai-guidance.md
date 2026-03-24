<!-- This file is auto-generated from schema/README-AI-GUIDANCE.md
     Do not edit directly - changes will be overwritten
     To update: modify the source file and run 'npm run build' -->

# SpecVerse Schema Files

This directory contains the official SpecVerse v3.1 schema definitions.

## Files

### `SPECVERSE-SCHEMA.json`
- **Purpose**: Official JSON Schema for validation
- **Use**: Schema validation, IDE support, tooling integration
- **Format**: Standard JSON Schema Draft 2020-12
- **Version**: v3.1.28

### `SPECVERSE-SCHEMA-AI.yaml`
- **Purpose**: AI-friendly YAML version with guidance comments
- **Use**: AI prompting, documentation reference
- **Format**: YAML with inline comments and examples
- **Size**: ~12KB (optimized for AI context windows)

### `MINIMAL-SYNTAX-REFERENCE.specly`
- **Purpose**: Working syntax examples showing all essential patterns
- **Use**: Quick reference, cheat sheet, learning examples
- **Format**: Complete SpecVerse specification demonstrating conventions
- **Content**: Models, controllers, services, events with real-world patterns

### `SPECVERSE-STRUCTURE-GUIDE.md`
- **Purpose**: Simple english version of schema thats easy for usersa to read
- **Use**: Quick reference, cheat sheet, learning examples
- **Format**: Simple English
- **Content**: Complete SpecVerse specification 

## Documentation

For complete SpecVerse documentation including structure reference, AI guidance, and practical examples, see:

📖 **[SPECVERSE-COMPLETE-GUIDE.md](./SPECVERSE-COMPLETE-GUIDE.md)**

This comprehensive guide includes:
- Complete structure reference with all properties
- Convention syntax patterns and examples
- AI development workflows and best practices
- Deployment patterns for all scales
- Practical examples from simple to enterprise
- Command reference for CLI usage
- Unified manifest architecture and implementation guidance (v3.1.28+)

## Maintenance

The AI schema is automatically generated from the JSON schema during the build process:

```bash
npm run build:schema
# Generates SPECVERSE-SCHEMA-AI.yaml from SPECVERSE-SCHEMA.json
```

To modify AI guidance:
1. Edit `scripts/json-to-yaml-schema.js`
2. Update the `aiGuidance` object
3. Run `npm run build:schema` to regenerate

## Token Efficiency

The AI schema is designed for efficient token usage:
- **~12KB total size** (with new instance types)
- **~3,500 tokens** (estimated)
- Fits comfortably in most AI context windows
- Optimized comment-to-content ratio
- Comprehensive deployment guidance included