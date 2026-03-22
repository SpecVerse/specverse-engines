// Views Entity — Invariants
// Formal properties that must hold for all view specifications.

module viewInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var controllers: Set[Controller]
  var events: Set[Event]
  var views: Set[View]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every view must reference at least one model that exists.
  val viewsReferenceValidModels: bool =
    views.forall(v =>
      v.models.size() > 0 and
      v.models.forall(modelName =>
        models.exists(m => m.name == modelName)))

  /// View names must be unique within the component.
  val viewNamesUnique: bool =
    views.forall(v1 => views.forall(v2 =>
      (v1 != v2) implies (v1.name != v2.name)))

  /// Every view has a valid type.
  val viewTypesValid: bool =
    views.forall(v =>
      Set("list", "detail", "form", "dashboard", "master_detail")
        .contains(v.viewType))

  // ─── Event Subscription Invariants ─────────────────────────────────

  /// Views only subscribe to events that exist.
  val viewsSubscribeToValidEvents: bool =
    views.forall(v =>
      v.subscribes.forall(eventName =>
        events.exists(e => e.name == eventName)))

  // ─── UI Component Invariants ───────────────────────────────────────

  /// Every view has at least one UI component.
  val viewsHaveComponents: bool =
    views.forall(v => v.uiComponents.size() > 0)

  // ─── Disabled Rules Produce Nothing ────────────────────────────────

  /// Disabled view patterns are never generated.
  val disabledPatternsAbsent: bool =
    views.forall(v =>
      v.pattern != "EnhancedListView" and
      v.pattern != "MasterDetailView" and
      v.pattern != "AnalyticsView" and
      v.pattern != "WorkflowView")

  // ─── Profile View Invariants ───────────────────────────────────────

  /// Models with profiles get a profile-aware form view.
  val profileModelsGetProfileForm: bool =
    models.forall(m =>
      (m.profiles.size() > 0) implies
        views.exists(v =>
          v.primaryModel == m.name and
          v.viewType == "form" and
          v.hasProfileSupport))

}
