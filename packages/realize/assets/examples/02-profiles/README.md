# SpecVerse Profiles

Learn SpecVerse's powerful **profile-attachment system** in v3.2 - the key feature that enables flexible model composition and dynamic behavior modification.

## Learning Objectives

By completing these examples, you will understand:
- How the v3.2 profile-attachment system works
- How profiles extend base models without inheritance
- How to design composable model architectures
- How multiple profiles can work together

## Key Concepts

### Profile-Attachment System in v3.2
In SpecVerse v3.2, profiles are separate models that can attach to base models using the `profile-attachment` mechanism:

```specly
DigitalProductProfile:
  description: "Profile for digital products"
  attributes:
    downloadUrl: String required
    license: String required
  profile-attachment:
    profiles: [Product]
```

### Composition Over Inheritance
Profiles provide capabilities without rigid class hierarchies:
- **Base models** remain simple and focused
- **Profiles** add specialized functionality
- **Multiple profiles** can attach to the same base model
- **Dynamic composition** enables flexible architectures

### Container Format Integration
Profiles work seamlessly with the v3.2 container format:
```specly
components:
  MyComponent:
    models:
      Product:        # Base model
      ProfileA:       # Profile 1
      ProfileB:       # Profile 2
```

## Examples in Order

### 1. [02-01: Using Profiles](./02-01-using-profiles.md)
**Concepts**: Basic profile usage, profile-attachment
- Creating your first profile models
- Using profile-attachment configuration
- Digital and Physical product profiles
- Base model extension patterns

### 2. [02-02: Profile Attachment](./02-02-profile-attachment.md)
**Concepts**: Multiple profiles, advanced scenarios
- Multiple profiles on one base model
- Profile behaviors and business logic
- Audit trail patterns with profiles
- Complex composition scenarios

## Prerequisites

- Complete [01-fundamentals](../01-fundamentals/) examples
- Understanding of v3.2 container format
- Familiarity with convention syntax
- SpecVerse v3 CLI tools installed

## Next Steps

After mastering profiles:
1. **Architecture** ([../03-architecture/](../03-architecture/)) - Controllers, services, and events
2. **Domain Examples** ([../04-domains/](../04-domains/)) - See profiles in real applications  
3. **Meta Examples** ([../05-meta/](../05-meta/)) - Advanced system specifications

## Profile Design Patterns

### Single-Purpose Profiles
Each profile should add one cohesive set of capabilities:
- **DigitalProductProfile** - Download and licensing
- **AuditProfile** - Compliance and tracking
- **SubscriptionProfile** - Recurring billing

### Clear Attachment Rules
Define which models can use each profile:
```specly
profile-attachment:
  profiles: [Product, Service, Asset]
```

### Behavior Composition
Profile behaviors can work together:
- Base model provides core functionality
- Profiles add specialized behaviors
- Multiple profiles can coordinate

## Real-World Use Cases

- **E-commerce**: Product profiles for digital/physical/subscription variants
- **SaaS platforms**: Feature profiles based on subscription tiers
- **Compliance systems**: Audit trail profiles for regulated industries
- **Multi-tenant systems**: Tenant-specific capability profiles
- **Content management**: Content type profiles with specialized attributes

## Validation

All profile examples can be tested:
```bash
# Validate individual examples
specverse validate examples/02-profiles/02-01-using-profiles.specly
specverse validate examples/02-profiles/02-02-profile-attachment.specly

# Run full test cycles
specverse test cycle examples/02-profiles/02-01-using-profiles.specly
specverse test cycle examples/02-profiles/02-02-profile-attachment.specly
```

The profile system is SpecVerse's most powerful composition feature - master it to build truly flexible, modular specifications!