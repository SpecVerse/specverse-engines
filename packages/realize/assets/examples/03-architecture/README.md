# SpecVerse Architecture

Learn how to design **system architecture** with SpecVerse - imports, controllers, services, events, views, and advanced patterns working together to create complete applications.

## Learning Objectives

By completing these examples, you will understand:
- How to use enhanced imports for modular specifications
- How to design controllers with actions
- How to define services and their operations
- How to publish and handle events
- How to create view components and presentations
- How to work with complex relationship patterns
- How to leverage AI-powered inference capabilities

## Key Concepts

### Enhanced Imports
Modular specifications with granular control:
- Selective construct imports
- Dependency management
- Namespace organization
- Reusable component libraries

### Controllers
Handle user interactions and coordinate business operations:
- Actions with parameters and validation
- Request/response patterns
- Error handling strategies
- Integration with models and services

### Services
Encapsulate business logic and external integrations:
- Service operations and contracts
- Dependency management
- Async operation patterns
- Event publishing

### Events
Enable loose coupling and reactive architectures:
- Event definitions and payloads
- Publishing from behaviors and actions
- Event handling and subscriptions
- Cross-service communication
- Event subscriptions for Controllers, Services, and Views

### Views
Define user interface structure and behavior:
- Component composition
- Data binding and presentation
- User interaction handling
- Responsive design patterns

## Examples in Order

### 1. [./03-01-enhanced-imports](././03-01-enhanced-imports.yaml)
**Concepts**: Enhanced imports, modular specifications
- Selective construct imports
- Dependency management
- Namespace organization
- Reusable specifications

### 2. [./03-02-controllers-and-actions](././03-02-controllers-and-actions.yaml)
**Concepts**: Controllers, actions, parameters, validation
- Creating RESTful controllers
- Action parameter validation
- Error handling patterns
- Request/response contracts

### 3. [./03-03-services-and-events](././03-03-services-and-events.yaml)
**Concepts**: Services, events, async operations
- Service design patterns
- Event publishing and handling
- Async operation coordination
- Cross-service communication

### 4. [./03-04-views-and-components](././03-04-views-and-components.yaml)
**Concepts**: Views, components, data binding
- Component composition
- Data presentation patterns
- User interaction handling
- Responsive design

### 5. [./03-05-complete-event-flow](././03-05-complete-event-flow.yaml)
**Concepts**: Complete event subscription system
- Event subscriptions across all constructs
- Controllers subscribing to events for automated management
- Services subscribing to events for cross-service communication
- Views subscribing to events for reactive UI updates
- EventHandlers orchestrating complex workflows

### 6. [./03-06-inference-engine-demo](././03-06-inference-engine-demo.specly)
**Concepts**: AI inference engine demonstration (Specly DSL)
- Complex e-commerce domain model with relationships
- Multiple relationship types (belongsTo, hasMany, manyToMany)
- Lifecycle state machines and transitions
- Comprehensive model attributes and behaviors
- Demonstrates automatic generation capabilities

### 7. [./03-07-relationships-demo](././03-07-relationships-demo.yaml)
**Concepts**: Advanced relationship patterns
- Complex relationship modeling
- Polymorphic associations
- Self-referential patterns
- Performance optimization techniques

### 8. [./03-08-one-line-relationships](././03-08-one-line-relationships.yaml)
**Concepts**: Concise relationship syntax
- One-line relationship definitions
- Rapid model development
- Productivity features
- Clean, readable specifications

## Prerequisites

- Complete [01-fundamentals](./01-fundamentals/) examples
- Understanding of [02-profiles](./02-profiles/) system
- Familiarity with web application architecture concepts

## Architecture Patterns

### Layered Architecture
```
Views (Presentation)
    ↓
Controllers (API/Interface)  
    ↓
Services (Business Logic)
    ↓
Models (Domain/Data)
```

### Event-Driven Architecture
```
Action → Behavior → Event → Handler → Side Effects
```

### Component-Based UI
```
Views → Components → Data Binding → User Interactions
```

### Modular Architecture
```
Imports → Components → Composition → Reusability
```

## Next Steps

After mastering architecture:
1. **Domain Examples** ([04-domains/](./04-domains/)) - Real-world applications
2. **Meta Examples** ([05-meta/](./05-meta/)) - Self-referential specifications  
3. **Deployment** ([06-deploy/](./06-deploy/)) - Infrastructure patterns

## Best Practices

### Enhanced Imports
- Import only what you need
- Use clear naming conventions
- Organize dependencies logically
- Document import strategies

### Controllers
- Keep actions focused and single-purpose
- Use clear parameter validation
- Handle errors gracefully
- Document expected responses

### Services
- Separate concerns clearly
- Use dependency injection patterns
- Handle failures and retries
- Publish meaningful events

### Events
- Use descriptive names and clear payloads
- Keep events focused on what happened
- Avoid coupling to specific handlers
- Version event schemas carefully

### Views
- Compose from reusable components
- Separate presentation from logic
- Handle loading and error states
- Design for accessibility

### Relationships
- Choose the right relationship type
- Optimize for performance
- Document complex associations
- Use concise syntax when appropriate

Architecture examples show how SpecVerse scales from simple models to complete, production-ready applications!