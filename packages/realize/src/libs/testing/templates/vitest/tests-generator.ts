/**
 * Vitest Test Suite Generator Wrapper
 *
 * Wraps the existing generate-tests.js script for use with the
 * implementation types system.
 *
 * NOTE: This is a wrapper around scripts/generate-tests.js
 * TODO: Convert generate-tests.js to native TypeScript template generator
 *       See vitest-tests.yaml for conversion notes.
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';
import { generateTests } from '../../../../../scripts/generate-tests.js';

/**
 * Generate test suite by delegating to the existing generator
 */
export default function generateTestSuite(context: TemplateContext): string {
  const { spec, implType, outputDir } = context;

  if (!spec) {
    throw new Error('Specification is required in template context');
  }

  // Extract configuration from implementation type
  const config = implType.configuration || {};

  const options = {
    testFramework: config.testFramework || 'vitest',
    generateUnitTests: config.generateUnitTests !== false,
    generateIntegrationTests: config.generateIntegrationTests !== false,
    generateE2ETests: config.generateE2ETests !== false,
    generateFixtures: config.generateFixtures !== false,
    generateMocks: config.generateMocks !== false
  };

  // Call the existing generator
  const result = generateTests(spec, outputDir || './tests', options);

  // Return summary information
  return JSON.stringify({
    message: 'Test suite generated successfully',
    unitTests: result.unitTests,
    integrationTests: result.integrationTests,
    e2eTests: result.e2eTests,
    fixtureCount: result.fixtureCount,
    mockCount: result.mockCount,
    outputDir: result.outputDir,
    files: result.files
  }, null, 2);
}
