/**
 * Mapping Migration Utilities
 *
 * Converts legacy three-level mapping system (v3.3) to new two-level system (v3.6).
 * Provides backward compatibility while encouraging migration to the simpler format.
 *
 * @module realize/utils/mapping-migration
 * @version 3.6.0
 */

import type { ManifestConfig } from './manifest-loader.js';
import type {
  DefaultMappingsV2,
  OverrideMapping
} from '../types/unified-mappings.js';
import type {
  CapabilityMapping,
  InstanceMapping,
  DefaultMappings
} from '../types/index.js';

/**
 * Convert legacy three-level mappings to new two-level system
 *
 * Migrates:
 * - defaultMappings (v3.3) → defaults (v3.6)
 * - capabilityMappings (v3.3) → overrides (v3.6)
 * - instanceMappings (v3.3) → overrides (v3.6) with configuration
 *
 * @param manifest - Manifest with legacy mappings
 * @returns Manifest with new two-level mappings
 */
export function migrateToTwoLevelSystem(manifest: ManifestConfig): ManifestConfig {
  // If already using new system, return as-is
  if (manifest.defaults || manifest.overrides) {
    return manifest;
  }

  // If no legacy mappings, return as-is
  if (!manifest.defaultMappings && !manifest.capabilityMappings && !manifest.instanceMappings) {
    return manifest;
  }

  const migrated: ManifestConfig = {
    ...manifest,
    defaults: undefined,
    overrides: []
  };

  // Step 1: Convert defaultMappings → defaults
  if (manifest.defaultMappings) {
    migrated.defaults = convertDefaultMappings(manifest.defaultMappings);
  }

  // Step 2: Convert capabilityMappings → overrides
  if (manifest.capabilityMappings) {
    const capabilityOverrides = convertCapabilityMappings(manifest.capabilityMappings);
    migrated.overrides!.push(...capabilityOverrides);
  }

  // Step 3: Convert instanceMappings → overrides (with configuration)
  if (manifest.instanceMappings) {
    const instanceOverrides = convertInstanceMappings(manifest.instanceMappings);
    migrated.overrides!.push(...instanceOverrides);
  }

  // Remove empty overrides array
  if (migrated.overrides && migrated.overrides.length === 0) {
    delete migrated.overrides;
  }

  return migrated;
}

/**
 * Convert v3.3 DefaultMappings to v3.6 DefaultMappingsV2
 *
 * Maps v3.3 architectural layer names to v3.6 technology category names.
 *
 * v3.3 uses: controller, service, view, storage, security, infrastructure, monitoring, communication
 * v3.6 uses: api, orm, cache, queue, auth, email, storage, search, logging, monitoring
 *
 * @param legacy - Legacy default mappings
 * @returns New default mappings
 */
function convertDefaultMappings(legacy: DefaultMappings): DefaultMappingsV2 {
  const converted: DefaultMappingsV2 = {};

  // Map v3.3 architectural layers to v3.6 technology categories
  if (legacy.controller) converted.api = legacy.controller;      // controller → api (REST endpoints)
  if (legacy.service) converted.orm = legacy.service;            // service → orm (often uses DB)
  if (legacy.storage) converted.storage = legacy.storage;        // storage → storage (direct mapping)
  if (legacy.security) converted.auth = legacy.security;         // security → auth
  if (legacy.monitoring) converted.monitoring = legacy.monitoring; // monitoring → monitoring (direct)
  if (legacy.communication) converted.email = legacy.communication; // communication → email
  if (legacy.infrastructure) {
    // Infrastructure can map to cache or queue depending on context
    // For now, map to cache as a reasonable default
    converted.cache = legacy.infrastructure;
  }

  // Note: v3.3 'view' doesn't have a direct v3.6 equivalent
  // View is typically UI layer, not part of backend mappings

  return converted;
}

/**
 * Convert v3.3 CapabilityMappings to v3.6 OverrideMappings
 *
 * @param legacy - Legacy capability mappings
 * @returns Override mappings
 */
function convertCapabilityMappings(legacy: CapabilityMapping[]): OverrideMapping[] {
  return legacy.map(mapping => ({
    target: mapping.capability,
    factory: mapping.instanceFactory,
    version: mapping.version,
    configuration: mapping.configuration,
    namespace: mapping.namespace
  }));
}

/**
 * Convert v3.3 InstanceMappings to v3.6 OverrideMappings
 *
 * @param legacy - Legacy instance mappings
 * @returns Override mappings with configuration
 */
function convertInstanceMappings(legacy: InstanceMapping[]): OverrideMapping[] {
  return legacy.map(mapping => ({
    target: mapping.instanceName,          // Instance name as target
    factory: mapping.instanceFactory,
    version: mapping.version,
    configuration: mapping.configuration
  }));
}

/**
 * Detect which mapping system is in use
 *
 * @param manifest - Manifest to analyze
 * @returns Mapping system version
 */
export function detectMappingSystem(manifest: ManifestConfig): 'v3.6' | 'v3.3' | 'none' {
  const hasNewSystem = !!(manifest.defaults || manifest.overrides);
  const hasLegacySystem = !!(
    manifest.defaultMappings ||
    manifest.capabilityMappings ||
    manifest.instanceMappings
  );

  if (hasNewSystem && hasLegacySystem) {
    // Both systems present - prefer new one
    return 'v3.6';
  }

  if (hasNewSystem) {
    return 'v3.6';
  }

  if (hasLegacySystem) {
    return 'v3.3';
  }

  return 'none';
}

/**
 * Get effective mappings using the appropriate system
 *
 * Automatically migrates if using legacy system.
 *
 * @param manifest - Manifest configuration
 * @returns Defaults and overrides (migrated if necessary)
 */
export function getEffectiveMappings(manifest: ManifestConfig): {
  defaults?: DefaultMappingsV2;
  overrides?: OverrideMapping[];
  system: 'v3.6' | 'v3.3' | 'none';
} {
  const system = detectMappingSystem(manifest);

  if (system === 'v3.6') {
    return {
      defaults: manifest.defaults,
      overrides: manifest.overrides,
      system: 'v3.6'
    };
  }

  if (system === 'v3.3') {
    const migrated = migrateToTwoLevelSystem(manifest);
    return {
      defaults: migrated.defaults,
      overrides: migrated.overrides,
      system: 'v3.3'
    };
  }

  return {
    defaults: undefined,
    overrides: undefined,
    system: 'none'
  };
}

/**
 * Validate that manifest uses consistent mapping system
 *
 * Warns if mixing v3.3 and v3.6 systems.
 *
 * @param manifest - Manifest to validate
 * @returns Validation warnings
 */
export function validateMappingConsistency(manifest: ManifestConfig): string[] {
  const warnings: string[] = [];

  const hasNewSystem = !!(manifest.defaults || manifest.overrides);
  const hasLegacySystem = !!(
    manifest.defaultMappings ||
    manifest.capabilityMappings ||
    manifest.instanceMappings
  );

  if (hasNewSystem && hasLegacySystem) {
    warnings.push(
      'Manifest contains both v3.6 (defaults/overrides) and v3.3 (defaultMappings/capabilityMappings/instanceMappings) mapping systems. ' +
      'Using v3.6 system and ignoring v3.3 mappings. ' +
      'Remove legacy mappings to avoid confusion.'
    );
  }

  return warnings;
}
