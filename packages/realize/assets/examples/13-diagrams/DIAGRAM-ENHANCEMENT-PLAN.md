# Diagram Examples Enhancement Plan

## Executive Summary

**Current State:** 7 of 12 supported diagram types have examples (58% coverage)
**Goal:** Achieve 100% coverage with comprehensive feature demonstrations
**Timeline:** 5 phases, estimated 8-10 hours total

---

## Phase 1: Cleanup - Remove Unsupported Features

### 1.1 Remove Model Inheritance Support
**Status:** Not supported by SpecVerse language
**Impact:** Remove from codebase to avoid confusion

**Tasks:**
- [x] Delete generated diagram files
  - `/examples/11-diagrams/generated-diagrams/model-inheritance.mmd`
  - `/examples/11-diagrams/generated-diagrams/11-07-model-inheritance.mmd`
- [ ] Remove from ERDiagramPlugin
  - Remove `'model-inheritance'` from `supportedTypes` array
  - Remove `case 'model-inheritance'` handler
  - Remove `generateModelInheritance()` method
- [ ] Remove from type definitions
  - Remove `'model-inheritance'` from `DiagramType` union in `types/index.ts`
- [ ] Update tests
  - Remove model-inheritance tests from `ERDiagramPlugin.test.ts`
  - Remove from integration tests
- [ ] Update documentation
  - Remove from plugin documentation comments

**Effort:** 1 hour

---

## Phase 2: Critical Missing Examples (High Priority)

### 2.1 Create 11-09-event-flow-layered-demo.specly
**Diagram Type:** `event-flow-layered`
**Purpose:** Demonstrate 5-layer architecture with dual event bus pattern

**Features to Demonstrate:**
- ✅ 5-layer architecture (Models → Domain Events → Controllers/Services → App Events → Views)
- ✅ Domain events (business logic events from models)
- ✅ Application events (UI/presentation events)
- ✅ Dual event bus pattern
- ✅ Event flow across all layers
- ✅ Layer boundaries and separation of concerns

**Specification Structure:**
```yaml
components:
  EcommerceApp:
    models:
      Order:
        attributes: { ... }
        behaviors:
          - name: placeOrder
            publishes: [OrderPlaced]  # Domain event
          - name: confirmPayment
            publishes: [PaymentConfirmed]  # Domain event

      Product:
        behaviors:
          - name: reserveStock
            publishes: [StockReserved]  # Domain event

    controllers:
      OrderController:
        operations:
          - name: createOrder
            subscribes: [OrderPlaced]
            publishes: [OrderCreatedNotification]  # App event

    services:
      PaymentService:
        operations:
          - name: processPayment
            subscribes: [OrderPlaced]
            publishes: [PaymentProcessed]  # App event

      InventoryService:
        operations:
          - name: checkStock
            subscribes: [StockReserved]
            publishes: [StockUpdated]  # App event

    views:
      OrderDashboard:
        subscribes: [OrderCreatedNotification, PaymentProcessed]

      InventoryView:
        subscribes: [StockUpdated]
```

**Expected Diagram Output:**
- 5 horizontal layers with clear boundaries
- Domain event bus in middle layer
- Application event bus above services layer
- Clear event flow arrows between layers
- Color coding by layer

**Effort:** 2 hours

---

### 2.2 Create 11-10-er-diagram-demo.specly
**Diagram Type:** `er-diagram`
**Purpose:** Comprehensive demonstration of all ER diagram features

**Features to Demonstrate:**
- ✅ All attribute types (String, Number, Boolean, Date, UUID, etc.)
- ✅ Attribute constraints (required, unique)
- ✅ All relationship types:
  - hasMany (one-to-many)
  - hasOne (one-to-one)
  - belongsTo (many-to-one)
  - manyToMany (many-to-many with through table)
- ✅ Cascade operations (delete, update)
- ✅ Self-referential relationships (e.g., Employee → Manager)
- ✅ Circular relationships
- ✅ Complex foreign key patterns

**Specification Structure:**
```yaml
components:
  ComprehensiveERDemo:
    models:
      # One-to-many example
      Department:
        attributes:
          id: UUID primary
          name: String required unique
          code: String required
          budget: Number
        relationships:
          employees: hasMany Employee cascade:delete
          manager: hasOne Employee as:departmentManager

      # Many-to-one with self-reference
      Employee:
        attributes:
          id: UUID primary
          firstName: String required
          lastName: String required
          email: Email required unique
          hireDate: Date required
          salary: Money
          departmentId: UUID
          managerId: UUID
        relationships:
          department: belongsTo Department
          manager: belongsTo Employee as:supervisor  # Self-reference
          subordinates: hasMany Employee as:supervisor  # Reverse self-reference
          projects: manyToMany Project through:ProjectAssignment

      # Many-to-many example
      Project:
        attributes:
          id: UUID primary
          name: String required
          startDate: Date
          endDate: Date
          budget: Money
        relationships:
          employees: manyToMany Employee through:ProjectAssignment
          lead: hasOne Employee as:projectLead

      # Through table for many-to-many
      ProjectAssignment:
        attributes:
          id: UUID primary
          employeeId: UUID required
          projectId: UUID required
          role: String required
          hoursAllocated: Number
          startDate: Date required
        relationships:
          employee: belongsTo Employee
          project: belongsTo Project
```

**Expected Diagram Output:**
- All models with full attribute definitions
- All relationship types clearly visualized
- Cardinality notation (||, }o, etc.)
- Through table shown for many-to-many
- Self-referential relationship loops

**Effort:** 2 hours

---

### 2.3 Create 11-11-manifest-demo.specly
**Diagram Types:** `manifest-mapping`, `technology-stack`, `capability-bindings`
**Purpose:** Demonstrate all manifest diagram capabilities

**Features to Demonstrate:**
- ✅ Component → Manifest → Implementation mapping
- ✅ Technology stack by category (Frontend, Backend, Database, Infrastructure)
- ✅ Framework specifications
- ✅ Version tracking
- ✅ Capability mappings
- ✅ Behavior mappings
- ✅ Communication channels
- ✅ Multiple implementations per capability

**Specification Structure:**
```yaml
components:
  EcommerceAPI:
    version: "2.0.0"
    models: { ... }
    controllers:
      ProductController:
        operations:
          - name: listProducts
          - name: getProduct
          - name: createProduct

    services:
      PaymentService:
        operations:
          - name: processPayment
          - name: refundPayment

manifests:
  production:
    name: "Ecommerce Production Manifest"
    version: "1.0.0"
    component: EcommerceAPI

    implementations:
      api:
        type: "REST API"
        technology: "Node.js"
        framework: "Express"
        version: "4.18.0"
        behaviors:
          - "ProductController.listProducts → GET /api/products"
          - "ProductController.getProduct → GET /api/products/:id"
          - "ProductController.createProduct → POST /api/products"
          - "PaymentService.processPayment → POST /api/payments/process"
          - "PaymentService.refundPayment → POST /api/payments/refund"

      database:
        type: "Database"
        technology: "PostgreSQL"
        version: "15.0"
        framework: "Prisma ORM"

      frontend:
        type: "Web UI"
        technology: "React"
        framework: "Next.js"
        version: "14.0"

      cache:
        type: "Cache"
        technology: "Redis"
        version: "7.0"

      search:
        type: "Search Engine"
        technology: "Elasticsearch"
        version: "8.0"

    capabilities:
      storage.products.create:
        implementations: [database]
      storage.products.read:
        implementations: [database, cache]
      search.products:
        implementations: [search]

    communications:
      eventBus:
        type: "message-queue"
        technology: "RabbitMQ"
        version: "3.12"
```

**Expected Diagram Outputs:**

**Manifest Mapping:**
- Three layers: Component → Manifest → Implementations
- Clear traceability lines
- Behavior counts per implementation
- Version information

**Technology Stack:**
- Category-based grouping (Frontend, Backend, Database, etc.)
- Technology + Framework + Version for each
- Color-coded by category
- Icon-based category identification

**Capability Bindings:**
- Capabilities on left
- Implementations on right
- Multiple implementations per capability shown
- Clear binding relationships

**Effort:** 3 hours

---

## Phase 3: Enhance Existing Examples (Medium Priority)

### 3.1 Enhance 11-01-event-flow-sequence-demo.specly
**Current Coverage:** 70%
**Target Coverage:** 95%

**Additional Features:**
- [ ] Deep event chains (5+ levels)
  - Add OrderShipped → TrackingUpdated → DeliveryScheduled → CustomerNotified → FeedbackRequested
- [ ] Circular event handling
  - Add InventoryLow → RestockOrdered → InventoryReplenished → InventoryLow (cycle)
- [ ] Event fan-out (one event → many subscribers)
  - OrderPlaced should trigger: PaymentService, InventoryService, AnalyticsService, NotificationService
- [ ] Event aggregation
  - Add OrderCompletionCheck that waits for: PaymentConfirmed + StockReserved + ShippingScheduled

**Effort:** 1 hour

---

### 3.2 Enhance 11-05-component-dependencies-demo.specly
**Current Coverage:** 50%
**Target Coverage:** 90%

**Additional Features:**
- [ ] Split into 3 components:
  - OrderManagement (main component)
  - PaymentProcessing (imported component)
  - InventoryManagement (imported component)
- [ ] Add import relationships
  ```yaml
  import:
    - from: "@company/payment-processing"
      component: PaymentProcessing
    - from: "@company/inventory-management"
      component: InventoryManagement
  ```
- [ ] Show cross-component event subscriptions
- [ ] Demonstrate component boundaries in diagram

**Effort:** 1.5 hours

---

### 3.3 Enhance 11-06-lifecycle-demo.specly
**Current Coverage:** 40%
**Target Coverage:** 85%

**Additional Features:**
- [ ] Explicit transition definitions with actions
  ```yaml
  Order:
    lifecycle:
      states: [pending, confirmed, processing, shipped, delivered, cancelled]
      transitions:
        - from: pending
          to: confirmed
          action: confirmOrder
          label: "Payment Received"
        - from: confirmed
          to: cancelled
          condition: "[timeout > 24h]"
          label: "Auto-cancel"
  ```
- [ ] Add conditional transitions with guards
- [ ] Include entry/exit actions
- [ ] Create complex state machine (8+ states)
  - Add: pending → awaitingPayment → paymentFailed → retrying → confirmed
- [ ] Demonstrate parallel regions (not supported? check)

**Effort:** 1.5 hours

---

### 3.4 Enhance 11-07-profiles-demo.specly
**Current Coverage:** 60%
**Target Coverage:** 85%

**Additional Features:**
- [ ] Show profiles attaching to multiple base models
  ```yaml
  AuditableProfile:
    profileAttachment:
      appliesTo: [User, Product, Order, Transaction]
  ```
- [ ] Add more complex profile hierarchies (10+ profiles)
- [ ] Demonstrate conditional profile scenarios in documentation
- [ ] Add profiles with relationships between them

**Effort:** 1 hour

---

### 3.5 Enhance 11-08-deployment-demo.specly
**Current Coverage:** 70%
**Target Coverage:** 95%

**Additional Features:**
- [ ] Add security instances
  ```yaml
  deployments:
    production:
      instances:
        security:
          authService:
            type: security
            component: AuthenticationService
            namespace: security
            advertises: [auth.*, session.*]

          firewall:
            type: infrastructure
            namespace: security
            advertises: [network.filter.*]
  ```
- [ ] Add monitoring instances
  ```yaml
  monitoring:
    prometheus:
      type: monitoring
      namespace: observability
      advertises: [metrics.*]

    grafana:
      type: monitoring
      namespace: observability
      uses: [metrics.*]
  ```
- [ ] Add infrastructure instances (load balancers, CDN)
- [ ] Demonstrate multiple communication channels
  ```yaml
  communications:
    eventBus:
      type: pubsub
      namespace: global

    apiGateway:
      type: http
      namespace: api

    messageQueue:
      type: queue
      namespace: async
  ```
- [ ] Create multi-environment section (development, staging, production)

**Effort:** 2 hours

---

## Phase 4: Documentation & Validation

### 4.1 Create Diagram Type Guide
**File:** `/examples/11-diagrams/README.md`

**Contents:**
- Overview of all 12 diagram types
- When to use each diagram type
- Feature matrix showing what each type supports
- Links to example files
- Tips for complex scenarios
- Troubleshooting common issues

**Effort:** 1.5 hours

---

### 4.2 Add Markdown Documentation for Each Example
**Pattern:** `11-XX-name-demo.md` alongside each `.specly` file

**Contents for each:**
- What diagram types this example generates
- Key features demonstrated
- Complexity indicators (simple/medium/complex)
- Real-world use cases
- Expected diagram output descriptions
- Tips and best practices

**Effort:** 2 hours (15 min per file × 8 files)

---

### 4.3 Validation & Testing

**Tasks:**
- [ ] Regenerate all diagrams
- [ ] Verify each diagram renders correctly in VSCode
- [ ] Test each diagram type independently
- [ ] Validate all new examples parse correctly
- [ ] Run full test suite
- [ ] Check for arrow syntax issues (should all use `-.->` now)
- [ ] Verify no `...>` syntax remains

**Effort:** 1 hour

---

## Phase 5: Advanced Features & Edge Cases

### 5.1 Create Advanced Complexity Examples (Optional)

**11-13-complex-enterprise-system.specly**
- Stress test with maximum complexity
- 20+ models, 15+ services, 10+ controllers
- Complex event chains
- Multiple deployments
- Full manifest with 10+ implementations

**11-14-edge-cases-demo.specly**
- Circular dependencies
- Deep nesting
- Self-referential models
- Complex lifecycle scenarios
- Error conditions and handling

**Effort:** 3 hours (optional)

---

## Summary

### Coverage Improvement
- **Current:** 7/12 diagram types with examples (58%)
- **After Phase 2:** 10/12 diagram types with examples (83%)
- **After Phase 3:** 10/12 with comprehensive coverage (95%+ per type)
- **After Phase 4:** 100% with documentation

### Effort Breakdown
| Phase | Tasks | Estimated Effort |
|-------|-------|------------------|
| Phase 1: Cleanup | Remove model-inheritance | 1 hour |
| Phase 2: New Examples | 3 new example files | 7 hours |
| Phase 3: Enhancements | 5 existing files enhanced | 7 hours |
| Phase 4: Documentation | README + per-file docs | 3.5 hours |
| Phase 5: Advanced (Optional) | Edge cases & stress tests | 3 hours |
| **Total Core (Phases 1-4)** | | **18.5 hours** |
| **Total with Optional** | | **21.5 hours** |

### Recommended Execution Order

**Week 1 - Critical Path:**
1. Phase 1: Cleanup (remove model-inheritance) - 1 hour
2. Phase 2.1: Event flow layered example - 2 hours
3. Phase 2.2: ER diagram example - 2 hours
4. Phase 2.3: Manifest examples - 3 hours

**Week 2 - Enhancements:**
5. Phase 3.1: Enhance event flow sequence - 1 hour
6. Phase 3.2: Enhance component dependencies - 1.5 hours
7. Phase 3.3: Enhance lifecycle - 1.5 hours
8. Phase 3.4: Enhance profiles - 1 hour
9. Phase 3.5: Enhance deployment - 2 hours

**Week 3 - Documentation:**
10. Phase 4.1: Diagram type guide - 1.5 hours
11. Phase 4.2: Per-example documentation - 2 hours
12. Phase 4.3: Validation & testing - 1 hour

**Optional - Week 4:**
13. Phase 5: Advanced complexity examples - 3 hours

---

## Success Criteria

- [ ] All 12 supported diagram types have examples
- [ ] Each example demonstrates 80%+ of available features
- [ ] All diagrams render correctly in VSCode without errors
- [ ] Documentation explains when to use each diagram type
- [ ] Examples range from simple to complex
- [ ] No unsupported features in codebase (model-inheritance removed)
- [ ] All tests pass
- [ ] No arrow syntax errors (`...>` replaced with `-.->`)

---

## Dependencies & Prerequisites

**Before Starting:**
- MermaidRenderer arrow syntax fix completed ✅
- Deployment topology diagram working ✅
- Build system operational ✅

**Tools Needed:**
- VSCode with Mermaid preview extension
- SpecVerse CLI working
- Test suite functional

---

## Risk Mitigation

**Risk:** New examples may reveal plugin bugs
**Mitigation:** Test incrementally, fix plugins as needed

**Risk:** Complex examples may hit diagram generator limits
**Mitigation:** Start with medium complexity, increase gradually

**Risk:** Documentation may become outdated
**Mitigation:** Generate docs from code where possible, use examples as single source of truth

---

## Next Steps

**Immediate Actions:**
1. Get approval for this plan
2. Begin Phase 1: Remove model-inheritance support
3. Create 11-09-event-flow-layered-demo.specly
4. Test and validate before proceeding to next example

**Questions for Stakeholder:**
1. Should we proceed with all phases or prioritize specific diagram types?
2. Are there specific real-world scenarios we should model in examples?
3. Should advanced complexity examples (Phase 5) be included?
4. Any preferences for documentation format/location?
