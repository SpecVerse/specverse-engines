# Example 04-01: Digital Product Catalog

This comprehensive example demonstrates a complete e-commerce product catalog system in SpecVerse v3.2, showcasing all major features including models, profiles, controllers, services, and events working together.

## Learning Objectives

- Apply SpecVerse v3.2 concepts to a real-world business domain
- Integrate multiple system components (models, controllers, services)
- Design profile-based product categorization with v3.2 profile-attachment
- Implement event-driven catalog management with typed attributes
- Build scalable e-commerce architecture patterns

## Business Domain

A digital product catalog supporting multiple product types (digital downloads, subscriptions) with dynamic pricing, inventory management, and comprehensive customer management using v3.2 container architecture.

## Domain Overview

Real-world e-commerce and digital commerce examples demonstrating SpecVerse v3.2 applied to retail and digital product scenarios.

**Key Features Demonstrated**:
- Digital product management with downloads
- Subscription-based billing and access control
- License management and validation
- Multi-profile composition (Digital + Subscription)
- Customer purchase history and access rights
- Event-driven architecture for payments and downloads

**Business Scenarios Covered**:
- Software sales with licensing
- Digital content subscriptions
- E-book and course distribution
- SaaS product management
- Digital rights management
- Automated billing and renewals

**SpecVerse Concepts Showcased**:
- ProfileAttachment with complex conditions
- Multiple lifecycles (publishing, subscription, payment)
- Event publishing for system integration
- Controller actions for API design
- Rich domain modeling with relationships

### What You'll Learn

#### E-commerce Domain Modeling
- **Product Catalogs**: Organizing digital products with metadata
- **Customer Management**: Purchase history and access rights
- **Subscription Systems**: Recurring billing and lifecycle management
- **Digital Rights**: License validation and download control

#### Profile Composition Patterns
- **DigitalProductProfile**: Download URLs, file metadata, system requirements
- **SubscriptionProfile**: Billing cycles, trials, access levels
- **AuditProfile**: Compliance tracking and change history
- **Multiple Profile Attachment**: Same product with different capabilities

#### Business Process Flows
- **Purchase Flow**: Product selection → Payment → License generation → Download access
- **Subscription Flow**: Trial signup → Payment → Active subscription → Renewal/cancellation
- **Download Flow**: Purchase validation → Secure link generation → Access logging

#### Technical Patterns
- **Event-Driven Integration**: Payment processing, download notifications
- **Security Patterns**: Signed URLs, license validation, access control
- **Lifecycle Management**: Product publishing, subscription states
- **Data Modeling**: Complex relationships between customers, products, purchases

### Prerequisites

- Complete [01-fundamentals](../fundamentals/01-01-basic-model) examples
- Understanding of [02-profiles](../profiles/02-01-using-profiles) system
- Familiarity with [03-architecture](../architecture/03-01-enhanced-imports) patterns


### Real-World Applications

These examples are based on common e-commerce patterns found in:

- **Software Companies**: Selling desktop applications and SaaS products
- **Digital Publishers**: E-books, courses, and educational content
- **Media Companies**: Digital downloads, streaming subscriptions
- **B2B Software**: Enterprise licenses and subscription models

### Integration Points

The commerce examples demonstrate integration with:

- **Payment Systems**: Stripe, PayPal, and other payment processors
- **File Storage**: AWS S3, CDN distribution for downloads
- **Email Systems**: Purchase confirmations, license delivery
- **Analytics**: Sales reporting, customer behavior tracking
- **CRM Systems**: Customer lifecycle and support integration

## Key Features

### Core Digital Product Models
```specly
components:
  DigitalProductCatalog:
    version: "3.2.0"
    description: "Complete digital product catalog with subscription capabilities"
    
    models:
      Product:
        description: "Base product model for digital goods"
        attributes:
          id: UUID required
          name: String required
          description: String
          sku: String required unique
          category: String required
          basePrice: Money required
          status: String default=active values=["active", "inactive", "discontinued"]
        relationships:
          purchases: hasMany Purchase
          subscriptions: hasMany Subscription

      Customer:
        description: "Customer who purchases digital products"
        attributes:
          id: UUID required
          email: Email required unique
          name: String required
          registrationDate: DateTime required
        relationships:
          purchases: hasMany Purchase
          subscriptions: hasMany Subscription

      Purchase:
        description: "Record of digital product purchase"
        attributes:
          id: UUID required
          customerId: UUID required
          productId: UUID required
          amount: Money required
          paymentMethod: String required values=["card", "paypal", "bank_transfer"]
          purchaseDate: DateTime required
          licenseKey: String
          downloadCount: Integer default=0
          status: String required values=["pending", "completed", "refunded"]
        relationships:
          customer: belongsTo Customer
          product: belongsTo Product
```

### V3.1 Profile System
```specly
DigitalProductProfile:
  description: "Profile for digital products with download capabilities"
  attributes:
    fileFormat: String required
    fileSize: Integer required
    downloadUrl: URL required
    licenseType: String required values=["single", "multi", "enterprise"]
    downloadLimit: Integer default=5
  profile-attachment:
    profiles: [Product]
  behaviors:
    generateDownloadLink:
      description: "Generate secure download link for customer"
      parameters:
        customerId: UUID required
        expirationHours: Integer required
      returns: URL
      ensures: ["Returns secure download URL with expiration"]

SubscriptionProfile:
  description: "Profile for subscription-based products"
  attributes:
    billingCycle: String required values=["monthly", "quarterly", "yearly"]
    trialPeriod: Integer default=0
    autoRenew: Boolean default=true
    accessLevel: String default=basic values=["basic", "premium", "enterprise"]
  profile-attachment:
    profiles: [Product]
  behaviors:
    calculateSubscriptionPrice:
      description: "Calculate subscription price with discounts"
      parameters:
        discountCode: String
        billingCycle: String required
      returns: Money
```

### Product Operations with V3.1 Controllers
```specly
controllers:
  ProductController:
    description: "Manage digital product catalog"
    model: Product
    actions:
      purchaseProduct:
        description: "Purchase a digital product"
        parameters:
          customerId: UUID required
          productId: UUID required
          paymentMethod: String required
        returns: Purchase
        requires: ["Customer exists", "Product is active"]
        ensures: ["Purchase created", "License key generated"]
        publishes: [ProductPurchased]
  
  SubscriptionController:
    description: "Manage subscription lifecycle"
    model: Subscription
    actions:
      createSubscription:
        description: "Start new subscription"
        parameters:
          customerId: UUID required
          productId: UUID required
          billingCycle: String required
        returns: Subscription
        publishes: [SubscriptionCreated]
```

## Visual Diagram

import Mermaid from '@site/src/components/Mermaid';



{/* Auto-generated diagram from canonical examples */}

{/* Generated: 2025-07-26T14:40:17.173Z */}

<div className="diagram-generated">

<Mermaid chart={`
classDiagram
    class Product {
        +id: UUID required
        +name: String required
        +description: String
        +sku: String required unique
        +category: String required
        +basePrice: Money required
        +status: String = active
        +tags: String
        +images: String
        +createdAt: DateTime required
        +updatedAt: DateTime required
        +calculateFinalPrice(taxRate: String?, discountCode: String?): Money %% ensures: Returns final price including tax and profile modifications
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class DigitalProductProfile {
        <<profile>>
        +fileFormat: String required
        +fileSize: Integer required
        +downloadUrl: URL required
        +licenseType: String required
        +licenseTerms: String required
        +productVersion: String
        +systemRequirements: String
        +checksumMD5: String
        +downloadLimit: Integer = 5
        +productId: UUID required
        +generateDownloadLink(customerId: UUID, expirationHours: Integer): URL %% ensures: Returns secure download URL with expiration
        +validateLicense(customerId: UUID): Boolean %% ensures: Returns true if customer has valid license
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class SubscriptionProfile {
        <<profile>>
        +billingCycle: String required
        +trialPeriod: Integer = 0
        +autoRenew: Boolean = true
        +minimumTerm: Integer = 1
        +cancellationPolicy: String
        +accessLevel: String = basic
        +features: String
        +productId: UUID required
        +calculateSubscriptionPrice(discountCode: String?, billingCycle: String): Money %% ensures: Returns price with yearly discount if applicable
        +canAccess(customerId: UUID): Boolean %% ensures: Returns true if subscription is active
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Customer {
        +id: UUID required
        +email: Email required unique
        +name: String required
        +registrationDate: DateTime required
        +status: String = active
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Purchase {
        +id: UUID required
        +customerId: UUID required
        +productId: UUID required
        +amount: Money required
        +paymentMethod: String required
        +purchaseDate: DateTime required
        +licenseKey: String
        +downloadCount: Integer = 0
        +status: String required
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }
    class Subscription {
        +id: UUID required
        +customerId: UUID required
        +productId: UUID required
        +status: String required
        +currentPeriodStart: DateTime required
        +currentPeriodEnd: DateTime required
        +nextBillingDate: DateTime
        +amount: Money required
        +trialEndsAt: DateTime
        +attachProfile(profileName: String): Boolean %% requires: Profile exists and is compatible with this model | ensures: Profile is attached, Profile attributes are available
        +detachProfile(profileName: String): Boolean %% requires: Profile is currently attached | ensures: Profile is detached, Profile attributes are no longer available
        +hasProfile(profileName: String): Boolean
    }

    Product o-- Purchase : *_purchases
    Product o-- Subscription : *_subscriptions
    DigitalProductProfile <|.. Product : 1_attaches_to_priority__0
    SubscriptionProfile <|.. Product : 1_attaches_to_priority__0
    Customer o-- Purchase : *_purchases
    Customer o-- Subscription : *_subscriptions
    Purchase -- Customer : 1_customer
    Purchase -- Product : 1_product
    Subscription -- Customer : 1_customer
    Subscription -- Product : 1_product
    ProductController -- Product : 1_manages
    SubscriptionController -- Subscription : 1_manages
    InventoryController -- Product : 1_manages
    CatalogController -- Product : 1_manages

    %% Other components
    class ProductController {
        <<controller>>
        ProductController
    }
    class SubscriptionController {
        <<controller>>
        SubscriptionController
    }
    class InventoryController {
        <<controller>>
        InventoryController
    }
    class CatalogController {
        <<controller>>
        CatalogController
    }
    class PaymentService {
        <<service>>
        PaymentService
    }
    class DownloadService {
        <<service>>
        DownloadService
    }
    class NotificationService {
        <<service>>
        NotificationService
    }
    class ProductPurchased {
        <<event>>
        ProductPurchased
    }
    class SubscriptionCreated {
        <<event>>
        SubscriptionCreated
    }
    class StockUpdated {
        <<event>>
        StockUpdated
    }
    class LowStockAlert {
        <<event>>
        LowStockAlert
    }
    class PaymentProcessed {
        <<event>>
        PaymentProcessed
    }
    class PriceCalculated {
        <<event>>
        PriceCalculated
    }
`} />

</div>



## Complete Example

### Primary: Specly DSL Format

The primary source for this example is the Specly DSL format, which provides the most readable and maintainable specification:

```specly
components:
  DigitalProductCatalog:
    version: "3.2.0"
    description: "Complete digital product catalog with subscription and download capabilities"
    
    export:
      models: [Product, Customer, Purchase, Subscription, DigitalProductProfile, SubscriptionProfile]
      controllers: [ProductController, SubscriptionController, InventoryController, CatalogController]
      services: [PaymentService, DownloadService, NotificationService]
      events: [ProductPurchased, SubscriptionCreated, StockUpdated, LowStockAlert, PaymentProcessed, PriceCalculated]
    
    models:
      Product:
        description: "Base product model for digital goods"
        attributes:
          id: UUID required
          name: String required
          description: String
          sku: String required unique
          category: String required
          basePrice: Money required
          status: String default=active values=["active", "inactive", "discontinued"]
        relationships:
          purchases: hasMany Purchase
          subscriptions: hasMany Subscription
        behaviors:
          calculateFinalPrice:
            description: "Calculate final price including tax and profile modifications"
            parameters:
              taxRate: String
              discountCode: String
            returns: Money
            ensures: ["Returns final price including tax and profile modifications"]
      
      DigitalProductProfile:
        description: "Profile for digital products with download capabilities"
        attributes:
          fileFormat: String required
          fileSize: Integer required
          downloadUrl: URL required
          licenseType: String required values=["single", "multi", "enterprise"]
          downloadLimit: Integer default=5
          productId: UUID required
        profile-attachment:
          profiles: [Product]
        behaviors:
          generateDownloadLink:
            description: "Generate secure download link for customer"
            parameters:
              customerId: UUID required
              expirationHours: Integer required
            returns: URL
            ensures: ["Returns secure download URL with expiration"]
    
    controllers:
      ProductController:
        description: "Manage digital product catalog"
        model: Product
        actions:
          purchaseProduct:
            description: "Purchase a digital product"
            parameters:
              customerId: UUID required
              productId: UUID required
              paymentMethod: String required
            returns: Purchase
            requires: ["Customer exists", "Product is active"]
            ensures: ["Purchase created", "License key generated"]
            publishes: [ProductPurchased]
    
    services:
      PaymentService:
        description: "Handle payment processing for digital products"
        operations:
          processPayment:
            description: "Process payment for purchase"
            parameters:
              purchaseId: UUID required
              amount: Money required
              paymentMethod: String required
            returns: String
            requires: ["Purchase exists", "Payment method is valid"]
            ensures: ["Payment is processed", "Receipt generated"]
            publishes: [PaymentProcessed]
    
    events:
      ProductPurchased:
        description: "Digital product was purchased"
        attributes:
          purchaseId: UUID required
          customerId: UUID required
          productId: UUID required
          amount: Money required
          licenseKey: String required
          purchaseDate: DateTime required
```

**Complete file**: [04-01-digital-product-catalog.specly](./04-01-digital-product-catalog.specly)

### Validation

To validate the specification:

```bash
# Validate Specly file directly
specverse validate 04-01-digital-product-catalog.specly
```

This demonstrates the v3.2 **single source** architecture where:
- **Specly DSL** serves as the primary, human-readable specification
- Direct validation without intermediate formats
- All tooling works directly with .specly files

## Architecture Patterns

### V3.1 Profile-Attachment Architecture
- **Dynamic Profiles**: DigitalProductProfile and SubscriptionProfile attach to base Product model
- **Behavioral Extension**: Profiles add specific behaviors (generateDownloadLink, calculateSubscriptionPrice)
- **Type Safety**: Profile-specific attributes with validation and constraints
- **Composition Over Inheritance**: Flexible product categorization without complex hierarchies

### Event-Driven Service Architecture
- **Typed Events**: All events use `attributes` (not payload) with strongly-typed fields
- **Service Publishing**: PaymentService publishes PaymentProcessed, controllers publish domain events
- **Cross-Service Communication**: Events enable decoupled service interactions
- **Event Attributes Pattern**: ProductPurchased includes purchaseId, customerId, productId, amount, licenseKey, purchaseDate

### Controller-Service Separation
- **Controllers**: Handle HTTP/API concerns with actions that publish events
- **Services**: Contain business logic with operations that process data
- **Clear Boundaries**: Controllers manage requests/responses, services handle domain logic
- **Event Integration**: Both can publish events for different architectural concerns

### V3.1 Component Architecture
- **Explicit Exports**: Components declare exactly what they expose (models, controllers, services, events)
- **Import Management**: Structured imports with file paths and selective type importing
- **Modular Design**: Self-contained components with clear interfaces
- **Version Management**: Component-level versioning for independent evolution

## Key Features Demonstrated

### V3.1 Core Features
- **Profile-Attachment System**: DigitalProductProfile and SubscriptionProfile extend Product with specialized behaviors
- **Typed Event Attributes**: Events use structured attributes (not payload) with full type safety
- **Service Architecture**: PaymentService, DownloadService, NotificationService demonstrate business logic separation
- **Controller Actions**: Multiple controllers (ProductController, SubscriptionController, InventoryController, CatalogController) with specific responsibilities
- **Component Exports**: Explicit declaration of models, controllers, services, and events for clean module boundaries

### Advanced Patterns
- **Behavioral Composition**: Profile behaviors (generateDownloadLink, validateLicense) extend base model capabilities
- **Event Publishing Chain**: Controllers publish domain events, services publish integration events
- **Multi-Profile Products**: Single Product model supports both digital download and subscription profiles
- **Relationship Management**: Complex hasMany/belongsTo relationships between Customer, Product, Purchase, Subscription
- **Business Logic Encapsulation**: Service operations with requires/ensures contracts and event publishing

### Real-World Integration
- **Payment Processing**: Complete payment flow with validation and confirmation
- **Digital Asset Management**: Secure download generation with licensing and tracking
- **Subscription Management**: Full subscription lifecycle with billing and access control
- **Inventory Tracking**: Stock management with automated alerts and threshold monitoring
- **Customer Notification**: Automated email confirmations and communication workflows

## Business Use Cases

- **E-commerce platforms**: Product catalog management
- **Digital marketplaces**: Multi-vendor product systems
- **SaaS applications**: Feature catalog and pricing
- **Content platforms**: Digital asset management

## Validation

Validate the Specly DSL format:
```bash
specverse validate examples/04-domains/04-01-digital-product-catalog.specly
```

## Next Steps

Continue to [Example 04-02: Organization Management](./04-02-organization-management) to see another complete domain implementation.

## Related Examples

- [Example 02-01: Using Profiles](../02-profiles/02-01-using-profiles) - Profile system fundamentals
- [Example 03-03: Services and Events](../03-architecture/03-03-services-and-events) - Service integration patterns
- [Example 03-05: Complete Event Flow](../03-architecture/03-05-complete-event-flow) - Event-driven architecture
- [Example 01-02: Model with Lifecycle](../01-fundamentals/01-02-model-with-lifecycle) - Component structure basics
- [Example 02-02: Profile Attachment](../02-profiles/02-02-profile-attachment) - Advanced profile patterns