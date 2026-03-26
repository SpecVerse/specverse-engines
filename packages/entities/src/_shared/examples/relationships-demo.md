# Example 03-07: Relationships Demo

This example provides comprehensive coverage of SpecVerse relationship patterns, demonstrating advanced modeling techniques including complex associations, inheritance patterns, and cross-domain relationships.

## Learning Objectives

- Master all SpecVerse relationship types
- Design complex multi-model associations
- Implement inheritance and composition patterns
- Create cross-domain model relationships
- Optimize relationship performance and navigation

## Relationship Types Overview

### Core Models with Relationships

**Customer and Order Relationship**:
```specly
models:
  Customer:
    description: "Customer with various relationships"
    attributes:
      id: UUID required
      name: String required
      email: Email required
      creditLimit: Money default=1000.00
    relationships:
      orders: hasMany Order
      recentOrders: hasMany Order

  Order:
    description: "Order with relationships"
    attributes:
      id: UUID required
      orderNumber: String required
      customerId: UUID required
      total: Money required
      status: String required values=["pending", "confirmed", "shipped", "delivered"]
    relationships:
      customer: belongsTo Customer
      items: hasMany OrderItem
```

**Product Catalog Relationships**:
```specly
Product:
  description: "Product with relationships"
  attributes:
    id: UUID required
    name: String required
    price: Money required
    categoryId: UUID required
    stock: Integer default=0
  relationships:
    category: belongsTo Category
    orderItems: hasMany OrderItem
    categories: manyToMany Category through:ProductCategory

Category:
  description: "Product category with hierarchical relationships"
  attributes:
    id: UUID required
    name: String required
    parentId: UUID
    isActive: Boolean default=true
  relationships:
    parent: belongsTo Category        # Self-referential
    children: hasMany Category        # Self-referential
    products: hasMany Product
    productCategories: hasMany ProductCategory
```

**Order Line Items with Rich Join Model**:
```specly
OrderItem:
  description: "Order line item"
  attributes:
    id: UUID required
    orderId: UUID required
    productId: UUID required
    quantity: Integer required
    unitPrice: Money required
    lineTotal: Money required
  relationships:
    order: belongsTo Order
    product: belongsTo Product

ProductCategory:
  description: "Rich join table with additional attributes"
  attributes:
    productId: UUID required
    categoryId: UUID required
    isPrimary: Boolean default=false
    sortOrder: Integer default=0
    addedAt: DateTime required
  relationships:
    product: belongsTo Product
    category: belongsTo Category
```

**Polymorphic Relationships**:
```specly
Comment:
  description: "Polymorphic comments that can be attached to multiple model types"
  attributes:
    id: UUID required
    content: String required
    commentableType: String required  # "Product", "Order", etc.
    commentableId: UUID required
    authorName: String required
    createdAt: DateTime required
  # Can be attached to Products, Orders, or other models
```

## Container Architecture

### v3.2 Component Structure

```specly
components:
  RelationshipDemo:
    version: "3.2.0"
    description: "Example 03-07: Demonstrates relationships in SpecVerse v3.2"
    
    export:
      models: [Customer, Order, OrderItem, Product, Category, Comment, ProductCategory]
      controllers: [OrderController, CustomerController, ProductController]
      events: [OrderCreated]
    
    import:
      - from: "@specverse/primitives"
        select: [UUID, Email, DateTime, Money, Integer]
```

### Advanced Relationship Patterns

**One-to-Many (Customer → Orders)**:
```specly
Customer:
  relationships:
    orders: hasMany Order          # All orders for customer
    recentOrders: hasMany Order    # Recent orders (filtered)
```

**Many-to-One (Order → Customer)**:
```specly
Order:
  relationships:
    customer: belongsTo Customer   # Order belongs to one customer
```

**Many-to-Many with Join Model**:
```specly
Product:
  relationships:
    categories: manyToMany Category through:ProductCategory
    
# Rich join model with additional attributes
ProductCategory:
  attributes:
    isPrimary: Boolean default=false  # Primary category flag
    sortOrder: Integer default=0      # Display order
    addedAt: DateTime required        # When relationship was created
```

**Self-Referential Hierarchy**:
```specly
Category:
  relationships:
    parent: belongsTo Category      # Parent category
    children: hasMany Category      # Child categories
```

### Controller Relationship Operations

```specly
controllers:
  CustomerController:
    description: "Customer relationship operations"
    model: Customer
    actions:
      getCustomerWithOrders:
        description: "Get customer with all orders and order items"
        parameters:
          customerId: UUID required
        returns: Customer
        requires: ["Customer exists"]
        ensures: ["Customer with orders and items loaded"]
        
  ProductController:
    description: "Product and category relationship operations"
    model: Product
    actions:
      assignToCategory:
        description: "Assign product to category with metadata"
        parameters:
          productId: UUID required
          categoryId: UUID required
          isPrimary: Boolean
        returns: Boolean
        requires: ["Product exists", "Category exists"]
        ensures: ["Product-category relationship created"]
```

## Relationship Navigation Examples

### Complex Relationship Chains

**Customer → Order → OrderItem → Product Chain**:
```specly
# Navigate from Customer to all Products they've ordered
Customer:
  relationships:
    orders: hasMany Order
    
Order:
  relationships:
    items: hasMany OrderItem
    
OrderItem:
  relationships:
    product: belongsTo Product
    
# Result: Customer.orders.items.product gives all products ordered by customer
```

**Category Hierarchy Navigation**:
```specly
Category:
  relationships:
    parent: belongsTo Category      # Navigate up hierarchy
    children: hasMany Category      # Navigate down hierarchy
    products: hasMany Product       # Products in this category
    
# Navigation examples:
# - category.parent.parent (grandparent category)
# - category.children.products (all products in child categories)
# - category.products.orderItems (all order items for products in category)
```

### Event-Driven Relationship Updates

```specly
events:
  OrderCreated:
    description: "Order created event with relationship data"
    attributes:
      orderId: UUID required
      customerId: UUID required         # Links to Customer
      customerEmail: Email required     # Denormalized for performance
      total: Money required
      itemCount: Integer required       # Count of OrderItems
      createdAt: DateTime required
      
# When OrderCreated is published:
# - Customer.orders relationship is automatically updated
# - Customer.recentOrders is refreshed
# - Analytics can track customer purchase patterns
```

### Relationship Performance Patterns

**Efficient Relationship Loading**:
- `Customer.orders` - Load customer's orders on demand
- `Customer.recentOrders` - Filtered relationship for common queries
- `Order.items` - Load order items with order details
- `Product.categories` - Many-to-many through rich join model

**Join Model Benefits**:
```specly
ProductCategory:
  attributes:
    isPrimary: Boolean default=false    # Mark primary category
    sortOrder: Integer default=0        # Control display order
    addedAt: DateTime required          # Track when relationship was created
    
# Enables queries like:
# - Get primary category for product
# - Sort products by category assignment order
# - Find recently categorized products
```

## Practical Relationship Use Cases

### E-Commerce Domain Modeling

**Customer Management**:
- Track all customer orders and order history
- Calculate customer lifetime value from orders
- Manage customer credit limits and spending

**Product Catalog Organization**:
- Hierarchical category structures (Electronics → Mobile → Phones)
- Products can belong to multiple categories
- Track primary vs secondary category assignments

**Order Processing**:
- Link orders to customers for account management
- Break orders into line items for detailed tracking
- Calculate order totals from individual items

**Inventory Management**:
- Track which products are ordered most frequently
- Monitor stock levels across product categories
- Analyze purchase patterns by customer segments

### Indexed Relationships

```yaml
Product:
  Relations:
    reviews:
      Type: "HasMany"
      Target: "Review"
      IndexHints:
        - "INDEX(productId, status)"
        - "INDEX(createdAt)"
      
  Behaviors:
    getTopRatedProducts:
      Query: "Use covering index for rating calculations"
      IndexStrategy: "rating_product_covering_idx"
```

### Pagination Support

```yaml
Blog:
  Relations:
    posts:
      Type: "HasMany"
      Target: "Post"
      Pagination:
        DefaultSize: 20
        MaxSize: 100
        Strategy: "cursor"
```

## Cross-Domain Relationships

### Service Boundaries

```yaml
OrderService:
  Models:
    Order:
      Relations:
        customer:
          Type: "Reference"
          Service: "CustomerService"
          Model: "Customer"
          Key: "customerId"
          
CustomerService:
  Models:
    Customer:
      Relations:
        orders:
          Type: "Reference"
          Service: "OrderService"
          Model: "Order"
          ForeignKey: "customerId"
```

### Event-Driven Relationships

```yaml
Order:
  Relations:
    customer:
      Type: "EventDriven"
      Target: "Customer"
      Events:
        Load: "CustomerRequested"
        Cache: "CustomerCached"
        Invalidate: "CustomerUpdated"
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.385Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Customer {
        +id: UUID required
        +name: String required
        +email: Email required
        +creditLimit: Money = 1000.00
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Order {
        +id: UUID required
        +orderNumber: String required
        +customerId: UUID required
        +total: Money required
        +status: String required
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
        +lineTotal: Money required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Product {
        +id: UUID required
        +name: String required
        +price: Money required
        +categoryId: UUID required
        +stock: Integer = 0
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Category {
        +id: UUID required
        +name: String required
        +parentId: UUID
        +isActive: Boolean = true
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Comment {
        +id: UUID required
        +content: String required
        +commentableType: String required
        +commentableId: UUID required
        +authorName: String required
        +createdAt: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class ProductCategory {
        +productId: UUID required
        +categoryId: UUID required
        +isPrimary: Boolean = false
        +sortOrder: Integer = 0
        +addedAt: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    Customer o-- Order : *_orders
    Customer o-- Order : *_recentOrders
    Order -- Customer : 1_customer
    Order o-- OrderItem : *_items
    OrderItem -- Order : 1_order
    OrderItem -- Product : 1_product
    Product -- Category : 1_category
    Product o-- OrderItem : *_orderItems
    Product -- Category : *_categories
    Category -- Category : 1_parent
    Category o-- Category : *_children
    Category o-- Product : *_products
    Category o-- ProductCategory : *_productCategories
    ProductCategory -- Product : 1_product
    ProductCategory -- Category : 1_category
    OrderController -- Order : 1_manages
    CustomerController -- Customer : 1_manages
    ProductController -- Product : 1_manages

    %% Other components
    class OrderController {
        <<controller>>
        OrderController
    }
    class CustomerController {
        <<controller>>
        CustomerController
    }
    class ProductController {
        <<controller>>
        ProductController
    }
    class OrderCreated {
        <<event>>
        OrderCreated
    }
`} />

</div>



## Complete Example

### Specly DSL Format
See [./03-07-relationships-demo.specly](./03-07-relationships-demo.specly) for the complete v3.2 specification.

### Generated: YAML Format
SpecVerse v3.2 uses convention-based Specly DSL as the source format. The build process can generate structured YAML for tooling integration:

```bash
# Generate YAML from Specly DSL
specverse build --format yaml 03-07-relationships-demo.specly
```

This produces fully structured YAML with expanded relationship definitions, join table specifications, and navigation patterns derived from the concise Specly syntax.

## Key Features Demonstrated

- **All relationship types**: BelongsTo, HasMany, HasOne, ManyToMany
- **Advanced patterns**: Polymorphic, self-referential, conditional
- **Performance optimization**: Eager loading, indexing, pagination
- **Complex associations**: Through models, rich joins, nested navigation
- **Cross-domain relationships**: Service boundaries, event-driven

## Relationship Design Principles

### Data Integrity
- Always define inverse relationships
- Use appropriate cascade options
- Validate relationship constraints

### Performance Considerations
- Plan for common access patterns
- Use appropriate indexing strategies
- Consider caching for expensive joins

### Domain Modeling
- Reflect real-world business relationships
- Use meaningful relationship names
- Document relationship semantics

## Advanced Techniques

### Relationship Validation and Integrity

**Data Integrity Rules**:
- Order.customerId must reference existing Customer
- OrderItem.orderId must reference existing Order
- OrderItem.productId must reference existing Product
- Category.parentId must reference existing Category (self-referential)

**Business Logic Validation**:
- Customer credit limit checking before order creation
- Product stock validation before adding to order
- Category hierarchy depth limits
- Primary category constraints (one per product)

**Performance Considerations**:
- Index foreign keys for efficient joins
- Consider denormalization for frequently accessed data
- Use pagination for large relationship collections
- Cache computed relationship aggregates

## Validation

Test this example:
```bash
specverse validate examples/03-architecture/03-07-relationships-demo.specly
```

## Next Steps

Continue to [Example 04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog) to see these relationship patterns applied in a complete business domain.

## Related Examples

- [Example 01-04: Models with Relations](../01-fundamentals/01-04-models-with-relations) - Basic relationship concepts
- [Example 03-06: Inference Engine Demo](./03-06-inference-engine-demo) - Automatic relationship detection
- [Example 04-02: Organization Management](../04-domains/04-02-organization-management) - Complex organizational relationships