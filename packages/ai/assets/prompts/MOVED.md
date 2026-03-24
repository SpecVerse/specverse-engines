# Prompts Directory Migration Notice

## Important: Directory Structure Changed

The prompts directory has been reorganized as part of the SpecVerse v3.1 AI Support architecture enhancement.

### New Structure

All prompts have been moved to the `ai-support/prompts/` directory:

- **Standard prompts**: `ai-support/prompts/core/standard/`
- **Specialized prompts**: `ai-support/prompts/specialized/`
- **Template prompts**: `ai-support/prompts/templates/`
- **Library-aware prompts**: `ai-support/prompts/library-aware/`

### Legacy Compatibility

This directory (`prompts/`) now serves as a symbolic link to `ai-support/prompts/` for backward compatibility.

### For Developers

Update your import paths and references:

```
OLD: prompts/standard/create.prompt.yaml
NEW: ai-support/prompts/core/standard/create.prompt.yaml
```

Or use the symlink:

```
COMPATIBLE: prompts/core/standard/create.prompt.yaml
```

For more information, see the AI Support Migration Guide in `ai-support/docs/migration-guide.md`.