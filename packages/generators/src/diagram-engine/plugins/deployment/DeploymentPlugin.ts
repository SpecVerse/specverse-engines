/**
 * DeploymentPlugin - Deployment topology and capability flow diagrams
 *
 * Supports:
 * - deployment-topology: Full deployment instance visualization
 * - capability-flow: Capability provider/consumer relationships
 * - environment-comparison: Multi-environment comparison (future)
 */

import { BaseDiagramPlugin } from '../../core/BaseDiagramPlugin.js';
import {
  DiagramType,
  DiagramContext,
  MermaidDiagram,
  ValidationResult
} from '../../types/index.js';
import { SpecVerseAST } from '@specverse/types';

interface DeploymentInstance {
  namespace?: string;
  scale?: number;
  component?: string;
  advertises?: string | string[];
  uses?: string[];
  capabilities?: string[];
  type?: string;
}

export class DeploymentPlugin extends BaseDiagramPlugin {
  name = 'deployment-plugin';
  version = '1.0.0';
  description = 'Deployment topology and capability flow diagrams';
  supportedTypes: DiagramType[] = ['deployment-topology', 'capability-flow'];

  /**
   * Generate diagram based on type
   */
  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    this.validateType(type);

    switch (type) {
      case 'deployment-topology':
        return this.generateDeploymentTopology(context);
      case 'capability-flow':
        return this.generateCapabilityFlow(context);
      default:
        throw new Error(`Unsupported diagram type: ${type}`);
    }
  }

  /**
   * Validate AST for deployment diagram generation
   */
  validate(ast: SpecVerseAST): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for deployments
    const deployments = (ast as any).deployments;
    if (!deployments || Object.keys(deployments).length === 0) {
      errors.push('No deployments found - deployment diagrams require deployment specifications');
    } else {
      // Check for instances
      let hasInstances = false;
      Object.values(deployments).forEach((deployment: any) => {
        if (deployment.instances && Object.keys(deployment.instances).length > 0) {
          hasInstances = true;
        }
      });

      if (!hasInstances) {
        warnings.push('No instances found in deployments - diagram will be empty');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate deployment topology diagram
   */
  private generateDeploymentTopology(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'TB');
    diagram.title = context.options.title || 'Deployment Topology';

    const deployments = (context.ast as any).deployments;
    if (!deployments || Object.keys(deployments).length === 0) {
      // Create empty state node
      const emptyNode = {
        id: 'NoDeployments',
        label: 'No Deployment Specifications Available',
        type: 'deployment' as const,
        color: '#f9f',
        shape: 'rounded' as const
      };
      diagram.nodes.push(emptyNode);
      context.nodes.set('NoDeployments', emptyNode);
      return diagram;
    }

    // Process each deployment
    Object.entries(deployments).forEach(([deploymentName, deployment]: [string, any]) => {
      const instances = deployment.instances || {};

      // Communication Channels subgraph
      if (instances.communications && Object.keys(instances.communications).length > 0) {
        const commNodes: string[] = [];

        Object.entries(instances.communications).forEach(([channelName, channel]: [string, any]) => {
          commNodes.push(channelName);

          const capabilities = Array.isArray(channel.capabilities) ? channel.capabilities : [];
          const channelType = channel.type || 'pubsub';
          const namespace = channel.namespace || 'global';

          const node = {
            id: channelName,
            label: `${channelName}<br>📡 ${channelType}<br>🌐 ${namespace}<br>📋 ${capabilities.length} capabilities`,
            type: 'deployment' as const,
            color: context.theme.colors.deployment,
            shape: 'stadium' as const,
            metadata: { capabilities, channelType, namespace }
          };
          diagram.nodes.push(node);
          context.nodes.set(channelName, node);

          // Add capability detail node if requested
          if (context.options.includeCapabilities !== false && capabilities.length > 0) {
            const capNodeId = `${channelName}_caps`;
            const topCaps = capabilities.slice(0, 3);
            const moreText = capabilities.length > 3 ? `<br>+${capabilities.length - 3} more` : '';

            const capNode = {
              id: capNodeId,
              label: topCaps.join('<br>') + moreText,
              type: 'deployment' as const,
              color: '#f3e5f5',
              shape: 'rounded' as const,
              metadata: { isCapabilityDetail: true }
            };
            diagram.nodes.push(capNode);
            context.nodes.set(capNodeId, capNode);

            diagram.edges.push({
              from: channelName,
              to: capNodeId,
              type: 'dotted',
              arrow: 'single'
            });
          }
        });

        diagram.subgraphs.push({
          id: 'communication_channels',
          label: 'Communication Channels',
          nodes: commNodes
        });
      }

      // Controller Instances subgraph
      if (instances.controllers && Object.keys(instances.controllers).length > 0) {
        const controllerNodes: string[] = [];

        Object.entries(instances.controllers).forEach(([instanceName, instance]: [string, any]) => {
          controllerNodes.push(instanceName);
          this.addInstanceNode(diagram, context, instanceName, instance as DeploymentInstance, '🎮', 'controller');
        });

        diagram.subgraphs.push({
          id: 'controller_instances',
          label: 'Controller Instances',
          nodes: controllerNodes
        });
      }

      // Service Instances subgraph
      if (instances.services && Object.keys(instances.services).length > 0) {
        const serviceNodes: string[] = [];

        Object.entries(instances.services).forEach(([instanceName, instance]: [string, any]) => {
          serviceNodes.push(instanceName);
          this.addInstanceNode(diagram, context, instanceName, instance as DeploymentInstance, '⚙️', 'service');
        });

        diagram.subgraphs.push({
          id: 'service_instances',
          label: 'Service Instances',
          nodes: serviceNodes
        });
      }

      // View Instances subgraph
      if (instances.views && Object.keys(instances.views).length > 0) {
        const viewNodes: string[] = [];

        Object.entries(instances.views).forEach(([instanceName, instance]: [string, any]) => {
          viewNodes.push(instanceName);
          this.addInstanceNode(diagram, context, instanceName, instance as DeploymentInstance, '👁️', 'view');
        });

        diagram.subgraphs.push({
          id: 'view_instances',
          label: 'View Instances',
          nodes: viewNodes
        });
      }

      // Add communication connections
      if (instances.communications && Object.keys(instances.communications).length > 0) {
        Object.keys(instances.communications).forEach(channelName => {
          ['controllers', 'services', 'views'].forEach(instanceType => {
            if (instances[instanceType]) {
              Object.keys(instances[instanceType]).forEach(instanceName => {
                diagram.edges.push({
                  from: instanceName,
                  to: channelName,
                  label: 'communicates via',
                  type: 'dotted',
                  arrow: 'single'
                });
              });
            }
          });
        });
      }
    });

    return diagram;
  }

  /**
   * Generate capability flow diagram
   */
  private generateCapabilityFlow(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'LR');
    diagram.title = context.options.title || 'Capability Flow';

    const deployments = (context.ast as any).deployments;
    if (!deployments || Object.keys(deployments).length === 0) {
      const emptyNode = {
        id: 'NoDeployments',
        label: 'No Deployment Specifications Available',
        type: 'deployment' as const,
        color: '#f9f',
        shape: 'rounded' as const
      };
      diagram.nodes.push(emptyNode);
      context.nodes.set('NoDeployments', emptyNode);
      return diagram;
    }

    const capabilityProviders = new Map<string, string[]>();
    const capabilityConsumers = new Map<string, string[]>();
    const allInstances = new Set<string>();

    // Collect capability providers and consumers
    Object.values(deployments).forEach((deployment: any) => {
      const instances = deployment.instances || {};

      // Process controllers and services (providers and consumers)
      ['controllers', 'services'].forEach(instanceType => {
        if (instances[instanceType]) {
          Object.entries(instances[instanceType]).forEach(([instanceName, instance]: [string, any]) => {
            allInstances.add(instanceName);

            const advertises = Array.isArray(instance.advertises) ? instance.advertises :
                             typeof instance.advertises === 'string' ? [instance.advertises] : [];
            const uses = Array.isArray(instance.uses) ? instance.uses : [];

            // Track what this instance provides
            advertises.forEach(cap => {
              if (!capabilityProviders.has(cap)) {
                capabilityProviders.set(cap, []);
              }
              capabilityProviders.get(cap)!.push(instanceName);
            });

            // Track what this instance consumes
            uses.forEach(cap => {
              if (!capabilityConsumers.has(cap)) {
                capabilityConsumers.set(cap, []);
              }
              capabilityConsumers.get(cap)!.push(instanceName);
            });
          });
        }
      });

      // Process views (consumers only)
      if (instances.views) {
        Object.entries(instances.views).forEach(([instanceName, instance]: [string, any]) => {
          allInstances.add(instanceName);

          const uses = Array.isArray(instance.uses) ? instance.uses : [];

          // Track what this instance consumes
          uses.forEach(cap => {
            if (!capabilityConsumers.has(cap)) {
              capabilityConsumers.set(cap, []);
            }
            capabilityConsumers.get(cap)!.push(instanceName);
          });
        });
      }
    });

    // Add provider subgraph
    const providers = new Set(Array.from(capabilityProviders.values()).flat());
    if (providers.size > 0) {
      diagram.subgraphs.push({
        id: 'providers',
        label: 'Capability Providers',
        nodes: Array.from(providers)
      });

      providers.forEach(provider => {
        const node = {
          id: provider,
          label: `${provider}<br>(Provider)`,
          type: 'service' as const,
          color: context.theme.colors.service,
          shape: 'rounded' as const
        };
        diagram.nodes.push(node);
        context.nodes.set(provider, node);
      });
    }

    // Add consumer subgraph
    const consumers = new Set(Array.from(capabilityConsumers.values()).flat());
    if (consumers.size > 0) {
      diagram.subgraphs.push({
        id: 'consumers',
        label: 'Capability Consumers',
        nodes: Array.from(consumers)
      });

      consumers.forEach(consumer => {
        const node = {
          id: consumer,
          label: `${consumer}<br>(Consumer)`,
          type: 'controller' as const,
          color: context.theme.colors.controller,
          shape: 'rounded' as const
        };
        diagram.nodes.push(node);
        context.nodes.set(consumer, node);
      });
    }

    // Add capability flow edges
    capabilityProviders.forEach((providerList, capability) => {
      const consumerList = capabilityConsumers.get(capability) || [];

      providerList.forEach(provider => {
        consumerList.forEach(consumer => {
          if (provider !== consumer) {
            diagram.edges.push({
              from: provider,
              to: consumer,
              label: capability,
              type: 'solid',
              arrow: 'single'
            });
          }
        });
      });
    });

    return diagram;
  }

  /**
   * Helper: Add instance node with capability details
   */
  private addInstanceNode(
    diagram: MermaidDiagram,
    context: DiagramContext,
    instanceName: string,
    instance: DeploymentInstance,
    emoji: string,
    type: 'controller' | 'service' | 'view'
  ): void {
    const namespace = instance.namespace || 'default';
    const scale = instance.scale || 1;
    const component = instance.component || 'unknown';

    // Main instance node
    const mainNode = {
      id: instanceName,
      label: `${emoji} ${instanceName}<br>📦 ${component}<br>🏷️ ${namespace}<br>⚖️ scale: ${scale}`,
      type: type,
      color: context.theme.colors[type as keyof typeof context.theme.colors] || context.theme.colors.deployment,
      shape: 'stadium' as const,
      metadata: { namespace, scale, component }
    };
    diagram.nodes.push(mainNode);
    context.nodes.set(instanceName, mainNode);

    // Add advertises detail node if present
    if (context.options.includeCapabilities !== false) {
      const advertises = Array.isArray(instance.advertises) ? instance.advertises :
                        typeof instance.advertises === 'string' ? [instance.advertises] : [];

      if (advertises.length > 0) {
        const advNodeId = `${instanceName}_adv`;
        const topAdv = advertises.slice(0, 2);
        const moreText = advertises.length > 2 ? `<br>+${advertises.length - 2} more` : '';

        const advNode = {
          id: advNodeId,
          label: `📢 Advertises:<br>${topAdv.join('<br>')}${moreText}`,
          type: type,
          color: context.theme.colors[type as keyof typeof context.theme.colors] || context.theme.colors.deployment,
          shape: 'rounded' as const,
          metadata: { isCapabilityDetail: true, capabilities: advertises }
        };
        diagram.nodes.push(advNode);
        context.nodes.set(advNodeId, advNode);

        diagram.edges.push({
          from: instanceName,
          to: advNodeId,
          type: 'dashed',
          arrow: 'single'
        });
      }

      // Add uses detail node if present
      const uses = Array.isArray(instance.uses) ? instance.uses : [];

      if (uses.length > 0) {
        const useNodeId = `${instanceName}_use`;
        const topUses = uses.slice(0, 2);
        const moreText = uses.length > 2 ? `<br>+${uses.length - 2} more` : '';

        const useNode = {
          id: useNodeId,
          label: `🔗 Uses:<br>${topUses.join('<br>')}${moreText}`,
          type: type,
          color: '#fff3e0',
          shape: 'rounded' as const,
          metadata: { isCapabilityDetail: true, capabilities: uses }
        };
        diagram.nodes.push(useNode);
        context.nodes.set(useNodeId, useNode);

        diagram.edges.push({
          from: instanceName,
          to: useNodeId,
          type: 'dotted',
          arrow: 'single'
        });
      }
    }
  }

  /**
   * Get default options for deployment diagrams
   */
  getDefaultOptions() {
    return {
      includeCapabilities: true,
      includeScaling: true,
      title: 'Deployment Topology'
    };
  }
}
