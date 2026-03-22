/**
 * Entity Module Manifest Loader
 *
 * Loads and validates module.yaml manifest files for entity modules.
 * The manifest declares what facets are implemented, where they live,
 * and how the module connects to the delivery infrastructure.
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';

// ============================================================================
// Manifest Types
// ============================================================================

export interface ModuleManifest {
  /** Entity type name */
  name: string;
  /** Whether this is a core or extension entity */
  type: 'core' | 'extension';
  /** Module version */
  version: string;
  /** Entity types this module depends on */
  depends_on: string[];
  /** Facet declarations */
  facets: ManifestFacets;
  /** Diagram plugin declarations */
  diagrams?: ManifestDiagram[];
  /** Delivery connections */
  delivery?: ManifestDelivery;
}

export interface ManifestFacets {
  /** Path to JSON Schema file */
  schema?: string;
  /** Convention processor paths */
  conventions?: {
    structural?: string;
    behavioural?: string;
  };
  /** Inference rule configuration */
  inference?: {
    entry?: string;
    rules?: string[];
  };
  /** Behavioural specification (Quint) */
  behaviour?: {
    rules?: string;
    invariants?: string;
  };
  /** Path to generators index */
  generators?: string;
  /** Path to documentation references */
  docs?: string;
  /** Path to test references */
  tests?: string;
}

export interface ManifestDiagram {
  type: string;
  variants?: string[];
}

export interface ManifestDelivery {
  parser?: boolean;
  inference?: boolean;
  realize?: boolean;
  cli?: boolean;
}

// ============================================================================
// Loader
// ============================================================================

/**
 * Load and parse a module.yaml manifest file.
 */
export function loadManifest(manifestPath: string): ModuleManifest {
  const content = readFileSync(manifestPath, 'utf8');
  const manifest = parseYaml(content) as ModuleManifest;

  // Ensure depends_on is always an array
  if (!manifest.depends_on) {
    manifest.depends_on = [];
  }

  return manifest;
}

/**
 * Validate a manifest has required fields.
 * Returns an array of error messages (empty if valid).
 */
export function validateManifest(manifest: ModuleManifest): string[] {
  const errors: string[] = [];

  if (!manifest.name) {
    errors.push('Missing required field: name');
  }
  if (!manifest.type || !['core', 'extension'].includes(manifest.type)) {
    errors.push('Missing or invalid field: type (must be "core" or "extension")');
  }
  if (!manifest.version) {
    errors.push('Missing required field: version');
  }
  if (!manifest.facets) {
    errors.push('Missing required field: facets');
  }

  return errors;
}
