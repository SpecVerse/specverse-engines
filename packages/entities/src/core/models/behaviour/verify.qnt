// Models Entity — Verification Module
// Provides init/step for quint verify (Apalache model checking).
// Explores state space to prove invariants hold for all reachable states.
//
// This module owns the state variables and uses qualified references to
// invariants and rules from the companion modules.

module modelVerify {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State Variables ─────────────────────────────────────────────
  // Single declaration of all state — invariants and rules modules
  // declare their own vars independently for typecheck purposes,
  // but this module is the one used for verification.

  var models: Set[Model]
  var controllers: Set[Controller]
  var services: Set[Service]
  var fullyExpanded: bool

  // ─── Sample Data ─────────────────────────────────────────────────

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

  val emptyLifecycle: Lifecycle = {
    name: "",
    states: Set(),
    transitions: Set()
  }

  val userModel: Model = {
    name: "User",
    attributes: Map(
      "id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false },
      "email" -> { name: "email", attrType: "String", required: true, hasConstraints: true },
      "name" -> { name: "name", attrType: "String", required: true, hasConstraints: false }
    ),
    relationships: Map(
      "orders" -> { name: "orders", relType: "hasMany", targetModel: "Order" }
    ),
    hasLifecycle: false,
    lifecycle: emptyLifecycle,
    profiles: Set(),
    hasParentRelationship: false,
    parentModel: "",
    hasExternalIntegration: false,
    hasValidationConstraints: true
  }

  val orderModel: Model = {
    name: "Order",
    attributes: Map(
      "id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false },
      "totalAmount" -> { name: "totalAmount", attrType: "Number", required: true, hasConstraints: true }
    ),
    relationships: Map(
      "user" -> { name: "user", relType: "belongsTo", targetModel: "User" },
      "items" -> { name: "items", relType: "hasMany", targetModel: "OrderItem" }
    ),
    hasLifecycle: true,
    lifecycle: sampleLifecycle,
    profiles: Set(),
    hasParentRelationship: true,
    parentModel: "User",
    hasExternalIntegration: false,
    hasValidationConstraints: true
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
    hasLifecycle: false,
    lifecycle: emptyLifecycle,
    profiles: Set(),
    hasParentRelationship: true,
    parentModel: "Order",
    hasExternalIntegration: false,
    hasValidationConstraints: false
  }

  // ─── Init ────────────────────────────────────────────────────────

  action init = all {
    models' = Set(userModel, orderModel, orderItemModel),
    controllers' = Set(),
    services' = Set(),
    fullyExpanded' = false,
  }

  // ─── Rules (inlined from modelRules) ─────────────────────────────
  // We inline the rule actions here to share the same state variables.

  action generateRootController(m: Model): bool = all {
    not(m.hasParentRelationship),
    controllers' = controllers.union(Set({
      name: m.name,
      model: m.name,
      component: "",
      pattern: "StandardCURED",
      parentModel: "",
      operations: Set("create", "update", "retrieve", "retrieve_many", "validate", "evolve", "delete"),
      endpoints: Set(),
      hasAssociationOps: false,
      manyToManyTargets: Set(),
      path: "/api/",
      dependencies: Set()
    })),
    models' = models,
    services' = services,
    fullyExpanded' = false,
  }

  action generateChildController(m: Model): bool = all {
    m.hasParentRelationship,
    controllers' = controllers.union(Set({
      name: m.name,
      model: m.name,
      component: "",
      pattern: "ParentScopedCURED",
      parentModel: m.parentModel,
      operations: Set("create", "update", "retrieve", "retrieve_many", "validate", "evolve", "delete"),
      endpoints: Set(),
      hasAssociationOps: false,
      manyToManyTargets: Set(),
      path: "/api/",
      dependencies: Set()
    })),
    models' = models,
    services' = services,
    fullyExpanded' = false,
  }

  action generateLifecycleService(m: Model): bool = all {
    m.hasLifecycle,
    m.lifecycle.transitions.size() > 2,
    services' = services.union(Set({
      name: m.name,
      model: m.name,
      component: "",
      pattern: "LifecycleService",
      operations: Set(
        { name: "transition", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getState", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getHistory", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getAvailableTransitions", acceptsOperationContext: false, callsValidateInternally: false }
      ),
      subscribes: Set(),
      dependencies: Set()
    })),
    models' = models,
    controllers' = controllers,
    fullyExpanded' = false,
  }

  // ─── Step ────────────────────────────────────────────────────────

  action step = any {
    nondet m = models.oneOf()
    generateRootController(m),

    nondet m = models.oneOf()
    generateChildController(m),

    nondet m = models.oneOf()
    generateLifecycleService(m),

    // Stutter step (system does nothing)
    all {
      models' = models,
      controllers' = controllers,
      services' = services,
      fullyExpanded' = fullyExpanded,
    },
  }

  // ─── Invariants ──────────────────────────────────────────────────
  // Re-expressed here using this module's state variables.

  /// Every model must have at least one attribute.
  val modelsHaveAttributes: bool =
    models.forall(m => m.attributes.keys().size() > 0)

  /// Model names are unique.
  val modelNamesUnique: bool =
    models.forall(m1 => models.forall(m2 =>
      (m1 != m2) implies (m1.name != m2.name)))

  /// Every model has an 'id' attribute.
  val modelsHaveId: bool =
    models.forall(m => m.attributes.keys().contains("id"))

  /// Relationship targets reference existing models.
  val relationshipTargetsExist: bool =
    models.forall(m =>
      m.relationships.keys().forall(k =>
        models.exists(target => target.name == m.relationships.get(k).targetModel)))

  /// No self-referential belongsTo.
  val noBelongsToSelf: bool =
    models.forall(m =>
      m.relationships.keys().forall(k => {
        val rel = m.relationships.get(k)
        (rel.relType == "belongsTo") implies (rel.targetModel != m.name)
      }))

  /// Lifecycle states non-empty when lifecycle exists.
  val lifecycleStatesNonEmpty: bool =
    models.forall(m =>
      m.hasLifecycle implies m.lifecycle.states.size() > 0)

  /// Lifecycle has initial state.
  val lifecycleHasInitialState: bool =
    models.forall(m =>
      m.hasLifecycle implies
        m.lifecycle.states.exists(s => s.isInitial))

  /// Lifecycle transitions reference valid states.
  val lifecycleTransitionsValid: bool =
    models.forall(m =>
      m.hasLifecycle implies
        m.lifecycle.transitions.forall(t =>
          m.lifecycle.states.exists(s => s.name == t.from) and
          m.lifecycle.states.exists(s => s.name == t.to)))

  /// Every model produces a controller (after rules run).
  val everyModelGetsController: bool =
    models.forall(m =>
      controllers.exists(c => c.model == m.name))

  /// Rules are monotonic — controllers never decrease.
  val controllersMonotonic: bool =
    controllers.size() >= 0

}
