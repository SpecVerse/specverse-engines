/**
 * Views Entity — Inference Rules
 *
 * Views are generated from models during inference. The inference engine uses
 * multiple rule files to generate:
 * - Automatic CRUD views (list, detail, form) from models
 * - Specialist view types (dashboard, analytics, board, timeline, etc.)
 * - Component type mappings (model attributes → UI components)
 * - Profile-aware form views for models with profiles
 *
 * The rule JSON files here are the source of truth. The build system
 * composes them into dist/inference-engine/rules/logical/ via
 * scripts/build-tools/compose-inference-rules.cjs.
 *
 * Rules with condition: "false" are disabled and excluded from metadata.
 *
 * The EntityInferenceRule metadata declared here describes what rules exist.
 * The inference engine infrastructure (RuleEngine, generators) executes them.
 */

import type { EntityInferenceRule } from '../../../_shared/types.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Lazily resolve the directory containing the inference rule JSON files.
 * Works in both ESM and CJS contexts (see models/inference/index.ts for details).
 */
function resolveRulesDir(): string {
  if (typeof __dirname !== 'undefined') return __dirname;
  const url: string = new Function('return import.meta.url')();
  return dirname(fileURLToPath(url));
}

/**
 * Inference rule metadata for the views entity.
 *
 * These describe what active rules exist and what they generate.
 * Rules with condition: "false" are excluded (disabled Phase 2 rules).
 */
export const viewInferenceRules: EntityInferenceRule[] = [
  // === v3.1 View Rules (active only) ===
  {
    id: 'views:profile_aware_form_view',
    description: 'Form view with profile attachment support for models with profiles',
    triggeredBy: 'models',
    generates: ['views'],
    priority: 75,
  },

  // === v3.4 Automatic CRUD Views ===
  {
    id: 'views:automatic_list_view',
    description: 'Automatic list view generation from models with search, filter, table, pagination',
    triggeredBy: 'models',
    generates: ['views'],
    priority: 100,
  },
  {
    id: 'views:automatic_detail_view',
    description: 'Automatic detail view generation from models with header, card, actions',
    triggeredBy: 'models',
    generates: ['views'],
    priority: 100,
  },
  {
    id: 'views:automatic_form_view',
    description: 'Automatic form view generation from models with header, form, actions',
    triggeredBy: 'models',
    generates: ['views'],
    priority: 100,
  },

  // === v3.4 Component Type Mapping ===
  {
    id: 'views:component_type_mapping',
    description: 'Maps model attribute types to 49 atomic UI component types (input, select, switch, etc.)',
    triggeredBy: 'models',
    generates: ['views'],
    priority: 90,
  },

  // === v3.4 Specialist View Type Expansion ===
  {
    id: 'views:specialist_dashboard',
    description: 'Dashboard view type expansion: metrics cards, charts, summary table',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_analytics',
    description: 'Analytics view type expansion: filter panel, charts, data table',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_board',
    description: 'Board view type expansion: kanban/swimlane with columns and cards',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_timeline',
    description: 'Timeline view type expansion: chronological event visualization',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_calendar',
    description: 'Calendar view type expansion: date-based scheduling with month/week/day views',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_workflow',
    description: 'Workflow view type expansion: state machine visualization with actions and history',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_wizard',
    description: 'Wizard view type expansion: multi-step guided process with navigation',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_comparison',
    description: 'Comparison view type expansion: side-by-side entity comparison',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_settings',
    description: 'Settings view type expansion: configuration panel with organized sections',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_map',
    description: 'Map view type expansion: geographic data visualization with markers',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_feed',
    description: 'Feed view type expansion: activity feed or social stream',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
  {
    id: 'views:specialist_profile',
    description: 'Profile view type expansion: user or entity profile page with tabs',
    triggeredBy: 'views',
    generates: ['views'],
    priority: 80,
  },
];

/**
 * Load the raw v3.1 view rules JSON for use by the inference engine.
 */
export function loadViewRules(): any {
  const dir = resolveRulesDir();
  return JSON.parse(readFileSync(resolve(dir, 'v3.1-view-rules.json'), 'utf8'));
}

/**
 * Load the raw v3.4 specialist view rules JSON for use by the inference engine.
 */
export function loadSpecialistViewRules(): any {
  const dir = resolveRulesDir();
  return JSON.parse(readFileSync(resolve(dir, 'v3.4-specialist-view-rules.json'), 'utf8'));
}

/**
 * Load the raw v3.4 specialist views expansion templates JSON.
 */
export function loadSpecialistViews(): any {
  const dir = resolveRulesDir();
  return JSON.parse(readFileSync(resolve(dir, 'v3.4-specialist-views.json'), 'utf8'));
}

/**
 * Load the raw v3.4 view component inference rules JSON.
 */
export function loadViewComponentInference(): any {
  const dir = resolveRulesDir();
  return JSON.parse(readFileSync(resolve(dir, 'v3.4-view-component-inference.json'), 'utf8'));
}

/**
 * Load the raw v3.4 component type mappings JSON.
 */
export function loadComponentMappings(): any {
  const dir = resolveRulesDir();
  return JSON.parse(readFileSync(resolve(dir, 'v3.4-component-mappings.json'), 'utf8'));
}
