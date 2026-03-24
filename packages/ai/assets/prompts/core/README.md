# SpecVerse Standard Prompts

**Production-ready AI prompts for complete application development workflows**

## Overview

The SpecVerse standard prompts enable seamless specification-driven development using AI assistants like Claude, ChatGPT, and Cursor. These prompts transform natural language requirements into complete, deployable applications.

## 📁 Directory Structure

```
prompts/core/
├── standard/
│   ├── v6/                           # Previous version (deprecated)
│   └── v7/                           # Current version (recommended)
│       ├── create.prompt.yaml        # Requirements → Specifications
│       ├── analyse.prompt.yaml       # Code → Specifications (reverse engineering)
│       ├── materialise.prompt.yaml   # Specifications → Implementation
│       └── realize.prompt.yaml       # Specifications → Deployment (environment-adaptive)
├── specialized/                      # Task-specific prompts
│   ├── migration.prompt.yaml        # Technology migrations
│   └── optimization.prompt.yaml     # Performance optimization
├── schemas/                          # Validation schemas
│   └── prompt.schema.yaml           # Prompt structure validation
├── examples/                         # Example usage and test cases
├── base-terminal-prompt.md           # Ready-to-use terminal prompts
├── CHANGELOG.md                      # Version history and migration notes
└── README.md                         # This file
```

## 🚀 Quick Start

### For Terminal/Chat Usage

**1. Get terminal-ready prompts:**
```bash
cat prompts/core/base-terminal-prompt.md
```

**2. Copy the create prompt and replace requirements:**
```
Requirements: I need a guesthouse booking system with multiple properties, rooms, and timeline visualization
Project Type: full-stack
Scale: business
Primary Technology: nextjs
```

**3. Generate implementation:**
Use the materialise prompt with your generated specification.

### For Programmatic Usage

```typescript
import { loadPrompt } from '@specverse/prompts';

const prompt = await loadPrompt('standard/v7/create');
const result = await llmProvider.complete(prompt, context);
```

## 🔄 Complete Workflow

### 1. Create Phase
**Input**: Natural language requirements
**Output**: Complete SpecVerse specification
**Prompt**: `create.prompt.yaml`

```
"I need a booking system for guesthouses..."
↓
Complete SpecVerse specification with models, controllers, services
```

### 2. Materialise Phase
**Input**: SpecVerse specification
**Output**: Production-ready implementation
**Prompt**: `materialise.prompt.yaml`

```
SpecVerse specification
↓
- Complete Next.js application
- Database schema with validations
- API routes with error handling
- React components with state management
- Setup scripts (start.sh)
```

### 3. Realize Phase (Optional)
**Input**: SpecVerse specification + environment
**Output**: Deployment configurations
**Prompt**: `realize.prompt.yaml`

```
SpecVerse specification + "production" environment
↓
- Infrastructure as Code
- CI/CD pipelines
- Monitoring configurations
- Security policies
```

## 📊 Version Comparison

| Feature | v6 | v7 |
|---------|----|----|
| Data Consistency | Basic | ✅ Multi-layer validation |
| Error Handling | Manual | ✅ Comprehensive patterns |
| Environment Adaptation | Static | ✅ Adaptive complexity |
| Local Development | Manual setup | ✅ Automated (start.sh) |
| Deployment Strategies | Basic | ✅ Zero-downtime options |
| Type Safety | Partial | ✅ End-to-end |
| Real-world Testing | Limited | ✅ Battle-tested |

## 🎯 Key Enhancements in v7

### Data Consistency Focus
- **Snake_case ↔ CamelCase mapping**: Automatic handling between database and frontend
- **Multi-layer validation**: Database constraints + API validation + Frontend checks
- **Type safety**: End-to-end type consistency across all layers

### Environment-Adaptive Generation
- **Development**: Simple Docker Compose + start.sh script
- **Production**: HA infrastructure + monitoring + security
- **Enterprise**: Multi-region + compliance + disaster recovery

### Production-Ready Patterns
- **Error handling**: Comprehensive error patterns with recovery
- **Automation**: Complete setup and deployment scripts
- **Monitoring**: Health checks and observability
- **Security**: Production-grade security configurations

## 🛠️ Framework Support

### Supported Frameworks
- **Next.js**: Full-stack React with App Router
- **NestJS**: Enterprise Node.js with TypeORM
- **Express**: Lightweight Node.js API
- **Django**: Python web framework
- **Rails**: Ruby web framework
- **Spring Boot**: Java enterprise applications

### Cloud Platforms
- **Vercel**: Serverless Next.js deployment
- **AWS**: Full cloud infrastructure
- **Azure**: Microsoft cloud services
- **GCP**: Google cloud platform
- **Local**: Docker-based development

## 📚 Real-World Testing

### Guesthouse Booking System Example
The v7 prompts were battle-tested with a complete guesthouse booking system:

- **Models**: Houses, Rooms, Bookings with relationships
- **Features**: Timeline visualization, conflict detection, multi-property support
- **Technologies**: Next.js 14, PostgreSQL, TypeScript, Tailwind CSS
- **Deployment**: Automated setup with start.sh, Docker Compose, health checks

**Result**: Fully functional application from requirements to deployment.

### Generated Code Quality
- ✅ **Type-safe**: Strict TypeScript with no `any` types
- ✅ **Validated**: Multi-layer data validation
- ✅ **Tested**: Comprehensive error handling
- ✅ **Documented**: Self-documenting code patterns
- ✅ **Deployable**: Production-ready configurations

## 📝 Prompt Format (v7)

All v7 prompts follow an enhanced YAML format:

```yaml
name: prompt-name
version: "7.0.0"
description: Enhanced prompt with data consistency focus
author: SpecVerse Team
tags: [v7, production-ready, data-consistency]

system:
  role: |
    Enhanced role with specific workflows and constraints
  context: |
    Required reading and enhanced requirements
  capabilities:
    - Enhanced capability list
  constraints:
    - Production-ready constraints

user:
  template: |
    Multi-phase template with conditional logic
    {% if environmentType == "development" %}
    Development-specific instructions
    {% endif %}

  variables:
    - name: dataConsistencyLevel
      type: string
      enum: ["basic", "strict", "paranoid"]
      default: "strict"

context:
  includes:
    - schema: node_modules/@specverse/lang/schema/SPECVERSE-SCHEMA-AI.yaml
  priority: "READ SCHEMA FILES FIRST"
  max_tokens: 4000

framework_support:
  nextjs:
    data_patterns: ["type-safe API routes", "validated forms"]
    validation_libraries: ["zod", "yup"]

output:
  quality_standards:
    - data_integrity: "Multi-layer validation"
    - error_resilience: "Recovery patterns"

validation:
  data_consistency: "Validate data flow between layers"
  production_readiness: "Enterprise-grade quality"
```

## 🔧 Configuration Options

### Data Consistency Levels
```yaml
dataConsistencyLevel:
  - basic      # Basic validation
  - strict     # Multi-layer validation (recommended)
  - paranoid   # Maximum validation and checks
```

### Implementation Styles
```yaml
implementationStyle:
  - minimal    # Essential features only
  - modern     # Best practices (recommended)
  - enterprise # Full enterprise features
```

### Environment Types
```yaml
environmentType:
  - development # Local dev with hot reload
  - test        # CI/CD integration
  - production  # High availability
  - enterprise  # Full compliance
```

## 🐛 Troubleshooting

### Common Issues & Solutions

**Data not displaying:**
- Check snake_case/camelCase mapping in `lib/db.ts`
- Verify date format conversions (ISO vs YYYY-MM-DD)
- Use `dataConsistencyLevel: strict` in materialise

**Database connection errors:**
- Use environment variables in scripts: `POSTGRES_URL="..." npm run dev`
- Check `.env.local` configuration
- Verify database exists and is accessible

**Missing functionality:**
- Ensure complete specification with all required models
- Use `implementationStyle: modern` for full features
- Check generated component relationships

## 📖 Migration Guide

### Upgrading from v6 to v7

1. **Update file paths**: Change `standard/v6/` to `standard/v7/`
2. **Add new variables**: Include `dataConsistencyLevel`, `environmentType`
3. **Review output**: Check for enhanced error handling and validation
4. **Test thoroughly**: Verify data consistency and type mapping

### Breaking Changes
- Materialise prompt requires data consistency configuration
- Realize prompt generates environment-specific output
- Enhanced variable sets for better control

## 🧪 Testing

Each prompt includes comprehensive testing:

```bash
# Test prompt effectiveness
npm run test:prompts

# Validate output format
npm run validate:prompts

# Test with multiple LLM providers
npm run test:providers
```

## 🤝 Contributing

### Adding New Prompts
1. Follow the v7 YAML schema
2. Include comprehensive variable definitions
3. Add examples and usage documentation
4. Test with real-world scenarios
5. Update CHANGELOG.md

### Reporting Issues
- Include full prompt configuration
- Provide example requirements or specifications
- Share generated output and expected behavior
- Test with multiple frameworks when possible

## 📄 License

Part of the SpecVerse project - MIT License

---

**Ready to start?** Check out [base-terminal-prompt.md](base-terminal-prompt.md) for copy-paste ready prompts!