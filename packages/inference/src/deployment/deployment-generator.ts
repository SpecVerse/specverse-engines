/**
 * V3.1 Deployment Generator
 * Generates minimal deployment specifications from logical components
 */

import { 
  LogicalComponentSpec,
  LogicalDeploymentSpec,
  InferenceContext,
  ValidationResult,
  InferenceRule
} from '../core/types.js';

export interface DeploymentGenerationResult {
  deployments: Record<string, LogicalDeploymentSpec>;
  rulesUsed: number;
  validation: ValidationResult;
}

export class DeploymentInferenceGenerator {
  private rules: InferenceRule<LogicalComponentSpec, LogicalDeploymentSpec>[] = [];
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  /**
   * Load deployment inference rules
   */
  async loadRules(rules: InferenceRule<LogicalComponentSpec, LogicalDeploymentSpec>[]): Promise<ValidationResult> {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      this.rules = [...rules].sort((a, b) => b.priority - a.priority);
      
      if (this.debug) {
        console.log(`🚀 Loaded ${this.rules.length} deployment rules`);
        this.rules.forEach(rule => {
          console.log(`   - ${rule.name} (priority: ${rule.priority})`);
        });
      }
    } catch (error) {
      validation.errors.push({
        code: 'RULE_LOADING_ERROR',
        message: `Failed to load deployment rules: ${error instanceof Error ? error.message : String(error)}`,
        location: 'DeploymentGenerator.loadRules'
      });
      validation.valid = false;
    }

    return validation;
  }

  /**
   * Generate deployment specifications from logical component
   */
  async generate(
    component: LogicalComponentSpec,
    context: InferenceContext
  ): Promise<DeploymentGenerationResult> {
    const startTime = Date.now();
    const deployments: Record<string, LogicalDeploymentSpec> = {};
    let rulesUsed = 0;

    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Generate instances first
      const instances = await this.generateInstances(component, context);
      rulesUsed += instances.rulesUsed;
      
      // Generate communication channels
      const channels = await this.generateChannels(component, context);

      // Generate complete deployment
      const targetEnvironment = context.environment?.target || 'development';
      const deploymentName = `${this.toKebabCase(component.name)}Deployment`;

      deployments[deploymentName] = {
        version: '3.1.0',
        environment: targetEnvironment,
        description: `Auto-generated minimal deployment for ${component.name}`,
        instances: {
          controllers: instances.controllers,
          services: instances.services,
          views: instances.views,
          communications: channels
        }
      };

      const processingTime = Date.now() - startTime;
      
      if (this.debug) {
        console.log(`🏗️  Generated deployment in ${processingTime}ms`);
        console.log(`   Instances: ${Object.keys(instances.controllers).length + Object.keys(instances.services).length + Object.keys(instances.views).length}`);
        console.log(`   Channels: ${Object.keys(channels).length}`);
        console.log(`   Rules applied: ${rulesUsed}`);
      }

    } catch (error) {
      validation.errors.push({
        code: 'DEPLOYMENT_GENERATION_ERROR',
        message: `Failed to generate deployment: ${error instanceof Error ? error.message : String(error)}`,
        location: 'DeploymentGenerator.generate'
      });
      validation.valid = false;
    }

    return {
      deployments,
      rulesUsed,
      validation
    };
  }

  /**
   * Generate instances from component logical elements
   */
  private async generateInstances(
    component: LogicalComponentSpec,
    context: InferenceContext
  ): Promise<{
    controllers: Record<string, any>;
    services: Record<string, any>;
    views: Record<string, any>;
    communications: Record<string, any>;
    rulesUsed: number;
  }> {
    const instances = {
      controllers: {},
      services: {},
      views: {},
      communications: {},
      rulesUsed: 0
    };

    // Generate controller instances
    Object.entries(component.controllers).forEach(([name, controller]) => {
      const namespace = controller.model ? this.toKebabCase(controller.model) : this.toKebabCase(name);
      const uses = this.inferControllerDependencies(controller, component);
      
      (instances.controllers as any)[this.toValidInstanceName(`${name}Instance`)] = {
        component: this.toKebabCase(component.name),
        namespace,
        advertises: "*",
        uses,
        scale: this.calculateControllerScale(controller, component)
      };
      instances.rulesUsed++;
    });

    // Generate service instances  
    Object.entries(component.services).forEach(([name, service]) => {
      const namespace = this.toKebabCase(name);
      const uses = this.inferServiceDependencies(service, component);
      
      (instances.services as any)[this.toValidInstanceName(`${name}Instance`)] = {
        component: this.toKebabCase(component.name),
        namespace,
        advertises: ["operations.*"],
        uses,
        scale: this.calculateServiceScale(service, component)
      };
      instances.rulesUsed++;
    });

    // Generate view instances (grouped by interface type)
    const viewGroups = this.groupViewsByInterface(component.views);
    Object.entries(viewGroups).forEach(([interfaceType, views]) => {
      const uses = this.inferViewDependencies(views, component);
      
      (instances.views as any)[this.toValidInstanceName(`${interfaceType}Interface`)] = {
        component: this.toKebabCase(component.name),
        namespace: interfaceType,
        uses,
        scale: this.calculateViewScale(interfaceType, views)
      };
      instances.rulesUsed++;
    });

    return instances;
  }

  /**
   * Generate communication channels
   */
  private async generateChannels(
    component: LogicalComponentSpec,
    context: InferenceContext
  ): Promise<Record<string, any>> {
    const channels: Record<string, any> = {};

    // Always generate main bus
    channels.mainBus = {
      namespace: "global",
      capabilities: this.extractAllCapabilities(component),
      type: "pubsub"
    };

    // Generate domain buses for complex components (>2 models)
    const modelCount = Object.keys(component.models || {}).length;
    if (modelCount > 2) {
      const domains = this.groupModelsByDomain(component.models || {});
      Object.entries(domains).forEach(([domain, models]) => {
        channels[`${domain}Bus`] = {
          namespace: domain,
          capabilities: models.map(model => `${model}.*`),
          type: this.chooseBusType(domain)
        };
      });
    }

    return channels;
  }

  // ===============================
  // Helper Methods
  // ===============================

  private inferControllerDependencies(controller: any, component: LogicalComponentSpec): string[] {
    const dependencies: string[] = [];
    
    if (controller.model) {
      dependencies.push(`${controller.model.toLowerCase()}.*`);
    }
    
    // Add service dependencies
    Object.keys(component.services || {}).forEach(serviceName => {
      dependencies.push(`${serviceName.toLowerCase()}.*`);
    });
    
    return dependencies;
  }

  private inferServiceDependencies(service: any, component: LogicalComponentSpec): string[] {
    const dependencies: string[] = [];
    
    // Infer from operations and subscriptions
    if (service.operations) {
      Object.keys(service.operations).forEach(opName => {
        dependencies.push(`${opName.toLowerCase()}.*`);
      });
    }
    
    return dependencies;
  }

  private inferViewDependencies(views: any[], component: LogicalComponentSpec): string[] {
    const dependencies = ["models.*"];
    
    // Add model-specific dependencies
    views.forEach(view => {
      if (view.model) {
        dependencies.push(`${view.model.toLowerCase()}.*`);
      }
      if (view.models) {
        view.models.forEach((model: string) => {
          dependencies.push(`${model.toLowerCase()}.*`);
        });
      }
    });
    
    return [...new Set(dependencies)]; // Remove duplicates
  }

  private calculateControllerScale(controller: any, component: LogicalComponentSpec): number {
    let scale = 1;
    
    // +1 for each model managed
    if (controller.model) scale += 1;
    
    // +2 if has many CURED operations
    if (controller.cured && Object.keys(controller.cured).length > 4) scale += 2;
    
    // +1 if has custom actions
    if (controller.customActions && Object.keys(controller.customActions).length > 0) scale += 1;
    
    return Math.min(scale, 8); // Cap at 8
  }

  private calculateServiceScale(service: any, component: LogicalComponentSpec): number {
    let scale = 1;
    
    // +1 for each operation
    if (service.operations) {
      scale += Math.min(Object.keys(service.operations).length, 3);
    }
    
    // +1 if subscribes to events
    if (service.subscribes_to && Object.keys(service.subscribes_to).length > 0) scale += 1;
    
    return Math.min(scale, 6); // Cap at 6
  }

  private calculateViewScale(interfaceType: string, views: any[]): number {
    const baseScales = {
      web: 4,
      admin: 2, 
      mobile: 3,
      api: 2
    };
    
    const baseScale = baseScales[interfaceType as keyof typeof baseScales] || 2;
    const viewCount = views.length;
    
    return Math.min(baseScale + Math.floor(viewCount / 2), 10);
  }

  private groupViewsByInterface(views: Record<string, any>): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      web: [],
      admin: [],
      mobile: [],
      api: []
    };
    
    Object.entries(views).forEach(([name, view]) => {
      // Determine interface type from view name or type
      const lowerName = name.toLowerCase();
      if (lowerName.includes('admin')) {
        groups.admin.push({name, ...view});
      } else if (lowerName.includes('mobile') || lowerName.includes('app')) {
        groups.mobile.push({name, ...view});
      } else if (lowerName.includes('api') || view.type === 'api') {
        groups.api.push({name, ...view});
      } else {
        groups.web.push({name, ...view});
      }
    });
    
    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, views]) => views.length > 0)
    );
  }

  private extractAllCapabilities(component: LogicalComponentSpec): string[] {
    const capabilities: string[] = [];
    
    // Add model capabilities
    Object.keys(component.models || {}).forEach(modelName => {
      capabilities.push(
        `${modelName.toLowerCase()}.create`,
        `${modelName.toLowerCase()}.read`, 
        `${modelName.toLowerCase()}.update`,
        `${modelName.toLowerCase()}.delete`
      );
    });
    
    // Add service capabilities
    Object.entries(component.services || {}).forEach(([serviceName, service]) => {
      if (service.operations) {
        Object.keys(service.operations).forEach(opName => {
          capabilities.push(`${serviceName.toLowerCase()}.${opName}`);
        });
      }
    });
    
    return capabilities;
  }

  private groupModelsByDomain(models: Record<string, any>): Record<string, string[]> {
    const domains: Record<string, string[]> = {};
    
    Object.keys(models).forEach(modelName => {
      // Simple domain inference based on model name patterns
      let domain = 'general';
      
      const lowerName = modelName.toLowerCase();
      if (lowerName.includes('user') || lowerName.includes('account') || lowerName.includes('profile')) {
        domain = 'identity';
      } else if (lowerName.includes('order') || lowerName.includes('payment') || lowerName.includes('transaction')) {
        domain = 'commerce';
      } else if (lowerName.includes('product') || lowerName.includes('catalog') || lowerName.includes('inventory')) {
        domain = 'catalog';
      } else if (lowerName.includes('notification') || lowerName.includes('message') || lowerName.includes('email')) {
        domain = 'communication';
      }
      
      if (!domains[domain]) domains[domain] = [];
      domains[domain].push(modelName);
    });
    
    return domains;
  }

  private chooseBusType(domain: string): string {
    // Choose bus type based on domain characteristics
    switch (domain) {
      case 'identity':
      case 'commerce':
        return 'rpc'; // Synchronous operations
      case 'communication':
      case 'notification':
        return 'pubsub'; // Asynchronous messaging
      default:
        return 'rpc';
    }
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Convert instance name to valid format (must start with lowercase)
   * Schema pattern: ^[a-z][a-zA-Z0-9_]*$
   */
  private toValidInstanceName(str: string): string {
    // Convert to camelCase but ensure starts with lowercase
    const camelCase = str
      .replace(/[^a-zA-Z0-9]/g, '')  // Remove special chars
      .replace(/([A-Z])/g, (match, char, index) => index === 0 ? char.toLowerCase() : char);
    
    // Ensure starts with lowercase letter
    return camelCase.charAt(0).toLowerCase() + camelCase.slice(1);
  }
}