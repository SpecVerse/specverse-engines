// Events Entity — Invariants
// Formal properties that must hold for all event specifications.

module eventInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var events: Set[Event]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every event must have a name.
  val eventsHaveNames: bool =
    events.forall(e => e.name != "")

  /// Event names must be unique within the component.
  val eventNamesUnique: bool =
    events.forall(e1 => events.forall(e2 =>
      (e1 != e2) implies (e1.name != e2.name)))

  /// Every event must have at least one attribute.
  val eventsHaveAttributes: bool =
    events.forall(e => e.attributes.keys().size() > 0)

  /// Every event must have a timestamp attribute.
  val eventsHaveTimestamp: bool =
    events.forall(e =>
      e.attributes.keys().contains("timestamp"))

  // ─── Pattern Coverage Invariants ───────────────────────────────────

  /// Every model gets standard CRUD events (unconditional).
  val everyModelGetsCrudEvents: bool =
    models.forall(m =>
      events.exists(e => e.model == m.name and e.pattern == "StandardEvents"))

  /// Models with relationships get relationship events.
  val relationshipModelsGetRelEvents: bool =
    models.forall(m =>
      (m.relationships.keys().size() > 0) implies
        events.exists(e => e.model == m.name and e.pattern == "RelationshipEvents"))

  /// Models with lifecycles get lifecycle transition events.
  val lifecycleModelsGetLifecycleEvents: bool =
    models.forall(m =>
      (m.hasLifecycle and m.lifecycle.transitions.size() > 0) implies
        events.exists(e => e.model == m.name and e.pattern == "LifecycleEvents"))

  /// Models with validation constraints get validation events.
  val constrainedModelsGetValidationEvents: bool =
    models.forall(m =>
      m.hasValidationConstraints implies
        events.exists(e => e.model == m.name and e.pattern == "ValidationEvents"))

  /// Models with profiles get profile events.
  val profileModelsGetProfileEvents: bool =
    models.forall(m =>
      (m.profiles.size() > 0) implies
        events.exists(e => e.model == m.name and e.pattern == "ProfileEvents"))

  // ─── Lifecycle Event Invariants ────────────────────────────────────

  /// Lifecycle events include fromState and toState attributes.
  val lifecycleEventsHaveStateAttrs: bool =
    events.forall(e =>
      (e.pattern == "LifecycleEvents") implies (
        e.attributes.keys().contains("fromState") and
        e.attributes.keys().contains("toState")))

}
