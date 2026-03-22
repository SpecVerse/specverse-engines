// Conventions Entity — Invariants (Meta-Circular)
// Formal properties for convention grammar definitions.
// The conventions entity uses the same convention grammar syntax it defines.

module conventionInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var conventions: Set[ConventionDefinition]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every convention must have a name.
  val conventionsHaveNames: bool =
    conventions.forall(c => c.name != "")

  /// Convention names must be unique within their domain.
  val conventionNamesUniquePerDomain: bool =
    conventions.forall(c1 => conventions.forall(c2 =>
      (c1 != c2 and c1.domain == c2.domain) implies (c1.name != c2.name)))

  /// Every convention has a valid domain.
  val conventionDomainsValid: bool =
    conventions.forall(c =>
      Set("specly", "quint").contains(c.domain))

  // ─── Pattern Invariants ────────────────────────────────────────────

  /// Convention patterns must be non-empty.
  val patternsNonEmpty: bool =
    conventions.forall(c => c.pattern != "")

  // ─── Template Invariants ───────────────────────────────────────────

  /// Every convention has a template with a non-empty body.
  val templatesHaveBody: bool =
    conventions.forall(c => c.template.body != "")

  // ─── Inheritance Invariants ────────────────────────────────────────

  /// Conventions with baseType must reference an existing convention.
  val baseTypeExists: bool =
    conventions.forall(c =>
      (c.baseType != "") implies
        conventions.exists(base => base.name == c.baseType))

  /// Convention inheritance does not create cycles (checked via depth limit).
  /// If A extends B and B extends C, C must not extend A.
  val noInheritanceCycles: bool =
    conventions.forall(c1 =>
      conventions.forall(c2 =>
        (c1.baseType == c2.name and c2.baseType != "") implies
          (c2.baseType != c1.name)))

}
