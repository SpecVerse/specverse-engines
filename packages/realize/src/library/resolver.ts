/**
 * Instance Factory Resolver
 *
 * Resolves deployment capabilities to instance factories
 * using manifest configuration and capability mappings.
 */

import path from 'path';
import { InstanceFactoryLibrary } from './library.js';
import { InstanceFactoryValidator } from './validator.js';
import type {
  InstanceFactory,
  CapabilityMapping,
  InstanceMapping,
  DefaultMappings,
  ResolvedImplementation
} from '../types/index.js';

/**
 * Resolver configuration (v3.3 hybrid mapping only)
 */
export interface ResolverConfig {
  /** v3.3 Hybrid Mapping System */
  defaultMappings?: DefaultMappings;
  capabilityMappings?: CapabilityMapping[];
  instanceMappings?: InstanceMapping[];

  /** Global configuration overrides */
  globalConfiguration?: Record<string, any>;
}

/**
 * Resolution context for a deployment instance
 */
export interface ResolutionContext {
  /** Deployment instance being resolved */
  instance: any;

  /** Component name */
  componentName?: string;

  /** Environment name */
  environment?: string;

  /** Additional context properties */
  [key: string]: any;
}

/**
 * Resolution error
 */
export class ResolutionError extends Error {
  constructor(
    message: string,
    public capability: string,
    public instance?: any
  ) {
    super(message);
    this.name = 'ResolutionError';
  }
}

/**
 * Resolver for mapping capabilities to instance factories
 */
export class InstanceFactoryResolver {
  private library: InstanceFactoryLibrary;
  private validator: InstanceFactoryValidator;
  private config: ResolverConfig;

  constructor(library: InstanceFactoryLibrary, config: ResolverConfig = {}) {
    this.library = library;
    this.validator = new InstanceFactoryValidator();
    this.config = config;
  }

  /**
   * Resolve a single capability to an instance factory (v3.3 hybrid mapping)
   *
   * Resolution priority:
   * 1. Instance-specific mapping (instanceMappings) - highest priority
   * 2. Capability-based mapping (capabilityMappings) - medium priority
   * 3. Default category mapping (defaultMappings) - lowest priority
   */
  resolveCapability(
    capability: string,
    context?: ResolutionContext
  ): ResolvedImplementation {
    let factoryName: string | undefined;
    let mappingConfig: Record<string, any> | undefined;
    let mappingVersion: string | undefined;

    // PRIORITY 1: Check for instance-specific mapping
    if (context?.instance?.name && this.config.instanceMappings) {
      const instanceMapping = this.config.instanceMappings.find(
        m => m.instanceName === context.instance.name
      );

      if (instanceMapping) {
        factoryName = instanceMapping.instanceFactory;
        mappingConfig = instanceMapping.configuration;
        mappingVersion = instanceMapping.version;
      }
    }

    // PRIORITY 2: Check for capability-based mapping
    if (!factoryName) {
      const capabilityMapping = this.findCapabilityMapping(capability);
      if (capabilityMapping) {
        factoryName = capabilityMapping.instanceFactory;
        mappingConfig = capabilityMapping.configuration;
        mappingVersion = capabilityMapping.version;
      }
    }

    // PRIORITY 3: Check for default category mapping
    if (!factoryName && context?.instance && this.config.defaultMappings) {
      const instanceCategory = context.instance.category || this.inferCategoryFromCapability(capability);
      if (instanceCategory) {
        factoryName = this.config.defaultMappings[instanceCategory as keyof DefaultMappings];
      }
    }

    // If still no factory found, throw error
    if (!factoryName) {
      throw new ResolutionError(
        `No instance factory mapping found for capability "${capability}".\n` +
        `  Instance: ${context?.instance?.name || 'unknown'}\n` +
        `  Tried: instanceMappings, capabilityMappings, defaultMappings`,
        capability,
        context?.instance
      );
    }

    // Resolve instance factory by name
    const loadResult = this.library.resolveWithMetadata(factoryName);

    if (!loadResult) {
      throw new ResolutionError(
        `Instance factory "${factoryName}" not found in library`,
        capability,
        context?.instance
      );
    }

    const factory = loadResult.type;
    // Get package root (3 levels up from libs/instance-factories/backend)
    const basePath = path.resolve(path.dirname(loadResult.filePath), '../../..');

    // Merge configuration in order of precedence:
    // 1. Instance factory defaults
    // 2. Global configuration
    // 3. Mapping configuration overrides
    const configuration = {
      ...(factory.configuration || {}),
      ...(this.config.globalConfiguration || {}),
      ...(mappingConfig || {})
    };

    // Validate the resolved implementation
    const validationResult = this.validator.validateComplete(factory, {
      specverseVersion: process.env.SPECVERSE_VERSION || '3.3.0'
    });

    if (!validationResult.compatible) {
      throw new ResolutionError(
        `Instance factory "${factory.name}" validation failed:\n` +
        (validationResult.errors || []).map(e => `  - ${e}`).join('\n'),
        capability,
        context?.instance
      );
    }

    return {
      capability,
      instanceFactory: factory,
      instance: context?.instance,
      configuration,
      basePath
    };
  }

  /**
   * Resolve all capabilities for a deployment instance
   */
  resolveForInstance(instance: any, context?: ResolutionContext): ResolvedImplementation[] {
    const resolved: ResolvedImplementation[] = [];

    // Get capabilities from instance
    const capabilities = this.getInstanceCapabilities(instance);

    // Resolve each capability
    for (const capability of capabilities) {
      try {
        const resolution = this.resolveCapability(capability, {
          ...context,
          instance
        });
        resolved.push(resolution);
      } catch (error) {
        // Re-throw with additional context
        if (error instanceof ResolutionError) {
          throw error;
        }
        throw new ResolutionError(
          `Failed to resolve capability "${capability}": ${error instanceof Error ? error.message : String(error)}`,
          capability,
          instance
        );
      }
    }

    // Validate dependencies between resolved implementations
    const depResult = this.validator.validateDependencies(resolved);
    if (!depResult.satisfied) {
      const errors: string[] = [];

      if (depResult.missing) {
        errors.push(...depResult.missing);
      }

      if (depResult.conflicts) {
        for (const conflict of depResult.conflicts) {
          errors.push(
            `Conflict for capability "${conflict.capability}": ` +
            `required by "${conflict.required}", available in "${conflict.available}"`
          );
        }
      }

      throw new ResolutionError(
        `Dependency validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`,
        'multiple',
        instance
      );
    }

    return resolved;
  }

  /**
   * Resolve all capabilities for a deployment
   */
  resolveForDeployment(deployment: any, context?: Omit<ResolutionContext, 'instance'>): Map<string, ResolvedImplementation[]> {
    const resolvedByInstance = new Map<string, ResolvedImplementation[]>();

    // Get all instances from deployment
    const instances = deployment.instances || {};

    for (const [instanceName, instance] of Object.entries(instances)) {
      const resolved = this.resolveForInstance(instance, {
        ...context,
        instance
      });

      resolvedByInstance.set(instanceName, resolved);
    }

    return resolvedByInstance;
  }

  /**
   * Find capability mapping that matches the given capability
   *
   * Supports wildcard patterns (e.g., "api.*" matches "api.rest", "api.graphql")
   */
  private findCapabilityMapping(capability: string): CapabilityMapping | undefined {
    if (!this.config.capabilityMappings) {
      return undefined;
    }

    // First try exact match
    for (const mapping of this.config.capabilityMappings) {
      if (mapping.capability === capability) {
        return mapping;
      }
    }

    // Then try wildcard match
    for (const mapping of this.config.capabilityMappings) {
      if (mapping.capability.includes('*')) {
        const pattern = mapping.capability.replace(/\*/g, '.*');
        if (new RegExp(`^${pattern}$`).test(capability)) {
          return mapping;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract capabilities from a deployment instance
   */
  private getInstanceCapabilities(instance: any): string[] {
    const capabilities: string[] = [];

    // From "advertises" field
    if (instance.advertises) {
      if (Array.isArray(instance.advertises)) {
        capabilities.push(...instance.advertises);
      } else if (typeof instance.advertises === 'string') {
        capabilities.push(instance.advertises);
      }
    }

    // From "capabilities" field (alternative format)
    if (instance.capabilities) {
      if (Array.isArray(instance.capabilities)) {
        capabilities.push(...instance.capabilities);
      } else if (typeof instance.capabilities === 'string') {
        capabilities.push(instance.capabilities);
      }
    }

    return [...new Set(capabilities)]; // Remove duplicates
  }

  /**
   * Apply template overrides to an instance factory
   */
  private applyTemplateOverrides(
    factory: InstanceFactory,
    overrides: Record<string, string>
  ): InstanceFactory {
    const newCodeTemplates = { ...factory.codeTemplates };

    for (const [templateName, templatePath] of Object.entries(overrides)) {
      if (newCodeTemplates[templateName]) {
        newCodeTemplates[templateName] = {
          ...newCodeTemplates[templateName],
          template: templatePath
        };
      }
    }

    return {
      ...factory,
      codeTemplates: newCodeTemplates
    };
  }

  /**
   * Infer instance category from capability pattern (v3.3)
   *
   * Used as fallback when instance doesn't have explicit category
   */
  private inferCategoryFromCapability(capability: string): string | undefined {
    const capabilityToCategoryMap: Record<string, string> = {
      'api.rest': 'controller',
      'api.graphql': 'controller',
      'api.websocket': 'controller',
      'service': 'service',
      'validation': 'service',
      'sdk': 'view',
      'ui': 'view',
      'frontend': 'view',
      'storage': 'storage',
      'database': 'storage',
      'cache': 'storage',
      'auth': 'security',
      'security': 'security',
      'infrastructure': 'infrastructure',
      'docker': 'infrastructure',
      'kubernetes': 'infrastructure',
      'monitoring': 'monitoring',
      'logging': 'monitoring',
      'messaging': 'communication',
      'queue': 'communication',
      'pubsub': 'communication'
    };

    // Try exact match
    if (capabilityToCategoryMap[capability]) {
      return capabilityToCategoryMap[capability];
    }

    // Try prefix match
    for (const [capPrefix, category] of Object.entries(capabilityToCategoryMap)) {
      if (capability.startsWith(capPrefix + '.')) {
        return category;
      }
    }

    return undefined;
  }

  /**
   * Get configuration summary for debugging
   */
  getConfigSummary(): {
    capabilityMappings: number;
    instanceMappings: number;
    defaultMappings: number;
  } {
    return {
      capabilityMappings: this.config.capabilityMappings?.length || 0,
      instanceMappings: this.config.instanceMappings?.length || 0,
      defaultMappings: Object.keys(this.config.defaultMappings || {}).length
    };
  }
}

/**
 * Create a resolver from manifest data (v3.3 hybrid mapping only)
 */
export function createResolver(
  library: InstanceFactoryLibrary,
  manifest: {
    defaultMappings?: DefaultMappings;
    capabilityMappings?: CapabilityMapping[];
    instanceMappings?: InstanceMapping[];
    configuration?: Record<string, any>;
  }
): InstanceFactoryResolver {
  return new InstanceFactoryResolver(library, {
    defaultMappings: manifest.defaultMappings,
    capabilityMappings: manifest.capabilityMappings,
    instanceMappings: manifest.instanceMappings,
    globalConfiguration: manifest.configuration
  });
}
