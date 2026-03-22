// Deployments Entity — Transformation Rules
// How deployment inference generates instances, channels, configurations.

module deploymentRules {

  import specverseTypes.* from "../../../_shared/behaviour/types"

  // ─── State ─────────────────────────────────────────────────────────

  var deploymentInstances: Set[DeploymentInstance]
  var channels: Set[Channel]
  var deployments: Set[Deployment]

  // ─── Instance Generation Rules ─────────────────────────────────────

  /// Rule: controller_instances (priority 100)
  action generateControllerInstances(controllers: Set[Controller], compName: str): bool = all {
    controllers.size() > 0,
    val newInstances = controllers.map(c => {
      name: c.name,
      component: compName,
      namespace: c.model,
      advertises: Set("*"),
      uses: c.dependencies,
      scale: 1,
      category: "controller"
    })
    deploymentInstances' = deploymentInstances.union(newInstances),
    channels' = channels,
    deployments' = deployments,
  }

  /// Rule: service_instances (priority 90)
  action generateServiceInstances(services: Set[Service], compName: str): bool = all {
    services.size() > 0,
    val newInstances = services.map(s => {
      name: s.name,
      component: compName,
      namespace: s.name,
      advertises: Set("operations.*"),
      uses: s.dependencies,
      scale: 1,
      category: "service"
    })
    deploymentInstances' = deploymentInstances.union(newInstances),
    channels' = channels,
    deployments' = deployments,
  }

  // ─── Channel Generation Rules ──────────────────────────────────────

  /// Rule: main_communication_bus (priority 100, condition: true)
  action generateMainBus: bool = all {
    channels' = channels.union(Set({
      name: "mainBus",
      namespace: "global",
      capabilities: Set("*"),
      channelType: "pubsub"
    })),
    deploymentInstances' = deploymentInstances,
    deployments' = deployments,
  }

  // ─── Properties ────────────────────────────────────────────────────
  // Deployment generation is monotonic — enforced by .union() in actions.

}
