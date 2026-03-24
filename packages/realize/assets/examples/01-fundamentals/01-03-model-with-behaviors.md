# Example 01-03: Model with Behaviors

This example demonstrates how to add declarative business logic to models through behaviors in SpecVerse v3.2, showing the "what" without the "how."

## Learning Objectives

- Define declarative behaviors on models
- Use Requires/Ensures clauses for contracts
- Specify parameters and return types using convention syntax
- Publish events from behaviors
- Understand event definitions with attributes

## Key Concepts

### Declarative Behaviors
Behaviors describe WHAT should happen, not HOW:
```specly
behaviors:
  calculateFinalPrice:
    description: "Calculate price with discount applied"
    requires: ["basePrice > 0", "discountRate >= 0", "discountRate <= 1"]
    returns: Money
    ensures: ["Returns basePrice reduced by discountRate percentage"]
```

### Contract-Based Design
v3.2 supports declarative contracts for behaviors:
- **Requires**: Preconditions that must be true
- **Ensures**: Postconditions that will be true after execution
- **Parameters**: Typed inputs using convention syntax (`name: Type modifiers`)
- **Returns**: Output type specification
- **Publishes**: Events that may be triggered

### Event Publishing
Behaviors can publish domain events:
```specly
updateStock:
  description: "Update product stock level"
  parameters:
    newStock: Integer required
  requires: ["newStock >= 0"]
  ensures: ["Stock level updated to newStock"]
  publishes: ["InventoryUpdated"]
```

### Parameter Handling
Parameters use the v3.2 convention syntax:
```specly
checkAvailability:
  description: "Check if product is available for purchase"
  parameters:
    requestedQuantity: Integer required
  requires: ["requestedQuantity > 0"]
  returns: Boolean
  ensures: ["Returns true if stock >= requestedQuantity"]
```

### Event Definitions
Events define the data structure using the attributes format:
```specly
events:
  InventoryUpdated:
    description: "Triggered when product stock level changes"
    attributes:
      productId: UUID required
      newStock: Integer required
      previousStock: Integer required
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:18.499Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required
        +name: String required
        +basePrice: Money required
        +stock: Integer = 0
        +discountRate: Number = 0 min=0 max=1
        +calculateFinalPrice(): Money %% requires: basePrice > 0, discountRate >= 0, discountRate <= 1 | ensures: Returns basePrice reduced by discountRate percentage
        +updateStock(newStock: Integer) %% requires: newStock >= 0 | ensures: Stock level updated to newStock | publishes: InventoryUpdated
        +checkAvailability(requestedQuantity: Integer): Boolean %% requires: requestedQuantity > 0 | ensures: Returns true if stock >= requestedQuantity
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    %% Other components
    class InventoryUpdated {
        <<event>>
        InventoryUpdated
    }
`} />

</div>


## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
components:
  SpecVerseFundamentals:
    version: "3.2.0"
    description: "Example 01-03: Model with declarative behaviors"
    
    export:
      models: [Product]
      events: [InventoryUpdated]
    
    import:
      - from: "@specverse/primitives"
        select: [Money]
    
    models:
      Product:
        description: "Product with pricing and inventory behaviors"
        attributes:
          id: UUID required
          name: String required
          basePrice: Money required
          stock: Integer default=0
          discountRate: Number min=0 max=1 default=0
        behaviors:
          calculateFinalPrice:
            description: "Calculate price with discount applied"
            requires: ["basePrice > 0", "discountRate >= 0", "discountRate <= 1"]
            returns: Money
            ensures: ["Returns basePrice reduced by discountRate percentage"]
          updateStock:
            description: "Update product stock level"
            parameters:
              newStock: Integer required
            requires: ["newStock >= 0"]
            ensures: ["Stock level updated to newStock"]
            publishes: ["InventoryUpdated"]
          checkAvailability:
            description: "Check if product is available for purchase"
            parameters:
              requestedQuantity: Integer required
            requires: ["requestedQuantity > 0"]
            returns: Boolean
            ensures: ["Returns true if stock >= requestedQuantity"]
    
    events:
      InventoryUpdated:
        description: "Triggered when product stock level changes"
        attributes:
          productId: UUID required
          newStock: Integer required
          previousStock: Integer required

deployments: {}
```

See the full file: [01-03-model-with-behaviors.specly](./01-03-model-with-behaviors.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml 01-03-model-with-behaviors.specly -o 01-03-model-with-behaviors.yaml
```

## Key Features Demonstrated

- **Declarative behaviors**: Business logic specification using contracts
- **Contract validation**: Requires/Ensures clauses for business rules
- **Event publishing**: Domain event integration with attribute definitions
- **Parameter handling**: Convention syntax for typed inputs (`name: Type modifiers`)
- **Return types**: Output specification with type safety

## Practical Use Cases

- **Price calculations**: Dynamic pricing with business rules and validation
- **Order processing**: Multi-step business workflows with contracts
- **Inventory management**: Stock level updates with event notifications
- **User actions**: Registration, authentication, profile updates with validation

## Design Principles

### Declarative Over Imperative
- Specify WHAT should happen, not HOW to implement it
- Let the runtime handle implementation details
- Focus on business rules and desired outcomes

### Contract-Driven Development
- Clear preconditions (requires) and postconditions (ensures)
- Explicit parameter validation with types and constraints
- Predictable behavior outcomes with return type specifications

## Validation

Test this example:
```bash
# Validate the Specly source file
specverse validate examples/01-fundamentals/01-03-model-with-behaviors.specly

# Run full test cycle
specverse test cycle examples/01-fundamentals/01-03-model-with-behaviors.specly
```

## Next Steps

Continue to [Example 01-04: Models with Relations](./01-04-models-with-relations) to learn about connecting models through relationships.

## Related Examples

- [Example 01-02: Model with Lifecycle](./01-02-model-with-lifecycle) - State management foundation
- [Example 02-01: Using Profiles](../02-profiles/02-01-using-profiles) - Extending behaviors with profiles
- [Example 03-03: Services and Events](../03-architecture/03-03-services-and-events) - Advanced event handling