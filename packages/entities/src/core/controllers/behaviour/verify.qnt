// Controllers Entity — Verification Module
// Verifies structural invariants hold for generated controllers.

module controllerVerify {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  var models: Set[Model]
  var controllers: Set[Controller]

  // ─── Sample Data ─────────────────────────────────────────────────

  val emptyLifecycle: Lifecycle = {
    name: "", states: Set(), transitions: Set()
  }

  val userModel: Model = {
    name: "User",
    attributes: Map(
      "id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false },
      "email" -> { name: "email", attrType: "String", required: true, hasConstraints: true }
    ),
    relationships: Map(),
    hasLifecycle: false, lifecycle: emptyLifecycle,
    profiles: Set(), hasParentRelationship: false, parentModel: "",
    hasExternalIntegration: false, hasValidationConstraints: false
  }

  val orderModel: Model = {
    name: "Order",
    attributes: Map(
      "id" -> { name: "id", attrType: "UUID", required: true, hasConstraints: false }
    ),
    relationships: Map(
      "user" -> { name: "user", relType: "belongsTo", targetModel: "User" }
    ),
    hasLifecycle: false, lifecycle: emptyLifecycle,
    profiles: Set(), hasParentRelationship: true, parentModel: "User",
    hasExternalIntegration: false, hasValidationConstraints: false
  }

  // ─── Init (with pre-generated controllers) ───────────────────────

  action init = all {
    models' = Set(userModel, orderModel),
    controllers' = Set(
      {
        name: "User", model: "User", component: "", pattern: "StandardCURED",
        parentModel: "",
        operations: Set("create", "update", "retrieve", "retrieve_many", "validate", "evolve", "delete"),
        endpoints: Set(), hasAssociationOps: false, manyToManyTargets: Set(),
        path: "/api/", dependencies: Set()
      },
      {
        name: "Order", model: "Order", component: "", pattern: "ParentScopedCURED",
        parentModel: "User",
        operations: Set("create", "update", "retrieve", "retrieve_many", "validate", "evolve", "delete"),
        endpoints: Set(), hasAssociationOps: false, manyToManyTargets: Set(),
        path: "/api/", dependencies: Set()
      }
    ),
  }

  action step = all {
    models' = models,
    controllers' = controllers,
  }

  // ─── Invariants ──────────────────────────────────────────────────

  val controllersReferenceValidModel: bool =
    controllers.forall(c => models.exists(m => m.name == c.model))

  val controllerNamesUnique: bool =
    controllers.forall(c1 => controllers.forall(c2 =>
      (c1 != c2) implies (c1.name != c2.name)))

  val controllerHasCuredOps: bool =
    controllers.forall(c =>
      Set("create", "update", "retrieve", "retrieve_many", "delete")
        .subseteq(c.operations))

  val validateAlwaysPresent: bool =
    controllers.forall(c => c.operations.contains("validate"))

  val rootControllerPaths: bool =
    controllers.forall(c =>
      (c.pattern == "StandardCURED") implies c.path != "")

}
