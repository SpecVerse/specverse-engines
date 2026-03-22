// Models Entity — Invariants
// Formal properties that must hold for all model specifications.
// The TypeScript inference engine is the implementation;
// these Quint invariants are the specification it must satisfy.

module modelInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var inferredControllers: Set[Controller]
  var inferredServices: Set[Service]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every model must have at least one attribute.
  val modelsHaveAttributes: bool =
    models.forall(m => m.attributes.keys().size() > 0)

  /// Every model must have a unique name within its component.
  val modelNamesUnique: bool =
    models.forall(m1 => models.forall(m2 =>
      (m1 != m2) implies (m1.name != m2.name)))

  /// Every model has an 'id' attribute (convention-processed).
  val modelsHaveId: bool =
    models.forall(m => m.attributes.keys().contains("id"))

  // ─── Relationship Invariants ───────────────────────────────────────

  /// Relationship targets must reference existing models.
  val relationshipTargetsExist: bool =
    models.forall(m =>
      m.relationships.keys().forall(k =>
        models.exists(target => target.name == m.relationships.get(k).targetModel)))

  /// No self-referential belongsTo relationships.
  val noBelongsToSelf: bool =
    models.forall(m =>
      m.relationships.keys().forall(k => {
        val rel = m.relationships.get(k)
        (rel.relType == "belongsTo") implies (rel.targetModel != m.name)
      }))

  // ─── Lifecycle Invariants ──────────────────────────────────────────

  /// Lifecycle states must be non-empty if a lifecycle is defined.
  val lifecycleStatesNonEmpty: bool =
    models.forall(m =>
      m.hasLifecycle implies m.lifecycle.states.size() > 0)

  /// Lifecycle must have an initial state.
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

  /// Every non-initial state is reachable via at least one transition.
  val lifecycleReachability: bool =
    models.forall(m =>
      m.hasLifecycle implies
        m.lifecycle.states.forall(s =>
          s.isInitial or
          m.lifecycle.transitions.exists(t => t.to == s.name)))

  // ─── Profile Invariants ────────────────────────────────────────────

  /// Profile names must be unique per model.
  val profileNamesUnique: bool =
    models.forall(m =>
      m.profiles.forall(p1 => m.profiles.forall(p2 =>
        (p1 != p2) implies (p1.name != p2.name))))

  // ─── Inference Output Invariants ───────────────────────────────────

  /// Every model produces exactly one controller.
  val everyModelGetsController: bool =
    models.forall(m =>
      inferredControllers.exists(c => c.model == m.name))

  /// Models with complex lifecycles produce a lifecycle service.
  val lifecycleModelsGetService: bool =
    models.forall(m =>
      (m.hasLifecycle and m.lifecycle.transitions.size() > 2) implies
        inferredServices.exists(s =>
          s.model == m.name and s.pattern == "LifecycleService"))

  /// Models with manyToMany relationships get association operations.
  val manyToManyGetsAssociationOps: bool =
    models.forall(m =>
      m.relationships.keys().exists(k =>
        m.relationships.get(k).relType == "manyToMany") implies
        inferredControllers.exists(c =>
          c.model == m.name and c.hasAssociationOps))

}
