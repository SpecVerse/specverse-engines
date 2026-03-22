// Views Entity — Transformation Rules
// Many view rules are currently DISABLED (condition: false).

module viewRules {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var models: Set[Model]
  var views: Set[View]

  // ─── Active Rules ──────────────────────────────────────────────────

  /// Rule: profile_aware_form_view (priority 75, ACTIVE)
  action generateProfileFormView(m: Model): bool = all {
    m.profiles.size() > 0,
    views' = views.union(Set({
      name: m.name,
      viewType: "form",
      primaryModel: m.name,
      models: Set(m.name),
      hasProfileSupport: true,
      subscribes: Set(),
      uiComponents: Set(),
      pattern: "ProfileAwareFormView"
    })),
    models' = models,
  }

  // ─── Properties ────────────────────────────────────────────────────
  // View generation only adds, never removes — enforced by .union() in actions.

}
