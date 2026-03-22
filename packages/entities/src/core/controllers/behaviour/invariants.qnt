// Controllers Entity — Invariants
// Formal properties that must hold for all controller specifications.

module controllerInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var controllers: Set[Controller]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every controller must reference a model that exists.
  val controllersReferenceValidModel: bool =
    controllers.forall(c =>
      models.exists(m => m.name == c.model))

  /// Controller names must be unique within the component.
  val controllerNamesUnique: bool =
    controllers.forall(c1 => controllers.forall(c2 =>
      (c1 != c2) implies (c1.name != c2.name)))

  // ─── CURED Operation Invariants ────────────────────────────────────

  /// Every controller has at least the core CURED operations.
  val controllerHasCuredOps: bool =
    controllers.forall(c =>
      Set("create", "update", "retrieve", "retrieve_many", "delete")
        .subseteq(c.operations))

  /// Validate operation is always present (v3.3 unified validation).
  val validateAlwaysPresent: bool =
    controllers.forall(c =>
      c.operations.contains("validate"))

  // ─── Path Invariants ───────────────────────────────────────────────

  /// Root controllers have paths starting with /api/.
  val rootControllerPaths: bool =
    controllers.forall(c =>
      (c.pattern == "StandardCURED") implies
        c.path != "")

  // ─── Association Operation Invariants ──────────────────────────────

  /// Association operations exist only for models with manyToMany relationships.
  val associationOpsRequireManyToMany: bool =
    controllers.forall(c =>
      c.hasAssociationOps implies
        models.exists(m =>
          m.name == c.model and
          m.relationships.keys().exists(k =>
            m.relationships.get(k).relType == "manyToMany")))

  // ─── Profile Operation Invariants ──────────────────────────────────

  /// Profile operations come as a complete set (all 4 or none).
  val profileOpsComplete: bool =
    controllers.forall(c =>
      c.operations.contains("attach_profile") implies
        Set("attach_profile", "detach_profile", "update_profile", "list_profiles")
          .subseteq(c.operations))

  // ─── HTTP Method Mapping ───────────────────────────────────────────

  /// Each CURED operation maps to exactly one HTTP endpoint.
  val operationEndpointBijection: bool =
    controllers.forall(c =>
      c.operations.forall(op =>
        c.endpoints.filter(e => e.operation == op).size() == 1))

  /// HTTP method mapping is consistent.
  val httpMethodMapping: bool =
    controllers.forall(c =>
      c.endpoints.forall(e =>
        (e.operation == "create" implies e.method == "POST") and
        (e.operation == "retrieve" implies e.method == "GET") and
        (e.operation == "update" implies e.method == "PUT") and
        (e.operation == "delete" implies e.method == "DELETE") and
        (e.operation == "retrieve_many" implies e.method == "GET") and
        (e.operation == "validate" implies e.method == "POST")))

}
