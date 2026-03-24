/**
 * Docker/Kubernetes Infrastructure Generator Wrapper
 *
 * Wraps the existing generate-infrastructure.js script for use with the
 * implementation types system.
 *
 * NOTE: This is a wrapper around scripts/generate-infrastructure.js
 * TODO: Convert generate-infrastructure.js to native TypeScript template generator
 *       See docker-k8s.yaml for conversion notes.
 */

import type { TemplateContext } from '@specverse/engine-realize';
import { generateInfrastructure } from '../../../../../scripts/generate-infrastructure.js';

/**
 * Generate infrastructure code by delegating to the existing generator
 */
export default function generateInfra(context: TemplateContext): string {
  const { spec, implType, outputDir } = context;

  if (!spec) {
    throw new Error('Specification is required in template context');
  }

  // Extract configuration from implementation type
  const config = implType.configuration || {};

  const options = {
    docker: config.docker || {},
    kubernetes: config.kubernetes || {},
    cicd: config.cicd || {}
  };

  // Call the existing generator
  const result = generateInfrastructure(spec, outputDir || './infrastructure', options);

  // Return summary information
  return JSON.stringify({
    message: 'Infrastructure code generated successfully',
    dockerFiles: result.dockerFiles,
    kubernetesFiles: result.kubernetesFiles,
    cicdFiles: result.cicdFiles,
    outputDir: result.outputDir,
    files: result.files
  }, null, 2);
}
