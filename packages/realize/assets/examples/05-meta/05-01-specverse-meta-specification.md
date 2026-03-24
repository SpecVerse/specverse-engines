# Example 05-01: SpecVerse Meta-Specification (Auto-Generated)

This fascinating example demonstrates SpecVerse's self-describing capabilities by modeling the SpecVerse language itself, showing how specification languages can be self-referential and bootstrapped.

**🤖 AUTO-GENERATED**: This specification is automatically generated from the SpecVerse JSON Schema using `npm run meta:generate`. The generation ensures the meta-specification always matches the actual language definition.

**Format**: v3.2 Components and Deployments containers with convention syntax

## Learning Objectives

- Understand meta-specification concepts and self-reference
- Learn how SpecVerse models its own grammar and semantics
- Explore language bootstrapping and self-hosting
- Master recursive specification patterns
- See how tools can be generated from specifications
- **Study auto-generation patterns for maintaining consistency**

## Auto-Generation Process

### How It Works

This meta-specification is automatically generated from the canonical JSON Schema:

```bash
# Regenerate the meta-specification
npm run meta:generate

# Included automatically in the build process
npm run build
```

**Sources:**
- **JSON Schema** (`schema/SPECVERSE-V3.1-SCHEMA.json`) → Language models and type definitions
- **Processing Logic** → Controllers for parsing, validation, and processing
- **Workflow Events** → Event definitions for specification lifecycle

**Benefits:**
- ✅ **Always accurate** - Can never drift from actual schema
- ✅ **Self-validating** - Proves language can describe itself
- ✅ **Maintenance-free** - Updates automatically when schema changes
- ✅ **Bootstrap verification** - Demonstrates true meta-circular evaluation

## Meta-Specification Concepts

### Self-Describing Language

SpecVerse can describe itself using its own syntax:

```yaml
components:
  SpecVerseLanguageSpecification:
    version: "3.2.0"
    description: "The SpecVerse specification language itself"
    
    models:
      Component:
        description: "Root container for a SpecVerse specification"
        attributes:
          name: String required
          version: SemanticVersion required
          description: String required
          componentType: String values=["BusinessLogic", "Infrastructure", "Platform"]
          
      Model:
        description: "Business entity or data structure"
        attributes:
          name: String required
          description: String required
          modelType: String values=["Entity", "ValueObject", "Aggregate"]
          
      Attribute:
        description: "Model property definition"
        attributes:
          name: String required
          type: String required
          required: Boolean default=false
          description: String
          constraints: String
          defaultValue: String
```

### Import and Export Structure

```yaml
    import:
      - from: "@specverse/primitives"
        select: [UUID, DateTime, URL, SemanticVersion]

    export:
      models: [Component, Model, Controller, View, Event, ProfileModel]
      controllers: [SpecificationParser, SpecificationValidator]
      views: [ComponentSummaryView, ModelDetailView]
      events: [ComponentParsed, ValidationCompleted]
```

### Core Meta-Models

```yaml
      ImportDefinition:
        description: "External dependency specification"
        attributes:
          source: String required
          types: String required
          rename: String

      CommonDefinition:
        description: "Reusable type definition"
        attributes:
          name: String required
          type: String required
          description: String required
          constraints: String
          properties: String
```

## Self-Referential Patterns

### Recursive Model Definitions

```yaml
      ProfileModel:
        description: "Model that can attach to other models for behavioral extension"
        attributes:
          attachmentCriteria: String required
          modelTypes: String required
          contextAccess: String values=["Parent", "Siblings", "None"]
        profile-attachment:
          profiles: [Model]
```

### Profile Attachments

```yaml
      SpecificationAuditProfile:
        description: "Tracks specification creation and modification"
        attributes:
          createdAt: DateTime required
          createdBy: String required
          lastModified: DateTime required
          modifiedBy: String required
          changeReason: String
          validationStatus: String required values=["Valid", "Invalid", "Pending"]
        profile-attachment:
          profiles: [Component]
```

### Controllers and Actions

```yaml
    controllers:
      SpecificationParser:
        description: "Parses SpecVerse YAML and Specly DSL into AST"
        model: Component
        actions:
          parseComponent:
            description: "Parse a Component specification"
            parameters:
              sourceContent: String required
              sourceFormat: String required values=["YAML", "Specly"]
            returns: String
            requires: ["Source content is valid syntax", "Source format is supported"]
            ensures: ["AST is generated", "Syntax errors are captured"]
            publishes: [ComponentParsed, ParseError]
```

## Language Bootstrapping

### Validation Controllers

```yaml
      SpecificationValidator:
        description: "Validates specifications against schema and business rules"
        model: Component
        actions:
          validateComponent:
            description: "Validate a complete component specification"
            parameters:
              componentAST: String required
              schemaVersion: String required
            returns: String
            requires: ["AST is well-formed", "Schema version is supported"]
            ensures: ["All references are resolved", "Business rules are enforced"]
            publishes: [ValidationCompleted]
```

### Views and Presentation

```yaml
    views:
      ComponentSummaryView:
        description: "High-level overview of a component specification"
        model: Component
        components:
          - ComponentOverview
          - ModelsList
          - ControllersList
        properties:
          showCounts: true
          sortable: true

      ModelDetailView:
        description: "Detailed view of a model definition"
        model: Model
        components:
          - ModelDetails
          - AttributesList
          - ProfilesList
        properties:
          expandable: true
          filterable: true
```

## Self-Validation Patterns

### Events and Notifications

```yaml
    events:
      ComponentParsed:
        description: "A SpecVerse component was successfully parsed"
        attributes:
          componentName: String required
          sourceFormat: String required values=["YAML", "Specly"]
          parseTime: DateTime required
          astNodeCount: Integer required

      ValidationCompleted:
        description: "Component validation process finished"
        attributes:
          componentName: String required
          validationStatus: String required values=["Valid", "Invalid"]
          errorCount: Integer required
          warningCount: Integer required
          errors: String
          warnings: String
```

### Deployment Structure

```yaml
deployments: {}
```

This meta-specification focuses on the core language elements and doesn't define deployment topologies, keeping the focus on the language structure itself.

## Advanced Meta-Patterns

### Generated YAML Format

The SpecVerse v3.2 parser will generate the following YAML structure from the Specly DSL:

```yaml
components:
  SpecVerseLanguageSpecification:
    version: "3.2.0"
    description: "Example 05-01: The SpecVerse specification language meta-model"
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, DateTime, URL, SemanticVersion]
    
    export:
      models: [Component, Model, Controller, View, Event, ProfileModel, ...]
      controllers: [SpecificationParser, SpecificationValidator, ...]
      views: [ComponentSummaryView, ModelDetailView, ...]
      events: [ComponentParsed, ValidationCompleted, ...]
    
    models:
      Component:
        description: "Root container for a SpecVerse specification"
        attributes:
          name: 
            type: String
            required: true
          version:
            type: SemanticVersion
            required: true
          description:
            type: String
            required: true
          componentType:
            type: String
            enum: ["BusinessLogic", "Infrastructure", "Platform"]

deployments: {}
```

## Key v3.2 Features Demonstrated

### Convention Syntax
- **Concise declarations**: `name: Type modifiers` format
- **Value constraints**: `values=["option1", "option2"]` syntax  
- **Default values**: `default=value` syntax
- **Profile attachments**: Direct profile-attachment declarations

### Container Structure
- **Components container**: All specifications in `components:` section
- **Deployments container**: Deployment topologies in `deployments:` section
- **Import arrays**: Clean `- file: path select: [types]` format
- **Export structure**: Organized by artifact type

## Practical Applications

### Self-Reference Patterns

SpecVerse v3.2 achieves self-description through:

1. **Language bootstrapping**: The parser that processes this specification is itself specified here
2. **Meta-validation**: Validation rules for specifications are themselves specified
3. **Recursive structures**: Profile attachments can be applied to the models that define them
4. **Tool generation**: The specification describes how to build tools from specifications

### Deployment Integration

```yaml
deployments:
  # Meta-specifications typically don't define deployment topologies
  # Focus is on the language structure itself
  {}
```

This meta-specification intentionally leaves deployments empty, as it focuses on describing the language structure rather than runtime deployment patterns.

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:16.944Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Component {
        +name: String required
        +version: SemanticVersion required
        +description: String required
        +componentType: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ImportDefinition {
        +source: String required
        +types: String required
        +rename: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class CommonDefinition {
        +name: String required
        +type: String required
        +description: String required
        +constraints: String
        +properties: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Model {
        +name: String required
        +description: String required
        +modelType: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Attribute {
        +name: String required
        +type: String required
        +required: Boolean = false
        +description: String
        +constraints: String
        +defaultValue: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ProfileModel {
        <<profile>>
        +attachmentCriteria: String required
        +modelTypes: String required
        +contextAccess: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class SpecificationAuditProfile {
        <<profile>>
        +createdAt: DateTime required
        +createdBy: String required
        +lastModified: DateTime required
        +modifiedBy: String required
        +changeReason: String
        +validationStatus: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Controller {
        +name: String required
        +description: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Action {
        +name: String required
        +description: String required
        +httpMethod: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class View {
        +name: String required
        +baseModel: String required
        +format: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Field {
        +name: String required
        +source: String required
        +formatter: String
        +sortable: Boolean = true
        +filterable: Boolean = true
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Event {
        +name: String required
        +description: String required
        +eventType: String required
        +dataStructure: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Deployment {
        +name: String required
        +version: SemanticVersion required
        +description: String required
        +environment: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ComputeService {
        +name: String required
        +componentReference: String required
        +replicas: Integer required min=1
        +autoScaling: Boolean = false
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ResourceRequirement {
        +memory: String required
        +cpu: String required
        +storage: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class StorageDefinition {
        +name: String required
        +type: String required
        +persistence: Boolean = true
        +highAvailability: Boolean = false
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class NetworkDefinition {
        +name: String required
        +type: String required
        +targets: String required
        +healthCheck: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Manifest {
        +specVersion: String required
        +name: String required
        +description: String required
        +version: SemanticVersion required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ComponentReference {
        +specificationSource: String required
        +specificationVersion: SemanticVersion required
        +description: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class TechnologyTarget {
        +layer: String required
        +language: String
        +framework: String
        +platform: String
        +version: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class RouteMapping {
        +controller: String required
        +action: String required
        +httpMethod: String required
        +route: String required
        +middleware: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ProfileMapping {
        +profileModel: String required
        +implementation: String required
        +attachmentContext: String required
        +description: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class CapabilityMapping {
        +capability: String required
        +implementation: String required
        +libraries: String
        +configuration: String
        +description: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    ProfileModel <|.. Model : 1_attaches_to_priority__0
    SpecificationAuditProfile <|.. Component : 1_attaches_to_priority__0
    SpecificationParser -- Component : 1_manages
    SpecificationValidator -- Component : 1_manages
    SpecificationProcessor -- Component : 1_manages
    DeploymentParser -- Deployment : 1_manages
    ManifestParser -- Manifest : 1_manages

    %% Other components
    class SpecificationParser {
        <<controller>>
        SpecificationParser
    }
    class SpecificationValidator {
        <<controller>>
        SpecificationValidator
    }
    class SpecificationProcessor {
        <<controller>>
        SpecificationProcessor
    }
    class DeploymentParser {
        <<controller>>
        DeploymentParser
    }
    class ManifestParser {
        <<controller>>
        ManifestParser
    }
    class ComponentParsed {
        <<event>>
        ComponentParsed
    }
    class ValidationCompleted {
        <<event>>
        ValidationCompleted
    }
    class ProfileValidated {
        <<event>>
        ProfileValidated
    }
    class ProcessingCompleted {
        <<event>>
        ProcessingCompleted
    }
    class SpecificationPublished {
        <<event>>
        SpecificationPublished
    }
    class ParseError {
        <<event>>
        ParseError
    }
    class DeploymentParsed {
        <<event>>
        DeploymentParsed
    }
    class DeploymentParseError {
        <<event>>
        DeploymentParseError
    }
    class TopologyValidated {
        <<event>>
        TopologyValidated
    }
    class ManifestParsed {
        <<event>>
        ManifestParsed
    }
    class ManifestParseError {
        <<event>>
        ManifestParseError
    }
    class ImplementationValidated {
        <<event>>
        ImplementationValidated
    }
`} />

</div>



## Complete Example

### Specly DSL Format (Source)
See [./05-01-specverse-meta-specification.specly](./05-01-specverse-meta-specification.specly) for the concise Specly DSL source format.

### Generated: YAML Format
The SpecVerse v3.2 parser generates YAML from the Specly DSL above, expanding the convention syntax into full YAML structure with explicit type definitions, constraints, and relationships.

## Key Features Demonstrated

- **Self-description**: Language modeling itself using v3.2 syntax
- **Convention syntax**: `name: Type modifiers` pattern throughout
- **Profile attachments**: Models that extend other models behaviorally
- **Import/export structure**: Clean dependency and interface management
- **Component containers**: v3.2 components and deployments structure
- **Event-driven architecture**: Controllers publish events for state changes

## Philosophical Implications

### Self-Reference and Completeness
- Gödel-like self-reference in specification languages
- SpecVerse v3.2 describing itself using its own conventions
- Bootstrap problem resolved through meta-circular evaluation

### v3.2 Design Principles
- **Convention over configuration**: Concise `name: Type modifiers` syntax
- **Container structure**: Clear separation of components and deployments
- **Profile-based extension**: Behavioral attachment patterns
- **Import/export clarity**: Explicit dependency management

## Meta-Programming Patterns

### SpecVerse v3.2 Processing

```bash
# Parse Specly DSL to AST
specverse parse 05-01-specverse-meta-specification.specly

# Generate YAML from Specly
specverse gen yaml 05-01-specverse-meta-specification.specly -o output.yaml

# Validate against v3.2 schema
specverse validate 05-01-specverse-meta-specification.specly
```

The meta-specification demonstrates how SpecVerse processes itself - the same parser and validator used for other specifications work on this self-describing specification.

## Validation

Test this example:
```bash
# Validate the Specly DSL format (primary)
specverse validate examples/05-meta/05-01-specverse-meta-specification.specly

# Process to YAML and validate
specverse gen yaml examples/05-meta/05-01-specverse-meta-specification.specly -o /tmp/output.yaml
specverse validate /tmp/output.yaml
```

## Next Steps

Continue to [Example 05-02: SpecVerse App Build](./05-02-specverse-app-build) to see how the build system itself can be specified.

## Related Examples

- [Example 03-06: Inference Engine Demo](../03-architecture/03-06-inference-engine-demo) - Tool intelligence patterns
- [Example 05-02: SpecVerse App Build](./05-02-specverse-app-build) - Build system specification
- [Example 01-01: Basic Model](../01-fundamentals/01-01-basic-model) - Foundation concepts being meta-modeled