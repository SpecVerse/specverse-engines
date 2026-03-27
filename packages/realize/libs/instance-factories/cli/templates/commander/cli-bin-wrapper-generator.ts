/**
 * CLI Bin Wrapper Generator
 *
 * Generates bin/cli.mjs — a Node.js executable wrapper that loads
 * tsx and runs the TypeScript CLI entry point.
 *
 * This allows `npm link` or `npx` to run the CLI without
 * the user having tsx installed globally.
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateCLIBinWrapper(context: TemplateContext): string {
  return `#!/usr/bin/env node
import { register } from 'tsx/esm/api';
const unregister = register();
await import('../src/cli/index.ts');
unregister();
`;
}
