# Example 08-01: Complete Grammar Example

**Category**: Comprehensive Grammar Examples  
**Format**: SpecVerse v3.2 Container  
**Complexity**: Maximum  


## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:16.213Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class User {
        +id: UUID required unique
        +email: Email required unique
        +firstName: String required
        +lastName: String required
        +phone: Phone
        +dateOfBirth: String
        +isActive: Boolean = true
        +loyaltyPoints: Integer = 0
        +tier: String = bronze
        +profile: String
        +preferences: String
        +lastLoginAt: DateTime
        +createdAt: DateTime required
        +updatedAt: DateTime
        +authenticate(email: Email, password: String): String %% requires: user exists, account is active | ensures: token is valid, login attempt logged | publishes: UserLoggedIn
        +updateProfile(value: String): User %% requires: user is authenticated | ensures: profile updated, cache invalidated | publishes: UserProfileUpdated
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Product {
        +id: UUID required unique
        +sku: String required unique
        +name: String required
        +description: String
        +price: Money required
        +cost: Money required
        +stock: Integer = 0
        +category: String required
        +brand: String
        +weight: String
        +dimensions: String
        +images: String
        +tags: String
        +isActive: Boolean = true
        +createdAt: DateTime required
        +updatedAt: DateTime
        +calculateDiscount(quantity: Integer, customerTier: String, promoCode: String?): Money %% requires: product is active, quantity > 0 | ensures: discount is non-negative | publishes: DiscountCalculated
        +checkAvailability(value: Integer): Boolean %% requires: product exists | ensures: availability check is accurate
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Order {
        +id: UUID required unique
        +orderNumber: String required unique
        +customerId: UUID required
        +status: String = pending
        +subtotal: Money required
        +tax: Money required
        +shipping: Money required
        +discount: Money = 0
        +total: Money required
        +currency: String = USD
        +shippingAddress: String required
        +billingAddress: String required
        +notes: String
        +createdAt: DateTime required
        +updatedAt: DateTime
        +calculateTotal(includeTax: Boolean? = true, applyDiscounts: Boolean? = true): Money %% requires: order has items | ensures: total matches sum of components | publishes: OrderTotalCalculated
        +validateOrder(value: String): String %% requires: customer exists, order has items | ensures: validation result is complete
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Payment {
        +id: UUID required
        +orderId: UUID required
        +amount: Money required
        +method: String required
        +status: String = pending
        +transactionId: String
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
    class ProductReview {
        +id: UUID required
        +productId: UUID required
        +customerId: UUID required
        +rating: Integer required
        +title: String
        +comment: String
        +isVerified: Boolean = false
        +isPublic: Boolean = true
        +reviewDate: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class OrderItem {
        +id: UUID required
        +orderId: UUID required
        +productId: UUID required
        +quantity: Integer required
        +unitPrice: Money required
        +totalPrice: Money required
        +discountAmount: Money = 0
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Shipment {
        +id: UUID required
        +orderId: UUID required
        +trackingNumber: String
        +carrier: String required
        +method: String required
        +status: String = preparing
        +shippedAt: DateTime
        +deliveredAt: DateTime
        +estimatedDelivery: DateTime
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ProductVariant {
        +id: UUID required
        +productId: UUID required
        +sku: String required unique
        +name: String required
        +variantType: String required
        +variantValue: String required
        +price: Money
        +stock: Integer = 0
        +isActive: Boolean = true
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class deployment_ecommercePlatform {
        <<deployment>>
        namespace: ecommercePlatform
        version: 2.5.0
        environment: production
    }

    User o-- Order : *_orders
    User o-- Address : *_addresses
    User o-- Payment : *_payments
    User o-- ProductReview : *_reviews
    Product -- Category : 1_category
    Product o-- ProductReview : *_reviews
    Product o-- OrderItem : *_orderItems
    Product o-- ProductVariant : *_variants
    Order -- User : 1_customer
    Order o-- OrderItem : *_items
    Order o-- Payment : *_payments
    Order o-- Shipment : *_shipments
    Payment -- Order : 1_order
    Category o-- Product : *_products
    Category -- Category : 1_parent
    Category o-- Category : *_children
    ProductReview -- Product : 1_product
    ProductReview -- User : 1_customer
    OrderItem -- Order : 1_order
    OrderItem -- Product : 1_product
    Shipment -- Order : 1_order
    ProductVariant -- Product : 1_product
    UserController -- User : 1_manages
    UserController -- PaymentProcessed : 1_subscribes_handleUserLoyaltyPoints
    UserController -- OrderCreated : 1_subscribes_updateUserActivity
    ProductController -- Product : 1_manages
    OrderController -- Order : 1_manages
    PaymentService -- OrderCreated : 1_subscribes_processPayment
    NotificationService -- UserCreated : 1_subscribes_sendWelcomeEmail
    NotificationService -- OrderCreated : 1_subscribes_sendOrderConfirmation
    NotificationService -- PaymentProcessed : 1_subscribes_sendPaymentReceipt

    %% Other components
    class UserController {
        <<controller>>
        UserController
    }
    class ProductController {
        <<controller>>
        ProductController
    }
    class OrderController {
        <<controller>>
        OrderController
    }
    class PaymentService {
        <<service>>
        PaymentService
    }
    class NotificationService {
        <<service>>
        NotificationService
    }
    class InventoryService {
        <<service>>
        InventoryService
    }
    class UserCreated {
        <<event>>
        UserCreated
    }
    class UserLoggedIn {
        <<event>>
        UserLoggedIn
    }
    class OrderCreated {
        <<event>>
        OrderCreated
    }
    class PaymentProcessed {
        <<event>>
        PaymentProcessed
    }
    class ProductRestocked {
        <<event>>
        ProductRestocked
    }
    class OrderStatusChanged {
        <<event>>
        OrderStatusChanged
    }
`} />

</div>


### User - account Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% User - account Lifecycle
    ___ --> pending : start
    pending --> verified : to_verified
    verified --> active : to_active
    active --> suspended : to_suspended
    suspended --> deactivated : to_deactivated
`} />


### User - verification Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% User - verification Lifecycle
    ___ --> unverified : start
    unverified --> verified : verify
    verified --> expired : expire
    expired --> verified : reverify
`} />


### Product - status Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Product - status Lifecycle
    ___ --> draft : start
    draft --> review : to_review
    review --> active : to_active
    active --> discontinued : to_discontinued
    discontinued --> archived : to_archived
`} />


### Product - inventory Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Product - inventory Lifecycle
    ___ --> in_stock : start
    in_stock --> low_stock : to_low_stock
    low_stock --> out_of_stock : to_out_of_stock
    out_of_stock --> discontinued : to_discontinued
`} />


### Order - fulfillment Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Order - fulfillment Lifecycle
    ___ --> pending : start
    pending --> confirmed : to_confirmed
    confirmed --> processing : to_processing
    processing --> shipped : to_shipped
    shipped --> delivered : to_delivered
`} />


### Order - payment Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% Order - payment Lifecycle
    ___ --> unpaid : start
    unpaid --> pending : to_pending
    pending --> paid : to_paid
    paid --> partially_refunded : to_partially_refunded
    partially_refunded --> refunded : to_refunded
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


### ProductReview - moderation Lifecycle


<Mermaid chart={`
stateDiagram-v2
    %% ProductReview - moderation Lifecycle
    ___ --> pending : start
    pending --> approved : to_approved
    approved --> rejected : to_rejected
`} />


## Overview

The ultimate SpecVerse v3.2 demonstration that showcases every language feature, pattern, and capability in one comprehensive specification. This example serves as the definitive reference implementation for the complete SpecVerse grammar.

## Business Domain

**Multi-Domain Enterprise System** integrating e-commerce, user management, content management, analytics, and deployment automation

## Complete Grammar Coverage

### Every Language Construct Demonstrated

#### Models
- **All Attribute Types**: String, Integer, Boolean, DateTime, Array, Object
- **All Relationship Types**: hasMany, belongsTo, manyToMany, self-referencing, polymorphic
- **Complete Lifecycles**: Linear and circular state machines with complex transitions
- **Advanced Behaviors**: Parameters, constraints, event publishing, step definitions
- **Profile Integration**: Multiple profile attachments with conditional logic

#### Controllers
- **Complete CURVED Operations**: Create, Retrieve, Update/Evolve, Delete with variations
- **Advanced Routing**: URL patterns, parameter validation, response handling
- **Event Subscriptions**: Controller event handling for automated management
- **Error Handling**: Comprehensive error responses and recovery patterns
- **Authentication Integration**: Role-based access control and permissions

#### Services
- **Business Logic Patterns**: Complex operations with multi-step workflows
- **Event Publishing**: Service-to-service communication patterns
- **External Integrations**: API calls, database operations, third-party services
- **Async Operations**: Background processing and queue management
- **Cross-Service Communication**: Inter-service event flows and data sharing

#### Events
- **Event Definitions**: Complete payload specifications with type safety
- **Publishing Patterns**: From models, controllers, services, and views
- **Subscription Patterns**: Event handling across all architectural layers
- **Event Flows**: Complex multi-event workflows and choreography
- **Error Events**: Failure handling and recovery event patterns

#### Views
- **All Component Types**: Forms, tables, charts, modals, navigation
- **Data Binding**: One-way and two-way data binding patterns
- **Event Handling**: User interaction and system event responses
- **Layout Systems**: Grid, flexbox, and custom layout specifications
- **Responsive Design**: Multi-device and accessibility patterns

#### Deployments
- **Logical Instance Architecture**: Controller, service, view, and communication instances
- **Capability-Based Design**: Instances advertise capabilities and use capabilities from channels
- **Namespace Organization**: Operational domains for multi-area enterprise modeling
- **Communication Channels**: Logical buses (pubsub, rpc) mediating between instances
- **Scaling Configuration**: Instance scaling based on load patterns and business requirements
- **Environment Management**: Development, staging, production deployment configurations

### Advanced Integration Patterns

#### Cross-Layer Communication
```specly
# Example: Complete event flow through all layers
Order:                          # Model layer
  behaviors:
    processPayment:
      publishes: [PaymentProcessed]

OrderController:                # Controller layer  
  subscribes: [PaymentProcessed]
  actions:
    handlePaymentSuccess:       # Automated response

PaymentService:                 # Service layer
  subscribes: [PaymentProcessed]
  operations:
    updateInventory:            # Business logic

OrderStatusView:               # View layer
  subscribes: [PaymentProcessed]
  components:
    StatusIndicator:            # UI update
```

#### Profile Composition
```specly
# Complex profile attachment with multiple profiles
Customer:
  attributes:
    name: String required
  profile-attachment:
    profiles: [BusinessCustomer, PremiumCustomer, AuditProfile]
    conditions:
      BusinessCustomer: "customerType == 'business'"
      PremiumCustomer: "subscriptionTier == 'premium'"
      AuditProfile: "always"
```

#### Advanced Relationships
```specly
# Every relationship type in one model hierarchy
User:
  relationships:
    profile: hasOne UserProfile
    orders: hasMany Order
    roles: manyToMany Role
    manager: belongsTo User         # Self-referencing
    directReports: hasMany User     # Self-referencing inverse
    
Product:
  relationships:
    reviews: hasMany Review as reviewable  # Polymorphic
    tags: manyToMany Tag through ProductTag # Through table
```

#### Deployment Architecture
```specly
# Capability-based logical instance deployment
deployments:
  ecommercePlatform:
    instances:
      controllers:
        productController:
          component: "e-commerce-platform"
          namespace: "product"
          advertises: "*"  # All behaviors, actions, events
          uses: ["catalog.*", "inventory.*", "orders.*"]
          scale: 5
          
      services:
        paymentService:
          component: "e-commerce-platform"
          namespace: "payment"
          advertises: ["operations.*"]
          uses: ["gateway.*", "fraud.*", "audit.*"]
          scale: 6
          
      communications:
        mainBus:
          namespace: "global"
          capabilities: [
            "product.create", "product.read", "product.update",
            "order.create", "payment.process", "inventory.check"
          ]
          type: "pubsub"
```

## Key Features Demonstrated

### 1. Complete Language Coverage
Every single SpecVerse v3.2 grammar feature is represented and demonstrated in real-world context.

### 2. Integration Excellence
Shows how all architectural layers work together seamlessly in a production system.

### 3. Advanced Patterns
Demonstrates complex scenarios including error handling, performance optimization, and security integration.

### 4. Production Readiness
Includes deployment, monitoring, and operational concerns for enterprise systems.

### 5. Extensibility
Shows how to extend and customize the language for specific domain needs.

## Business Scenarios Covered

### E-commerce Operations
- Product catalog management
- Order processing and fulfillment
- Customer relationship management
- Inventory tracking and updates
- Payment processing and billing

### User Management
- Authentication and authorization
- Role-based access control
- User profile management
- Activity tracking and audit trails
- Multi-tenant organization support

### Content Management
- Document and media management
- Version control and collaboration
- Publishing workflows
- Content delivery and caching
- Search and indexing

### Analytics and Reporting
- Data collection and aggregation
- Real-time analytics and dashboards
- Business intelligence and reporting
- Performance monitoring
- Usage analytics and insights

### System Operations
- Deployment automation
- Infrastructure management
- Monitoring and alerting
- Backup and disaster recovery
- Security and compliance

## Prerequisites

- **Complete Understanding**: All previous example categories (01-07)
- **Enterprise Experience**: Large-scale system design experience
- **SpecVerse Mastery**: Deep knowledge of v3.2 architecture and patterns
- **Domain Knowledge**: Understanding of complex business domains

## Learning Outcomes

### Technical Mastery
1. **Complete Grammar Knowledge**: Understanding of every language feature
2. **Integration Expertise**: How to design cohesive multi-layer systems
3. **Performance Patterns**: Optimizing specifications for scale and efficiency
4. **Security Integration**: Building secure, compliant enterprise systems
5. **Operational Excellence**: Production deployment and monitoring patterns

### Business Value
1. **Rapid Development**: Accelerated enterprise application development
2. **Consistency**: Standardized patterns across large organizations
3. **Maintainability**: Self-documenting, evolving system specifications
4. **Quality Assurance**: Built-in validation and testing patterns
5. **Team Collaboration**: Shared understanding through declarative specifications

## Validation and Testing

### Comprehensive Validation
```bash
# Complete grammar validation
specverse validate examples/08-comprehensive/08-01-complete-grammar-example.specly

# Full test cycle with all checks
specverse test cycle examples/08-comprehensive/08-01-complete-grammar-example.specly

# Advanced validation with performance and security checks
specverse validate --strict --performance --security examples/08-comprehensive/08-01-complete-grammar-example.specly
```

### Expected Results
- ✅ **100% Grammar Coverage**: Every language feature validated
- ✅ **Integration Success**: All layers work together seamlessly
- ✅ **Performance Compliance**: Meets enterprise performance requirements
- ✅ **Security Validation**: Passes security and compliance checks

## Real-World Applications

This comprehensive example serves as:

### Reference Implementation
- **Language Documentation**: Living documentation for SpecVerse v3.2
- **Best Practices Guide**: Recommended patterns for enterprise development
- **Training Material**: Complete learning resource for development teams
- **Validation Standard**: Benchmark for language feature completeness

### Production Templates
- **Enterprise Starter**: Foundation for large-scale application development
- **Domain Templates**: Customizable templates for specific business domains
- **Integration Patterns**: Reusable patterns for common enterprise scenarios
- **Architecture Guidelines**: Standards for consistent system design

## Advanced Techniques

### Meta-Programming Patterns
```specly
# Self-referential specifications for dynamic systems
SpecificationDefinition:
  description: "SpecVerse specification metadata"
  attributes:
    version: String required
    components: Array<ComponentDefinition>
  behaviors:
    validateSpecification:
      description: "Validate specification structure"
      parameters:
        spec: SpecificationDefinition required
      returns: ValidationResult
```

### Performance Optimization
```specly
# Caching and performance patterns
ProductCatalog:
  attributes:
    products: Array<Product> cached
  behaviors:
    loadProducts:
      description: "Load products with caching"
      caching:
        strategy: "lazy-load"
        ttl: "1 hour"
        keys: ["category", "brand"]
```

### Security Integration
```specly
# Security and audit patterns
SecureDocument:
  attributes:
    content: String encrypted
    accessLog: Array<AccessEntry> audit
  behaviors:
    accessDocument:
      description: "Access with security logging"
      requires: ["user.hasPermission('read')", "document.isAccessible()"]
      audit: true
      security:
        encryption: "AES-256"
        logging: "full"
```

## Next Steps

After mastering this comprehensive example:

1. **Apply to Production**: Use patterns in real enterprise projects
2. **Customize for Domain**: Adapt patterns for specific business needs
3. **Contribute Back**: Share improvements and new patterns with community
4. **Train Teams**: Use as training material for development teams
5. **Extend Language**: Propose new features based on real-world experience

## Future Evolution

This comprehensive example will evolve to:

- Demonstrate new language features as they're added
- Showcase emerging architectural patterns
- Integrate with new technologies and platforms
- Provide benchmarks for performance and scalability
- Support tooling development and validation

---

*This complete grammar example represents the pinnacle of SpecVerse v3.2 capabilities, demonstrating how a single specification can capture the complexity of enterprise systems while maintaining clarity, maintainability, and production readiness.*