# Example 03-01: Enhanced Import System

This example demonstrates SpecVerse v3.2's powerful import system that enables component reusability and modular architecture through granular construct selection and clean syntax.

## Learning Objectives

- Master the v3.2 import system with selective construct importing
- Learn container-based component structure
- Understand granular import of specific constructs (Models, Types, Services, etc.)
- Explore component composition through imports
- See how imported constructs integrate with local definitions

## Key Concepts

### V3.1 Import Syntax

SpecVerse v3.2 uses clean array-based imports with selective construct importing:

```specly
components:
  EnhancedImportDemo:
    import:
      - from: "@specverse/primitives"
        select: [UUID, Money, Email, Phone]
```

### Import Sources

**Local File Imports**:
```specly
import:
  - from: "@specverse/primitives"
    select: [UUID, Money, Email, Phone]
```

### Container Integration

Imported constructs integrate seamlessly with the v3.2 container format:

```specly
components:
  MyComponent:
    models:
      UserProfile:
        attributes:
          id: UUID required        # Using imported type
          email: Email required    # Using imported type
```

## Example Structure

### Component Configuration

The example demonstrates a user profile system that imports common primitives and shows complete v3.2 architecture:

**Imports**:
- Basic primitives (UUID, Money, Email, Phone) from common definitions
- Clean array-based import syntax

### UserProfile Model with Relationships

Shows integration of imported constructs with v3.2 features:
- Uses imported `UUID` and `Email` primitives 
- Demonstrates relationships with `belongsTo` syntax
- Includes lifecycle states and transitions
- Contains behaviors with requires/ensures contracts

```specly
UserProfile:
  description: "User profile with imported primitives"
  attributes:
    id: UUID required
    email: Email required
    phone: Phone
  relationships:
    organization: belongsTo OrganizationModel
  lifecycles:
    status:
      states: [draft, active, suspended, archived]
      transitions:
        activate: draft -> active
        suspend: active -> suspended
```

### V3.1 Import Benefits

1. **Clean Syntax**: Simple array-based import declarations
2. **Selective Imports**: Import only specific constructs with `select:`
3. **Container Integration**: Imports work seamlessly with components structure
4. **Type Safety**: Imported primitives integrate with convention syntax
5. **Clear Dependencies**: Explicit file paths and selections

## Usage Patterns

### Selective Primitive Import
Import only the primitives you need:
```specly
import:
  - from: "@specverse/primitives"
    select: [UUID, Email, Phone]  # Not importing all available primitives
```

### Complete Architecture Integration
The example shows full v3.2 architecture with controllers, services, and events:
```specly
controllers:
  ProfileController:
    model: UserProfile
    actions:
      updateProfile:
        parameters:
          profileId: UUID required    # Using imported primitive
          updateData: String required

services:
  ProfileService:
    operations:
      processProfileUpdate:
        parameters:
          profile: UserProfile required
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:18.067Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class UserProfile {
        +id: UUID required
        +email: Email required
        +phone: Phone
        +userId: String required
        +sessionToken: String
        +updateProfile(updateData: String): UserProfile %% requires: user has update permission, profile is not archived | ensures: audit trail is created, notification is sent | publishes: ProfileUpdated
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class OrganizationModel {
        +id: UUID required
        +name: String required
        +adminUser: String required
        +validateAdmin(user: String): Boolean %% requires: user is active | ensures: permission is verified
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    UserProfile -- OrganizationModel : 1_organization
    OrganizationModel o-- UserProfile : *_profiles
    ProfileController -- UserProfile : 1_manages

    %% Other components
    class ProfileController {
        <<controller>>
        ProfileController
    }
    class ProfileService {
        <<service>>
        ProfileService
    }
    class ProfileUpdated {
        <<event>>
        ProfileUpdated
    }
    class OrganizationChanged {
        <<event>>
        OrganizationChanged
    }
`} />

</div>


### UserProfile - status Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% UserProfile - status Lifecycle
    ___ --> draft : start
    draft --> active : activate
    active --> suspended : suspend
`} />


## Best Practices

1. **Import Only What You Need**: Use granular selection with `select:` to minimize dependencies
2. **Use File Paths**: Clear relative file paths for local imports
3. **Container Integration**: Leverage imports within the components structure
4. **Type Safety**: Imported primitives work seamlessly with convention syntax
5. **Organize Imports**: Group imports at the component level

## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
components:
  EnhancedImportDemo:
    version: "3.2.0"
    description: "Example 03-01: Demonstrates import system with granular selection"
    
    export:
      models: [UserProfile, OrganizationModel]
      events: [ProfileUpdated, OrganizationChanged]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, Money, Email, Phone]
    
    models:
      UserProfile:
        description: "User profile with imported primitives"
        attributes:
          id: UUID required
          email: Email required
          phone: Phone
        relationships:
          organization: belongsTo OrganizationModel
        behaviors:
          updateProfile:
            description: "Update user profile with audit trail"
            parameters:
              updateData: String required
            publishes: [ProfileUpdated]
            returns: UserProfile

deployments: {}
```

See the full file: [03-01-enhanced-imports.specly](./03-01-enhanced-imports.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml 03-01-enhanced-imports.specly -o 03-01-enhanced-imports.yaml
```

## Key Features Demonstrated

- **V3.1 Container Format**: Components and deployments structure
- **Import System**: File-based imports with selective construct selection
- **Convention Syntax**: `name: Type modifiers` attribute definitions
- **Relationships**: `belongsTo` and `hasMany` relationship syntax
- **Controllers**: Actions with parameters and return types
- **Services**: Operations with business logic
- **Events**: Event definitions with attributes
- **Views**: UI component integration

## Validation

```bash
# Validate the Specly source file
specverse validate examples/03-architecture/03-01-enhanced-imports.specly

# Run full test cycle
specverse test cycle examples/03-architecture/03-01-enhanced-imports.specly
```

## Next Steps

Continue to [Example 03-02: Controllers and Actions](./03-02-controllers-and-actions) to see how controllers coordinate operations with imported primitives.

## Related Examples

- [Example 01-01: Basic Model](../01-fundamentals/01-01-basic-model) - Foundation model concepts
- [Example 02-01: Using Profiles](../02-profiles/02-01-using-profiles) - Profile system with imports
- [Example 03-05: Complete Event Flow](./03-05-complete-event-flow) - Advanced architecture patterns

## Key Takeaways

- SpecVerse v3.2's import system enables clean component modularity
- Selective imports with `select:` prevent dependency bloat
- Imported primitives integrate seamlessly with convention syntax
- Container format provides clear organization structure
- Complete architecture patterns work together (models, controllers, services, events)