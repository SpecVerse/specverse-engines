# Example 03-02: Controllers and Actions

This example introduces SpecVerse v3.2 system architecture patterns using Controllers - the coordination layer that orchestrates business operations across models and publishes events for system integration.

## Learning Objectives

- Understand v3.2 Controllers as business operation coordinators
- Learn Action definitions with clean parameter syntax
- Master preconditions (requires) and postconditions (ensures)
- Explore event publishing for loose coupling
- See how Controllers map to API endpoints and business workflows

## Key Concepts

### V3.1 Controllers as Coordinators

Controllers coordinate operations across models using clean v3.2 syntax with convention-based parameter definitions:

```specly
controllers:
  ProductController:
    model: Product
    description: "Manage product operations"
    actions:
      createProduct:
        description: "Create a new product"
        parameters:
          name: String required
          price: Money required
          category: String required
        returns: Product
        requires: ["name is not empty", "price > 0", "category is valid"]
        ensures: ["Product created with unique ID", "Stock initialized to 0"]
        publishes: [ProductCreated]
```

### V3.1 Action Patterns

**CRUD Operations**: Clean convention syntax for standard operations
```specly
updateProduct:
  description: "Update existing product"
  parameters:
    id: UUID required
    name: String
    price: Money
    category: String
  returns: Product
  requires: ["Product with ID exists", "price > 0 if specified"]
  ensures: ["Product attributes updated", "Version timestamp updated"]
  publishes: [ProductUpdated]
```

**Business Operations**: Domain-specific workflows with validation
```specly
deleteProduct:
  description: "Delete a product"
  parameters:
    id: UUID required
  returns: Boolean
  requires: ["Product with ID exists", "No active orders reference this product"]
  ensures: ["Product marked as deleted"]
  publishes: [ProductDeleted]
```

### Input/Output Contracts

**Clean Parameter Syntax**: Convention-based parameter definitions
```specly
getProduct:
  description: "Get single product by ID"
  parameters:
    id: UUID required
  returns: Product
  requires: ["Product with ID exists"]
  ensures: ["Returns complete product details"]
```

**Complex Operations**: Multi-model coordination
```specly
createOrder:
  description: "Create a new order"
  parameters:
    customerId: UUID required
    items: String required
  returns: Order
  requires: ["Customer exists", "All products available", "Sufficient stock"]
  ensures: ["Order created", "Stock reserved", "Total calculated"]
  publishes: [OrderCreated]
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.967Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required
        +name: String required
        +price: Money required min=0
        +stock: Integer = 0
        +category: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Order {
        +id: UUID required
        +customerId: UUID required
        +total: Money required
        +status: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class OrderItem {
        +id: UUID required
        +productId: UUID required
        +quantity: Integer required min=1
        +unitPrice: Money required
        +lineTotal: Money required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    Order o-- OrderItem : *_items
    ProductController -- Product : 1_manages
    OrderController -- Order : 1_manages

    %% Other components
    class ProductController {
        <<controller>>
        ProductController
    }
    class OrderController {
        <<controller>>
        OrderController
    }
    class ProductCreated {
        <<event>>
        ProductCreated
    }
    class ProductUpdated {
        <<event>>
        ProductUpdated
    }
    class ProductDeleted {
        <<event>>
        ProductDeleted
    }
    class OrderCreated {
        <<event>>
        OrderCreated
    }
    class OrderConfirmed {
        <<event>>
        OrderConfirmed
    }
`} />

</div>


### REST API Mapping

V3.1 controllers automatically map to REST endpoints:

```bash
# GET /api/products/{id}
ProductController.getProduct

# POST /api/products  
ProductController.createProduct

# PUT /api/products/{id}
ProductController.updateProduct

# DELETE /api/products/{id}
ProductController.deleteProduct
```

## Event-Driven Architecture

### V3.1 Event Publishing
Controllers publish events using clean array syntax for system-wide coordination:

```specly
confirmOrder:
  description: "Confirm order and process payment"
  parameters:
    id: UUID required
    paymentInfo: String required
  returns: Order
  requires: ["Order exists", "Order is pending", "Payment is valid"]
  ensures: ["Order confirmed", "Payment processed", "Inventory updated"]
  publishes: [OrderConfirmed]
```

### Event Definitions with Attributes
Events use v3.2 attributes format instead of payload:

```specly
events:
  ProductCreated:
    description: "New product was added to catalog"
    attributes:
      productId: UUID required
      name: String required
      category: String required
      price: Money required
  
  OrderConfirmed:
    description: "Order was confirmed and payment processed"
    attributes:
      orderId: UUID required
      confirmationNumber: String required
      paymentId: UUID required
```


## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
components:
  ControllersAndActions:
    version: "3.2.0"
    description: "Example 03-02: Controllers and actions for API design"
    
    export:
      models: [Product, Order, OrderItem]
      controllers: [ProductController, OrderController]
      events: [ProductCreated, ProductUpdated, OrderCreated]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, Money, DateTime]
    
    controllers:
      ProductController:
        model: Product
        description: "Manage product operations"
        actions:
          createProduct:
            description: "Create a new product"
            parameters:
              name: String required
              price: Money required
              category: String required
            returns: Product
            requires: ["name is not empty", "price > 0"]
            ensures: ["Product created with unique ID"]
            publishes: [ProductCreated]

deployments: {}
```

See the full file: [03-02-controllers-and-actions.specly](./03-02-controllers-and-actions.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml 03-02-controllers-and-actions.specly -o 03-02-controllers-and-actions.yaml
```

## Key Features Demonstrated

- **V3.1 Container Format**: Components and deployments structure
- **Controller-Model Association**: `model:` property links controllers to primary models
- **Convention Syntax**: Clean parameter definitions with `name: Type modifiers`
- **Preconditions/Postconditions**: `requires:` and `ensures:` validation arrays
- **Event publishing**: `publishes:` array for loose coupling
- **REST API mapping**: Automatic HTTP endpoint generation
- **Relationships**: `hasMany` syntax for model associations

## Design Principles

### Single Responsibility
- Controllers coordinate, models contain business logic
- Each action has a clear, specific purpose
- V3.1 `model:` property creates clear controller-model associations

### Contract-Driven Development
- Clean parameter syntax with convention-based types
- Array-based preconditions and postconditions
- Predictable input/output contracts

### Event-First Architecture
- Array-based event publishing for all significant operations
- Enable loose coupling with `attributes:` format events
- Support audit trails and system integration

## Benefits of V3.1 Controller Design

- **Clean Syntax**: Convention-based parameter definitions
- **Type Safety**: Imported types integrate seamlessly
- **Model Association**: Clear controller-model relationships
- **Event Integration**: Easy event publishing and handling
- **REST Mapping**: Automatic API endpoint generation

## Validation

Test this example:
```bash
# Validate the Specly source file
specverse validate examples/03-architecture/03-02-controllers-and-actions.specly

# Run full test cycle
specverse test cycle examples/03-architecture/03-02-controllers-and-actions.specly
```

## Next Steps

Continue to [Example 03-03: Services and Events](./03-03-services-and-events) to learn about external service integration and advanced event handling.

## Related Examples

- [Example 01-03: Model with Behaviors](../01-fundamentals/01-03-model-with-behaviors) - Business logic foundation
- [Example 03-05: Complete Event Flow](./03-05-complete-event-flow) - End-to-end system integration
- [Example 04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog) - Real-world controller usage