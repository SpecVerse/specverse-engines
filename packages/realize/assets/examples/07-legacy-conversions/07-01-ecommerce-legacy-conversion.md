# Example 07-01: E-commerce Legacy Conversion

**Source**: `../SpecLang/example_full.json`  
**Category**: Legacy Format Conversions  
**Format**: SpecVerse v3.2 Container  


## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:16.533Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required unique
        +name: String required
        +description: String
        +price: Money required
        +inventory: Integer required
        +inventoryThreshold: Integer = 5
        +category: String required
        +decreaseInventory(quantity: Integer): Boolean %% requires: quantity > 0, inventory >= quantity | ensures: inventory reduced by quantity | publishes: LowInventoryDetected
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Order {
        +id: UUID required unique
        +customerId: UUID required
        +date: DateTime required
        +total: Money required
        +status: String required = pending
        +updateStatus(newStatus: String): Order %% requires: newStatus is valid | ensures: status updated, event published | publishes: OrderStatusChanged
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    OrderController -- Order : 1_manages
    ProductController -- Product : 1_manages

    %% Other components
    class OrderController {
        <<controller>>
        OrderController
    }
    class ProductController {
        <<controller>>
        ProductController
    }
    class OrderPlaced {
        <<event>>
        OrderPlaced
    }
    class OrderStatusChanged {
        <<event>>
        OrderStatusChanged
    }
    class LowInventoryDetected {
        <<event>>
        LowInventoryDetected
    }
`} />

</div>


## Overview

This example demonstrates the conversion of a legacy JSON-based specification to SpecVerse v3.2, showcasing basic e-commerce functionality with enhanced v3.2 features including steps in behaviors and controller route mappings.

## Business Domain

**E-commerce Platform** with product catalog and order management

## Key Features Demonstrated

### Enhanced v3.2 Features
- **Steps in Behaviors**: Detailed workflow step definitions
- **Controller Routes**: URL-to-action mapping capabilities  
- **Enhanced View Components**: Rich component properties with events
- **Type Safety**: Enhanced type definitions with validation

### Business Functionality
- Product and Order models with behaviors
- OrderController and ProductController with route mappings
- ProductCatalogView with enhanced component definitions
- Complete purchase workflow

## SpecVerse Concepts

### Models
- **Product**: Core product entity with pricing and inventory
- **Order**: Order processing with lifecycle management

### Controllers  
- **ProductController**: Product management operations
- **OrderController**: Order processing and fulfillment

### Views
- **ProductCatalogView**: Enhanced UI components with properties and events

### Key Conversions Made

#### 1. Structure Transformation
- **JSON Format** → **v3.2 Container Format**
- Root sections → `components:` wrapper
- Nested component structure with version and metadata

#### 2. Convention Processing  
- **Expanded YAML** → **Human-friendly conventions**
- `"Parameters": {...}` → `parameters: name: Type modifiers`
- `"Payload": {...}` → `attributes: name: Type modifiers`

#### 3. Enhanced Features
- **Steps Arrays**: Detailed workflow definitions in behaviors/actions
- **Component Properties**: Rich UI component specifications
- **Controller Routes**: URL-to-action mappings
- **Type Safety**: Enhanced type definitions

## Prerequisites

- Understanding of legacy JSON specification formats
- Familiarity with SpecVerse v3.2 container format
- Knowledge of e-commerce domain modeling

## Learning Outcomes

1. **Legacy Migration**: How to convert JSON specifications to v3.2
2. **Feature Enhancement**: Leveraging v3.2's richer modeling capabilities  
3. **Convention Power**: Using human-friendly syntax effectively
4. **Business Logic**: Modeling complete e-commerce workflows

## Validation

This converted specification passes complete validation:

```bash
# Validate the conversion
specverse validate examples/07-legacy-conversions/07-01-ecommerce-legacy-conversion.specly

# Run full test cycle
specverse test cycle examples/07-legacy-conversions/07-01-ecommerce-legacy-conversion.specly
```

**Result**: ✅ 100% validation success

## Next Steps

- Review [07-02: Inventory Management Conversion](./07-02-inventory-management-conversion) for complex inventory patterns
- Explore [07-03: Guesthouse Booking Conversion](./07-03-guesthouse-booking-conversion) for relational models
- See [05-01: SpecVerse Meta-Specification](../05-meta/05-01-specverse-meta-specification) for advanced patterns

This example demonstrates how legacy specifications can be successfully migrated to SpecVerse v3.2 while gaining enhanced modeling capabilities and maintaining backward compatibility.