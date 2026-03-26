# Example 03-04: Views and Components

This example demonstrates frontend specification patterns using Views and Components, showing how to define user interfaces, layouts, and component hierarchies in SpecVerse.

## Learning Objectives

- Define frontend views and component structures
- Specify UI component properties and behaviors
- Design responsive layouts and component composition
- Create reusable component libraries
- Integrate with backend models and controllers

## Key Concepts

### Core Models
Supporting frontend data structures:

```specly
models:
  Product:
    description: "Product displayed in views"
    attributes:
      id: UUID required
      name: String required
      price: Money required
      description: String
      imageUrl: String
      category: String required

  Customer:
    description: "Customer viewing the interface"
    attributes:
      id: UUID required
      name: String required
      email: Email required
      preferences: String
```

### View Specifications
Frontend views and component architecture:

```specly
views:
  ProductView:
    description: "Product catalog and detail views"
    model: Product
    components:
      - ProductList
      - ProductCard
      - ProductDetails
      - ProductImages
      - ProductReviews
    properties:
      responsive: true
      pagination: true
      searchable: true
    subscriptions:
      events:
        - ProductCreated
        - ProductUpdated
  
  CustomerView:
    description: "Customer profile and account management"
    model: Customer
    components:
      - ProfileForm
      - OrderHistory
      - AddressList
      - PaymentMethods
    properties:
      responsive: true
      secure: true
      authenticated: true
    subscriptions:
      events:
        - CustomerUpdated
        - OrderCreated
```

### Dashboard Architecture
```specly
views:
  DashboardView:
    description: "Main dashboard with analytics"
    components:
      - SalesChart
      - RecentOrders
      - TopProducts
      - AlertPanel
    properties:
      responsive: true
      realtime: true
      refreshable: true
    subscriptions:
      events:
        - OrderCreated
        - PaymentProcessed
        - LowStockAlert
```

### Event Integration
**User Interaction Events**: Track frontend behavior
```specly
events:
  ViewLoaded:
    description: "View was successfully loaded"
    attributes:
      viewName: String required
      userId: UUID required
      loadTime: Integer required
      timestamp: DateTime required
  
  ComponentInteraction:
    description: "User interacted with a component"
    attributes:
      componentName: String required
      action: String required
      userId: UUID required
      data: String
      timestamp: DateTime required
```

## Container Architecture

### v3.2 Component Structure
```specly
components:
  ViewsAndComponents:
    version: "3.2.0"
    description: "Example 03-04: Views and components for frontend architecture"
    
    export:
      models: [Product, Customer]
      views: [ProductView, CustomerView, DashboardView]
      events: [ViewLoaded, ComponentInteraction]
    
    import:
      - from: "@specverse/primitives"
        select: [Money]
```

### Component Architecture Patterns

**ProductView Components**:
- `ProductList` - Main product listing grid
- `ProductCard` - Individual product display
- `ProductDetails` - Detailed product information
- `ProductImages` - Product image gallery
- `ProductReviews` - Customer reviews section

**CustomerView Components**:
- `ProfileForm` - Customer profile editing
- `OrderHistory` - Past orders display
- `AddressList` - Shipping addresses management
- `PaymentMethods` - Payment options management

**DashboardView Components**:
- `SalesChart` - Real-time sales analytics
- `RecentOrders` - Latest order activity
- `TopProducts` - Best-selling items
- `AlertPanel` - System notifications

## View Properties and Features

### ProductView Features
- **Responsive Design**: Adapts to all screen sizes
- **Pagination**: Handles large product catalogs
- **Search Integration**: Real-time product filtering
- **Event Subscriptions**: Updates when products change

### CustomerView Security
- **Authentication Required**: Secure customer data
- **Responsive Layout**: Mobile-friendly profile management
- **Real-time Updates**: Syncs with order and profile changes

### DashboardView Analytics
- **Real-time Data**: Live updates from business events
- **Refreshable Views**: Manual and automatic refresh
- **Responsive Charts**: Optimized for desktop and mobile
- **Event-driven Updates**: Reacts to business activities

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.753Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required
        +name: String required
        +price: Money required
        +description: String
        +imageUrl: String
        +category: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Customer {
        +id: UUID required
        +name: String required
        +email: Email required
        +preferences: String
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    %% Other components
    class ViewLoaded {
        <<event>>
        ViewLoaded
    }
    class ComponentInteraction {
        <<event>>
        ComponentInteraction
    }
`} />

</div>



## Complete Example

### Specly DSL Format
See [./03-04-views-and-components.specly](./03-04-views-and-components.specly) for the complete v3.2 specification.

### Generated: YAML Format
SpecVerse v3.2 uses convention-based Specly DSL as the source format. The build process can generate structured YAML for tooling integration:

```bash
# Generate YAML from Specly DSL
specverse build --format yaml 03-04-views-and-components.specly
```

This produces fully structured YAML with expanded view definitions, component hierarchies, and event bindings derived from the concise Specly syntax.

## Key Features Demonstrated

- **View specifications**: Complete UI screen definitions
- **Component architecture**: Reusable UI element patterns
- **Layout systems**: Responsive grid and flexbox layouts
- **State management**: Frontend data flow patterns
- **Event integration**: UI events connected to backend actions

## Design Principles

### Component Reusability
- Define components once, use everywhere
- Parameterizable through properties
- Consistent behavior across views

### Separation of Concerns
- Views handle layout and composition
- Components handle specific functionality
- Models provide data structure

### Responsive Design
- Mobile-first approach
- Progressive enhancement
- Flexible grid systems

## Framework Integration

### Component System Mapping
SpecVerse views and components map to popular frontend frameworks:

**React Integration**:
- Views → Page Components
- Components → Function Components
- Properties → Props
- Subscriptions → useEffect hooks

**Vue Integration**:
- Views → Vue Router Pages
- Components → Single File Components
- Properties → Props/Data
- Subscriptions → Watchers

**Angular Integration**:
- Views → Route Components
- Components → Angular Components
- Properties → Inputs/Outputs
- Subscriptions → Observables

## Validation

Test this example:
```bash
specverse validate examples/03-architecture/03-04-views-and-components.specly
```

## Next Steps

Continue to [Example 03-05: Complete Event Flow](./03-05-complete-event-flow) to see how frontend components integrate with backend event-driven architecture.

## Related Examples

- [Example 03-02: Controllers and Actions](./03-02-controllers-and-actions) - Backend API integration
- [Example 04-01: Digital Product Catalog](../04-domains/04-01-digital-product-catalog) - Complete frontend/backend system
- [Example 01-01: Basic Model](../01-fundamentals/01-01-basic-model) - Data model foundation