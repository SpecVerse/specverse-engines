# Example 11-07: Profiles and Model Diagrams

**Demonstrates**: Profile attachments, model inheritance, and ER diagrams

## Overview

This example showcases profile-based architecture where models can have dynamic profiles attached at runtime. Perfect for demonstrating ER diagrams, model inheritance, and profile attachment patterns.

## Diagram Types Demonstrated

### 1. Profile Attachment Diagram (`profile-attachment`)
Shows which profiles can attach to which models and the attachment conditions.

### 2. Model Inheritance Diagram (`model-inheritance`)
Visualizes the inheritance hierarchy between models and profiles.

### 3. ER Diagram (`er-diagram`)
Traditional entity-relationship diagram showing all models, attributes, and relationships.

## Example Scenario

**Product Profile System** with:
- **Base Model**: Product (main entity)
- **Profiles**:
  - DigitalProduct (downloadable items)
  - AuditProfile (compliance tracking)
  - ActiveProductProfile (lifecycle state)
  - SubscriptionProfile (recurring billing)
  - DiscountProfile (pricing modifications)

## Key Features

### Profile Attachment
```yaml
DigitalProduct:
  attributes:
    downloadUrl: URL required
    fileSize: Integer required
  profile-attachment:
    profiles: [Product]  # Can attach to Product
```

### Dynamic Composition
Profiles allow runtime composition - a Product can have multiple profiles attached based on its state and type.

## Generated Diagrams

### Profile Attachment Diagram
Shows the attachment relationships:
- Product ← DigitalProduct
- Product ← AuditProfile
- Product ← SubscriptionProfile
- Product ← DiscountProfile

### Model Inheritance
Shows how profiles extend base models with additional attributes and behaviors.

### ER Diagram
Complete entity-relationship view with all attributes and relationships.

## Generation

```bash
# Generate profile attachment diagram
specverse gen diagram 11-07-profiles-demo.specly -t profile-attachment

# Generate model inheritance
specverse gen diagram 11-07-profiles-demo.specly -t model-inheritance

# Generate ER diagram
specverse gen diagram 11-07-profiles-demo.specly -t er-diagram

# Generate all diagrams
specverse gen diagram 11-07-profiles-demo.specly
```

## Use Cases

1. **Dynamic Composition**: Models that need runtime behavior modification
2. **Multi-tenant Systems**: Different tenants with different profile combinations
3. **Feature Flags**: Profiles as feature enablers
4. **Compliance**: Audit profiles for regulatory requirements
5. **Extensibility**: Add new capabilities without modifying base models

## Best Practices

1. **Clear Profile Purpose**: Each profile should have a single, focused purpose
2. **Minimal Coupling**: Profiles should be independent of each other
3. **Attachment Conditions**: Use conditions to control when profiles attach
4. **Profile Priority**: Use priority when multiple profiles compete
5. **Documentation**: Document what each profile adds to the base model

---

**See**: `generated-diagrams/11-07-*.mmd` for full generated Mermaid diagrams
