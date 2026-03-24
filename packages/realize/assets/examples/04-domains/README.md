# Domain Examples

Real-world domain models demonstrating SpecVerse v3.2 applied to complete business domains. These examples show how all the concepts work together in production scenarios.

## Available Domains

### 🛒 [04-01-digital-product-catalog](./04-01-digital-product-catalog.md)
**E-commerce and Digital Products**
- Digital product catalog with subscriptions
- Profile-based product categorization
- Payment processing workflows
- Download and licensing management

**Key Features Demonstrated**:
- Profile-attachment system with DigitalProductProfile and SubscriptionProfile
- Event-driven architecture with typed attributes
- Service operations for payments, downloads, and notifications
- Complete e-commerce workflow integration

### 🏢 [04-02-organization-management](./04-02-organization-management.md)
**Company and Organization Management**
- Multi-company organizational structures
- Employee management and hierarchies
- Role-based access control
- Performance reviews and leave requests

**Key Features Demonstrated**:
- Complex organizational hierarchies with self-referential relationships
- Profile-attachment with CustomerProfile, PublicCompanyProfile, and AuditProfile
- Comprehensive HR workflows with services
- Multi-level department and team structures

## Learning Approach

### For Beginners
Start with the domain closest to your use case:
- **E-commerce applications** → [04-01-digital-product-catalog](./04-01-digital-product-catalog.md)
- **Business management** → [04-02-organization-management](./04-02-organization-management.md)

### For Advanced Users
Study both domains to see different patterns:
- Compare profile-attachment usage across domains
- Note service architecture patterns
- Observe event-driven integration approaches
- Extract reusable domain modeling patterns

## What Each Domain Teaches

### Digital Product Catalog Domain
- **Product Management**: Digital catalogs, subscriptions, inventory
- **Profile-Attachment**: Dynamic product categorization with DigitalProductProfile and SubscriptionProfile
- **Event-Driven Commerce**: Payment processing, download management, notifications
- **Service Architecture**: Separation of concerns with PaymentService, DownloadService, NotificationService

### Organization Management Domain  
- **Organizational Modeling**: Multi-level hierarchies, departments, teams
- **Profile-Based Extensions**: Company types with CustomerProfile, PublicCompanyProfile, AuditProfile
- **Complex Relationships**: Self-referential hierarchies, many-to-many role assignments
- **Workflow Management**: Leave requests, performance reviews, HR processes

## Cross-Domain Patterns

Look for these patterns across both domains:

### V3.1 Profile-Attachment Patterns
- **AuditProfile**: Change tracking and compliance (Organization Management)
- **CustomerProfile**: Client relationship data (Organization Management)
- **DigitalProductProfile**: Download and licensing (Digital Product Catalog)
- **SubscriptionProfile**: Recurring billing (Digital Product Catalog)

### V3.1 Architecture Patterns
- **Controller-Service Separation**: Clear API and business logic boundaries
- **Event-Driven Integration**: Typed events with attributes for loose coupling
- **Import/Export Management**: Clean module boundaries with selective imports
- **Convention-Based Modeling**: Human-readable attribute definitions

## Using Domain Examples

### As Learning Material
1. Read the domain README
2. Study the main models first
3. Understand the lifecycle flows
4. Explore the profile compositions
5. Review the controller patterns

### As Templates
1. Copy relevant models to your project
2. Adapt the profiles to your needs
3. Modify behaviors for your business rules
4. Extend with your specific requirements

### As Reference
1. Look up specific patterns when needed
2. Compare approaches across domains
3. Find solutions to common problems
4. Validate your own designs

## Prerequisites

- Complete [01-fundamentals](../01-fundamentals/) examples
- Understand [02-profiles](../02-profiles/) system  
- Familiar with [03-architecture](../03-architecture/) concepts

## Validation

Test the domain examples:
```bash
# Validate Digital Product Catalog
specverse validate examples/04-domains/04-01-digital-product-catalog.specly

# Validate Organization Management  
specverse validate examples/04-domains/04-02-organization-management.specly

# Run full test cycles
specverse test cycle examples/04-domains/04-01-digital-product-catalog.specly
```

## Next Steps

After studying domains:
1. **Meta Examples** ([../05-meta/](../05-meta/)) - Advanced system specifications
2. **Deployment** ([../06-deploy/](../06-deploy/)) - Infrastructure patterns
3. **Build Your Own** - Apply learnings to your domain

These domain examples bridge the gap between learning SpecVerse v3.2 concepts and building real applications!