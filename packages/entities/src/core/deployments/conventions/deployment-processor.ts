import { AbstractProcessor } from '@specverse/types';
import { DeploymentSpec, InstancesSpec, ControllerInstanceSpec, ServiceInstanceSpec, ViewInstanceSpec, CommunicationInstanceSpec, StorageInstanceSpec, SecurityInstanceSpec, InfrastructureInstanceSpec, MonitoringInstanceSpec } from '@specverse/types';

export class DeploymentProcessor extends AbstractProcessor<any, DeploymentSpec[]> {
  process(deploymentsData: any): DeploymentSpec[] {
    const deployments: DeploymentSpec[] = [];

    for (const [deploymentName, deploymentData] of Object.entries(deploymentsData)) {
      deployments.push(this.processDeployment(deploymentName, deploymentData as any));
    }

    return deployments;
  }

  private processDeployment(deploymentName: string, deploymentData: any): DeploymentSpec {
    const validProperties = ['version', 'description', 'environment', 'instances'];

    const unknownProperties = Object.keys(deploymentData).filter(
      key => !validProperties.includes(key)
    );

    if (unknownProperties.length > 0) {
      this.addWarning(
        `Deployment '${deploymentName}' contains unknown properties that will be preserved for validation: ${unknownProperties.join(', ')}`
      );
    }

    let processedInstances = deploymentData.instances;
    if (deploymentData.instances) {
      processedInstances = this.processInstances(deploymentData.instances);
    }

    return {
      name: deploymentName,
      namespace: deploymentName,
      version: deploymentData.version,
      description: deploymentData.description,
      environment: deploymentData.environment,
      instances: processedInstances,
      ...Object.fromEntries(
        Object.entries(deploymentData).filter(([key]) => !validProperties.includes(key))
      )
    } as DeploymentSpec;
  }

  private processInstances(instancesData: any): InstancesSpec {
    const result: InstancesSpec = {};

    if (instancesData.controllers) {
      result.controllers = {};
      for (const [instanceName, instanceData] of Object.entries(instancesData.controllers)) {
        result.controllers[instanceName] = this.processControllerInstance(
          instanceName,
          instanceData as any
        );
      }
    }

    if (instancesData.services) {
      result.services = {};
      for (const [instanceName, instanceData] of Object.entries(instancesData.services)) {
        result.services[instanceName] = this.processServiceInstance(
          instanceName,
          instanceData as any
        );
      }
    }

    if (instancesData.views) {
      result.views = {};
      for (const [instanceName, instanceData] of Object.entries(instancesData.views)) {
        result.views[instanceName] = this.processViewInstance(
          instanceName,
          instanceData as any
        );
      }
    }

    if (instancesData.communications) {
      result.communications = {};
      for (const [instanceName, instanceData] of Object.entries(instancesData.communications)) {
        result.communications[instanceName] = this.processCommunicationInstance(
          instanceName,
          instanceData as any
        );
      }
    }

    if (instancesData.storage) {
      result.storage = {};
      for (const [instanceName, instanceData] of Object.entries(instancesData.storage)) {
        result.storage[instanceName] = this.processStorageInstance(
          instanceName,
          instanceData as any
        );
      }
    }

    if (instancesData.security) {
      result.security = {};
      for (const [instanceName, instanceData] of Object.entries(instancesData.security)) {
        result.security[instanceName] = this.processSecurityInstance(
          instanceName,
          instanceData as any
        );
      }
    }

    if (instancesData.infrastructure) {
      result.infrastructure = {};
      for (const [instanceName, instanceData] of Object.entries(instancesData.infrastructure)) {
        result.infrastructure[instanceName] = this.processInfrastructureInstance(
          instanceName,
          instanceData as any
        );
      }
    }

    if (instancesData.monitoring) {
      result.monitoring = {};
      for (const [instanceName, instanceData] of Object.entries(instancesData.monitoring)) {
        result.monitoring[instanceName] = this.processMonitoringInstance(
          instanceName,
          instanceData as any
        );
      }
    }

    return result;
  }

  private processControllerInstance(instanceName: string, instanceData: any): ControllerInstanceSpec {
    const result: ControllerInstanceSpec = {
      component: instanceData.component,
      namespace: instanceData.namespace,
      scale: instanceData.scale || 1,
      // New properties
      rateLimit: instanceData.rateLimit,
      timeout: instanceData.timeout,
      operations: instanceData.operations,
      resources: instanceData.resources,
      autoscaling: instanceData.autoscaling
    };

    if (instanceData.advertises) {
      result.advertises = this.expandCapabilities(instanceData.advertises, 'controller', instanceData.component);
    }

    if (instanceData.uses) {
      result.uses = this.expandCapabilities(instanceData.uses, 'consumer', instanceData.component);
    }

    return result;
  }

  private processServiceInstance(instanceName: string, instanceData: any): ServiceInstanceSpec {
    const result: ServiceInstanceSpec = {
      component: instanceData.component,
      namespace: instanceData.namespace,
      scale: instanceData.scale || 1,
      // New properties
      operations: instanceData.operations,
      resources: instanceData.resources,
      autoscaling: instanceData.autoscaling,
      security: instanceData.security,
      caching: instanceData.caching
    };

    if (instanceData.advertises) {
      result.advertises = this.expandCapabilities(instanceData.advertises, 'service', instanceData.component);
    }

    if (instanceData.uses) {
      result.uses = this.expandCapabilities(instanceData.uses, 'consumer', instanceData.component);
    }

    return result;
  }

  private processViewInstance(instanceName: string, instanceData: any): ViewInstanceSpec {
    const result: ViewInstanceSpec = {
      component: instanceData.component,
      namespace: instanceData.namespace,
      scale: instanceData.scale || 1,
      // New properties
      caching: instanceData.caching,
      prefetch: instanceData.prefetch
    };

    if (instanceData.uses) {
      result.uses = this.expandCapabilities(instanceData.uses, 'consumer', instanceData.component);
    }

    return result;
  }

  private processCommunicationInstance(instanceName: string, instanceData: any): CommunicationInstanceSpec {
    return {
      namespace: instanceData.namespace,
      capabilities: instanceData.capabilities || [],
      type: instanceData.type || 'pubsub',
      // New properties
      events: instanceData.events,
      consumer: instanceData.consumer
    };
  }

  private processStorageInstance(instanceName: string, instanceData: any): StorageInstanceSpec {
    const result: StorageInstanceSpec = {
      component: instanceData.component,
      namespace: instanceData.namespace,
      type: instanceData.type,
      scale: instanceData.scale || 1,
      // v3.5.0: Logical properties at root level
      persistence: instanceData.persistence,
      consistency: instanceData.consistency,
      encryption: instanceData.encryption,
      backup: instanceData.backup,
      replication: instanceData.replication
    };

    if (instanceData.uses) {
      result.uses = this.expandCapabilities(instanceData.uses, 'service', instanceData.component);
    }

    if (instanceData.advertises) {
      result.advertises = this.expandCapabilities(instanceData.advertises, 'service', instanceData.component);
    }

    return result;
  }

  private processSecurityInstance(instanceName: string, instanceData: any): SecurityInstanceSpec {
    const result: SecurityInstanceSpec = {
      component: instanceData.component,
      namespace: instanceData.namespace,
      type: instanceData.type,
      scale: instanceData.scale || 1,
      // v3.5.0: Logical properties at root level
      scope: instanceData.scope,
      policies: instanceData.policies,
      encryption: instanceData.encryption,
      auditLevel: instanceData.auditLevel
    };

    if (instanceData.advertises) {
      result.advertises = this.expandCapabilities(instanceData.advertises, 'service', instanceData.component);
    }

    if (instanceData.uses) {
      result.uses = this.expandCapabilities(instanceData.uses, 'consumer', instanceData.component);
    }

    return result;
  }

  private processInfrastructureInstance(instanceName: string, instanceData: any): InfrastructureInstanceSpec {
    const result: InfrastructureInstanceSpec = {
      component: instanceData.component,
      namespace: instanceData.namespace,
      type: instanceData.type,
      scale: instanceData.scale || 1,
      // v3.5.0: Logical properties at root level
      redundancy: instanceData.redundancy,
      healthCheck: instanceData.healthCheck,
      loadBalancing: instanceData.loadBalancing
    };

    if (instanceData.advertises) {
      result.advertises = this.expandCapabilities(instanceData.advertises, 'service', instanceData.component);
    }

    if (instanceData.uses) {
      result.uses = this.expandCapabilities(instanceData.uses, 'consumer', instanceData.component);
    }

    return result;
  }

  private processMonitoringInstance(instanceName: string, instanceData: any): MonitoringInstanceSpec {
    const result: MonitoringInstanceSpec = {
      component: instanceData.component,
      namespace: instanceData.namespace,
      type: instanceData.type,
      scale: instanceData.scale || 1,
      // v3.5.0: Logical properties at root level
      scope: instanceData.scope,
      retention: instanceData.retention,
      alerting: instanceData.alerting,
      sampling: instanceData.sampling
    };

    if (instanceData.advertises) {
      result.advertises = this.expandCapabilities(instanceData.advertises, 'service', instanceData.component);
    }

    if (instanceData.uses) {
      result.uses = this.expandCapabilities(instanceData.uses, 'consumer', instanceData.component);
    }

    return result;
  }

  private expandCapabilities(
    capabilities: string | string[],
    role: 'controller' | 'service' | 'consumer',
    componentName?: string
  ): string[] {
    const capList = Array.isArray(capabilities) ? capabilities : [capabilities];
    const expanded: string[] = [];

    for (const cap of capList) {
      if (cap === '*') {
        expanded.push(...this.expandWildcardCapability(role, componentName));
      } else if (cap.endsWith('.*')) {
        expanded.push(...this.expandPatternCapability(cap, role, componentName));
      } else {
        expanded.push(cap);
      }
    }

    return [...new Set(expanded)];
  }

  private expandWildcardCapability(role: 'controller' | 'service' | 'consumer', componentName?: string): string[] {
    switch (role) {
      case 'controller':
        return ['behaviors.*', 'actions.*', 'events.*'];
      case 'service':
        return ['operations.*', 'events.*'];
      case 'consumer':
        return ['models.*'];
      default:
        return [];
    }
  }

  private expandPatternCapability(pattern: string, role: 'controller' | 'service' | 'consumer', componentName?: string): string[] {
    const prefix = pattern.replace('.*', '');

    if (prefix === 'behaviors') {
      return ['behaviors.create', 'behaviors.update', 'behaviors.delete'];
    } else if (prefix === 'operations') {
      return ['operations.process', 'operations.validate', 'operations.transform'];
    } else if (prefix === 'events') {
      return ['events.created', 'events.updated', 'events.deleted'];
    } else if (prefix === 'models') {
      return ['models.create', 'models.read', 'models.update', 'models.delete'];
    } else {
      return [`${prefix}.create`, `${prefix}.read`, `${prefix}.update`, `${prefix}.delete`];
    }
  }
}
