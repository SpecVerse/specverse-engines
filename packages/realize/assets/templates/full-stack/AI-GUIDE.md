# SpecVerse AI Development Guide

**📖 This guide has been superseded by the comprehensive guide.**

## Updated Documentation Location

For complete SpecVerse AI development guidance, please see:

**SPECVERSE-COMPLETE-GUIDE.md** in your SpecVerse installation:
- **Local development**: `node_modules/@specverse/lang/schema/SPECVERSE-COMPLETE-GUIDE.md`
- **Global installation**: Run `specverse docs` to view the guide
- **Online**: [SpecVerse Documentation](https://specverse.org/guide)

The complete guide includes everything from this legacy guide plus:

## Enhanced Content

- **Complete structure reference** - Every schema element documented
- **Practical examples** - From simple blog to enterprise SaaS
- **Convention syntax patterns** - Full shorthand reference
- **AI development workflows** - Step-by-step AI operation guidance
- **Deployment patterns** - Real-world deployment configurations for all scales
- **Command reference** - All CLI commands in one place
- **Best practices** - Common pitfalls and recommendations
- **Type reference** - Complete primitive and format types
- **Manifest system** - Implementation guidance patterns

## Quick Reference for AI Assistants

### Key Principles
1. Use conventions: `attributeName: TypeName modifiers` for 90% of attributes
2. Component names: PascalCase (UserManagement, PaymentService)
3. Start minimal: Let AI inference expand to complete architecture
4. Scale appropriately: Personal ≠ Enterprise complexity

### Quick Syntax Reference

For working examples showing all essential SpecVerse syntax patterns:
**`node_modules/@specverse/lang/schema/MINIMAL-SYNTAX-REFERENCE.specly`**

This auto-generated file demonstrates core concepts with practical examples.

### Essential Commands
```bash
# Validate specification
specverse validate specs/main.specly

# Generate complete architecture with AI inference
specverse infer specs/main.specly -o specs/complete.specly

# Generate all outputs
specverse gen all specs/main.specly
```

## Migration Note

The legacy AI-GUIDE.md has been archived to `archive/AI-GUIDE-legacy.md` for reference.

---
*For comprehensive guidance, see SPECVERSE-COMPLETE-GUIDE.md in your SpecVerse installation*