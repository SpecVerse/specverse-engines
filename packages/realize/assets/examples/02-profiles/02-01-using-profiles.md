# Example 02-01: Using Profiles

This example demonstrates SpecVerse's powerful profile attachment system in v3.2, enabling dynamic composition of model functionality based on runtime conditions.

## Learning Objectives

- Understand profile-attachment configuration and criteria in v3.2
- Learn how profiles extend base models without inheritance
- Master dynamic profile attachment for flexible model composition
- Explore profile-based behavioral extensions
- Design composable model architectures

## Key Concepts

### Profile Attachment System in v3.2

The profile attachment system allows models to dynamically acquire new capabilities through profile composition. Profiles are separate models that can attach to base models conditionally.

```specly
components:
  SpecVerseProfiles:
    models:
      DigitalProductProfile:
        description: "Profile for digital products (downloads, software, etc.)"
        attributes:
          downloadUrl: String required
          fileSize: String
          fileFormat: String
          license: String required
        profile-attachment:
          profiles: [Product]
```

### Profile Model Pattern

Profiles are regular models with a special `profile-attachment` section that defines which models they can extend:

```specly
PhysicalProductProfile:
  description: "Profile for physical products (shipping, inventory, etc.)"
  attributes:
    weight: Number required
    dimensions: String
    shippingClass: String required
    fragile: Boolean default=false
  profile-attachment:
    profiles: [Product]
```

### Dynamic Composition

Profiles enable runtime composition without traditional inheritance:

```specly
# Base model remains simple and focused
Product:
  description: "Base product model that can be extended with profiles"
  attributes:
    id: UUID required unique
    name: String required
    price: Money required
    category: String required

# Profiles add specialized capabilities
DigitalProductProfile:
  attributes:
    downloadUrl: String required
    license: String required
    downloadLimit: Integer default=5
  profile-attachment:
    profiles: [Product]
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:18.309Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required unique
        +name: String required
        +productDescription: String
        +price: Money required
        +category: String required
        +productTags: String
        +createdAt: DateTime required
        +updatedAt: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class DigitalProductProfile {
        <<profile>>
        +downloadUrl: String required
        +fileSize: String
        +fileFormat: String
        +license: String required
        +downloadLimit: Integer = 5
        +expirationDays: Integer = 30
        +minimumPrice: Money = 0.00
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class PhysicalProductProfile {
        <<profile>>
        +weight: Number required
        +dimensions: String
        +shippingClass: String required
        +fragile: Boolean = false
        +stockLevel: Integer = 0
        +reorderPoint: Integer = 10
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    DigitalProductProfile <|.. Product : 1_attaches_to_priority__0
    PhysicalProductProfile <|.. Product : 1_attaches_to_priority__0
`} />

</div>


## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
components:
  SpecVerseProfiles:
    version: "3.2.0"
    description: "Example 02-01: Profile attachment system (v3.2 feature)"
    
    export:
      models: [Product, DigitalProductProfile, PhysicalProductProfile]
    
    import:
      - from: "@specverse/primitives"
        select: [Money]
    
    models:
      Product:
        description: "Base product model that can be extended with profiles"
        attributes:
          id: UUID required unique
          name: String required
          productDescription: String
          price: Money required
          category: String required
          productTags: String
          createdAt: DateTime required
          updatedAt: DateTime required
      
      DigitalProductProfile:
        description: "Profile for digital products (downloads, software, etc.)"
        attributes:
          downloadUrl: String required
          fileSize: String
          fileFormat: String
          license: String required
          downloadLimit: Integer default=5
          expirationDays: Integer default=30
          minimumPrice: Money default=0.00
        profile-attachment:
          profiles: [Product]
      
      PhysicalProductProfile:
        description: "Profile for physical products (shipping, inventory, etc.)"
        attributes:
          weight: Number required
          dimensions: String
          shippingClass: String required
          fragile: Boolean default=false
          stockLevel: Integer default=0
          reorderPoint: Integer default=10
        profile-attachment:
          profiles: [Product]

deployments: {}
```

See the full file: [02-01-using-profiles.specly](./02-01-using-profiles.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml 02-01-using-profiles.specly -o 02-01-using-profiles.yaml
```

## Profile Attachment Pattern

The profile attachment system enables flexible model composition:

1. **Base Model** - Product provides core functionality
2. **Profile Models** - DigitalProductProfile and PhysicalProductProfile add specialized attributes
3. **Attachment Declaration** - `profile-attachment: profiles: [Product]` defines which models can be extended
4. **Runtime Composition** - Profiles attach to Product instances based on business logic

## Benefits of Profile System

### Composition Over Inheritance
- Multiple profiles can potentially attach to the same model instance
- Profiles provide functionality without rigid class hierarchies  
- Business logic emerges from profile interactions

### Modular Design
- Base models remain simple and focused
- Profiles add specialized capabilities only when needed
- Clear separation of concerns across different product types

### Reusability
- Profiles can be designed to attach to multiple model types
- Common patterns can work across different entities
- Profile attributes are self-contained and testable

## Key Features Demonstrated

- **Profile-attachment**: Dynamic model composition in v3.2
- **Specialized attributes**: Different profiles for different product types
- **Container format**: v3.2 components and deployments structure
- **Convention syntax**: `name: Type modifiers` attribute definitions
- **Import system**: Shared types from common definitions

## Validation

Test this example:
```bash
# Validate the Specly source file
specverse validate examples/02-profiles/02-01-using-profiles.specly

# Run full test cycle
specverse test cycle examples/02-profiles/02-01-using-profiles.specly
```

## Next Steps

Continue to [Example 02-02: Profile Attachment](./02-02-profile-attachment) to learn advanced profile scenarios including multiple profiles and profile interactions.

## Related Examples

- [Example 01-01: Basic Model](../01-fundamentals/01-01-basic-model) - Foundation for profile attachment
- [Example 03-02: Controllers and Actions](../03-architecture/03-02-controllers-and-actions) - Using profiles in system architecture