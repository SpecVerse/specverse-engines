// Services Entity — Verification Module
// Verifies structural invariants hold for generated services.

module serviceVerify {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  var models: Set[Model]
  var services: Set[Service]

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
    name: "", states: Set(), transitions: Set()
  }

  val orderModel: Model = {
    name: "Order",
    attributes: Map(
      "id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false }
    ),
    relationships: Map(),
    hasLifecycle: true, lifecycle: sampleLifecycle,
    profiles: Set(), hasParentRelationship: false, parentModel: "",
    hasExternalIntegration: false, hasValidationConstraints: false
  }

  // ─── Init (with pre-generated lifecycle service) ──────────────────

  action init = all {
    models' = Set(orderModel),
    services' = Set({
      name: "Order", model: "Order", component: "",
      pattern: "LifecycleService",
      operations: Set(
        { name: "transition", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getState", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getHistory", acceptsOperationContext: false, callsValidateInternally: false },
        { name: "getAvailableTransitions", acceptsOperationContext: false, callsValidateInternally: false }
      ),
      subscribes: Set(), dependencies: Set()
    }),
  }

  action step = all {
    models' = models,
    services' = services,
  }

  // ─── Invariants ──────────────────────────────────────────────────

  val servicesReferenceValidModel: bool =
    services.forall(s => models.exists(m => m.name == s.model))

  val serviceNamesUnique: bool =
    services.forall(s1 => services.forall(s2 =>
      (s1 != s2) implies (s1.name != s2.name)))

  val servicesHaveOperations: bool =
    services.forall(s => s.operations.size() > 0)

  val lifecycleServiceCondition: bool =
    services.forall(s =>
      (s.pattern == "LifecycleService") implies
        models.exists(m =>
          m.name == s.model and m.hasLifecycle and
          m.lifecycle.transitions.size() > 2))

  val lifecycleServiceOps: bool =
    services.forall(s =>
      (s.pattern == "LifecycleService") implies
        Set("transition", "getState", "getHistory", "getAvailableTransitions")
          .forall(opName => s.operations.exists(op => op.name == opName)))

  val noProcessingService: bool =
    services.forall(s => s.pattern != "ProcessingService")

  val noValidationService: bool =
    services.forall(s => s.pattern != "ValidationService")

}
