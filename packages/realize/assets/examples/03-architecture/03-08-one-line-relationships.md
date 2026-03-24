# Example 03-08: One-Line Relationships

This example demonstrates SpecVerse's concise one-line relationship syntax, showing how to define complex data relationships in a clean, readable format that reduces boilerplate while maintaining full expressiveness.


## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.279Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Customer {
        +id: UUID required
        +name: String required
        +email: Email required unique
        +createdAt: DateTime required
        +status: String = active
        +calculateLifetimeValue(): Money %% requires: orders collection is available | ensures: Returns sum of all completed order totals
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Order {
        +id: UUID required
        +orderNumber: String required unique
        +orderDate: DateTime required
        +total: Money required
        +status: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class OrderItem {
        +id: UUID required
        +quantity: Integer required
        +unitPrice: Money required
        +lineTotal: Money required
        +productName: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Product {
        +id: UUID required
        +name: String required
        +price: Money required
        +description: String
        +inStock: Boolean = true
        +sku: String required unique
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Category {
        +id: UUID required
        +name: String required
        +description: String
        +isActive: Boolean = true
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class CustomerProfile {
        +id: UUID required
        +bio: String
        +preferences: String
        +customerId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Address {
        +id: UUID required
        +street: String required
        +city: String required
        +country: String required
        +isDefault: Boolean = false
        +customerId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Payment {
        +id: UUID required
        +amount: Money required
        +method: String required
        +processedAt: DateTime required
        +orderId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ProductVariant {
        +id: UUID required
        +sku: String required unique
        +name: String required
        +price: Money required
        +productId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Review {
        +id: UUID required
        +rating: Integer required min=1 max=5
        +comment: String
        +createdAt: DateTime required
        +productId: UUID required
        +customerId: UUID required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Tag {
        +id: UUID required
        +name: String required unique
        +color: String = blue
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Coupon {
        +id: UUID required
        +code: String required unique
        +discount: Money required
        +expiresAt: DateTime required
        +isActive: Boolean = true
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Offer {
        +id: UUID required
        +title: String required
        +description: String required
        +validUntil: DateTime required
        +isActive: Boolean = true
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class CustomerPreference {
        +customerId: UUID required
        +productId: UUID required
        +preference: Integer required min=1 max=10
        +createdAt: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class OrderCoupon {
        +orderId: UUID required
        +couponId: UUID required
        +appliedAt: DateTime required
        +discountAmount: Money required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class CustomerOfferAssignment {
        +customerId: UUID required
        +offerId: UUID required
        +assignedAt: DateTime required
        +notified: Boolean = false
        +accepted: Boolean = false
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ProductBundle {
        +productId: UUID required
        +bundledProductId: UUID required
        +quantity: Integer required min=1
        +discountPercent: Integer = 0
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    Customer o-- Order : *_orders
    Customer -- CustomerProfile : 1_profile
    Customer o-- Order : *_orderHistory
    Customer -- Address : 1_primaryAddress
    Customer o-- CustomerPreference : *_preferences
    Customer -- Customer : 1_referredBy
    Customer o-- Review : *_reviews
    Order -- Customer : 1_customer
    Order o-- OrderItem : *_items
    Order -- Payment : 1_payment
    Order o-- OrderCoupon : *_appliedCoupons
    OrderItem -- Order : 1_order
    OrderItem -- Product : 1_product
    Product -- Category : 1_category
    Product o-- ProductVariant : *_variants
    Product o-- Review : *_reviews
    Product -- Tag : *_tags
    Product o-- OrderItem : *_orderItems
    Category -- Category : 1_parent
    Category o-- Category : *_children
    Category o-- Product : *_products
    CustomerProfile -- Customer : 1_customer
    Address -- Customer : 1_customer
    Payment -- Order : 1_order
    ProductVariant -- Product : 1_product
    Review -- Product : 1_product
    Review -- Customer : 1_customer
    Tag -- Product : *_products
    Coupon o-- OrderCoupon : *_orders
    Offer o-- CustomerOfferAssignment : *_customers
    CustomerPreference -- Customer : 1_customer
    CustomerPreference -- Product : 1_product
    OrderCoupon -- Order : 1_order
    OrderCoupon -- Coupon : 1_coupon
    CustomerOfferAssignment -- Customer : 1_customer
    CustomerOfferAssignment -- Offer : 1_offer
    ProductBundle -- Product : 1_product
    ProductBundle -- Product : 1_bundledProduct

    %% Other components
    class OrderConfirmed {
        <<event>>
        OrderConfirmed
    }
    class OrderShipped {
        <<event>>
        OrderShipped
    }
`} />

</div>


## Learning Objectives

- Master one-line relationship syntax for all relationship types
- Understand relationship modifiers (cascade, dependent, through, key)
- Learn when to use one-line vs verbose syntax
- Explore complex relationship patterns in real-world scenarios
- See how one-line syntax improves readability

## Key Concepts

### One-Line Relationship Syntax

SpecVerse v3.2 supports defining relationships in a single line using convention syntax:

```specly
relationships:
  orders: hasMany Order
  profile: hasOne CustomerProfile
  customer: belongsTo Customer
  tags: manyToMany Tag
```

### v3.2 Component Structure

```specly
components:
  OneLineRelationshipsDemo:
    version: "3.2.0"
    description: "Example 03-08: Demonstrates comprehensive relationship patterns in SpecVerse v3.2"
    
    export:
      models: [Customer, Order, OrderItem, Product, Category, CustomerProfile, Address, Payment]
      events: [OrderConfirmed, OrderShipped]
    
    import:
      - from: "@specverse/primitives"
        select: [Money]
```

### Core Relationship Patterns

**One-to-Many (hasMany)**: Parent has multiple children
```specly
Customer:
  relationships:
    orders: hasMany Order
    reviews: hasMany Review
```

**One-to-One (hasOne)**: Exclusive relationship
```specly
Customer:
  relationships:
    profile: hasOne CustomerProfile
    primaryAddress: hasOne Address
```

**Many-to-One (belongsTo)**: Child belongs to parent
```specly
Order:
  relationships:
    customer: belongsTo Customer
    payment: hasOne Payment
```

**Many-to-Many (manyToMany)**: Bidirectional associations
```specly
Product:
  relationships:
    tags: manyToMany Tag
```

## Complete E-Commerce Domain Model

### Customer Management

```specly
Customer:
  description: "Customer with various relationship formats"
  attributes:
    id: UUID required
    name: String required
    email: Email required unique
    status: String default=active
  relationships:
    orders: hasMany Order                    # All customer orders
    profile: hasOne CustomerProfile          # Extended customer info
    primaryAddress: hasOne Address           # Default shipping address  
    preferences: hasMany CustomerPreference  # Product preferences
    referredBy: belongsTo Customer          # Self-referential (referrals)
    reviews: hasMany Review                  # Product reviews by customer
  behaviors:
    calculateLifetimeValue:
      description: "Calculate total value across all orders"
      returns: Money
      ensures: ["Returns sum of all completed order totals"]

CustomerProfile:
  description: "Extended customer information"
  attributes:
    bio: String
    preferences: String
    customerId: UUID required
  relationships:
    customer: belongsTo Customer
```

### Order Processing

```specly
Order:
  description: "Customer order with one-line relationships"
  attributes:
    id: UUID required
    orderNumber: String required unique
    total: Money required
    status: String required values=["pending", "confirmed", "shipped", "delivered", "cancelled"]
  relationships:
    customer: belongsTo Customer        # Order belongs to one customer
    items: hasMany OrderItem           # Order contains multiple items
    payment: hasOne Payment            # One payment per order
    appliedCoupons: hasMany OrderCoupon # Applied discount coupons

OrderItem:
  description: "Individual item in an order"
  attributes:
    quantity: Integer required
    unitPrice: Money required
    lineTotal: Money required
    productName: String required
  relationships:
    order: belongsTo Order    # Line item belongs to order
    product: belongsTo Product # References catalog product
```

### Product Catalog

```specly
Product:
  description: "Product with complex relationship patterns"
  attributes:
    id: UUID required
    name: String required
    price: Money required
    sku: String required unique
    inStock: Boolean default=true
  relationships:
    category: belongsTo Category       # Product belongs to category
    variants: hasMany ProductVariant   # Size/color variants
    reviews: hasMany Review           # Customer reviews
    tags: manyToMany Tag             # Flexible tagging system
    orderItems: hasMany OrderItem     # Track order history

Category:
  description: "Hierarchical product category"
  attributes:
    name: String required
    isActive: Boolean default=true
  relationships:
    parent: belongsTo Category     # Self-referential hierarchy
    children: hasMany Category     # Child categories
    products: hasMany Product      # Products in category
```

### Advanced Relationship Patterns

**Self-Referential Relationships**:
```specly
Customer:
  relationships:
    referredBy: belongsTo Customer  # Customer who made referral
    
Category:
  relationships:
    parent: belongsTo Category      # Parent category
    children: hasMany Category      # Child categories
```

**Rich Join Models**:
```specly
CustomerPreference:
  description: "Customer product preferences with rating"
  attributes:
    customerId: UUID required
    productId: UUID required  
    preference: Integer required min=1 max=10  # Preference strength
    createdAt: DateTime required
  relationships:
    customer: belongsTo Customer
    product: belongsTo Product

OrderCoupon:
  description: "Coupon applied to specific order"
  attributes:
    orderId: UUID required
    couponId: UUID required
    discountAmount: Money required  # Actual discount applied
    appliedAt: DateTime required
  relationships:
    order: belongsTo Order
    coupon: belongsTo Coupon
```

### Event Integration

```specly
events:
  OrderConfirmed:
    description: "Order has been confirmed"
    attributes:
      orderId: UUID required
      customerId: UUID required        # Links to Customer relationship
      orderNumber: String required
      total: Money required
      confirmedAt: DateTime required
  
  OrderShipped:
    description: "Order has been shipped"
    attributes:
      orderId: UUID required
      trackingNumber: String required
      carrier: String required
      shippedAt: DateTime required
```

### Benefits of v3.2 Relationship Syntax

**Concise and Readable**: One-line relationship definitions
```specly
# Clear, concise relationship definitions
relationships:
  customer: belongsTo Customer
  items: hasMany OrderItem
  payment: hasOne Payment
```

**Type Safety**: Strong typing with convention validation
**Performance**: Optimized for common relationship patterns
**Consistency**: Uniform syntax across all relationship types

## Complete Example

### Specly DSL Format
See [./03-08-one-line-relationships.specly](./03-08-one-line-relationships.specly) for the complete v3.2 specification.

### Generated: YAML Format
SpecVerse v3.2 uses convention-based Specly DSL as the source format. The build process can generate structured YAML for tooling integration:

```bash
# Generate YAML from Specly DSL
specverse build --format yaml 03-08-one-line-relationships.specly
```

This produces fully structured YAML with expanded relationship definitions, foreign key mappings, and join table specifications derived from the concise Specly syntax.

## Validation

```bash
specverse validate examples/03-architecture/03-08-one-line-relationships.specly
```

## Comprehensive Domain Coverage

**17 Model Types**: Complete e-commerce domain modeling
- Core entities: Customer, Order, Product, Category
- Supporting models: Address, Payment, Review, Tag
- Relationship models: CustomerPreference, OrderCoupon, ProductBundle
- Extended features: ProductVariant, Coupon, Offer

**Relationship Types Demonstrated**:
- `hasMany` - One-to-many relationships
- `hasOne` - One-to-one relationships  
- `belongsTo` - Many-to-one relationships
- `manyToMany` - Many-to-many relationships
- Self-referential relationships
- Rich join models with additional attributes

**Business Logic Integration**:
- Customer lifetime value calculation
- Order confirmation and shipping events
- Product preference tracking
- Coupon application system

## Next Steps

- Review [Example 03-07: Relationships Demo](./03-07-relationships-demo) for advanced relationship patterns
- Explore [Example 01-04: Models with Relations](../01-fundamentals/01-04-models-with-relations) for relationship fundamentals
- See relationships in action with [Example 04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog)

## Key Takeaways

- **Convention Over Configuration**: Simple, readable relationship syntax
- **Comprehensive Coverage**: All relationship patterns in single example
- **Type Safety**: Strong typing with validation built-in
- **Business Logic Integration**: Behaviors and events work with relationships
- **Performance Optimized**: Efficient relationship loading and navigation
- **Development Velocity**: Faster modeling with less boilerplate