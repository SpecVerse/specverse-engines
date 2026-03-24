/**
 * Generic TSConfig Generator
 *
 * Generates TypeScript configuration based on manifest choices
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateTsConfig(context: TemplateContext): string {
  const { manifest, spec } = context;

  // Extract TypeScript options from implementation types
  const mergedOptions = extractTsConfigOptions(context.implementationTypes || []);

  // Detect if we're using React - check both implementation types AND if we have views in the spec
  const hasViews = spec && (spec.views || (Array.isArray(spec.views) && spec.views.length > 0));
  const usesReact = hasViews && (context.implementationTypes || []).some((implType: any) =>
    implType.capabilities?.provides?.includes('ui.components') &&
    implType.technology?.framework === 'react'
  );

  // Base tsconfig for backend code
  const tsconfig = {
    compilerOptions: {
      // Defaults
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'node',
      lib: ['ES2022'],
      outDir: './dist',
      rootDir: './src',

      // Strict mode
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,

      // Module resolution
      resolveJsonModule: true,
      allowSyntheticDefaultImports: true,

      // Output
      declaration: true,
      declarationMap: true,
      sourceMap: true,

      // Merge options from implementation types
      ...mergedOptions
    },
    include: usesReact ? ['src/**/*.ts'] : ['src/**/*'],  // Exclude .tsx files if React is used
    exclude: usesReact
      ? ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts', 'src/components/**', 'src/hooks/**', 'src/types/**']  // Exclude React-specific dirs
      : ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts'],
    ...(usesReact && {
      references: [{ path: './tsconfig.react.json' }]  // Reference React config
    })
  };

  return JSON.stringify(tsconfig, null, 2);
}

function extractTsConfigOptions(implementationTypes: any[]): any {
  const options: any = {};

  if (!implementationTypes || implementationTypes.length === 0) {
    return options;
  }

  for (const implType of implementationTypes) {
    // Access from generic configuration.tsconfig structure
    if (implType.requirements?.configuration?.tsconfig?.compilerOptions) {
      Object.assign(options, implType.requirements.configuration.tsconfig.compilerOptions);
    }
  }

  return options;
}
