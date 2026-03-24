# Example 03-05: Complete Event Flow

This example demonstrates end-to-end event-driven architecture by showing how a single user action (placing an order) triggers a cascade of coordinated system operations across multiple services.

## Learning Objectives

- Understand complete event-driven system orchestration
- See how models, controllers, and services work together
- Learn event choreography vs orchestration patterns
- Master cross-service communication and coordination
- Build resilient, scalable system architectures

## Business Scenario

A customer places an order, triggering a complex workflow involving validation, payment processing, inventory updates, shipping preparation, and notifications.

## Event Flow Overview

```
Customer Places Order
       ↓
1. OrderController.createOrder
   → Publishes: OrderCreated
       ↓
2. PaymentService.processPayment
   → Publishes: PaymentProcessed | PaymentFailed
       ↓
3. InventoryService.reserveItems
   → Publishes: InventoryReserved | InsufficientStock
       ↓
4. ShippingService.prepareShipment
   → Publishes: ShipmentPrepared
       ↓
5. NotificationService.sendConfirmation
   → Publishes: CustomerNotified
       ↓
6. CompensationService.handleFailures
   → Publishes: OrderCancelled | RefundInitiated
```

## Key Components

### Order Controller
```specly
controllers:
  OrderController:
    description: "Order management"
    model: Order
    actions:
      createOrder:
        description: "Create new order"
        parameters:
          customerId: UUID required
          items: String required
        returns: Order
        ensures: ["Order created"]
        publishes: [OrderCreated]
        
  InventoryController:
    description: "Automated inventory management"
    model: Product
    actions:
      autoReorder:
        description: "Automatically reorder low stock items"
        parameters:
          productId: UUID required
        returns: String
        requires: ["Product exists"]
        ensures: ["Reorder request created"]
        publishes: [BackorderCreated]
```

### Core Models
```specly
models:
  Product:
    description: "Product with inventory tracking"
    attributes:
      id: UUID required
      name: String required
      price: Money required
      stock: Integer default=0

  Order:
    description: "Customer order with lifecycle"
    attributes:
      id: UUID required
      customerId: UUID required
      total: Money required
      status: String required values=["pending", "confirmed", "shipped", "delivered", "cancelled"]
```

### Event Definitions
```specly
events:
  OrderCreated:
    description: "New order created"
    attributes:
      orderId: UUID required
      customerId: UUID required
      total: Money required
      itemCount: Integer required
      createdAt: DateTime required

  PaymentProcessed:
    description: "Payment successfully processed"
    attributes:
      paymentId: UUID required
      orderId: UUID required
      amount: Money required
      method: String required
      processedAt: DateTime required
      
  InventoryReserved:
    description: "Inventory successfully reserved"
    attributes:
      orderId: UUID required
      productId: UUID required
      quantity: Integer required
      reservedAt: DateTime required
```

### Service Operations
```specly
services:
  PaymentService:
    description: "Process payments and handle financial transactions"
    operations:
      processPayment:
        description: "Process payment for order"
        parameters:
          orderId: UUID required
          amount: Money required
          paymentMethod: String required
        returns: String
        requires: ["Order exists", "Payment method is valid"]
        ensures: ["Payment is processed"]
        publishes: [PaymentProcessed, PaymentFailed]

  InventoryService:
    description: "Manage inventory and stock reservations"
    operations:
      reserveItems:
        description: "Reserve inventory for order"
        parameters:
          orderId: UUID required
          items: String required
        returns: Boolean
        requires: ["Order exists", "Sufficient stock available"]
        ensures: ["Stock is reserved or backorder created"]
        publishes: [InventoryReserved, InsufficientStock]
        
  CompensationService:
    description: "Handle failure compensation and rollbacks"
    operations:
      handlePaymentFailure:
        description: "Compensate for payment failures"
        parameters:
          orderId: UUID required
          failureReason: String required
        returns: Boolean
        requires: ["Order exists", "Payment failure occurred"]
        ensures: ["Compensation actions taken"]
        publishes: [OrderCancelled, RefundInitiated]
```

## Container Architecture

### v3.2 Component Structure
```specly
components:
  CompleteEventFlowExample:
    version: "3.2.0"
    description: "Example 03-05: Demonstrates complete event subscription system across all constructs"
    
    export:
      models: [Product, Order]
      controllers: [InventoryController, OrderController]
      services: [PaymentService, InventoryService, ShippingService, NotificationService, CompensationService]
      events: [StockUpdated, OrderCreated, OrderPlaced, PaymentProcessed, PaymentFailed, InventoryReserved]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, Money, DateTime]
```

### Event Choreography Patterns

**Success Flow**: Happy path with all operations succeeding
```
OrderCreated → PaymentProcessed → InventoryReserved → ShipmentPrepared → CustomerNotified
```

**Error Handling Flows**:
```
# Payment failure compensation
OrderCreated → PaymentFailed → OrderCancelled → RefundInitiated

# Inventory shortage handling  
PaymentProcessed → InsufficientStock → BackorderCreated → SupplierNotified
```

**Comprehensive Event Coverage**: 13 distinct events handling all scenarios:
- `OrderCreated`, `PaymentProcessed`, `PaymentFailed`
- `InventoryReserved`, `InsufficientStock`, `ShipmentPrepared`
- `CustomerNotified`, `OrderCancelled`, `RefundInitiated`
- `BackorderCreated`, `SupplierNotified`, `StockUpdated`, `OrderPlaced`

## Service Integration Architecture

### Multi-Service Coordination

**Payment Processing**: Handles financial transactions
- Publishes `PaymentProcessed` on success
- Publishes `PaymentFailed` on errors
- Triggers compensation workflows

**Inventory Management**: Manages stock reservations
- Reserves items for confirmed payments
- Creates backorders for insufficient stock
- Updates stock levels and triggers alerts

**Shipping Coordination**: Prepares order fulfillment
- Creates shipments for reserved inventory
- Generates tracking information
- Coordinates with delivery services

**Notification System**: Customer communication
- Sends confirmations for successful orders
- Alerts customers of delays or issues
- Provides order status updates

**Compensation Logic**: Error recovery
- Handles payment failures gracefully
- Manages inventory shortage scenarios
- Triggers refunds and cancellations

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.641Z */}

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
        +status: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    InventoryController -- Product : 1_manages
    OrderController -- Order : 1_manages

    %% Other components
    class InventoryController {
        <<controller>>
        InventoryController
    }
    class OrderController {
        <<controller>>
        OrderController
    }
    class PaymentService {
        <<service>>
        PaymentService
    }
    class InventoryService {
        <<service>>
        InventoryService
    }
    class ShippingService {
        <<service>>
        ShippingService
    }
    class NotificationService {
        <<service>>
        NotificationService
    }
    class CompensationService {
        <<service>>
        CompensationService
    }
    class StockUpdated {
        <<event>>
        StockUpdated
    }
    class OrderCreated {
        <<event>>
        OrderCreated
    }
    class OrderPlaced {
        <<event>>
        OrderPlaced
    }
    class PaymentProcessed {
        <<event>>
        PaymentProcessed
    }
    class PaymentFailed {
        <<event>>
        PaymentFailed
    }
    class InventoryReserved {
        <<event>>
        InventoryReserved
    }
    class InsufficientStock {
        <<event>>
        InsufficientStock
    }
    class ShipmentPrepared {
        <<event>>
        ShipmentPrepared
    }
    class CustomerNotified {
        <<event>>
        CustomerNotified
    }
    class OrderCancelled {
        <<event>>
        OrderCancelled
    }
    class RefundInitiated {
        <<event>>
        RefundInitiated
    }
    class BackorderCreated {
        <<event>>
        BackorderCreated
    }
    class SupplierNotified {
        <<event>>
        SupplierNotified
    }
`} />

</div>



## Complete Example

### Specly DSL Format
See [./03-05-complete-event-flow.specly](./03-05-complete-event-flow.specly) for the complete v3.2 specification.

### Generated: YAML Format
SpecVerse v3.2 uses convention-based Specly DSL as the source format. The build process can generate structured YAML for tooling integration:

```bash
# Generate YAML from Specly DSL
specverse build --format yaml 03-05-complete-event-flow.specly
```

This produces fully structured YAML with expanded event definitions, service operations, and choreography patterns derived from the concise Specly syntax.

## Key Features Demonstrated

- **End-to-end orchestration**: Complete business workflow
- **Event choreography**: Service coordination through events
- **Error handling**: Compensation and retry patterns
- **System resilience**: Failure recovery mechanisms
- **Event sourcing**: Complete audit trail capability

## Architecture Benefits

### Scalability
- Services can be scaled independently
- Event-driven communication reduces bottlenecks
- Horizontal scaling through event partitioning

### Resilience
- Failure isolation between services
- Automatic retry and compensation patterns
- System can continue operating with partial failures

### Observability
- Complete event trail for debugging
- Business process monitoring
- Performance analysis through event timing

## Practical Use Cases

- **E-commerce order processing**: Complete purchase workflows
- **Banking transactions**: Multi-step financial operations
- **Travel booking**: Complex reservation systems
- **Supply chain management**: End-to-end logistics

## Validation

Test this example:
```bash
specverse validate examples/03-architecture/03-05-complete-event-flow.specly
```

## Next Steps

Continue to [Example 04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog) to see these patterns applied to a complete business domain.

## Related Examples

- [Example 03-03: Services and Events](./03-03-services-and-events) - Service integration foundation
- [Example 03-02: Controllers and Actions](./03-02-controllers-and-actions) - API coordination patterns
- [Example 04-02: Organization Management](../04-domains/04-02-organization-management) - Complex business workflows