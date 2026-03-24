# Example 01-04: Models with Relations

This example demonstrates how to connect models through relationships in SpecVerse v3.2, creating a foundation for complex business domains.

## Learning Objectives

- Define relationships between models using v3.2 syntax
- Use hasMany, belongsTo, and hasOne relations
- Create connected business entities
- Design normalized data structures

## Key Concepts

### Relationship Types in v3.2

**hasMany**: One model contains multiple instances of another
```specly
relationships:
  orders: hasMany Order
```

**belongsTo**: Model is owned/associated with another
```specly
relationships:
  customer: belongsTo Customer
```

**hasOne**: One-to-one relationship (for future use)

### Model Connection Example
A complete e-commerce model with relationships:
```specly
components:
  SpecVerseFundamentals:
    models:
      Customer:
        description: "Customer who places orders"
        attributes:
          id: UUID required
          name: String required
          email: Email required unique
          createdAt: DateTime required
        relationships:
          orders: hasMany Order
      
      Order:
        description: "Customer order containing multiple items"
        attributes:
          id: UUID required
          orderDate: DateTime required
          status: String required
          total: Money required
        relationships:
          customer: belongsTo Customer
          items: hasMany OrderItem
```

### Navigation Patterns
The relationship structure enables navigation:
```specly
# Customer → Orders → OrderItems navigation
# customer.orders (hasMany Order)
# order.items (hasMany OrderItem)  
# item.orderRef (belongsTo Order)
# item.product (belongsTo Product)
```

### Relationship Configuration
v3.2 uses simple, declarative relationship syntax:
```specly
relationships:
  items: hasMany OrderItem
  product: belongsTo Product
  orderRef: belongsTo Order
```

## Model Design Patterns

### Master-Detail Pattern
- **Customer** (master) has many **Orders** (detail)
- **Order** (master) has many **OrderItems** (detail)

### Association Pattern
- **Order** belongs to **Customer**
- **OrderItem** belongs to **Order** and **Product**

### Normalized Structure
- Separate entities for logical grouping
- Clear ownership relationships
- Referential integrity through relationships

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:18.404Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Customer {
        +id: UUID required
        +name: String required
        +email: Email required unique
        +createdAt: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Order {
        +id: UUID required
        +orderDate: DateTime required
        +status: String required
        +total: Money required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class OrderItem {
        +id: UUID required
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
        +stock: Integer = 0
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    Customer o-- Order : *_orders
    Order -- Customer : 1_customer
    Order o-- OrderItem : *_items
    OrderItem -- Order : 1_orderRef
    OrderItem -- Product : 1_product
`} />

</div>


## Complete Example

### Primary: Specly DSL Format (.specly)
```specly
components:
  SpecVerseFundamentals:
    version: "3.2.0"
    description: "Example 01-04: Models with relationships demonstrating data connections"
    
    export:
      models: [Customer, Order, OrderItem, Product]
    
    import:
      - from: "@specverse/primitives"
        select: [Money]
    
    models:
      Customer:
        description: "Customer who places orders"
        attributes:
          id: UUID required
          name: String required
          email: Email required unique
          createdAt: DateTime required
        relationships:
          orders: hasMany Order
      
      Order:
        description: "Customer order containing multiple items"
        attributes:
          id: UUID required
          orderDate: DateTime required
          status: String required
          total: Money required
        relationships:
          customer: belongsTo Customer
          items: hasMany OrderItem
      
      OrderItem:
        description: "Individual item within an order"
        attributes:
          id: UUID required
          quantity: Integer required
          unitPrice: Money required
          lineTotal: Money required
        relationships:
          orderRef: belongsTo Order
          product: belongsTo Product
      
      Product:
        description: "Product available for purchase"
        attributes:
          id: UUID required
          name: String required
          price: Money required
          stock: Integer default=0

deployments: {}
```

See the full file: [01-04-models-with-relations.specly](./01-04-models-with-relations.specly)

### Generated: YAML Format
The YAML format is automatically generated from the Specly DSL using:
```bash
specverse gen yaml 01-04-models-with-relations.specly -o 01-04-models-with-relations.yaml
```

## Key Features Demonstrated

- **Relationship definitions**: hasMany and belongsTo patterns in v3.2
- **Connected models**: Multi-entity business domains
- **Navigation patterns**: Traversing related data structures
- **Normalized design**: Proper separation of concerns across entities
- **Real-world modeling**: E-commerce order management system

## Practical Use Cases

- **E-commerce**: Customer → Orders → OrderItems → Products
- **Blog system**: Author → Posts → Comments → Categories
- **Organization**: Department → Employees → Projects → Tasks
- **Content management**: Category → Articles → Tags → Authors

## Design Best Practices

### Relationship Clarity
- Use descriptive relationship names (`orders`, `customer`, `items`)
- Document the business purpose of each relationship
- Use consistent naming patterns across models

### Navigation Efficiency
- Design for common access patterns (Customer → Orders)
- Consider bidirectional relationships where needed
- Plan for performance requirements with proper indexing

### Data Integrity
- Use belongsTo for ownership relationships
- Use hasMany for collection relationships
- Ensure referential integrity through proper foreign keys

## Validation

Test this example:
```bash
# Validate the Specly source file
specverse validate examples/01-fundamentals/01-04-models-with-relations.specly

# Run full test cycle
specverse test cycle examples/01-fundamentals/01-04-models-with-relations.specly
```

## Next Steps

Continue to [Example 02-01: Using Profiles](../02-profiles/02-01-using-profiles) to learn about dynamic model composition through the profile system.

## Related Examples

- [Example 01-01: Basic Model](./01-01-basic-model) - Foundation model concepts
- [Example 01-03: Model with Behaviors](./01-03-model-with-behaviors) - Adding business logic
- [Example 03-07: Relationships Demo](../03-architecture/03-07-relationships-demo) - Advanced relationship patterns