# Example 05-02: SpecVerse App Build

This example demonstrates how to specify build systems, CI/CD pipelines, and development toolchains using SpecVerse, treating infrastructure and build processes as first-class specifications.

**Format**: v3.2 Components and Deployments containers with convention syntax

## Learning Objectives

- Model build systems and development workflows
- Specify CI/CD pipelines declaratively
- Design toolchain integration patterns
- Create reproducible development environments
- Build infrastructure-as-code specifications

## Build System Specification

### v3.2 Component Structure

```yaml
components:
  SpecVerseAppBuild:
    version: "3.2.0"
    description: "Meta-model showing how to build a SpecVerse application system"
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, DateTime]
    
    export:
      models: [VersionedProfile, Specification, Model, Controller, Event]
      controllers: [SpecificationController]
      events: [SpecificationCreated, SpecificationValidated]
```

### Model Definitions with Convention Syntax

```yaml
    models:
      VersionedProfile:
        description: "Profile for components that are versioned"
        attributes:
          versionString: String required
          created: DateTime required
          lastModified: DateTime required
          author: String
          componentId: UUID required
        profile-attachment:
          profiles: [Specification, Model, Controller, Event]

      Specification:
        description: "The root container for a SpecVerse specification"
        attributes:
          specVersion: String required
          name: String required
          description: String required
          versionString: String required
          modelCount: Integer default=0
          status: String default=draft values=["draft", "published", "deprecated"]
```

### Model Relationships and Constraints

```yaml
      Model:
        description: "A data model definition"
        attributes:
          name: String required
          description: String required
          attributeCount: Integer default=0
          hasProfiles: Boolean default=false
          specificationId: UUID required
        relationships:
          specification: belongsTo Specification

      Event:
        description: "A notification of a state change in the system"
        attributes:
          name: String required
          description: String required
          eventType: String required values=["Created", "Updated", "Validated", "Published", "Deprecated"]
          specificationId: UUID required
        relationships:
          specification: belongsTo Specification
```

## CI/CD Pipeline Specification

### Controller Actions with Event Publishing

```yaml
    controllers:
      SpecificationController:
        description: "Controller for specification operations"
        model: Specification
        actions:
          createSpecification:
            description: "Create a new specification"
            parameters:
              name: String required
              description: String required
              specVersion: String required
            returns: Specification
            requires: ["Name is unique", "Spec version is valid"]
            ensures: ["Specification is persisted", "Initial version is set"]
            publishes: [SpecificationCreated]
          
          validateSpecification:
            description: "Validate a specification against the meta-schema"
            parameters:
              specificationId: UUID required
            returns: String
            requires: ["Specification exists"]
            ensures: ["Validation results are returned", "Status is updated"]
            publishes: [SpecificationValidated]
```

### Event Definitions with Structured Attributes

```yaml
    events:
      SpecificationCreated:
        description: "Triggered when a new specification is created"
        attributes:
          specificationId: UUID required
          name: String required
          specVersion: String required
          createdBy: String required
          timestamp: DateTime required

      SpecificationValidated:
        description: "Triggered when a specification is validated"
        attributes:
          specificationId: UUID required
          name: String required
          valid: Boolean required
          errorCount: Integer required
          warningCount: Integer required
          validatedAt: DateTime required
```

## Development Environment

### Deployment Configuration

```yaml
deployments: {}
```

This meta-model focuses on the build system structure itself rather than runtime deployment topology. The `deployments` section is intentionally empty as this specification describes the build process, not the deployment of built artifacts.

### Generated YAML Format

The SpecVerse v3.2 parser generates expanded YAML from the concise Specly DSL:

```yaml
components:
  SpecVerseAppBuild:
    version: "3.2.0"
    description: "Example 05-02: Meta-model showing how to build a SpecVerse application system"
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, DateTime]
    
    models:
      VersionedProfile:
        description: "Profile for components that are versioned"
        attributes:
          versionString:
            type: String
            required: true
          created:
            type: DateTime  
            required: true
          componentId:
            type: UUID
            required: true
        profile-attachment:
          profiles: [Specification, Model, Controller, Event]

deployments: {}
```

## Code Quality and Standards

## Key v3.2 Features Demonstrated

### Profile Attachments
- **VersionedProfile**: Attaches versioning behavior to multiple model types
- **Profile syntax**: `profile-attachment:` with `profiles:` array
- **Cross-cutting concerns**: Versioning applies to Specifications, Models, Controllers, Events

### Convention Syntax Benefits
- **Concise declarations**: `name: String required` instead of verbose YAML
- **Value constraints**: `values=["option1", "option2"]` syntax
- **Default values**: `default=0` and `default=draft` syntax
- **Relationship declarations**: `belongsTo ModelName` syntax

### Build System Modeling

This example shows how build systems themselves can be modeled in SpecVerse:

1. **Specifications as data**: Build systems create and validate specifications
2. **Version tracking**: VersionedProfile tracks changes across all artifacts  
3. **Event-driven builds**: Controllers publish events when specifications are created/validated
4. **Type safety**: Strong typing ensures build system integrity

### Meta-Circular Architecture

```bash
# The build system that processes this specification
# is itself specified by this specification
specverse validate 05-02-specverse-app-build.specly
specverse gen yaml 05-02-specverse-app-build.specly -o build-system.yaml
```

## Artifact Management

### Infrastructure as Code Patterns

```yaml
# Example: Build infrastructure could be specified as deployment
deployments:
  BuildInfrastructure:
    environment: "ci-cd"
    description: "Build system deployment topology"
    
    services:
      BuildAgent:
        component: SpecVerseAppBuild
        replicas: 3
        resources:
          cpu: "2 cores"
          memory: "4GB"
      
      ArtifactStore:
        component: StorageService
        persistence: true
        backup: daily
```

This example focuses on the build system model rather than deployment topology, but shows how deployment specifications could extend the build model.

### Build Pipeline Integration

The build system integrates with SpecVerse tooling:

```bash
# Development workflow
specverse init my-project                    # Generate project structure
specverse validate src/*.specly              # Validate all specifications
specverse gen yaml src/main.specly -o dist/# Generate artifacts
specverse test dist/                         # Test generated code

# CI/CD integration
specverse validate src/*.specly               # Validate entire project
specverse build --target production         # Production build
specverse deploy --environment staging      # Deploy to staging
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:16.833Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class VersionedProfile {
        <<profile>>
        +versionString: String required
        +created: DateTime required
        +lastModified: DateTime required
        +author: String
        +componentId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Specification {
        +specVersion: String required
        +name: String required
        +description: String required
        +versionString: String required
        +modelCount: Integer = 0
        +status: String = draft
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Model {
        +name: String required
        +description: String required
        +attributeCount: Integer = 0
        +hasProfiles: Boolean = false
        +specificationId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Controller {
        +name: String required
        +description: String required
        +actionCount: Integer = 0
        +specificationId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Event {
        +name: String required
        +description: String required
        +eventType: String required
        +specificationId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    VersionedProfile <|.. Specification : 1_attaches_to_priority__0
    VersionedProfile <|.. Model : 1_attaches_to_priority__0
    VersionedProfile <|.. Controller : 1_attaches_to_priority__0
    VersionedProfile <|.. Event : 1_attaches_to_priority__0
    Model -- Specification : 1_specification
    Controller -- Specification : 1_specification
    Event -- Specification : 1_specification
    SpecificationController -- Specification : 1_manages

    %% Other components
    class SpecificationController {
        <<controller>>
        SpecificationController
    }
    class SpecificationCreated {
        <<event>>
        SpecificationCreated
    }
    class SpecificationValidated {
        <<event>>
        SpecificationValidated
    }
`} />

</div>



## Complete Example

### Specly DSL Format (Source)
See [./05-02-specverse-app-build.specly](./05-02-specverse-app-build.specly) for the concise Specly DSL source format.

### Generated: YAML Format
The SpecVerse v3.2 parser generates expanded YAML from the Specly DSL above, converting the convention syntax into full type definitions with explicit constraints and relationships.

## Key Features Demonstrated

- **Profile attachments**: VersionedProfile applies to multiple model types
- **Convention syntax**: Concise `name: Type modifiers` declarations
- **Event-driven architecture**: Controllers publish specification lifecycle events
- **Container structure**: v3.2 components and deployments separation
- **Meta-circular modeling**: Build system specified using itself
- **Type constraints**: Strong typing with value enumerations and defaults

## Infrastructure as Code

### SpecVerse v3.2 Processing Chain

```bash
# 1. Parse Specly DSL
specverse parse 05-02-specverse-app-build.specly

# 2. Validate against schema
specverse validate 05-02-specverse-app-build.specly

# 3. Generate YAML output
specverse gen yaml 05-02-specverse-app-build.specly -o build-system.yaml

# 4. Use in build pipeline
specverse build --config build-system.yaml
```

### Build System Events

The build system publishes events for monitoring and integration:

```yaml
# Events published during build process
SpecificationCreated -> triggers validation
SpecificationValidated -> triggers build
BuildCompleted -> triggers deployment
DeploymentCompleted -> triggers monitoring
```

These events enable event-driven build pipelines and integration with external systems.

## Validation

Test this example:
```bash
# Validate the Specly DSL format (primary)
specverse validate examples/05-meta/05-02-specverse-app-build.specly

# Transpile to YAML and validate  
specverse gen yaml examples/05-meta/05-02-specverse-app-build.specly -o /tmp/build-output.yaml
specverse validate /tmp/build-output.yaml
```

## Next Steps

Continue to [Example 06-01: Basic Deployment Intro](../06-deploy/06-01-basic-deployment-intro) to see how deployment topologies complement build specifications.

## Related Examples

- [Example 05-01: SpecVerse Meta-Specification](./05-01-specverse-meta-specification) - Self-describing language
- [Example 06-01: Basic Deployment Intro](../06-deploy/06-01-basic-deployment-intro) - Deployment fundamentals
- [Example 04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog) - Complete application example