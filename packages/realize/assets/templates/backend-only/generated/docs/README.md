# Generated Documentation

This directory contains documentation and diagrams automatically generated from inferred SpecVerse specifications.

## Content Types

### Documentation Files
- **`*-complete-docs.md`**: Complete documentation from AI-inferred specifications
- **`*-deployed-docs.md`**: Documentation for deployment specifications
- **`*-deployed-prod-docs.md`**: Production deployment documentation

### Diagram Files  
- **`*-complete-diagrams.md`**: UML diagrams (ER, sequence, class) for complete specifications
- **`*-deployed-diagrams.md`**: Deployment diagrams for development environment
- **`*-deployed-prod-diagrams.md`**: Deployment diagrams for production environment

## Auto-Generation

These files are automatically generated when you run:

```bash
# Generates both specification and documentation
npm run infer                    # → creates complete docs + diagrams
npm run infer:deployment         # → creates development deployment docs + diagrams  
npm run infer:deployment:prod    # → creates production deployment docs + diagrams
```

## Manual Generation

You can also generate documentation for existing specifications:

```bash
# Generate docs for specific files
npm run infer:docs                        # docs for complete specification
npm run infer:deployment:docs             # docs for development deployment
npm run infer:deployment:prod:docs        # docs for production deployment
```

## File Organization

Files follow this naming pattern:
- `{project-name}-complete-docs.md` - Documentation for AI-inferred complete specification
- `{project-name}-complete-diagrams.md` - UML diagrams for complete specification  
- `{project-name}-deployed-docs.md` - Documentation for development deployment
- `{project-name}-deployed-diagrams.md` - Deployment diagrams for development
- `{project-name}-deployed-prod-docs.md` - Documentation for production deployment
- `{project-name}-deployed-prod-diagrams.md` - Deployment diagrams for production

All files are automatically regenerated when you run infer commands.