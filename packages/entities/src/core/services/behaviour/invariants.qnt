// Services Entity — Invariants
// Formal properties that must hold for all service specifications.

module serviceInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var services: Set[Service]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every service must reference a model that exists.
  val servicesReferenceValidModel: bool =
    services.forall(s =>
      models.exists(m => m.name == s.model))

  /// Service names must be unique within the component.
  val serviceNamesUnique: bool =
    services.forall(s1 => services.forall(s2 =>
      (s1 != s2) implies (s1.name != s2.name)))

  /// Every service has at least one operation.
  val servicesHaveOperations: bool =
    services.forall(s => s.operations.size() > 0)

  // ─── Unified Validation Invariant (v3.3) ───────────────────────────

  /// Every service has exactly ONE validate method.
  val unifiedValidateMethod: bool =
    services.forall(s =>
      s.operations.filter(op => op.name == "validate").size() == 1)

  /// The validate method accepts an operation context.
  val validateAcceptsContext: bool =
    services.forall(s =>
      s.operations.forall(op =>
        (op.name == "validate") implies op.acceptsOperationContext))

  /// Mutation operations internally call validate().
  val mutationsCallValidate: bool =
    services.forall(s =>
      s.operations.forall(op =>
        Set("create", "update", "evolve").contains(op.name) implies
          op.callsValidateInternally))

  // ─── Pattern-Specific Invariants ───────────────────────────────────

  /// LifecycleService exists only when the model has >2 transitions.
  val lifecycleServiceCondition: bool =
    services.forall(s =>
      (s.pattern == "LifecycleService") implies
        models.exists(m =>
          m.name == s.model and
          m.hasLifecycle and
          m.lifecycle.transitions.size() > 2))

  /// LifecycleService always has the required operations.
  val lifecycleServiceOps: bool =
    services.forall(s =>
      (s.pattern == "LifecycleService") implies
        Set("transition", "getState", "getHistory", "getAvailableTransitions")
          .forall(opName => s.operations.exists(op => op.name == opName)))

  /// RelationshipService exists only for complex relationship models.
  val relationshipServiceCondition: bool =
    services.forall(s =>
      (s.pattern == "RelationshipService") implies
        models.exists(m =>
          m.name == s.model and
          m.relationships.keys().exists(k =>
            m.relationships.get(k).relType == "manyToMany")))

  // ─── Deprecated Pattern Invariants ─────────────────────────────────

  /// ProcessingService is deprecated. Must never be generated.
  val noProcessingService: bool =
    services.forall(s => s.pattern != "ProcessingService")

  /// ValidationService is deprecated. Must never be generated.
  val noValidationService: bool =
    services.forall(s => s.pattern != "ValidationService")

}
