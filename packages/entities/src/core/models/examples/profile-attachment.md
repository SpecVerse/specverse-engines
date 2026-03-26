# Example 02-02: Profile Attachment

This advanced example demonstrates multiple profile attachment scenarios in SpecVerse v3.2, showcasing how different profiles can provide specialized capabilities to base models and create composable architectures.

## Learning Objectives

- Design multiple profile models for specialized functionality
- Create profile models with behaviors that extend base functionality
- Master audit trail patterns for compliance tracking
- Explore contract-based behavior design with requires/ensures
- Understand how multiple profiles can complement base models

## Key Concepts

### Multiple Profile Architecture

This example shows how a single base model can be extended by multiple specialized profiles:

```specly
components:
  SpecVerseAdvancedProfiles:
    models:
      Product:
        description: "Base product that can have multiple profiles attached"
        attributes:
          id: UUID required
          name: String required
          basePrice: Money required
          category: String required
          isPublished: Boolean default=false
        behaviors:
          calculateFinalPrice:
            description: "Calculate price with all attached profile modifications"
            requires: ["basePrice > 0"]
            returns: Money
            ensures: ["Returns price after all profile price modifications are applied"]
```

### Digital Product Profile

Digital products require special handling for downloads, licensing, and file management:

```specly
DigitalProduct:
  description: "Digital product profile for downloadable items"
  attributes:
    downloadUrl: URL required
    fileSize: Integer required
    licenseType: String required
  profile-attachment:
    profiles: [Product]
  behaviors:
    generateDownloadLink:
      description: "Generate secure, time-limited download link"
      returns: URL
      ensures: ["Returns secure download URL with expiration"]
```

### Audit Trail Profile

Audit profiles provide compliance tracking and change management across different model types:

```specly
AuditProfile:
  description: "Audit trail profile for compliance tracking"
  attributes:
    createdBy: UUID required
    createdAt: DateTime required
    lastModifiedBy: UUID
    lastModifiedAt: DateTime
  profile-attachment:
    profiles: [Product]
  behaviors:
    recordChange:
      description: "Record a change in the audit trail"
      parameters:
        field: String required
        newValue: String required
        userId: UUID required
      ensures: ["Change is recorded with timestamp and user ID"]
```

### Lifecycle-Based Profile

Profiles can provide functionality that's only available in specific lifecycle states:

```specly
ActiveProductProfile:
  description: "Profile for products in active lifecycle state"
  attributes:
    activatedAt: DateTime required
    activatedBy: UUID required
  profile-attachment:
    profiles: [Product]
  behaviors:
    performActiveTasks:
      description: "Tasks only available for active products"
      requires: ["Product is in active state"]
```

### Subscription Profile

Subscription profiles handle recurring billing and subscription management:

```specly
SubscriptionProfile:
  description: "Profile for subscription-based products"
  attributes:
    subscriptionType: String required
    billingCycle: String required
    recurringPrice: Money required
  profile-attachment:
    profiles: [Product]
  behaviors:
    applyRecurring:
      description: "Apply recurring billing logic"
      returns: Money
```

### Discount Profile

Discount profiles apply pricing modifications:

```specly
DiscountProfile:
  description: "Profile for applying discounts to products"
  attributes:
    discountType: String required
    discountValue: Money required
    validUntil: DateTime
  profile-attachment:
    profiles: [Product]
  behaviors:
    applyDiscount:
      description: "Apply discount to base price"
      returns: Money
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:18.212Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required
        +name: String required
        +basePrice: Money required
        +category: String required
        +isPublished: Boolean = false
        +calculateFinalPrice(): Money %% requires: basePrice > 0 | ensures: Returns price after all profile price modifications are applied
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class DigitalProduct {
        <<profile>>
        +downloadUrl: URL required
        +fileSize: Integer required
        +licenseType: String required
        +generateDownloadLink(): URL %% ensures: Returns secure download URL with expiration
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class AuditProfile {
        <<profile>>
        +createdBy: UUID required
        +createdAt: DateTime required
        +lastModifiedBy: UUID
        +lastModifiedAt: DateTime
        +recordChange(field: String, newValue: String, userId: UUID) %% ensures: Change is recorded with timestamp and user ID
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ActiveProductProfile {
        <<profile>>
        +activatedAt: DateTime required
        +activatedBy: UUID required
        +performActiveTasks() %% requires: Product is in active state
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class SubscriptionProfile {
        <<profile>>
        +subscriptionType: String required
        +billingCycle: String required
        +recurringPrice: Money required
        +applyRecurring(): Money
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class DiscountProfile {
        <<profile>>
        +discountType: String required
        +discountValue: Money required
        +validUntil: DateTime
        +applyDiscount(): Money
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    DigitalProduct <|.. Product : 1_attaches_to_priority__0
    AuditProfile <|.. Product : 1_attaches_to_priority__0
    ActiveProductProfile <|.. Product : 1_attaches_to_priority__0
    SubscriptionProfile <|.. Product : 1_attaches_to_priority__0
    DiscountProfile <|.. Product : 1_attaches_to_priority__0
`} />

</div>


## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
components:
  SpecVerseAdvancedProfiles:
    version: "3.2.0"
    description: "Example 02-02: Advanced profile attachment scenarios"
    
    export:
      models: [Product, DigitalProduct, AuditProfile, ActiveProductProfile, SubscriptionProfile, DiscountProfile]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, Money, DateTime, URL]
    
    models:
      Product:
        description: "Base product that can have multiple profiles attached"
        attributes:
          id: UUID required
          name: String required
          basePrice: Money required
          category: String required
          isPublished: Boolean default=false
        behaviors:
          calculateFinalPrice:
            description: "Calculate price with all attached profile modifications"
            requires: ["basePrice > 0"]
            returns: Money
            ensures: ["Returns price after all profile price modifications are applied"]
      
      # Multiple profile models with different specializations
      DigitalProduct:
        description: "Digital product profile for downloadable items"
        attributes:
          downloadUrl: URL required
          fileSize: Integer required
          licenseType: String required
        profile-attachment:
          profiles: [Product]
        behaviors:
          generateDownloadLink:
            description: "Generate secure, time-limited download link"
            returns: URL
            ensures: ["Returns secure download URL with expiration"]
      
      AuditProfile:
        description: "Audit trail profile for compliance tracking"
        attributes:
          createdBy: UUID required
          createdAt: DateTime required
          lastModifiedBy: UUID
          lastModifiedAt: DateTime
        profile-attachment:
          profiles: [Product]
        behaviors:
          recordChange:
            description: "Record a change in the audit trail"
            parameters:
              field: String required
              newValue: String required
              userId: UUID required
            ensures: ["Change is recorded with timestamp and user ID"]

deployments: {}
```

See the full file: [02-02-profile-attachment.specly](./02-02-profile-attachment.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml 02-02-profile-attachment.specly -o 02-02-profile-attachment.yaml
```

## Profile Composition Patterns

### Multiple Profiles on One Model
A single Product instance can have multiple profiles attached simultaneously:
- **DigitalProduct** - For download functionality
- **AuditProfile** - For compliance tracking
- **SubscriptionProfile** - For recurring billing
- **DiscountProfile** - For pricing modifications

### Behavior Orchestration
When multiple profiles are attached, their behaviors can work together:
1. `Product.calculateFinalPrice()` calls base price calculation
2. `SubscriptionProfile.applyRecurring()` modifies for subscription
3. `DiscountProfile.applyDiscount()` applies final discounts
4. `AuditProfile.recordChange()` logs the price calculation

## Key Features Demonstrated

- **Multiple profile attachment**: Single model extended by multiple specialized profiles
- **Profile behaviors**: Each profile adds its own business logic
- **Container format**: v3.2 structure with components and deployments
- **Convention syntax**: Simplified attribute and parameter definitions
- **Behavioral composition**: How profiles work together

## Practical Use Cases

- **E-commerce platforms**: Products with digital, subscription, and discount capabilities
- **SaaS applications**: Feature profiles based on subscription tiers
- **Compliance systems**: Audit trail profiles for regulated industries
- **Multi-tenant systems**: Tenant-specific capability profiles

## Validation

Test this example:
```bash
# Validate the Specly source file
specverse validate examples/02-profiles/02-02-profile-attachment.specly

# Run full test cycle
specverse test cycle examples/02-profiles/02-02-profile-attachment.specly
```

## Next Steps

Continue to [Example 03-01: Enhanced Imports](../03-architecture/03-01-enhanced-imports) to learn about building modular system architectures.

## Related Examples

- [Example 02-01: Using Profiles](./02-01-using-profiles) - Profile basics and fundamentals
- [Example 03-03: Services and Events](../03-architecture/03-03-services-and-events) - Profile integration with services
- [Example 04-02: Organization Management](../04-domains/04-02-organization-management) - Real-world profile usage