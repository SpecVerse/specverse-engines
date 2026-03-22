// Services Entity — Quint Tests
// Tests that verify service invariant properties hold for generated services.

module serviceTests {

  import specverseTypes.* from "../../../_shared/behaviour/types"

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

  var models: Set[Model]
  var services: Set[Service]

  val orderModel: Model = {
    name: "Order",
    attributes: Map("id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false }),
    relationships: Map(),
    hasLifecycle: true, lifecycle: sampleLifecycle,
    profiles: Set(), hasParentRelationship: false, parentModel: "",
    hasExternalIntegration: false, hasValidationConstraints: false
  }

  val simpleModel: Model = {
    name: "Tag",
    attributes: Map("id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false }),
    relationships: Map(),
    hasLifecycle: false, lifecycle: emptyLifecycle,
    profiles: Set(), hasParentRelationship: false, parentModel: "",
    hasExternalIntegration: false, hasValidationConstraints: false
  }

  val lifecycleService: Service = {
    name: "Order", model: "Order", component: "", pattern: "LifecycleService",
    operations: Set(
      { name: "transition", acceptsOperationContext: false, callsValidateInternally: false },
      { name: "getState", acceptsOperationContext: false, callsValidateInternally: false },
      { name: "getHistory", acceptsOperationContext: false, callsValidateInternally: false },
      { name: "getAvailableTransitions", acceptsOperationContext: false, callsValidateInternally: false }
    ),
    subscribes: Set(), dependencies: Set()
  }

  action init = all {
    models' = Set(orderModel, simpleModel),
    services' = Set(lifecycleService),
  }

  action step = all { models' = models, services' = services }

  /// Lifecycle service references a valid model.
  run validModelRefTest = {
    init.then(all {
      assert(services.forall(s => models.exists(m => m.name == s.model))),
      models' = models, services' = services,
    })
  }

  /// Lifecycle service has all required operations.
  run lifecycleOpsTest = {
    init.then(all {
      assert(services.forall(s =>
        (s.pattern == "LifecycleService") implies
          Set("transition", "getState", "getHistory", "getAvailableTransitions")
            .forall(opName => s.operations.exists(op => op.name == opName)))),
      models' = models, services' = services,
    })
  }

  /// Lifecycle service only exists for models with >2 transitions.
  run lifecycleConditionTest = {
    init.then(all {
      assert(services.forall(s =>
        (s.pattern == "LifecycleService") implies
          models.exists(m => m.name == s.model and m.lifecycle.transitions.size() > 2))),
      models' = models, services' = services,
    })
  }

  /// No deprecated service patterns.
  run noDeprecatedPatternsTest = {
    init.then(all {
      assert(services.forall(s => s.pattern != "ProcessingService")),
      assert(services.forall(s => s.pattern != "ValidationService")),
      models' = models, services' = services,
    })
  }

  /// Simple model without lifecycle does not get a service.
  run noServiceForSimpleModelTest = {
    init.then(all {
      assert(not(services.exists(s => s.model == "Tag"))),
      models' = models, services' = services,
    })
  }

}
