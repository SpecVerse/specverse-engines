/**
 * Pattern Adapter Generator (v0.9.0)
 *
 * Copies ReactPatternAdapter from specverse-app-demo for pattern-based view rendering.
 * This bundles the adapter with generated code for standalone deployment.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface PatternAdapterGeneratorContext {
  spec: any;
  manifest: any;
}

export async function generate(context: PatternAdapterGeneratorContext): Promise<string> {
  // Try to find the react-pattern-adapter.tsx source file
  // It should be in specverse-app-demo/frontend-react/src/lib/react-pattern-adapter.tsx

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Possible locations for the source file
  const possiblePaths = [
    // PRIORITY 1: Bundled with package (in libs/ directory)
    // From dist/libs/instance-factories/applications/templates/react/ to libs/instance-factories/applications/templates/react/
    join(__dirname, '../../../../../../libs/instance-factories/applications/templates/react/react-pattern-adapter.tsx'),
    // PRIORITY 2: Development environment (specverse-app-demo sibling)
    // Relative to instance factories in development
    join(__dirname, '../../../../../../../specverse-app-demo/frontend-react/src/lib/react-pattern-adapter.tsx'),
    // Relative to specverse-lang root
    join(__dirname, '../../../../../../specverse-app-demo/frontend-react/src/lib/react-pattern-adapter.tsx'),
    // Sibling to specverse-lang
    join(__dirname, '../../../../../../../specverse-app-demo/frontend-react/src/lib/react-pattern-adapter.tsx')
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
    // The imports from @specverse/lang/browser are valid and exported
    return `/**
 * ReactPatternAdapter - Pattern-Based View Rendering
 *
 * AUTO-GENERATED: Copied from specverse-app-demo
 * Source: ${foundPath}
 *
 * This file provides pattern detection and React/Tailwind rendering for
 * tech-independent composite patterns. It is bundled with generated code
 * for standalone deployment.
 *
 * Imports COMPOSITE_VIEW_PATTERNS and types from @specverse/lang/browser
 * which are exported from the published npm package.
 *
 * DO NOT EDIT: Changes will be overwritten on next generation.
 * To customize, create a wrapper or modify the original source.
 */

${adapterSource}
`;
  }

  // Fallback: Return stub that imports from @specverse/lang/browser
  return `/**
 * ReactPatternAdapter - Pattern-Based View Rendering (STUB)
 *
 * ⚠️ WARNING: Could not locate react-pattern-adapter.tsx source file.
 *
 * This is a stub implementation that imports from @specverse/lang/browser.
 * For full functionality, ensure specverse-app-demo is available at generation time.
 *
 * Attempted paths:
${possiblePaths.map(p => ` * - ${p}`).join('\n')}
 */

import { useMemo } from 'react';
import {
  COMPOSITE_VIEW_PATTERNS,
  type CompositeViewPattern,
  type CURVEDOperation
} from '@specverse/lang/browser';

/**
 * React-specific protocol mapping for CURVED operations (STUB)
 */
export const REACT_PROTOCOL_MAPPING: Record<CURVEDOperation, {
  method: string;
  pathPattern: string;
}> = {
  create: {
    method: 'POST',
    pathPattern: '/api/{resource}'
  },
  update: {
    method: 'PUT',
    pathPattern: '/api/{resource}/{id}'
  },
  retrieve: {
    method: 'GET',
    pathPattern: '/api/{resource}/{id}'
  },
  retrieve_many: {
    method: 'GET',
    pathPattern: '/api/{resource}'
  },
  validate: {
    method: 'POST',
    pathPattern: '/api/{resource}/validate'
  },
  evolve: {
    method: 'POST',
    pathPattern: '/api/{resource}/{id}/evolve'
  },
  delete: {
    method: 'DELETE',
    pathPattern: '/api/{resource}/{id}'
  }
};

/**
 * Simple Tailwind adapter stub
 */
const createStubTailwindAdapter = () => ({
  renderComponent: (type: string, _props: any) => {
    return \`<div class="p-2 text-gray-600">[\${type}]</div>\`;
  }
});

/**
 * Stub PatternAdapter that uses browser exports
 */
export function usePatternAdapter() {
  return useMemo(() => ({
    tailwindAdapter: createStubTailwindAdapter(),

    detectPattern(view: any): CompositeViewPattern | null {
      const viewType = view.type?.toLowerCase();
      const typeToPattern: Record<string, string> = {
        'form': 'form-view',
        'list': 'list-view',
        'detail': 'detail-view',
        'dashboard': 'dashboard-view'
      };
      const patternId = typeToPattern[viewType];
      return patternId ? COMPOSITE_VIEW_PATTERNS[patternId] : null;
    },

    renderPattern(_context: any): string {
      return \`
        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p class="text-yellow-800 font-semibold">⚠️ Pattern Adapter Stub</p>
          <p class="text-sm text-yellow-700 mt-2">
            Full ReactPatternAdapter could not be bundled.
            Views will not render correctly.
          </p>
        </div>
      \`;
    }
  }), []);
}

export { COMPOSITE_VIEW_PATTERNS } from '@specverse/lang/browser';

console.warn('⚠️ Using stub ReactPatternAdapter - full source file not found during generation');
`;
}
