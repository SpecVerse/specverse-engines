/**
 * Full Spec JSON Generator
 *
 * Generates spec.json with the complete AI-optimized specification
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate spec.json - the complete AI-optimized spec
 */
export default function generateSpecJson(context: TemplateContext): string {
  const { spec } = context;

  // Return the full spec as formatted JSON
  return JSON.stringify(spec, null, 2);
}
