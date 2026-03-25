/**
 * Manifest Loader Utility
 *
 * Loads and validates SpecVerse manifest files.
 * Provides default manifests for testing and development.
 */

import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { resolve } from 'path';
import type {
  CapabilityMapping,
  InstanceMapping,
  DefaultMappings,
  DeploymentReference
} from '../types/index.js';
import type {
  DefaultMappingsV2,
  OverrideMapping
} from '../types/unified-mappings.js';

/**
 * Instance Factory Declaration
 *
 * Declares an instance factory with its source metadata.
 * Source structure matches registry FactorySource exactly.
 */
export interface InstanceFactoryDeclaration {
  /** Factory name (must match registry) */
  name: string;

  /** Source metadata */
  source: {
    /** Source type */
    type: 'npm' | 'git' | 'url';

    /** NPM package name (for npm type) */
    package?: string;

    /** Version constraint (for npm type) */
    version?: string;

    /** Git repository URL (for git type) */
    url?: string;

    /** Entry point file path */
    entrypoint?: string;
  };
}

export interface ManifestConfig {
  specVersion: string;
  name: string;
  description?: string;
  version: string;

  /** v3.3 Deployment Reference (REQUIRED) */
  deployment: DeploymentReference;

  /**
   * Instance Factories (NEW - v3.6+)
   *
   * Explicit declarations of instance factories with source metadata.
   * This allows validation without registry lookup.
   */
  instanceFactories?: InstanceFactoryDeclaration[];

  /**
   * Two-Level Mapping System (v3.6+) - RECOMMENDED
   *
   * Simplified mapping system with two clear levels:
   * - defaults: Sugar syntax for common cases
   * - overrides: Explicit control with optional configuration
   */
  defaults?: DefaultMappingsV2;
  overrides?: OverrideMapping[];

  /**
   * Three-Level Mapping System (v3.3) - LEGACY
   *
   * Maintained for backward compatibility.
   * Will be deprecated in future versions.
   * Use two-level system (defaults + overrides) instead.
   */
  defaultMappings?: DefaultMappings;
  capabilityMappings?: CapabilityMapping[];
  instanceMappings?: InstanceMapping[];

  /** Global configuration */
  configuration?: Record<string, any>;

  /** Manifest templates for common tech stacks */
  manifestTemplates?: Array<{
    template: string;
    version?: string;
  }>;

  /** Internal metadata */
  _manifestName?: string;
  _manifestPath?: string;
  _isDefault?: boolean;
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Load manifest from file
 */
export function loadManifest(manifestPath: string): ManifestConfig {
  if (!manifestPath) {
    throw new Error('Manifest path is required');
  }

  const fullPath = resolve(manifestPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Manifest file not found: ${fullPath}`);
  }

  try {
    const yamlContent = readFileSync(fullPath, 'utf8');
    const parsed = parseYaml(yamlContent) as any;

    // Handle unified container format (manifests: { ManifestName: { ... } })
    if (parsed.manifests && typeof parsed.manifests === 'object') {
      const manifestKeys = Object.keys(parsed.manifests);
      if (manifestKeys.length === 0) {
        throw new Error('Manifests container is empty');
      }

      // Use first manifest
      const manifestName = manifestKeys[0];
      const manifest = parsed.manifests[manifestName];

      // Add metadata
      manifest._manifestName = manifestName;
      manifest._manifestPath = fullPath;

      return manifest as ManifestConfig;
    }

    // Handle direct manifest format (legacy or simplified)
    if (parsed.specVersion) {
      return parsed as ManifestConfig;
    }

    throw new Error('Invalid manifest format: missing "manifests" container or "specVersion"');

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Manifest file not found: ${fullPath}`);
    }
    throw new Error(`Failed to load manifest: ${error.message}`);
  }
}

/**
 * Get manifest configuration value by path
 */
export function getManifestValue(
  manifest: ManifestConfig | null | undefined,
  path: string,
  defaultValue?: any
): any {
  if (!manifest || !path) {
    return defaultValue;
  }

  const parts = path.split('.');
  let current: any = manifest;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return defaultValue;
    }
  }

  return current;
}

/**
 * Validate manifest structure (v3.3 only - no backward compatibility)
 */
export function validateManifest(manifest: ManifestConfig | null | undefined): ManifestValidationResult {
  const errors: string[] = [];

  if (!manifest) {
    errors.push('Manifest is null or undefined');
    return { valid: false, errors };
  }

  // Required fields
  if (!manifest.specVersion) {
    errors.push('Missing required field: specVersion');
  } else if (!manifest.specVersion.startsWith('3.3')) {
    errors.push(`Invalid specVersion: ${manifest.specVersion}. Only v3.3.x is supported.`);
  }

  if (!manifest.name) {
    errors.push('Missing required field: name');
  }

  if (!manifest.version) {
    errors.push('Missing required field: version');
  }

  // v3.3 required: deployment reference
  if (!manifest.deployment) {
    errors.push('Missing required field: deployment (must reference a deployment specification)');
  } else {
    if (!manifest.deployment.deploymentSource) {
      errors.push('deployment.deploymentSource is required');
    }
    if (!manifest.deployment.deploymentName) {
      errors.push('deployment.deploymentName is required');
    }
  }

  // v3.3 required: at least one mapping strategy
  const hasMappings = manifest.defaultMappings ||
                      (manifest.capabilityMappings && manifest.capabilityMappings.length > 0) ||
                      (manifest.instanceMappings && manifest.instanceMappings.length > 0);

  if (!hasMappings) {
    errors.push('At least one mapping strategy is required: defaultMappings, capabilityMappings, or instanceMappings');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Merge manifests (v3.3 composition)
 */
export function mergeManifests(
  baseManifest: ManifestConfig | null | undefined,
  overrideManifest: ManifestConfig | null | undefined
): ManifestConfig | null {
  if (!baseManifest) return overrideManifest || null;
  if (!overrideManifest) return baseManifest;

  // v3.3 merge: arrays override completely, objects merge
  return {
    ...baseManifest,
    ...overrideManifest,
    // Deployment reference: override completely
    deployment: overrideManifest.deployment || baseManifest.deployment,
    // Default mappings: merge objects
    defaultMappings: {
      ...(baseManifest.defaultMappings || {}),
      ...(overrideManifest.defaultMappings || {})
    },
    // Capability mappings: override array completely
    capabilityMappings: overrideManifest.capabilityMappings || baseManifest.capabilityMappings,
    // Instance mappings: override array completely
    instanceMappings: overrideManifest.instanceMappings || baseManifest.instanceMappings,
    // Configuration: merge objects
    configuration: {
      ...(baseManifest.configuration || {}),
      ...(overrideManifest.configuration || {})
    }
  };
}

/**
 * Get manifest summary for debugging
 */
export function getManifestSummary(manifest: ManifestConfig): {
  name: string;
  version: string;
  deployment: string;
  mappingStrategies: string[];
  instanceCount?: number;
} {
  const strategies: string[] = [];

  if (manifest.defaultMappings) {
    const count = Object.keys(manifest.defaultMappings).length;
    strategies.push(`defaultMappings (${count} categories)`);
  }

  if (manifest.capabilityMappings && manifest.capabilityMappings.length > 0) {
    strategies.push(`capabilityMappings (${manifest.capabilityMappings.length} patterns)`);
  }

  if (manifest.instanceMappings && manifest.instanceMappings.length > 0) {
    strategies.push(`instanceMappings (${manifest.instanceMappings.length} instances)`);
  }

  return {
    name: manifest.name,
    version: manifest.version,
    deployment: `${manifest.deployment?.deploymentName || 'unknown'} from ${manifest.deployment?.deploymentSource || 'unknown'}`,
    mappingStrategies: strategies
  };
}
