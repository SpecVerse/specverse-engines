# SpecVerse Terminal Quick-Start Guide

**For**: LLM Terminal Users (ChatGPT, Claude, Cursor, etc.)
**Purpose**: Use SpecVerse standard prompts for specification generation and implementation
**Version**: 7.0.0

This guide shows how to use the **standard SpecVerse prompts** for terminal/chat-based AI interactions.

## Available Standard Prompts (v7)

SpecVerse provides four standard prompts with enhanced capabilities:

1. **`create`** - Generate SpecVerse specifications from natural language requirements
2. **`analyse`** - Extract specifications from existing codebases (reverse engineering)
3. **`materialise`** - Generate complete implementations from specifications
4. **`realize`** - Generate deployment configurations (environment-adaptive)

Located in: `prompts/core/standard/v7/`

## Quick Start: Using the Create Prompt

The **create** prompt is your starting point for new projects:

### Step 1: View the Full Prompt

```bash
cat prompts/core/standard/v7/create.prompt.yaml
```

### Step 2: Terminal-Ready Version

Copy this complete prompt into your LLM:

```
You are a SpecVerse v3.2.0 specification creator that generates complete, well-structured specifications from natural language requirements.

IMPORTANT: First, read these reference files if available:
- node_modules/@specverse/lang/schema/SPECVERSE-SCHEMA-AI.yaml (AI guidance and examples)
- node_modules/@specverse/lang/schema/MINIMAL-SYNTAX-REFERENCE.specly (complete syntax example)

Your task is to:
1. Analyze natural language requirements
2. Extract core business entities and their relationships
3. Generate complete SpecVerse specifications with:
   - Models with attributes and behaviors
   - Controllers with CURED operations
   - Services with business logic
   - Views for user interfaces
   - Events for system communication
   - Deployments for infrastructure
   - Manifests for implementation details

Use SpecVerse v3.2.0 syntax:
- Attributes: name: Type modifiers
- Types: String, Integer, UUID, Email, DateTime, Boolean, Money, Text
- Modifiers: required, optional, unique, auto, searchable, indexed, default=value
- Relations: hasMany, belongsTo, references

Generate a SpecVerse specification from these requirements:

Requirements: [YOUR REQUIREMENTS HERE]
Project Type: [web-app/api/full-stack]
Scale: [personal/startup/business/enterprise]
Primary Technology: [nextjs/nestjs/express/auto]

Please generate:
1. Complete component specification with all models and relationships
2. Implementation manifest with technology choices
3. Deployment specification for the target environment
```

## Workflow Example: From Idea to Implementation

### 1. Create Specification
```
Requirements: I need a guesthouse booking system where I can manage multiple properties, each with rooms that guests can book. Need to see bookings on a timeline and prevent double-booking.
Project Type: full-stack
Scale: business
Primary Technology: nextjs
```

### 2. Generate Implementation (Materialise)
After getting your specification, use the materialise prompt:

```
Generate a complete implementation from this SpecVerse specification:

[PASTE YOUR SPECIFICATION HERE]

Target Framework: nextjs
Implementation Style: modern
Data Consistency Level: strict
Error Handling Strategy: comprehensive

Generate:
1. Complete project structure
2. Database schema with migrations
3. API routes with validation
4. React components with state management
5. Setup scripts (like start.sh)
6. Documentation
```

### 3. Generate Deployment (Realize)
For deployment configurations:

```
Generate deployment configurations from this SpecVerse specification:

[PASTE YOUR SPECIFICATION HERE]

Target Environment: [development/production/enterprise]
Cloud Provider: [vercel/aws/local]

For development: Generate Docker Compose and start.sh script
For production: Generate infrastructure as code and CI/CD pipelines
```

## Complete Workflow Commands

1. **Create** a specification from requirements
2. **Save** as `spec.specly`
3. **Materialise** into working code
4. **Realize** deployment configurations
5. **Run** with generated start scripts

## Key Improvements in v7

### Create (v7)
- Better validation and type safety
- Support for complex relationships
- Event-driven architecture patterns
- Modern deployment targets (Vercel, Netlify)

### Materialise (v7)
- **Data consistency focus** - Handles snake_case/camelCase mapping
- **Multi-layer validation** - Database, API, and frontend
- **Automated setup** - Generates start.sh style scripts
- **Error handling** - Comprehensive error patterns

### Realize (v7)
- **Environment-adaptive** - Only generates what's needed
- **Progressive enhancement** - Dev → Test → Prod → Enterprise
- **Local dev support** - Quick start scripts and Docker Compose
- **Zero-downtime** - Blue-green and canary deployments

## Environment-Specific Generation

### Development
- Simple Docker Compose
- start.sh quick-start script
- Hot reload configuration
- Basic debugging setup

### Production
- High availability infrastructure
- Monitoring and alerting
- Security hardening
- Backup and recovery

### Enterprise
- Multi-region deployment
- Compliance frameworks
- Advanced security
- Disaster recovery

## Tips for Better Results

1. **Be specific** about your requirements
2. **Include examples** of the data you'll work with
3. **Specify scale** to get appropriate architecture
4. **Mention constraints** like compliance or performance
5. **Describe user workflows** for better UX generation

## Troubleshooting Common Issues

### Data Mapping Issues
If you see snake_case/camelCase problems:
- Request "strict" data consistency level in materialise
- Ask for explicit data mapping functions

### Missing Bookings/Data
Check for:
- Database column name mapping (room_id vs roomId)
- Date format conversions (ISO vs YYYY-MM-DD)
- API response transformations

### Connection Issues
For database connections:
- Use environment variables in scripts
- Generate start.sh with explicit POSTGRES_URL
- Include .env.example templates

## Next Steps

1. Start with the **create** prompt for your requirements
2. Use **materialise** to generate implementation
3. Apply **realize** for deployment setup
4. Iterate based on your specific needs

Remember: v7 prompts are environment-aware and will adapt their output to your actual needs!