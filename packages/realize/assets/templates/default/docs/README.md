# {{projectName}} Documentation

This directory contains project-specific documentation for your SpecVerse application.

## Documentation Structure

```
docs/
├── README.md                           # This file
├── example-documentation-template.md   # Template for creating documentation
├── api/                               # API documentation (generated)
├── diagrams/                          # Generated diagrams
└── guides/                            # Project-specific guides
```

## Generated Content

When you run SpecVerse generation commands, documentation will be created in:

- `diagrams/` - UML diagrams (ER, sequence, architecture, lifecycle, deployment)
- `api/` - API documentation generated from specifications

## SpecVerse Schema Reference

For complete SpecVerse language documentation and schema reference, see:

- **Main Schema**: `../../schema/SPECVERSE-SCHEMA.json`
- **Schema Guidance**: Maintained in the main project

These files contain the authoritative SpecVerse v3.3 language specification and are maintained in the main project.

## Creating Project Documentation

1. Use `example-documentation-template.md` as a starting point
2. Run `npm run generate:docs` to generate API documentation
3. Run `npm run generate:diagrams` to create visual diagrams
4. Add project-specific guides in the `guides/` directory

## Generation Commands

```bash
# Generate all documentation
npm run generate:docs

# Generate diagrams only
npm run generate:diagrams

# Generate specific diagram types
npm run generate:diagram:deployment
```