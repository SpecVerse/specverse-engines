# Example 11-03: MVC Architecture Diagram

**Demonstrates**: Model-View-Controller architecture visualization

## Overview

The **MVC Architecture** diagram provides a clear visualization of the traditional three-tier Model-View-Controller pattern, showing how presentation, control logic, and data layers interact in a web application.

### Key Features

- **Layered Visualization**: Clear separation of Views, Controllers, Services, and Models
- **Data Flow**: Shows request flow from views through controllers to models
- **Service Layer**: Optional business logic layer between controllers and models
- **Relationship Mapping**: Automatic detection of layer interactions
- **Clean Separation**: Visual representation of separation of concerns

### When to Use This Diagram

✅ **Use MVC diagrams when:**
- Documenting **traditional web applications** (Rails, Django, Laravel, ASP.NET MVC)
- Explaining **application architecture** to stakeholders
- Onboarding new team members to codebase structure
- Planning **refactoring** from monolith to layered architecture
- Reviewing **separation of concerns** in existing code
- Creating **architectural documentation** for compliance

❌ **Don't use MVC diagrams when:**
- Application doesn't follow MVC pattern (use service-architecture instead)
- Need to show **component boundaries** (use component-dependencies instead)
- Focus is on **event flows** (use event-flow diagrams instead)
- Microservices architecture (use service-architecture instead)

## Generated Diagram

The MVC architecture diagram shows the 4-layer architecture with clear separation of concerns:

```mermaid
graph TB
  subgraph views_layer["🖥️ VIEWS (Presentation Layer)"]
    ProductListView("ProductListView")
    ProductDetailView("ProductDetailView")
    UserProfileView("UserProfileView")
    OrderCheckoutView("OrderCheckoutView")
  end
  subgraph controllers_layer["⚙️ CONTROLLERS (Request Handling)"]
    ProductController("ProductController")
    UserController("UserController")
    OrderController("OrderController")
  end
  subgraph services_layer["🔧 SERVICES (Business Logic)"]
    AuthenticationService("AuthenticationService")
    PaymentService("PaymentService")
    InventoryService("InventoryService")
  end
  subgraph models_layer["📦 MODELS (Data & Domain Logic)"]
    User("User")
    Product("Product")
    Order("Order")
  end

  ProductListView -->|"requests"| ProductController
  UserProfileView -->|"requests"| UserController
  OrderCheckoutView -->|"requests"| OrderController
  ProductController -->|"uses"| InventoryService
  OrderController -->|"uses"| PaymentService
  UserController -->|"uses"| AuthenticationService
  ProductController -->|"manages"| Product
  UserController -->|"manages"| User
  OrderController -->|"manages"| Order
  PaymentService -->|"accesses"| Order
  InventoryService -->|"accesses"| Product
  AuthenticationService -->|"accesses"| User
```

*Note: This is a simplified view. The complete generated diagram includes all 7 views, 5 controllers, 6 services, and 6 models with full relationship mapping.*

## Generating the Diagram

### Basic Generation

```bash
# Generate MVC architecture diagram
specverse gen diagram 11-03-mvc-architecture-demo.specly -d mvc-architecture -o mvc.mmd

# With custom title
specverse gen diagram 11-03-mvc-architecture-demo.specly \
  -d mvc-architecture \
  --title "E-Commerce MVC Architecture" \
  -o mvc-custom.mmd
```

### Theme Options

```bash
# Default theme (balanced colors)
specverse gen diagram 11-03-mvc-architecture-demo.specly -d mvc-architecture -o mvc-default.mmd

# Forest theme (green tones)
specverse gen diagram 11-03-mvc-architecture-demo.specly -d mvc-architecture --theme forest -o mvc-forest.mmd

# Dark theme (dark background)
specverse gen diagram 11-03-mvc-architecture-demo.specly -d mvc-architecture --theme dark -o mvc-dark.mmd

# Neutral theme (grayscale)
specverse gen diagram 11-03-mvc-architecture-demo.specly -d mvc-architecture --theme neutral -o mvc-neutral.mmd
```

## Example Scenario

This example demonstrates an **E-Commerce Product Management System** with complete MVC layers:

### Application Layers

#### 1. Views Layer (Presentation)
- **ProductListView**: Product catalog display
- **ProductDetailView**: Individual product pages
- **UserProfileView**: User account management
- **OrderCheckoutView**: Checkout process
- **OrderHistoryView**: Order tracking
- **CategoryBrowseView**: Category navigation
- **AdminDashboardView**: Admin management interface

#### 2. Controllers Layer (Request Handling)
- **ProductController**: Product CRUD operations
- **UserController**: User management and authentication
- **OrderController**: Order processing
- **CategoryController**: Category management
- **ReviewController**: Product review handling

#### 3. Services Layer (Business Logic)
- **AuthenticationService**: User authentication and tokens
- **PaymentService**: Payment processing
- **InventoryService**: Stock management
- **ShippingService**: Shipping and tracking
- **NotificationService**: Customer notifications
- **SearchService**: Product search functionality

#### 4. Models Layer (Data & Domain Logic)
- **User**: Customer and vendor accounts
- **Product**: Product catalog entries
- **Category**: Product categorization
- **Order**: Customer orders
- **OrderItem**: Order line items
- **Review**: Product reviews

### Data Flow Patterns

#### View → Controller → Model (Read)
```
UserProfileView → UserController → User
  (request user data) → (fetch) → (retrieve)
```

#### View → Controller → Service → Model (Complex Operations)
```
OrderCheckoutView → OrderController → PaymentService → Order
  (submit order) → (process) → (validate payment) → (create)
```

#### Controller → Multiple Models (Relationships)
```
ProductController → Product + Category + Review
  (manages product with related data)
```

## Understanding the Visualization

### Layer Organization

The diagram shows **top-down data flow**:
1. **Views** (top): User interface components
2. **Controllers** (middle-top): Request handling
3. **Services** (middle-bottom): Business logic
4. **Models** (bottom): Data and domain logic

### Node Structure

Each node displays:
- **Component name** (large text)
- **Operations** (CURVED operations, actions)
- **Key attributes** (for models, first 3 attributes shown)

### Edge Types

- **Solid arrows** (`→`): Direct dependencies and data flow
- **"requests"**: Views calling controllers
- **"uses"**: Controllers calling services
- **"manages"**: Controllers managing models
- **"accesses"**: Services accessing models

### Reading the Diagram

1. **Start at Views**: Find user-facing components
2. **Follow to Controllers**: See request handlers
3. **Track to Services**: Identify business logic
4. **End at Models**: Find data definitions
5. **Note relationships**: Same-model connections show tight coupling

## Implementation Details

### SpecVerse Syntax

The MVC visualization is generated from standard SpecVerse v3.2 specifications:

#### Defining Models

```yaml
models:
  Product:
    attributes:
      id: UUID required
      name: String required
      price: Money required
    relationships:
      category: belongsTo Category
      reviews: hasMany Review
```

#### Defining Controllers

```yaml
controllers:
  ProductController:
    model: Product  # Links controller to model
    cured:  # Standard CRUD operations
      create: {}
      retrieve: {}
      update: {}
      delete: {}
    actions:  # Custom actions
      search: {}
      filterByCategory: {}
```

#### Defining Services

```yaml
services:
  PaymentService:
    operations:
      processPayment: {}
      validateCard: {}
      refundPayment: {}
```

#### Defining Views

```yaml
views:
  ProductListView:
    model: Product  # Links view to model
    layout:
      components:
        - ProductGrid
        - FilterSidebar
        - Pagination
```

## MVC Pattern Benefits

### Separation of Concerns

- **Views**: Only presentation logic
- **Controllers**: Only request/response handling
- **Services**: Reusable business logic
- **Models**: Data and domain rules

### Testability

- Test views independently (UI testing)
- Test controllers with mocked services
- Test services with mocked models
- Test models with unit tests

### Maintainability

- Change views without touching controllers
- Refactor business logic in services
- Modify data structures in models
- Clear responsibility boundaries

## Advanced Features

### Service Layer Integration

The diagram automatically shows the optional **service layer** when services are defined:

```yaml
# Without services: Controller → Model (direct)
ProductController → Product

# With services: Controller → Service → Model
ProductController → SearchService → Product
```

### Multiple Model Access

Controllers and services accessing multiple models are shown with multiple edges:

```yaml
OrderController → Order
OrderController → OrderItem
OrderController → Payment
```

### View-to-Model Matching

Views are automatically connected to controllers managing the same model:

```yaml
# Automatic connection detected:
UserProfileView (model: User) → UserController (model: User)
```

## Best Practices

### Specification Design

1. **Link controllers to models**: Use `model: ModelName` in controllers
2. **Link views to models**: Use `model: ModelName` in views
3. **Define CURVED operations**: Standard operations show predictable patterns
4. **Add custom actions**: Document non-CRUD operations
5. **Include services**: Show business logic layer

### Diagram Readability

1. **Limit scope**: Focus on one subsystem (e.g., product management)
2. **Group related components**: Keep related models/controllers together
3. **Document patterns**: Add comments explaining conventions
4. **Use consistent naming**: ProductController for Product model
5. **Show key relationships**: Include important model relationships

### Architecture Patterns

**Traditional MVC** (Views directly call Controllers):
```
View → Controller → Model
```

**MVC with Services** (Recommended for complex apps):
```
View → Controller → Service → Model
```

**Fat Controller** (Anti-pattern):
```
View → Controller (with business logic) → Model
```
*Avoid this - extract business logic to services*

## Troubleshooting

### Empty Layers

**Problem**: A layer (views, controllers, services) appears empty

**Solutions**:
- Ensure components are defined in the specification
- Check that models have controllers defined
- Verify services have operations defined
- Add views if they're missing

### Missing Connections

**Problem**: Controllers and views aren't connected

**Solutions**:
- Ensure views have `model:` property
- Ensure controllers have `model:` property
- Match model names exactly (case-sensitive)
- Check that models exist in specification

### Too Many Edges

**Problem**: Diagram has too many connections and looks cluttered

**Solutions**:
- Split into multiple diagrams by domain area
- Remove unnecessary service connections
- Focus on primary data flows
- Use service-architecture for service details

### Services Not Shown

**Problem**: Services layer doesn't appear

**Solutions**:
- Define services in the specification
- Add operations to services
- Services must have at least one operation
- Check syntax of services section

## Related Examples

- **11-04-service-architecture-demo.specly**: Service layer focus
- **11-05-component-dependencies-demo.specly**: Multi-component architecture
- **11-01-event-flow-sequence-demo.specly**: Event-driven patterns
- **11-02-event-flow-swimlane-demo.specly**: Parallel processing

## Additional Resources

### MVC Architecture
- [MVC Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- [Rails MVC](https://guides.rubyonrails.org/getting_started.html#mvc-architecture)
- [ASP.NET MVC](https://dotnet.microsoft.com/en-us/apps/aspnet/mvc)

### SpecVerse Resources
- **Schema Documentation**: `docs/reference/schema.md`
- **Controller Patterns**: `docs/guides/controllers.md`
- **Service Layer**: `docs/guides/services.md`

---

**Generated with SpecVerse v3.2 Unified Diagram Generator**
**Diagram Type**: mvc-architecture
**Example**: 11-03-mvc-architecture-demo.specly
