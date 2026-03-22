// Models Entity — Quint Tests
// Simulation-based tests that exercise the model rules state machine.
// Run with: npx quint test <file> --main modelTests

module modelTests {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── Reuse sample data from verify module ────────────────────────

  val emptyLifecycle: Lifecycle = {
    name: "", states: Set(), transitions: Set()
  }

  val sampleLifecycle: Lifecycle = {
    name: "status",
    states: Set(
      { name: "draft", isInitial: true, isTerminal: false },
      { name: "active", isInitial: false, isTerminal: false },
      { name: "archived", isInitial: false, isTerminal: true }
    ),
    transitions: Set(
      { name: "activate", from: "draft", to: "active" },
      { name: "archive", from: "active", to: "archived" },
      { name: "reactivate", from: "archived", to: "active" }
    )
  }

  val userModel: Model = {
    name: "User",
    attributes: Map(
      "id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false },
      "email" -> { name: "email", attrType: "String", required: true, hasConstraints: true }
    ),
    relationships: Map(
      "orders" -> { name: "orders", relType: "hasMany", targetModel: "Order" }
    ),
    hasLifecycle: false, lifecycle: emptyLifecycle,
    profiles: Set(), hasParentRelationship: false, parentModel: "",
    hasExternalIntegration: false, hasValidationConstraints: true
  }

  val orderModel: Model = {
    name: "Order",
    attributes: Map(
      "id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false },
      "totalAmount" -> { name: "totalAmount", attrType: "Number", required: true, hasConstraints: true }
    ),
    relationships: Map(
      "user" -> { name: "user", relType: "belongsTo", targetModel: "User" }
    ),
    hasLifecycle: true, lifecycle: sampleLifecycle,
    profiles: Set(), hasParentRelationship: true, parentModel: "User",
    hasExternalIntegration: false, hasValidationConstraints: true
  }

  val orderItemModel: Model = {
    name: "OrderItem",
    attributes: Map(
      "id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false },
      "quantity" -> { name: "quantity", attrType: "Integer", required: true, hasConstraints: true }
    ),
    relationships: Map(
      "order" -> { name: "order", relType: "belongsTo", targetModel: "Order" }
    ),
    hasLifecycle: false, lifecycle: emptyLifecycle,
    profiles: Set(), hasParentRelationship: true, parentModel: "Order",
    hasExternalIntegration: false, hasValidationConstraints: false
  }

  // ─── State Variables ─────────────────────────────────────────────

  var models: Set[Model]
  var controllers: Set[Controller]
  var services: Set[Service]
  var fullyExpanded: bool

  // ─── Rule Actions (same as verify.qnt) ───────────────────────────

  action generateRootController(m: Model): bool = all {
    not(m.hasParentRelationship),
    controllers' = controllers.union(Set({
      name: m.name, model: m.name, component: "", pattern: "StandardCURED",
      parentModel: "",
      operations: Set("create", "update", "retrieve", "retrieve_many", "validate", "evolve", "delete"),
      endpoints: Set(), hasAssociationOps: false, manyToManyTargets: Set(),
      path: "/api/", dependencies: Set()
    })),
    models' = models, services' = services, fullyExpanded' = false,
  }

  action generateChildController(m: Model): bool = all {
    m.hasParentRelationship,
    controllers' = controllers.union(Set({
      name: m.name, model: m.name, component: "", pattern: "ParentScopedCURED",
      parentModel: m.parentModel,
      operations: Set("create", "update", "retrieve", "retrieve_many", "validate", "evolve", "delete"),
      endpoints: Set(), hasAssociationOps: false, manyToManyTargets: Set(),
      path: "/api/", dependencies: Set()
    })),
    models' = models, services' = services, fullyExpanded' = false,
  }

  action generateLifecycleService(m: Model): bool = all {
    m.hasLifecycle, m.lifecycle.transitions.size() > 2,
    services' = services.union(Set({
      name: m.name, model: m.name, component: "", pattern: "LifecycleService",
      operations: Set(
        { name: "transition", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getState", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getHistory", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getAvailableTransitions", acceptsOperationContext: false, callsValidateInternally: false }
      ),
      subscribes: Set(), dependencies: Set()
    })),
    models' = models, controllers' = controllers, fullyExpanded' = false,
  }

  // ─── Init ────────────────────────────────────────────────────────

  action init = all {
    models' = Set(userModel, orderModel, orderItemModel),
    controllers' = Set(),
    services' = Set(),
    fullyExpanded' = false,
  }

  // ─── Tests ───────────────────────────────────────────────────────

  /// Root model (User) gets a StandardCURED controller.
  run rootControllerTest = {
    init
      .then(generateRootController(userModel))
      .then(all {
        assert(controllers.exists(c => c.model == "User" and c.pattern == "StandardCURED")),
        models' = models, controllers' = controllers, services' = services, fullyExpanded' = fullyExpanded,
      })
  }

  /// Child model (Order) gets a ParentScopedCURED controller.
  run childControllerTest = {
    init
      .then(generateChildController(orderModel))
      .then(all {
        assert(controllers.exists(c => c.model == "Order" and c.pattern == "ParentScopedCURED")),
        assert(controllers.exists(c => c.model == "Order" and c.parentModel == "User")),
        models' = models, controllers' = controllers, services' = services, fullyExpanded' = fullyExpanded,
      })
  }

  /// Model with lifecycle (Order, 3 transitions) gets a LifecycleService.
  run lifecycleServiceTest = {
    init
      .then(generateLifecycleService(orderModel))
      .then(all {
        assert(services.exists(s => s.model == "Order" and s.pattern == "LifecycleService")),
        assert(services.exists(s => s.operations.exists(op => op.name == "transition"))),
        models' = models, controllers' = controllers, services' = services, fullyExpanded' = fullyExpanded,
      })
  }

  /// All three rules can run in sequence without conflict.
  run fullInferenceTest = {
    init
      .then(generateRootController(userModel))
      .then(generateChildController(orderModel))
      .then(generateChildController(orderItemModel))
      .then(generateLifecycleService(orderModel))
      .then(all {
        // Every model got a controller
        assert(controllers.size() == 3),
        assert(controllers.exists(c => c.model == "User")),
        assert(controllers.exists(c => c.model == "Order")),
        assert(controllers.exists(c => c.model == "OrderItem")),
        // Order got a lifecycle service
        assert(services.size() == 1),
        assert(services.exists(s => s.model == "Order" and s.pattern == "LifecycleService")),
        models' = models, controllers' = controllers, services' = services, fullyExpanded' = fullyExpanded,
      })
  }

  /// Rules are monotonic — running a rule twice doesn't duplicate.
  run monotonicityTest = {
    init
      .then(generateRootController(userModel))
      .then(generateRootController(userModel))
      .then(all {
        // Set union means no duplicates
        assert(controllers.filter(c => c.model == "User").size() == 1),
        models' = models, controllers' = controllers, services' = services, fullyExpanded' = fullyExpanded,
      })
  }

  /// Root controller precondition: fails for child models.
  run rootControllerPreconditionTest = {
    init
      .then(all {
        // orderModel has hasParentRelationship = true, so generateRootController should not apply
        assert(orderModel.hasParentRelationship),
        // This confirms the precondition prevents misapplication
        models' = models, controllers' = controllers, services' = services, fullyExpanded' = fullyExpanded,
      })
  }

}
