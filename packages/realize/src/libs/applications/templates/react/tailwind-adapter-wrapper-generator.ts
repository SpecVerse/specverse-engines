/**
 * Tailwind Adapter Wrapper Generator
 *
 * Bundles the tailwind-adapter-generator.ts source file for generated projects.
 * This file is imported by react-pattern-adapter.tsx.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface TailwindAdapterGeneratorContext {
  spec: any;
  manifest: any;
}

export async function generate(context: TailwindAdapterGeneratorContext): Promise<string> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Try to find the tailwind-adapter-generator.ts source file
  const possiblePaths = [
    // PRIORITY 1: Bundled with package (in libs/ directory)
    join(__dirname, '../../../../../../libs/instance-factories/applications/templates/react/tailwind-adapter-generator.ts'),
    // PRIORITY 2: Development environment (local)
    join(__dirname, './tailwind-adapter-generator.ts'),
    join(__dirname, '../tailwind-adapter-generator.ts')
  ];

  let adapterSource: string | null = null;
  let foundPath: string | null = null;

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        adapterSource = readFileSync(path, 'utf-8');
        foundPath = path;
        break;
      } catch (error) {
        // Continue to next path
      }
    }
  }

  if (adapterSource) {
    // Successfully read the adapter - return it with a header comment
    return `/**
 * Universal Tailwind Adapter Generator
 *
 * AUTO-GENERATED: Copied from @specverse/lang
 * Source: ${foundPath}
 *
 * This file provides Tailwind CSS rendering for all atomic component types.
 * It is imported by react-pattern-adapter.tsx.
 *
 * DO NOT EDIT: Changes will be overwritten on next generation.
 */

${adapterSource}
`;
  }

  // Fallback: Return minimal stub (should never happen with bundled source)
  return `/**
 * Tailwind Adapter Generator (STUB)
 *
 * ⚠️ WARNING: Could not locate tailwind-adapter-generator.ts source file.
 */

import type { ComponentAdapter } from '@specverse/lang';

export function createUniversalTailwindAdapter(): ComponentAdapter {
  return {
    renderComponent(type: string, properties: Record<string, any> = {}, children?: string): string {
      return \`<div class="p-4 border border-gray-300 rounded bg-gray-50">
        <span class="text-gray-700">\${type}</span>
      </div>\`;
    }
  };
}

console.warn('⚠️ Using stub Tailwind adapter - full source file not found during generation');
`;
}
