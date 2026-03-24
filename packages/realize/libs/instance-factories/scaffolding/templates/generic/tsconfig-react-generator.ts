/**
 * React TSConfig Generator
 *
 * Generates TypeScript configuration for React components with bundler module resolution
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateReactTsConfig(context: TemplateContext): string {
  const tsconfigReact = {
    extends: './tsconfig.json',
    compilerOptions: {
      // React/Vite specific settings
      moduleResolution: 'bundler',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      jsx: 'react-jsx',
      jsxImportSource: 'react',
      types: ['vite/client'],

      // Allow importing .ts/.tsx files with extensions
      allowImportingTsExtensions: true,

      // Project reference settings
      composite: true,
      outDir: './dist/react'
    },
    include: ['src/**/*.tsx', 'src/**/*.ts'],
    exclude: [
      'node_modules',
      'dist',
      '**/*.test.ts',
      '**/*.spec.ts',
      'src/main.ts',  // Backend entry point
      'src/controllers/**',  // Backend controllers
      'src/routes/**',  // Backend routes
      'src/services/**'  // Backend services (if any)
    ]
  };

  return JSON.stringify(tsconfigReact, null, 2);
}
