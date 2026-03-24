# SpecVerse v3.2 Examples

Welcome to the SpecVerse v3.2 examples directory! This is the **single source of truth** for all SpecVerse specification examples, organized by learning path and complexity.

## 📋 **Complete Examples Overview**

Comprehensive guide to all 24 examples with descriptions, diagrams, and learning recommendations organized by category below.

## 🆕 **Enhanced Documentation System**

All examples include enhanced diagram generation and rich documentation:

**Features:**
- ✨ **Enhanced Diagrams**: Profile attachments, CURVED operations, service subscriptions, lifecycle state machines
- 🎨 **Rich Visualization**: Complete class diagrams with convention syntax display  
- 📊 **Dual Format**: Both standalone and Docusaurus-ready documentation
- 🏷️ **Rich Metadata**: Categories, tags, auto-generated timestamps

## Common Definitions

All examples use shared type definitions from [`common-definitions.yaml`](./common/common-definitions.yaml) which provides:
- **Basic Types**: UUID, Email, Phone, URL, DateTime, Date
- **Financial Types**: Money with currency support
- **Location Types**: Address structures for global use
- **Contact Types**: ContactInfo, PersonName, ContactPerson
- **Business Types**: PaymentTerms, AuditEntry, FileInfo

This eliminates external dependencies and makes examples self-contained and easy to understand.


## Learning System

The examples include a comprehensive metadata system for enhanced learning:

### 📊 [examples-index.yaml](./metadata/examples-index.yaml)
**Master index** with concept mapping, difficulty levels, and learning paths
- Complete catalog of all 24 core examples
- Concept-based discovery (find examples by "profiles", "events", etc.)
- Difficulty progression from beginner to advanced
- Business domain classification

### 🎯 [learning-paths.yaml](./metadata/learning-paths.yaml)
**Personalized learning paths** based on role and experience
- Role-specific paths (Business Analyst, Developer, Architect)
- Experience-based pacing (Beginner, Intermediate, Advanced)
- Goal-oriented specializations (Quick Evaluation, Production Implementation)
- Adaptive checkpoints and progress tracking

### 📝 Category Metadata
Each directory includes `metadata.yaml` with:
- Learning objectives and prerequisites
- Time estimates and difficulty levels
- Concept coverage and real-world use cases
- Validation commands and next steps

### 📖 [Learning Metadata Documentation](./LEARNING-METADATA.md)
**Detailed documentation** about the metadata system:
- Purpose and design of metadata files
- Current usage and future possibilities
- Validation and maintenance guidelines
- Implementation roadmap for tooling

## Directory Structure

### 📚 [Fundamentals](./01-fundamentals/01-01-basic-model.md)
**Learn the basics** - Start here if you're new to SpecVerse
- [01-01-basic-model](./01-fundamentals/01-01-basic-model.md) - Your first SpecVerse model with attributes and types
- [01-02-model-with-lifecycle](./01-fundamentals/01-02-model-with-lifecycle.md) - Adding state management and flow syntax
- [01-03-model-with-behaviors](./01-fundamentals/01-03-model-with-behaviors.md) - Business logic with contracts and events
- [01-04-models-with-relations](./01-fundamentals/01-04-models-with-relations.md) - Connecting entities with relationships

### 🎭 [Profiles](./02-profiles/02-01-using-profiles.md)
**Profile system** - Learn SpecVerse's powerful composition model
- [02-01-using-profiles](./02-profiles/02-01-using-profiles.md) - Dynamic model composition and reusable patterns
- [02-02-profile-attachment](./02-profiles/02-02-profile-attachment.md) - Advanced profile scenarios and attachment strategies

### 🏗️ [Architecture](./03-architecture/03-01-enhanced-imports.md)
**System architecture** - Controllers, services, and events
- [03-01-enhanced-imports](./03-architecture/03-01-enhanced-imports.md) - Advanced import system with granular control
- [03-02-controllers-and-actions](./03-architecture/03-02-controllers-and-actions.md) - REST API endpoints and action definitions
- [03-03-services-and-events](./03-architecture/03-03-services-and-events.md) - External services and event-driven messaging
- [03-04-views-and-components](./03-architecture/03-04-views-and-components.md) - Frontend components and UI composition
- [03-05-complete-event-flow](./03-architecture/03-05-complete-event-flow.md) - Full system integration patterns
- [03-06-inference-engine-demo](./03-architecture/03-06-inference-engine-demo.md) - AI-powered modeling and relationship detection
- [03-07-relationships-demo](./03-architecture/03-07-relationships-demo.md) - Advanced relationship patterns
- [03-08-one-line-relationships](./03-architecture/03-08-one-line-relationships.md) - Concise relationship syntax

### 🏢 [Domains](./04-domains/04-01-digital-product-catalog.md)
**Real-world domains** - Complete domain models and business scenarios
- [04-01-digital-product-catalog](./04-domains/04-01-digital-product-catalog.md) - E-commerce product management
- [04-02-organization-management](./04-domains/04-02-organization-management.md) - Company structure and hierarchy

### 🚀 [Meta](./05-meta/05-01-specverse-meta-specification.md)
**Advanced topics** - Meta-programming and system specification
- [05-01-specverse-meta-specification](./05-meta/05-01-specverse-meta-specification.md) - Self-describing systems and reflection
- [05-02-specverse-app-build](./05-meta/05-02-specverse-app-build.md) - Build system integration and tooling

### 📦 [Deploy](./06-deploy/06-01-basic-deployment-intro.md)
**Deployment specifications** - Infrastructure and deployment patterns
- [06-01-basic-deployment-intro](./06-deploy/06-01-basic-deployment-intro.md) - Simple deployment patterns and environments
- [06-02-enhanced-deployment-example](./06-deploy/06-02-enhanced-deployment-example.md) - Advanced deployment scenarios with scaling


## Learning Path

**Recommended progression for new users:**

1. **Start with Fundamentals** ([Fundamentals](./01-fundamentals/01-01-basic-model.md))
   - [01-01-basic-model.md](./01-fundamentals/01-01-basic-model.md) → [01-02-model-with-lifecycle.md](./01-fundamentals/01-02-model-with-lifecycle.md) → [01-03-model-with-behaviors.md](./01-fundamentals/01-03-model-with-behaviors.md) → [01-04-models-with-relations.md](./01-fundamentals/01-04-models-with-relations.md)

2. **Learn Profiles** ([Profiles](./02-profiles/02-01-using-profiles.md))
   - [02-01-using-profiles.md](./02-profiles/02-01-using-profiles.md) → [02-02-profile-attachment.md](./02-profiles/02-02-profile-attachment.md)

3. **Understand Architecture** ([Architecture](./03-architecture/03-01-enhanced-imports.md))
   - [03-02-controllers-and-actions.md](./03-architecture/03-02-controllers-and-actions.md) → [03-03-services-and-events.md](./03-architecture/03-03-services-and-events.md)

4. **Study Real Domains** ([Domains](./04-domains/04-01-digital-product-catalog.md))
   - [04-01-digital-product-catalog.md](./04-domains/04-01-digital-product-catalog.md) or [04-02-organization-management.md](./04-domains/04-02-organization-management.md) - pick the domain closest to your use case

## Format Options

All examples are provided in **dual format** with **Specly DSL as primary**:

### **Primary: Specly DSL Format (.specly)**
- **Human-optimized syntax** - Concise, readable, easy to write
- **Advanced features** - One-line relationships, flow syntax, shorthand notation
- **Developer-friendly** - What you'll actually write in practice
- **Complete examples**: All examples include `.specly` files

### **Generated: YAML Format (.yaml)**  
- **Machine-generated** from Specly DSL using `specverse gen yaml`
- **AI-optimized** - Structured for automation and tooling
- **Comprehensive** - Fully expanded with all properties explicit
- **Interoperable** - Standard format for system integration

### **Documentation (.md)**
- **Learning guides** - Step-by-step explanations with code snippets
- **Concept explanation** - Why and how to use each feature
- **Visual diagrams** - Mermaid diagrams showing model relationships
- **Best practices** - Real-world usage patterns and tips

**Recommended workflow**: Read the `.md` guide → Study the `.specly` code → Generate `.yaml` when needed for tooling.

## 📖 **Start with Documentation**

Every example includes a comprehensive **`.md` documentation file** that should be your starting point:

- **📚 Learning Guide**: Step-by-step explanations of concepts
- **🎯 Learning Objectives**: What you'll master from this example  
- **🔧 Key Concepts**: Deep dives into specific features
- **📊 Visual Diagrams**: Mermaid diagrams showing relationships
- **💡 Best Practices**: Real-world usage patterns and tips
- **✅ Complete Examples**: Links to both `.specly` and `.yaml` files

**Always start with the `.md` file** - it will guide you through understanding the `.specly` code and when to use the generated `.yaml` format.

## Using Examples

### Learn from an Example
```bash
# 1. Read the documentation guide
open ./01-fundamentals/01-01-basic-model.md

# 2. Study the Specly DSL code  
cat ./01-fundamentals/01-01-basic-model.specly

# 3. See the generated YAML (optional)
cat ./01-fundamentals/01-01-basic-model.yaml
```

### Validate Examples  
```bash
# Validate Specly DSL (primary format)
specverse dev quick ./01-fundamentals/01-01-basic-model.specly

# Validate generated YAML
specverse validate ./01-fundamentals/01-01-basic-model.yaml

# Validate all examples
npm run validate:examples
```

### Generate YAML from Specly
```bash
# Generate YAML from Specly DSL (recommended workflow)
specverse gen yaml ./01-fundamentals/01-01-basic-model.specly -o my-output.yaml

# Regenerate all YAML files from Specly
npm run process:examples
```

### Use as Template
```bash
# Copy Specly DSL as starting point (recommended)
cp 04-domains/04-01-digital-product-catalog.specly my-project.specly

# Copy YAML if needed for tooling
cp 04-domains/04-01-digital-product-catalog.yaml my-project.yaml

# Initialize new project with examples
specverse init my-project --template=./01-fundamentals/01-01-basic-model.specly
```

## Contributing Examples

When adding new examples, follow the **4-Point Process** for example quality assurance:

### **4-Point Process for Example Quality**

**Pre-Check: Initial YAML Assessment (First Time Only)**
- **⚠️ ONLY for initial cleanup**: When first applying 4-Point Process to legacy examples
- **One-time decision**: If YAML > Specly, use YAML as source to regenerate Specly ONCE
- **After 4-Point Process**: Specly is ALWAYS the source, YAML is ALWAYS generated

1. **📝 Text Quality**: Ensure documentation text truly discusses the feature being demonstrated
   - Clear learning objectives and concept explanations
   - Step-by-step walkthroughs with context
   - Real-world use cases and benefits

2. **💡 Code Snippet Alignment**: Make code snippets in the text align perfectly with the actual code
   - Documentation code blocks match the `.specly` file exactly  
   - No outdated or inconsistent examples
   - Complete, runnable code segments

3. **🔧 Specly Represents Previous**: Ensure the `.specly` file correctly represents both text and code snippets
   - **Specly DSL is the permanent primary format** (after initial cleanup)
   - Complete implementation of all documented features
   - Follows SpecVerse best practices and conventions
   - **All future edits**: Only modify Specly, never edit YAML

4. **⚙️ YAML Generated from Specly**: The `.yaml` file must be generated from the `.specly` file
   - **Never manually edit YAML files** - they are auto-generated
   - Use `specverse gen yaml example.specly -o example.yaml`
   - Validates both formats independently

### **Implementation Workflow**
0. **Pre-Check (First Time Only)** - If legacy cleanup, check if YAML > Specly
1. **Write `.md`** - Complete documentation with clear learning objectives
2. **Update Specly** - Edit directly OR one-time generation from YAML if better
3. **Generate YAML** - Always use `specverse gen yaml example.specly -o example.yaml`
4. **Validate both** - Ensure both formats pass validation
5. **Test diagrams** - Verify Mermaid diagram generation works
6. **Update metadata** - Add to examples index and learning paths

**Remember**: After initial 4-Point Process, ONLY edit Specly files!

### **Quality Gates**
- ✅ Text accurately describes the demonstrated features
- ✅ Code snippets match the actual `.specly` implementation
- ✅ `.specly` file is complete and follows conventions
- ✅ `.yaml` file is auto-generated (never manually edited)
- ✅ Both formats validate successfully
- ✅ Diagrams generate without errors
- ✅ Metadata is updated appropriately

## Validation Status

All examples in this directory are guaranteed to:
- ✅ **Pass validation** - Conform to current schema
- ✅ **Use modern syntax** - ProfileAttachment, current types
- ✅ **Include proper imports** - Valid @specverse/common references
- ✅ **Work with current tools** - Compatible with CLI and parser

## Documentation Status

Documentation repository integration:
- ✅ **Zero Broken Links** - All cross-references working in documentation site (2025-07-25)
- ✅ **Complete Navigation** - Seamless linking between all example categories
- ✅ **Clean Builds** - Documentation builds without warnings or errors

## Need Help?

- 📖 **Documentation**: See `/documentation/docs/` for detailed guides
- 🛠️ **Tools**: Use `specverse --help` for CLI commands
- 🐛 **Issues**: Report problems in the main SpecVerse repository
- 💡 **Discussions**: Join the SpecVerse community discussions

### Quick Start Options

**New to SpecVerse?** Start with [01-01-basic-model.md](./01-fundamentals/01-01-basic-model.md) (guide) and [01-01-basic-model.specly](./01-fundamentals/01-01-basic-model.specly) (code)

**Want a personalized path?** Check the [learning paths](./metadata/learning-paths.yaml) for role-based recommendations

**Looking for specific concepts?** Use the [examples index](./metadata/examples-index.yaml) to find examples by topic

**Need a quick overview?** Try the 4-hour evaluation path:
- [01-01-basic-model.md](./01-fundamentals/01-01-basic-model.md) → [02-01-using-profiles.md](./02-profiles/02-01-using-profiles.md) → [04-01-digital-product-catalog.md](./04-domains/04-01-digital-product-catalog.md)

**Want to dive into code?** Study the Specly DSL files:
- [01-01-basic-model.specly](./01-fundamentals/01-01-basic-model.specly) → [02-01-using-profiles.specly](./02-profiles/02-01-using-profiles.specly) → [04-01-digital-product-catalog.specly](./04-domains/04-01-digital-product-catalog.specly)