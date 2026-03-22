/**
 * Backend tsconfig.json Generator
 *
 * Generates TypeScript configuration for backend workspace
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateBackendTsConfig(context: TemplateContext): string {
  const config = {
    compilerOptions: {
      // Target and Module
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022'],
      moduleResolution: 'node',

      // Output
      outDir: './dist',
      rootDir: './src',

      // Strict Type Checking
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,

      // Additional Checks
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,

      // Module Resolution
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
      isolatedModules: true,

      // Source Maps
      sourceMap: true,
      declaration: true,
      declarationMap: true,

      // Skip lib check for faster builds
      skipLibCheck: true,

      // Emit
      removeComments: false,
      importHelpers: true,

      // Experimental
      experimentalDecorators: true,
      emitDecoratorMetadata: true,

      // Types
      types: ['node']
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts']
  };

  return JSON.stringify(config, null, 2);
}
