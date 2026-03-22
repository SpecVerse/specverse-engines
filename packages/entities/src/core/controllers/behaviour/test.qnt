// Controllers Entity — Quint Tests
// Tests that verify controller invariant properties hold for generated controllers.

module controllerTests {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  val emptyLifecycle: Lifecycle = {
    name: "", states: Set(), transitions: Set()
  }

  var models: Set[Model]
  var controllers: Set[Controller]

  val userModel: Model = {
    name: "User",
    attributes: Map("id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false }),
    relationships: Map(),
    hasLifecycle: false, lifecycle: emptyLifecycle,
    profiles: Set(), hasParentRelationship: false, parentModel: "",
    hasExternalIntegration: false, hasValidationConstraints: false
  }

  val orderModel: Model = {
    name: "Order",
    attributes: Map("id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false }),
    relationships: Map("user" -> { name: "user", relType: "belongsTo", targetModel: "User" }),
    hasLifecycle: false, lifecycle: emptyLifecycle,
    profiles: Set(), hasParentRelationship: true, parentModel: "User",
    hasExternalIntegration: false, hasValidationConstraints: false
  }

  val userController: Controller = {
    name: "User", model: "User", component: "", pattern: "StandardCURED",
    parentModel: "",
    operations: Set("create", "update", "retrieve", "retrieve_many", "validate", "evolve", "delete"),
    endpoints: Set(), hasAssociationOps: false, manyToManyTargets: Set(),
    path: "/api/", dependencies: Set()
  }

  val orderController: Controller = {
    name: "Order", model: "Order", component: "", pattern: "ParentScopedCURED",
    parentModel: "User",
    operations: Set("create", "update", "retrieve", "retrieve_many", "validate", "evolve", "delete"),
    endpoints: Set(), hasAssociationOps: false, manyToManyTargets: Set(),
    path: "/api/", dependencies: Set()
  }

  action init = all {
    models' = Set(userModel, orderModel),
    controllers' = Set(userController, orderController),
  }

  action step = all { models' = models, controllers' = controllers }

  /// Controllers reference valid models.
  run validModelRefsTest = {
    init.then(all {
      assert(controllers.forall(c => models.exists(m => m.name == c.model))),
      models' = models, controllers' = controllers,
    })
  }

  /// All controllers have CURED operations.
  run curedOpsTest = {
    init.then(all {
      assert(controllers.forall(c =>
        Set("create", "update", "retrieve", "retrieve_many", "delete").subseteq(c.operations))),
      models' = models, controllers' = controllers,
    })
  }

  /// Validate operation is present on all controllers.
  run validatePresentTest = {
    init.then(all {
      assert(controllers.forall(c => c.operations.contains("validate"))),
      models' = models, controllers' = controllers,
    })
  }

  /// Root controllers have StandardCURED pattern.
  run rootPatternTest = {
    init.then(all {
      assert(userController.pattern == "StandardCURED"),
      assert(not(userModel.hasParentRelationship)),
      models' = models, controllers' = controllers,
    })
  }

  /// Child controllers have ParentScopedCURED pattern.
  run childPatternTest = {
    init.then(all {
      assert(orderController.pattern == "ParentScopedCURED"),
      assert(orderController.parentModel == "User"),
      models' = models, controllers' = controllers,
    })
  }

}
