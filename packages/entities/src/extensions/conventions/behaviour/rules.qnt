// Conventions Entity — Transformation Rules (Meta-Circular)
// Specifies how convention definitions are processed and registered.

module conventionRules {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var conventions: Set[ConventionDefinition]
  var registeredConventions: Set[ConventionDefinition]

  // ─── Registration Rules ────────────────────────────────────────────

  /// Every convention definition registers with its target domain.
  action registerConvention(c: ConventionDefinition): bool = all {
    Set("specly", "quint").contains(c.domain),
    registeredConventions' = registeredConventions.union(Set(c)),
    conventions' = conventions,
  }

  // ─── Composition Rules ─────────────────────────────────────────────

  /// No two conventions from different domains share the same name
  /// (cross-domain uniqueness).
  val crossDomainNamesDistinct: bool =
    conventions.forall(c1 => conventions.forall(c2 =>
      (c1 != c2 and c1.name == c2.name) implies (c1.domain != c2.domain)))

  // ─── Properties ────────────────────────────────────────────────────
  // Registration is monotonic — enforced by .union() in actions.

}
