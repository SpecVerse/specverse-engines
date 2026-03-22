// Models Entity — Transformation Rules
// Formal specification of how the inference engine transforms model definitions.
// Each action corresponds to an inference rule in v3.1-controller-rules.json
// or v3.1-service-rules.json.

module modelRules {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var controllers: Set[Controller]
  var services: Set[Service]
  var fullyExpanded: bool

  // ─── Controller Generation Rules ───────────────────────────────────

  /// Rule: cured_root_controller (priority 100)
  /// Every model without a parent relationship gets a standard CURED controller.
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

  /// Rule: cured_child_controller (priority 90)
  /// Models with a parent relationship get a parent-scoped CURED controller.
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

  /// Rule: lifecycle_service (priority 80)
  /// Models with complex lifecycles (>2 transitions) get a lifecycle service.
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

  // ─── Expansion Properties ──────────────────────────────────────────
  // Monotonicity (rules only add, never remove) is enforced by the
  // action structure: every action uses .union() to add to state.

}
