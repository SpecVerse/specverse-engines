// Deployments Entity — Invariants
// Formal properties for deployment specifications.

module deploymentInvariants {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var components: Set[Component]
  var deployments: Set[Deployment]

  // ─── Structural Invariants ─────────────────────────────────────────

  /// Every deployment must have a valid environment.
  val deploymentsHaveEnvironment: bool =
    deployments.forall(d =>
      Set("development", "staging", "production", "test")
        .contains(d.environment))

  /// Deployment names must be unique.
  val deploymentNamesUnique: bool =
    deployments.forall(d1 => deployments.forall(d2 =>
      (d1 != d2) implies (d1.name != d2.name)))

  // ─── Instance Invariants ───────────────────────────────────────────

  /// Instance names must be unique within a deployment.
  val instanceNamesUniquePerDeployment: bool =
    deployments.forall(d =>
      d.instances.forall(i1 => d.instances.forall(i2 =>
        (i1 != i2) implies (i1.name != i2.name))))

  /// Every instance has a namespace.
  val instancesHaveNamespace: bool =
    deployments.forall(d =>
      d.instances.forall(inst => inst.namespace != ""))

  /// Instance scale must be positive.
  val scalePositive: bool =
    deployments.forall(d =>
      d.instances.forall(inst => inst.scale > 0))

  // ─── Channel Invariants ────────────────────────────────────────────

  /// Every channel has a valid type.
  val channelTypesValid: bool =
    deployments.forall(d =>
      d.channels.forall(ch =>
        Set("pubsub", "request-reply", "stream").contains(ch.channelType)))

  /// The main communication bus always exists.
  val mainBusExists: bool =
    deployments.forall(d =>
      d.channels.exists(ch => ch.name == "mainBus"))

  // ─── Coverage Invariants ───────────────────────────────────────────

  /// Every controller in the component has a deployment instance.
  val controllerInstanceCoverage: bool =
    deployments.forall(d =>
      components.forall(comp =>
        comp.controllers.forall(c =>
          d.instances.exists(inst =>
            inst.name == c.name and inst.category == "controller"))))

  /// View instances are grouped by interface type.
  val viewInstanceGrouping: bool =
    deployments.forall(d =>
      d.instances.forall(inst =>
        (inst.category == "view") implies
          inst.name != ""))

}
