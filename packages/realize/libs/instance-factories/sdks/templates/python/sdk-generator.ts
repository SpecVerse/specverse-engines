/**
 * Python SDK Generator Wrapper
 *
 * Wraps the existing generate-sdk-python.js script for use with the
 * implementation types system.
 *
 * NOTE: This is a wrapper around scripts/generate-sdk-python.js
 * TODO: Convert generate-sdk-python.js to native TypeScript template generator
 *       See python-sdk.yaml for conversion notes.
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';
import { generatePythonSDK } from '../../../../../scripts/generate-sdk-python.js';

/**
 * Generate Python SDK by delegating to the existing generator
 */
export default function generateSDK(context: TemplateContext): string {
  const { spec, implType, outputDir } = context;

  if (!spec) {
    throw new Error('Specification is required in template context');
  }

  // Extract configuration from implementation type
  const config = implType.configuration || {};

  const options = {
    packageName: config.packageName || 'specverse_client',
    packageVersion: config.packageVersion || '1.0.0',
    includeAuth: config.includeAuth !== false,
    includeRetry: config.includeRetry !== false,
    includeAsync: config.includeAsync !== false,
    timeout: config.timeout || 30000,
    retries: config.retries || 3
  };

  // Call the existing generator
  const result = generatePythonSDK(spec, outputDir || './sdk-python', options);

  // Return summary information
  return JSON.stringify({
    message: 'Python SDK generated successfully',
    packageName: result.packageName,
    resourceCount: result.resourceCount,
    endpointCount: result.endpointCount,
    outputDir: result.outputDir,
    files: result.files
  }, null, 2);
}
