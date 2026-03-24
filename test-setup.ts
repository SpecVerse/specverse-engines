/**
 * SpecVerse Test Setup
 *
 * Detects environment capabilities and sets up global test context.
 * Tests use __TEST_ENV__ to conditionally skip tests that need
 * specific tools or file structures.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

interface TestEnvironment {
  /** Quint binary is installed and working */
  hasQuint: boolean;
  /** specverse-lang examples directory exists (for file existence tests) */
  hasExamples: boolean;
  /** specverse-lang root (for tests that reference the source repo) */
  langRoot: string | null;
  /** Path to composed SPECVERSE-SCHEMA.json */
  schemaPath: string;
  /** Path to the engines repo root */
  enginesRoot: string;
}

function detectEnvironment(): TestEnvironment {
  const enginesRoot = resolve(__dirname);
  const langRoot = resolve(enginesRoot, '../specverse-lang');
  const langExists = existsSync(langRoot);

  return {
    hasQuint: (() => {
      try {
        execSync('npx quint --version', { stdio: 'pipe', timeout: 10000 });
        return true;
      } catch {
        return false;
      }
    })(),
    hasExamples: langExists && existsSync(resolve(langRoot, 'examples')),
    langRoot: langExists ? langRoot : null,
    schemaPath: resolve(enginesRoot, 'packages/parser/schema/SPECVERSE-SCHEMA.json'),
    enginesRoot,
  };
}

const env = detectEnvironment();

// Make available globally for all tests
declare global {
  var __TEST_ENV__: TestEnvironment;
}
globalThis.__TEST_ENV__ = env;

// Log environment on first run
console.log(`\nTest environment:`);
console.log(`  Quint: ${env.hasQuint ? 'available' : 'not installed (Quint tests will skip)'}`);
console.log(`  Examples: ${env.hasExamples ? 'available' : 'not available (file existence tests will skip)'}`);
console.log(`  Schema: ${existsSync(env.schemaPath) ? 'found' : 'MISSING'}`);
console.log('');
