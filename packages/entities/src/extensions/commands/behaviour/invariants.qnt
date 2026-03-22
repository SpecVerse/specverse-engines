// Commands Entity — Invariants
// Formal properties for CLI command specifications.

module commandInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var commands: Set[Command]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every command must have a name.
  val commandsHaveNames: bool =
    commands.forall(c => c.name != "")

  /// Command names must be unique at the same nesting level.
  val commandNamesUnique: bool =
    commands.forall(c1 => commands.forall(c2 =>
      (c1 != c2 and c1.parent == c2.parent) implies (c1.name != c2.name)))

  /// Every command has a description.
  val commandsHaveDescriptions: bool =
    commands.forall(c => c.description != "")

  // ─── Argument Invariants ───────────────────────────────────────────

  /// Argument names must be unique within a command.
  val argumentNamesUnique: bool =
    commands.forall(c =>
      c.arguments.indices().forall(i =>
        c.arguments.indices().forall(j =>
          (i != j) implies (c.arguments[i].name != c.arguments[j].name))))

  // ─── Option Invariants ─────────────────────────────────────────────

  /// Option long names must be unique within a command.
  val optionNamesUnique: bool =
    commands.forall(c =>
      c.options.forall(o1 => c.options.forall(o2 =>
        (o1 != o2) implies (o1.longName != o2.longName))))

  /// Options with defaults are implicitly optional.
  val defaultImpliesOptional: bool =
    commands.forall(c =>
      c.options.forall(o =>
        o.hasDefault implies not(o.required)))

  // ─── Subcommand Invariants ─────────────────────────────────────────

  /// A command is either a group (has subcommands) or a leaf (has action).
  val groupOrLeaf: bool =
    commands.forall(c =>
      (c.subcommands.size() > 0) implies not(c.hasDirectAction))

  /// Subcommand nesting must not exceed 3 levels.
  val maxNestingDepth: bool =
    commands.forall(c => c.depth <= 3)

}
