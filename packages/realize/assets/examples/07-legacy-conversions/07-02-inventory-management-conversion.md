# Example 07-02: Inventory Management Conversion

**Source**: `../SpecLang/inventory_management_compatible_corrected.json`  
**Category**: Legacy Format Conversions  
**Format**: SpecVerse v3.2 Container  


## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:16.431Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required unique
        +name: String required
        +description: String
        +price: Money required
        +inventory: Integer required
        +inventoryThreshold: Integer required = 5
        +category: String required
        +increaseInventory(quantity: Integer): Product %% publishes: ProductPurchased
        +decreaseInventory(quantity: Integer): Product %% requires: quantity > 0, inventory >= quantity | publishes: ProductSold, LowInventoryDetected, OutOfStockDetected
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Transaction {
        +id: UUID required unique
        +productId: UUID required
        +transactionType: String required
        +quantity: Integer required
        +unitPrice: Money required
        +totalAmount: Money required
        +timestamp: DateTime required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    ProductController -- Product : 1_manages
    TransactionController -- Transaction : 1_manages

    %% Other components
    class ProductController {
        <<controller>>
        ProductController
    }
    class TransactionController {
        <<controller>>
        TransactionController
    }
    class ProductAdded {
        <<event>>
        ProductAdded
    }
    class ProductDeleted {
        <<event>>
        ProductDeleted
    }
    class ProductPurchased {
        <<event>>
        ProductPurchased
    }
    class ProductSold {
        <<event>>
        ProductSold
    }
    class LowInventoryDetected {
        <<event>>
        LowInventoryDetected
    }
    class OutOfStockDetected {
        <<event>>
        OutOfStockDetected
    }
`} />

</div>


## Overview

This example showcases a comprehensive inventory management system converted from legacy JSON format, featuring complex behaviors, multiple controllers, and rich view components with advanced UI specifications.

## Business Domain

**Inventory Management System** with product tracking, transactions, and rich UI components

## Key Features Demonstrated

### Advanced Features
- **Multiple View Types**: Catalog, detail, and form views
- **Complex Component Properties**: Validation and data binding
- **Event-Driven Architecture**: Inventory updates through events
- **Rich UI Components**: Data grids, forms, and panels

### Business Functionality
- Product and Transaction models with complex behaviors
- Multiple controllers for different business operations
- Comprehensive view layer with various component types
- Real-time inventory tracking and updates

## SpecVerse Concepts

### Models
- **Product**: Advanced product entity with inventory tracking
- **Transaction**: Complex transaction processing with audit trails

### Controllers  
- **ProductController**: Product lifecycle management
- **TransactionController**: Transaction processing and validation

### Views
- **Multiple View Types**: 
  - Catalog views for browsing
  - Detail views for inspection
  - Form views for data entry
  - Data grids for tabular display

### Advanced Patterns

#### 1. Complex Component Properties
```specly
components:
  InventoryForm:
    properties:
      validation: "real-time"
      dataBinding: "two-way"
      errorHandling: "inline"
```

#### 2. Event-Driven Updates
```specly
behaviors:
  updateInventory:
    steps:
      - "Validate transaction"
      - "Update stock levels"
      - "Publish inventory change event"
    publishes: [InventoryUpdated]
```

#### 3. Rich UI Specifications
- Data validation and binding
- Component event handling
- Layout and styling specifications
- Responsive design patterns

## Key Conversions Made

#### 1. View Layer Enhancement
- **Basic Components** → **Rich Component Specifications**
- Added properties, events, and validation
- Structured layout definitions instead of arrays

#### 2. Business Logic Separation
- **Monolithic Logic** → **Service-Oriented Architecture**
- Clear separation between controllers and business logic
- Event-driven component communication

#### 3. Data Modeling
- **Simple Attributes** → **Complex Type Definitions**
- Enhanced validation and constraints
- Relationship modeling improvements

## Prerequisites

- Complete [07-01: E-commerce Legacy Conversion](./07-01-ecommerce-legacy-conversion)
- Understanding of inventory management concepts
- Familiarity with complex UI component modeling
- Knowledge of event-driven architecture

## Learning Outcomes

1. **Complex System Migration**: Converting comprehensive business systems
2. **UI Component Modeling**: Rich component specifications with events
3. **Event Architecture**: Implementing reactive system patterns
4. **Service Design**: Separating concerns in complex applications

## Validation

This converted specification demonstrates production-ready patterns:

```bash
# Validate the conversion
specverse validate examples/07-legacy-conversions/07-02-inventory-management-conversion.specly

# Run full test cycle
specverse test cycle examples/07-legacy-conversions/07-02-inventory-management-conversion.specly
```

**Result**: ✅ 100% validation success with complex patterns

## Next Steps

- Review [07-03: Guesthouse Booking Conversion](./07-03-guesthouse-booking-conversion) for relational modeling
- Explore [04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog) for modern domain patterns
- See [03-04: Views and Components](../03-architecture/03-04-views-and-components) for view layer best practices

This example demonstrates how complex legacy systems can be modernized using SpecVerse v3.2's advanced features while maintaining full functionality and improving maintainability.