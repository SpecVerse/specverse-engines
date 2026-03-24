# SpecVerse Fundamentals

**Start here!** These examples teach the core concepts of SpecVerse v3.2 in a progressive learning path.

## Learning Objectives

By completing these examples, you will understand:
- How to use the v3.2 container format (`components:` and `deployments:`)
- How to define models with attributes using convention syntax
- How to add lifecycles to track state changes
- How to define behaviors with parameters and constraints
- How to create relationships between models

## Examples in Order

### 1. [01-01: Basic Model](./01-01-basic-model.md) 
**Concepts**: Container format, models, attributes, convention syntax
- Your first SpecVerse v3.2 model
- Container format with components and deployments
- Basic attribute definitions using convention syntax
- Type system and constraints (`name: Type modifiers`)
- Import system with file paths and select lists

### 2. [01-02: Model with Lifecycle](./01-02-model-with-lifecycle.md)
**Concepts**: Lifecycles, states, flow syntax  
- Adding state management to models
- Flow syntax for state transitions (`state -> state -> state`)
- Circular and linear workflows
- Business process modeling

### 3. [01-03: Model with Behaviors](./01-03-model-with-behaviors.md)
**Concepts**: Behaviors, parameters, contracts, events
- Adding declarative business logic to models
- Parameters using convention syntax
- Requires/Ensures contracts for validation
- Event publishing with attributes format
- Contract-driven development

### 4. [01-04: Models with Relations](./01-04-models-with-relations.md)
**Concepts**: Relationships, hasMany, belongsTo
- Connecting models through relationships
- hasMany and belongsTo relationship patterns
- Navigation patterns and data integrity
- Normalized data structure design

## Prerequisites

- Basic understanding of YAML syntax
- Familiarity with object-oriented concepts  
- SpecVerse v3 CLI tools installed and working (`specverse --help`)

## Next Steps

After completing the fundamentals:
1. **Profiles** ([../02-profiles/](../02-profiles/)) - Learn dynamic model composition
2. **Architecture** ([../03-architecture/](../03-architecture/)) - Controllers, services, and events
3. **Domain Examples** ([../04-domains/](../04-domains/)) - Real-world business applications

## Format Options

Each example is available in both formats:
- **`.specly`** - Primary Specly DSL format with v3.2 container syntax (recommended for learning)
- **`.yaml`** - Generated YAML format created from Specly using `specverse gen yaml`

**Recommendation**: Start with the `.md` documentation files, then study the `.specly` source code.