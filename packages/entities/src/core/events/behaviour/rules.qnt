// Events Entity — Transformation Rules
// Specifies how event inference rules fire based on model characteristics.

module eventRules {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var events: Set[Event]

  // ─── Standard CRUD Events (priority 100, condition: true) ──────────

  /// Every model unconditionally gets standard CRUD events.
  action generateStandardEvents(m: Model): bool = all {
    val emptyAttrs: str -> Attribute = Map()
    events' = events.union(Set(
      { name: m.name, model: m.name, pattern: "StandardEvents", attributes: emptyAttrs }
    )),
    models' = models,
  }

  // ─── Relationship Events (priority 90) ─────────────────────────────

  /// Models with any relationships get relationship-specific events.
  action generateRelationshipEvents(m: Model): bool = all {
    m.relationships.keys().size() > 0,
    val emptyAttrs: str -> Attribute = Map()
    events' = events.union(Set(
      { name: m.name, model: m.name, pattern: "RelationshipEvents", attributes: emptyAttrs }
    )),
    models' = models,
  }

  // ─── Lifecycle Events (priority 85) ────────────────────────────────

  /// Models with lifecycle transitions get lifecycle events.
  action generateLifecycleEvents(m: Model): bool = all {
    m.hasLifecycle,
    m.lifecycle.transitions.size() > 0,
    val emptyAttrs: str -> Attribute = Map()
    events' = events.union(Set(
      { name: m.name, model: m.name, pattern: "LifecycleEvents", attributes: emptyAttrs }
    )),
    models' = models,
  }

  // ─── Validation Events (priority 80) ───────────────────────────────

  /// Models with validation constraints or parent relationships get validation events.
  action generateValidationEvents(m: Model): bool = all {
    m.hasValidationConstraints or m.hasParentRelationship,
    val emptyAttrs: str -> Attribute = Map()
    events' = events.union(Set(
      { name: m.name, model: m.name, pattern: "ValidationEvents", attributes: emptyAttrs }
    )),
    models' = models,
  }

  // ─── Profile Events (priority 75) ──────────────────────────────────

  /// Models with profiles get profile attachment events.
  action generateProfileEvents(m: Model): bool = all {
    m.profiles.size() > 0,
    val emptyAttrs: str -> Attribute = Map()
    events' = events.union(Set(
      { name: m.name, model: m.name, pattern: "ProfileEvents", attributes: emptyAttrs }
    )),
    models' = models,
  }

  // ─── Monotonicity ──────────────────────────────────────────────────
  // Event generation only adds, never removes — enforced by .union() in actions.

}
