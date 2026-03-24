# Example 03-06: Inference Engine Demo

This example demonstrates SpecVerse's inference engine capabilities, showing how the system can automatically derive relationships, generate code patterns, and suggest architectural improvements.

## Learning Objectives

- Understand automatic relationship inference
- Learn about code pattern generation
- Explore architectural suggestion capabilities
- Master inference rule configuration
- See how inference improves development velocity

## Key Concepts

### Complete E-Commerce Domain Model

The inference engine analyzes comprehensive domain models to detect patterns and suggest improvements:

```specly
models:
  Customer:
    description: "Root entity - customer account"
    attributes:
      id: UUID required
      email: Email required unique
      firstName: String required
      lastName: String required
      creditLimit: Money default=1000.00
      registrationDate: DateTime required
    relationships:
      orders: hasMany Order  # ← Engine infers from order.customerEmail
      reviews: hasMany Review
    lifecycles:
      account:
        flow: pending -> active -> suspended -> deleted

  Order:
    description: "Customer order - belongs to customer, has many items"
    attributes:
      id: UUID required
      orderNumber: String required unique
      customerEmail: Email required  # ← Engine suggests: belongsTo Customer
      total: Money required
    relationships:
      customer: belongsTo Customer
      items: hasMany OrderItem
      payments: hasMany Payment
```

### Advanced Relationship Patterns

The engine detects complex relationship patterns in the domain:

```specly
Product:
  description: "Product catalog entity"
  attributes:
    id: UUID required
    name: String required
    price: Money required
    sku: String required unique  # ← Engine suggests: index for performance
  relationships:
    orderItems: hasMany OrderItem
    reviews: hasMany Review
    inventory: hasOne Inventory  # ← Engine infers 1:1 relationship
  lifecycles:
    inventory:
      flow: draft -> active -> discontinued -> archived

OrderItem:
  description: "Individual line item in an order"
  attributes:
    productSku: String required  # ← Engine links to Product.sku
    quantity: Integer required
    unitPrice: Money required
  relationships:
    order: belongsTo Order
    product: belongsTo Product  # ← Engine infers from productSku
```

### Controller Pattern Inference

```specly
controllers:
  OrderController:
    description: "Handle order operations"
    model: Order  # ← Engine infers standard CRUD operations
    actions:
      createOrder:
        description: "Create new order"
        parameters:
          customerId: UUID required  # ← Engine links to Customer model
          items: String required
          shippingAddress: String required
        returns: Order
        requires: ["Customer exists", "Products available"]  # ← Engine suggests validation
        ensures: ["Order created", "Inventory updated"]
        publishes: [OrderCreated]  # ← Engine suggests event publishing
        
# Engine suggests additional actions based on Order lifecycle:
# - updateOrderStatus, cancelOrder, processPayment, trackShipment
```

## Container Architecture

### v3.2 Component Structure

```specly
components:
  ECommerceSystem:
    version: "3.2.0"
    description: "Example 03-06: Complete e-commerce system to test inference engine"
    
    export:
      models: [Customer, Product, Order, OrderItem, Payment, Category, Review, Inventory]
      controllers: [OrderController]
      events: [OrderCreated]
      views: [OrderDashboard]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, Email, DateTime, Money]
```

### Inference Engine Analysis Points

**Relationship Pattern Detection**:
- `Order.customerEmail` → suggests `belongsTo Customer`
- `OrderItem.productSku` → suggests `belongsTo Product`  
- `Category.parentId` → suggests `belongsTo Category` (self-referencing)
- `Inventory.product` → suggests `hasOne` relationship

**Lifecycle Pattern Recognition**:
- Order: `pending -> processing -> shipped -> delivered`
- Payment: `pending -> authorized -> captured -> settled`
- Review: `pending -> approved -> rejected`

**Behavior Pattern Suggestions**:
- Customer.`calculateTotalSpent()` → aggregate function pattern
- Inventory.`checkLowStock()` → business rule pattern
- Customer.`validateCreditLimit()` → constraint validation pattern

### Domain-Specific Pattern Detection

**E-Commerce Patterns Detected**:
- **Order Management**: Order → OrderItem → Product chain
- **Customer Lifecycle**: Registration → Active → Suspended flow  
- **Inventory Management**: Product → Inventory → Stock tracking
- **Payment Processing**: Order → Payment → Transaction handling
- **Review System**: Customer → Review → Product feedback loop

**Architectural Insights**:
- **Event-Driven**: OrderCreated event suggests pub/sub architecture
- **Domain Modeling**: Rich behaviors on Customer and Inventory models
- **View Integration**: OrderDashboard connects to backend Order model
- **Lifecycle Management**: Multiple state machines for different concerns

## Advanced Inference Capabilities

### Business Logic Pattern Recognition

```specly
# Engine detects common business patterns
Inventory:
  behaviors:
    updateQuantity:
      description: "Update inventory levels"
      parameters:
        quantity: Integer required
        reason: String required  # ← Engine suggests: audit trail
      returns: Boolean
      ensures: ["Inventory levels updated correctly"]
    
    checkLowStock:
      description: "Check if reorder needed"
      returns: Boolean
      ensures: ["Low stock status determined"]
      # ← Engine suggests: could trigger reorder event
```

### Complex Relationship Analysis

**Multi-Level Relationships Detected**:
- Customer → Order → OrderItem → Product (4-level chain)
- Category → Category (self-referencing hierarchy)
- Product → Review ← Customer (many-to-many through Review)
- Order → Payment (one-to-many transaction tracking)

**Cross-Model Validation Suggestions**:
- OrderItem.productSku should match Product.sku
- Order.customerEmail should match Customer.email
- Payment.amount should not exceed Order.total

### View and Component Integration

```specly
views:
  OrderDashboard:
    description: "Order management dashboard"
    model: Order  # ← Engine connects view to domain model
    components:
      - OrderTable      # ← Engine suggests: pagination for large datasets
      - OrderSummary    # ← Engine suggests: aggregate calculations
      - OrderFilters    # ← Engine suggests: search by status, date, customer
    properties:
      orderLimit: 50    # ← Engine suggests: performance optimization
      responsive: true  # ← Engine suggests: mobile compatibility
      realtime: true    # ← Engine suggests: event subscription for updates
```

**Dashboard Optimization Suggestions**:
- OrderTable: Paginate large order lists
- OrderSummary: Cache aggregate calculations
- OrderFilters: Index commonly searched fields
- Real-time Updates: Subscribe to OrderCreated events

## Advanced Inference Features

### Cross-Model Analysis

```yaml
# Engine analyzes entire domain for consistency
DomainAnalysis:
  ModelConsistency:
    - "All entities have consistent ID strategy"
    - "Audit fields applied uniformly"
    - "Naming conventions followed"
    
  RelationshipIntegrity:
    - "No orphaned foreign keys"
    - "Bidirectional relationships defined"
    - "Cascade rules specified"
```

### Business Logic Inference

```yaml
# Engine suggests business rules based on patterns
BusinessRuleInference:
  CustomerLifecycle:
    States: ["prospect", "active", "inactive", "churned"]
    Transitions: "Inferred from typical customer journey"
    
  OrderProcessing:
    RequiredSteps: ["validate", "payment", "fulfillment"]
    Events: ["OrderCreated", "PaymentProcessed", "OrderShipped"]
```

### Integration Pattern Suggestions

```yaml
ServiceIntegration:
  PaymentService:
    SuggestedOperations:
      - processPayment
      - refundPayment
      - verifyPayment
    ErrorHandling: "Retry with exponential backoff"
    
  NotificationService:
    Channels: ["email", "sms", "push"]
    Templates: "Inferred from domain events"
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.525Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Customer {
        +id: UUID required
        +email: Email required unique
        +firstName: String required
        +lastName: String required
        +phone: String
        +status: String = active
        +creditLimit: Money = 1000.00
        +registrationDate: DateTime required
        +calculateTotalSpent(): Money %% ensures: Returns accurate total spending
        +validateCreditLimit(amount: Money): Boolean %% ensures: Credit limit validation completed
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Product {
        +id: UUID required
        +name: String required
        +description: String
        +price: Money required
        +category: String required
        +stock: Integer required
        +isDigital: Boolean = false
        +weight: String
        +sku: String required unique
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Order {
        +id: UUID required
        +orderNumber: String required unique
        +customerEmail: Email required
        +subtotal: Money required
        +tax: Money required
        +shipping: Money required
        +total: Money required
        +shippingAddress: String required
        +billingAddress: String required
        +orderDate: DateTime required
        +expectedDelivery: DateTime
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class OrderItem {
        +id: UUID required
        +productName: String required
        +productSku: String required
        +quantity: Integer required
        +unitPrice: Money required
        +lineTotal: Money required
        +discountApplied: Money
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Payment {
        +id: UUID required
        +amount: Money required
        +paymentMethod: String required
        +transactionId: String required
        +processorResponse: String
        +processedAt: DateTime
        +refundedAmount: Money
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Category {
        +id: UUID required
        +name: String required
        +description: String
        +parentId: UUID
        +isActive: Boolean = true
        +sortOrder: Integer = 0
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Review {
        +id: UUID required
        +rating: Integer required
        +title: String required
        +comment: String
        +isVerifiedPurchase: Boolean = false
        +isApproved: Boolean = false
        +reviewDate: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Inventory {
        +id: UUID required
        +location: String required
        +quantityOnHand: Integer required
        +quantityReserved: Integer = 0
        +quantityAvailable: Integer required
        +reorderPoint: Integer = 10
        +maxStock: Integer = 100
        +lastRestocked: DateTime
        +updateQuantity(quantity: Integer, reason: String): Boolean %% ensures: Inventory levels updated correctly
        +checkLowStock(): Boolean %% ensures: Low stock status determined
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    Customer o-- Order : *_orders
    Customer o-- Review : *_reviews
    Product o-- OrderItem : *_orderItems
    Product o-- Review : *_reviews
    Product -- Inventory : 1_inventory
    Order -- Customer : 1_customer
    Order o-- OrderItem : *_items
    Order o-- Payment : *_payments
    OrderItem -- Order : 1_order
    OrderItem -- Product : 1_product
    Payment -- Order : 1_order
    Category -- Category : 1_parent
    Category o-- Category : *_children
    Category o-- Product : *_products
    Review -- Product : 1_product
    Review -- Customer : 1_customer
    Inventory -- Product : 1_product
    OrderController -- Order : 1_manages

    %% Other components
    class OrderController {
        <<controller>>
        OrderController
    }
    class OrderCreated {
        <<event>>
        OrderCreated
    }
`} />

</div>


### Customer - account Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Customer - account Lifecycle
    ___ --> pending : start
    pending --> active : to_active
    active --> suspended : to_suspended
    suspended --> deleted : to_deleted
`} />


### Product - inventory Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Product - inventory Lifecycle
    ___ --> draft : start
    draft --> active : to_active
    active --> discontinued : to_discontinued
    discontinued --> archived : to_archived
`} />


### Order - fulfillment Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Order - fulfillment Lifecycle
    ___ --> pending : start
    pending --> processing : to_processing
    processing --> shipped : to_shipped
    shipped --> delivered : to_delivered
`} />


### Order - payment Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Order - payment Lifecycle
    ___ --> unpaid : start
    unpaid --> paid : to_paid
    paid --> refunded : to_refunded
`} />


### Payment - processing Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Payment - processing Lifecycle
    ___ --> pending : start
    pending --> authorized : to_authorized
    authorized --> captured : to_captured
    captured --> settled : to_settled
`} />


### Review - moderation Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Review - moderation Lifecycle
    ___ --> pending : start
    pending --> approved : to_approved
    approved --> rejected : to_rejected
`} />



## Complete Example

### Specly DSL Format
See [./03-06-inference-engine-demo.specly](./03-06-inference-engine-demo.specly) for the complete v3.2 specification.

### Generated: YAML Format
SpecVerse v3.2 uses convention-based Specly DSL as the source format. The build process can generate structured YAML for tooling integration:

```bash
# Generate YAML from Specly DSL
specverse build --format yaml 03-06-inference-engine-demo.specly
```

This produces fully structured YAML with expanded relationship definitions, behavior contracts, and inference analysis derived from the concise Specly syntax.

## Key Features Demonstrated

- **Automatic relationship detection**: Smart foreign key analysis
- **Pattern recognition**: Common architectural patterns
- **Code generation suggestions**: Controller actions, service operations
- **Performance optimization**: Analysis and recommendations
- **Business rule inference**: Domain-specific patterns

## Practical Benefits

### Development Acceleration
- Reduces boilerplate code writing
- Suggests missing components
- Provides architectural guidance

### Quality Improvement
- Enforces naming conventions
- Suggests best practices
- Identifies potential issues

### Consistency Maintenance
- Cross-model validation
- Pattern enforcement
- Standard compliance

## Inference Engine Configuration

### Inference Engine Analysis Summary

**High-Confidence Patterns (Auto-Applied)**:
- Customer.email → Order.customerEmail relationship
- Product.sku → OrderItem.productSku relationship  
- Category self-referencing hierarchy
- Standard CRUD operations for OrderController

**Medium-Confidence Suggestions (Review Required)**:
- Add inventory alerts for low stock conditions
- Consider caching Customer.calculateTotalSpent() results
- Add validation for Payment.amount vs Order.total
- Implement order cancellation workflow

**Domain-Specific Recommendations**:
- E-commerce order lifecycle management
- Inventory reorder point automation
- Customer credit limit validation
- Review moderation workflow

## Validation

Test this example:
```bash
specverse validate examples/03-architecture/03-06-inference-engine-demo.specly
```

## Next Steps

Continue to [Example 03-07: Relationships Demo](./03-07-relationships-demo) to explore advanced relationship patterns and modeling techniques.

## Related Examples

- [Example 01-04: Models with Relations](../01-fundamentals/01-04-models-with-relations) - Basic relationship concepts
- [Example 02-01: Using Profiles](../02-profiles/02-01-using-profiles) - Profile attachment patterns
- [Example 05-02: SpecVerse App Build](../05-meta/05-02-specverse-app-build) - Build system integration