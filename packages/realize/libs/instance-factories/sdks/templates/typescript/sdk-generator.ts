/**
 * TypeScript SDK Generator Wrapper
 *
 * Wraps the existing generate-sdk-typescript.js script for use with the
 * implementation types system.
 *
 * NOTE: This is a wrapper around scripts/generate-sdk-typescript.js
 * TODO: Convert generate-sdk-typescript.js to native TypeScript template generator
 *       See typescript-sdk.yaml for conversion notes.
 */

import type { TemplateContext } from '@specverse/engine-realize';
import { generateTypeScriptSDK } from '../../../../../scripts/generate-sdk-typescript.js';

/**
 * Generate TypeScript SDK by delegating to the existing generator
 */
export default function generateSDK(context: TemplateContext): string {
  const { spec, implType, outputDir } = context;

  if (!spec) {
    throw new Error('Specification is required in template context');
  }

  // Extract configuration from implementation type
  const config = implType.configuration || {};

  const options = {
    packageName: config.packageName || '@specverse/sdk',
    packageVersion: config.packageVersion || '1.0.0',
    includeAuth: config.includeAuth !== false,
    includeRetry: config.includeRetry !== false,
    timeout: config.timeout || 30000,
    retries: config.retries || 3
  };

  // Call the existing generator
  const result = generateTypeScriptSDK(spec, outputDir || './sdk-typescript', options);

  // Return summary information
  return JSON.stringify({
    message: 'TypeScript SDK generated successfully',
    packageName: result.packageName,
    resourceCount: result.resourceCount,
    endpointCount: result.endpointCount,
    outputDir: result.outputDir,
    files: result.files
  }, null, 2);
}
