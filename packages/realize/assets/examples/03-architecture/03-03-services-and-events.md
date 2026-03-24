# Example 03-03: Services and Events

This example demonstrates how to integrate with external services and build event-driven architectures for scalable system design.

## Learning Objectives

- Define external service integrations
- Design event publishing and subscription patterns
- Implement asynchronous operation handling
- Build resilient service communication
- Create event-driven business workflows

## Key Concepts

### Event-Driven Patterns

**Domain Events**: Business-significant occurrences
```specly
events:
  OrderCreated:
    description: "New order was placed by customer"
    attributes:
      orderId: UUID required
      customerId: UUID required
      total: Money required
      itemCount: Integer required
      createdAt: DateTime required
    
  PaymentProcessed:
    description: "Payment was successfully processed"
    attributes:
      paymentId: UUID required
      orderId: UUID required
      amount: Money required
      method: String required
      status: String required
      processedAt: DateTime required
    
  StockReserved:
    description: "Product stock was reserved for order"
    attributes:
      productId: UUID required
      orderId: UUID required
      quantity: Integer required
      reservedAt: DateTime required
```

**Core Models**: Supporting event-driven workflows
```specly
models:
  Product:
    description: "Product in catalog"
    attributes:
      id: UUID required
      name: String required
      price: Money required
      stock: Integer default=0

  Order:
    description: "Customer order"
    attributes:
      id: UUID required
      customerId: UUID required
      total: Money required
      status: String required values=["pending","confirmed","shipped","delivered"]
      
  Customer:
    description: "Customer account"
    attributes:
      id: UUID required
      email: Email required
      name: String required
      preferences: String
```

### Service Definitions

**Payment Processing**: Handle financial transactions
```specly
services:
  PaymentService:
    description: "Handle payment processing and transactions"
    operations:
      processPayment:
        description: "Process payment for order"
        parameters:
          orderId: UUID required
          amount: Money required
          paymentMethod: String required
        returns: String
        requires: ["Order exists", "Payment method is valid", "Amount matches order total"]
        ensures: ["Payment is processed", "Order status updated", "Receipt generated"]
        publishes: [PaymentProcessed]
```

**Notification Services**: Multi-channel messaging
```specly
NotificationService:
  description: "Send notifications across channels"
  operations:
    sendEmail:
      description: "Send email notification"
      parameters:
        recipientEmail: Email required
        subject: String required
        message: String required
        template: String
      returns: Boolean
      requires: ["Valid email address", "Subject not empty", "Message not empty"]
      ensures: ["Email is sent", "Delivery status recorded"]
      publishes: [NotificationSent]
```

**Inventory Management**: Stock and warehouse operations
```specly
InventoryService:
  description: "Manage product inventory and stock levels"
  operations:
    reserveStock:
      description: "Reserve stock for order"
      parameters:
        productId: UUID required
        quantity: Integer required
        orderId: UUID required
      returns: Boolean
      requires: ["Product exists", "Sufficient stock available"]
      ensures: ["Stock is reserved", "Inventory updated"]
      publishes: [StockReserved]
```

### Container Structure

**v3.2 Component Format**: Modern container-based architecture
```specly
components:
  ServicesAndEvents:
    version: "3.2.0"
    description: "Example 03-03: Services and event-driven architecture"
    
    export:
      models: [Product, Customer, Order]
      services: [InventoryService, PaymentService, NotificationService]
      events: [OrderCreated, StockReserved, PaymentProcessed, LowStockAlert, NotificationSent]
    
    import:
      - from: "@specverse/primitives"
        select: [Money]
```

## Integration Architecture

### Service Composition

Services work together to handle complex workflows:

1. **Order Creation Flow**:
   - PaymentService processes payment → publishes `PaymentProcessed`
   - InventoryService reserves stock → publishes `StockReserved` 
   - NotificationService sends confirmation → publishes `NotificationSent`

2. **Inventory Management**:
   - Stock updates trigger `LowStockAlert` when thresholds are crossed
   - Reserved stock integrates with order fulfillment
   - Real-time stock level checking supports order validation

### Event Choreography

**Event-Driven Workflow**: When `OrderCreated` is published:
1. PaymentService processes payment → `PaymentProcessed`
2. InventoryService reserves stock → `StockReserved`
3. NotificationService sends confirmation → `NotificationSent`
4. Low stock checks trigger → `LowStockAlert` if needed

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.861Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required
        +name: String required
        +price: Money required
        +stock: Integer = 0
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Order {
        +id: UUID required
        +customerId: UUID required
        +total: Money required
        +status: String required values=[pending, confirmed, shipped, delivered]
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Customer {
        +id: UUID required
        +email: Email required
        +name: String required
        +preferences: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    %% Other components
    class PaymentService {
        <<service>>
        PaymentService
    }
    class InventoryService {
        <<service>>
        InventoryService
    }
    class NotificationService {
        <<service>>
        NotificationService
    }
    class OrderCreated {
        <<event>>
        OrderCreated
    }
    class StockReserved {
        <<event>>
        StockReserved
    }
    class PaymentProcessed {
        <<event>>
        PaymentProcessed
    }
    class LowStockAlert {
        <<event>>
        LowStockAlert
    }
    class NotificationSent {
        <<event>>
        NotificationSent
    }
`} />

</div>



## Complete Example

### Specly DSL Format
See [./03-03-services-and-events.specly](./03-03-services-and-events.specly) for the complete v3.2 specification.

### Generated: YAML Format
SpecVerse v3.2 uses convention-based Specly DSL as the source format. The build process can generate structured YAML for tooling integration:

```bash
# Generate YAML from Specly DSL
specverse build --format yaml 03-03-services-and-events.specly
```

This produces fully structured YAML with expanded service definitions, event schemas, and validation rules derived from the concise Specly syntax.

## Key Features Demonstrated

- **Service definitions**: External system integration
- **Event publishing**: Domain event patterns
- **Asynchronous operations**: Long-running process handling
- **Error handling**: Retry policies and failure management
- **Event-driven workflows**: Choreographed business processes

## Design Principles

### Loose Coupling
- Services communicate through well-defined interfaces
- Event-driven integration reduces direct dependencies
- Systems can evolve independently

### Resilience
- Retry policies for transient failures
- Timeout handling for external calls
- Graceful degradation patterns

### Observability
- Event streams provide audit trails
- Service operations publish telemetry
- End-to-end traceability

## Practical Use Cases

- **E-commerce platforms**: Payment, inventory, shipping integration
- **Microservices architectures**: Service-to-service communication
- **Event streaming**: Real-time data processing
- **Workflow orchestration**: Multi-step business processes

## Validation

Test this example:
```bash
specverse validate examples/03-architecture/03-03-services-and-events.specly
```

## Next Steps

Continue to [Example 03-04: Views and Components](./03-04-views-and-components) to learn about frontend component specification.

## Related Examples

- [Example 03-02: Controllers and Actions](./03-02-controllers-and-actions) - API coordination layer
- [Example 03-05: Complete Event Flow](./03-05-complete-event-flow) - End-to-end system integration
- [Example 04-02: Organization Management](../04-domains/04-02-organization-management) - Complex service orchestration