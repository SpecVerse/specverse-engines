/**
 * TSConfig Generator for React App
 *
 * Generates TypeScript configuration for frontend
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateTsConfig(context: TemplateContext): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      types: ["vite/client"],

      /* Bundler mode */
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",

      /* Linting */
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"]
  }, null, 2);
}
