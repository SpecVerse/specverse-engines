/**
 * Zod Validation Generator Wrapper
 *
 * Wraps the existing generate-validation.js script for use with the
 * implementation types system.
 *
 * NOTE: This is a wrapper around scripts/generate-validation.js
 * TODO: Convert generate-validation.js to native TypeScript template generator
 *       See zod-validation.yaml for conversion notes.
 */

import type { TemplateContext } from '@specverse/engine-realize';
import { generateValidation } from '../../../../../scripts/generate-validation.js';

/**
 * Generate validation schemas by delegating to the existing generator
 */
export default function generateValidationSchemas(context: TemplateContext): string {
  const { spec, implType, outputDir } = context;

  if (!spec) {
    throw new Error('Specification is required in template context');
  }

  // Extract configuration from implementation type
  const config = implType.configuration || {};

  const options = {
    framework: config.framework || 'zod',
    generateJsonSchema: config.generateJsonSchema !== false,
    stripUnknown: config.stripUnknown !== false,
    abortEarly: config.abortEarly || false
  };

  // Call the existing generator
  const result = generateValidation(spec, outputDir || './validation', options);

  // Return summary information
  return JSON.stringify({
    message: 'Validation schemas generated successfully',
    modelCount: result.modelCount,
    schemaCount: result.schemaCount,
    outputDir: result.outputDir,
    files: result.files
  }, null, 2);
}
