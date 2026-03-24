# SpecVerse v3.2 Syntax Reference

**Two complementary references for perfect SpecVerse syntax**

This directory contains the **definitive syntax references** for SpecVerse v3.2, designed to solve the problem of AI assistants and developers getting syntax wrong due to inadequate examples.

## 📚 **Two Reference Types**

### 🏢 **Complete Reference** (`00-01-complete-specverse-reference.specly`)
Real-world business example with full feature coverage:
- **600+ lines** with realistic business domain (Users, Products, Orders)
- **Multiple instances** of every feature showing proper YAML structure  
- **Production-ready patterns** with comprehensive deployments
- **Best for**: Learning business modeling, understanding real applications

### ⚡ **Minimal Reference** (`00-02-minimal-syntax-reference.specly`)
Stripped-down syntax-only example:
- **200 lines** with generic names (Model1, Service1, Event1)
- **Pure syntax focus** without business logic distractions
- **Essential patterns only** for quick lookup
- **Best for**: Quick reference, copy-paste templates, AI training

## 🎯 **Problem Solved**

These references address the core issue identified: **AI assistants generating incorrect SpecVerse syntax** due to:
1. ❌ ~~No single comprehensive example~~ → ✅ **Two complete references covering all scenarios**
2. ❌ ~~Missing "multiple instances" showing YAML structure~~ → ✅ **2-5 examples of every feature** 
3. ❌ ~~Wrong property names (`payload` vs `parameters`, `events` vs `publishes`)~~ → ✅ **Correct property names throughout**
4. ❌ ~~Missing structural wrappers (`attributes:`, `actions:`, `operations:`)~~ → ✅ **All wrappers demonstrated**
5. ❌ ~~Missing advanced features (`steps`, `subscribes_to`, `cured`, `profile-attachment`)~~ → ✅ **100% schema coverage**

## 🔧 **Key Fixes Applied**

### ✅ **Convention Processor Fixed**
- Now **preserves unknown properties** instead of dropping them
- **Schema validation catches errors** instead of silent failures
- **Proper error reporting** for invalid properties

### ✅ **Property Names Corrected**
| Wrong | Correct | Usage |
|-------|---------|-------|
| `payload:` | `parameters:` | Controller actions, service operations |
| `events:` | `publishes:` | Events published by operations |

### ✅ **Structure Wrappers Required**
```yaml
models:
  ModelName:
    attributes:     # ✅ Required wrapper
      name: String required
    
controllers:
  ControllerName:
    actions:        # ✅ Required wrapper
      actionName:
        parameters: # ✅ Correct property name

services:
  ServiceName:
    operations:     # ✅ Required wrapper  
      operationName:
        parameters: # ✅ Correct property name
```

## 📊 **Complete Schema Coverage**

**✅ 100% SpecVerse v3.2 Schema Coverage Achieved**

Both references now demonstrate **every single feature** in the schema:
- **38/38 schema features** covered across both examples
- **All property names** correct (`parameters` not `payload`, `publishes` not `events`)  
- **All structural wrappers** present (`attributes:`, `actions:`, `operations:`)
- **Advanced features** included (`steps`, `subscribes_to`, `cured`, `profile-attachment`)
- **Multiple formats** shown (array vs object subscriptions, shorthand vs structured lifecycles)

See `FEATURE-COVERAGE.md` for complete feature-by-feature verification.

This reference serves as the **definitive syntax guide** for SpecVerse v3.2, ensuring correct usage across all development scenarios with **guaranteed 100% schema compliance**.

## Purpose

This reference example serves as:

- **AI Assistant Guide**: Correct syntax patterns for AI code generation
- **Developer Reference**: Quick lookup for proper SpecVerse syntax
- **Testing Standard**: Comprehensive example for validating language features
- **Learning Resource**: Complete working example showing all capabilities

## Key Features Demonstrated

### 🏗️ **Multiple Instances Pattern**
Every section shows **multiple items** to demonstrate proper YAML structure:

```yaml
attributes:
  id: UUID required           # First attribute
  email: Email unique required # Second attribute
  username: String unique required min=3 max=50 # Third with modifiers
```

### 📋 **Complete ExecutableProperties Syntax**
Shows correct property names and structure:

```yaml
operations:
  processPayment:
    description: "Process payment for order"
    parameters:                    # ✅ NOT "payload"
      orderId: UUID required
      amount: Money required
    returns: String
    requires: ["Order exists"]
    ensures: ["Payment processed"] 
    publishes: [PaymentProcessed]  # ✅ NOT "events"
```

### 🔧 **All Property Types**
Demonstrates every supported property type and modifier:

- **Basic Types**: `String`, `Integer`, `Boolean`, `UUID`, `Email`, `DateTime`, `Money`
- **Modifiers**: `required`, `optional`, `unique`, `min=X`, `max=X`, `default=value`
- **Collections**: `String[]`, `Object[]`
- **Relationships**: `hasMany`, `hasOne`, `belongsTo`, `manyToMany`
- **Lifecycle States**: Both shorthand and structured formats

### 🏛️ **Complete Architecture Coverage**
Shows all architectural components:

- **Models** (5): User, Product, Order, OrderItem, Category
- **Controllers** (3): UserController, ProductController, OrderController  
- **Services** (3): EmailService, PaymentService, InventoryService
- **Events** (12): Covering all lifecycle and business events
- **Deployments** (2): Development and production configurations

### 🚀 **Deployment Instances**
Comprehensive deployment examples with:

- **Controllers**: Multiple API instances with scaling
- **Services**: Background services with configuration
- **Storage**: Database and cache layers
- **Security**: Authentication and secrets management
- **Infrastructure**: Load balancing and API gateways
- **Monitoring**: Metrics, logging, and alerting

## Usage for AI Assistants

When generating SpecVerse specifications, reference this file for:

1. **Property Names**: Use `parameters:` not `payload:`, `publishes:` not `events:`
2. **Structure Wrappers**: Always include `attributes:`, `actions:`, `operations:`
3. **Multiple Items**: Follow YAML array/object patterns shown
4. **Naming Conventions**: PascalCase for types, camelCase for properties
5. **Component References**: Support both PascalCase and kebab-case for component names

## Quick Syntax Reference

| Feature | Correct Syntax | Wrong Syntax |
|---------|---------------|--------------|
| Model Attributes | `attributes:\n  id: UUID required` | `id: UUID required` |
| Controller Actions | `actions:\n  create:\n    parameters:` | `actions:\n  create:\n    payload:` |
| Service Operations | `operations:\n  process:\n    publishes: [Event]` | `operations:\n  process:\n    events: [Event]` |
| Component References | `component: UserController` or `component: user-controller` | `component: usercontroller` |

## Validation

This example passes full SpecVerse v3.2 validation:

```bash
specverse validate examples/00-reference/00-01-complete-specverse-reference.specly
# ✅ Validation successful!
```

## Files

- `00-01-complete-specverse-reference.specly` - Complete reference specification
- `README.md` - This documentation

This reference ensures consistent, correct SpecVerse usage across all development scenarios.