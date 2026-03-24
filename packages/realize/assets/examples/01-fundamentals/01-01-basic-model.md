# Example 01-01: Basic Model Definition

This fundamental example demonstrates the core building blocks of SpecVerse v3.3.2: defining models with attributes and basic constraints using the container format.

## Learning Objectives

- Understand the v3.2 container format with `components:` and `deployments:`
- Define models with attributes using convention syntax
- Apply basic type constraints
- Use common data types effectively

## Key Concepts

### Container Format
Every SpecVerse v3.2 specification uses the container format:
```specly
components:
  SpecVerseFundamentals:
    version: "3.2.0"
    description: "Example 01-01: Basic model definition with attributes"
    
    # Component content goes here
    
deployments: {}
```

### Model Definition
Models represent business entities with structured attributes using convention syntax:
```specly
models:
  Product:
    description: "Simple product with basic attributes"
    attributes:
      id: UUID required
      name: String required
      summary: String
      price: Money required
      inStock: Boolean default=true
      category: String required values=["electronics","books","clothing","home"]
      contactEmail: Email
```

### Import and Export System
Components can import common primitives and export their models:
```specly
export:
  models: [Product]

import:
  - from: "@specverse/primitives"
    select: [Money]
```

### Type System  
- **UUID**: Universally unique identifier (built-in type)
- **String**: Text values with optional length constraints (v3.2 uses String instead of Text)
- **Money**: Monetary values (imported from common business types)
- **Boolean**: True/false values
- **Email**: Email address format (built-in type)

### Convention Syntax for Attributes
v3.2 uses a streamlined convention syntax for attributes:
- **Basic format**: `name: Type modifiers`
- **required**: Field must have a value (e.g., `id: UUID required`)
- **default**: Provides fallback value when not specified (e.g., `inStock: Boolean default=true`)
- **values**: Enumerated allowed values (e.g., `category: String required values=["electronics","books","clothing","home"]`)

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:18.690Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required
        +name: String required
        +summary: String
        +price: Money required
        +inStock: Boolean = true
        +category: String required values=[electronics, books, clothing, home]
        +contactEmail: Email
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
`} />

</div>


## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
components:
  SpecVerseFundamentals:
    version: "3.2.0"
    description: "Example 01-01: Basic model definition with attributes"
    
    export:
      models: [Product]
    
    import:
      - from: "@specverse/primitives"
        select: [Money]
    
    models:
      Product:
        description: "Simple product with basic attributes"
        attributes:
          id: UUID required
          name: String required
          summary: String
          price: Money required
          inStock: Boolean default=true
          category: String required values=["electronics","books","clothing","home"]
          contactEmail: Email

deployments: {}
```

See the full file: [01-01-basic-model.specly](./01-01-basic-model.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml 01-01-basic-model.specly -o 01-01-basic-model.yaml
```

## Key Features Demonstrated

- **Container format**: v3.2 structure with `components:` and `deployments:` sections
- **Component metadata**: Name, version, description in YAML structure
- **Model definition**: Simple business entity with attributes using convention syntax
- **Attribute types**: UUID, String (not Text), Money, Boolean, Email
- **Convention syntax**: Human-friendly `name: Type modifiers` format
- **Import/Export system**: Array-based imports with file path and select list

## Validation

Test this example:
```bash
# Validate the Specly source file
specverse validate examples/01-fundamentals/01-01-basic-model.specly

# Process to YAML and validate
specverse gen yaml examples/01-fundamentals/01-01-basic-model.specly -o temp.yaml
specverse validate temp.yaml

# Or use the test cycle command for full validation
specverse test cycle examples/01-fundamentals/01-01-basic-model.specly
```

## Next Steps

Continue to [Example 01-02: Model with Lifecycle](./01-02-model-with-lifecycle) to learn about state management and transitions.

## Related Examples

- [Example 01-04: Models with Relations](./01-04-models-with-relations) - Adding relationships between models
- [Example 02-01: Using Profiles](../02-profiles/02-01-using-profiles) - Extending models with profiles