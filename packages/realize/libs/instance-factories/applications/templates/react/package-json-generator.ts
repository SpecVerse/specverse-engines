/**
 * Package.json Generator for React Frontend
 *
 * Generates package.json for the frontend workspace
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generatePackageJson(context: TemplateContext): string {
  const { spec } = context;

  const appName = spec.metadata?.component?.toLowerCase() || 'frontend';
  const version = spec.metadata?.version || '1.0.0';
  const description = spec.metadata?.description || 'Frontend application';

  const pkg = {
    name: `${appName}-frontend`,
    version,
    description,
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview",
      test: "echo 'No tests configured for frontend'",
      lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
    },
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.18.0",
      "@tanstack/react-query": "^5.0.0",
      "react-hook-form": "^7.48.0",
      "zod": "^3.22.0",
      "@hookform/resolvers": "^3.3.0",
      "zustand": "^4.4.0"
    },
    devDependencies: {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "@vitejs/plugin-react": "^4.2.0",
      "typescript": "^5.2.0",
      "vite": "^5.0.0",
      "eslint": "^8.53.0",
      "@typescript-eslint/eslint-plugin": "^6.10.0",
      "@typescript-eslint/parser": "^6.10.0",
      "eslint-plugin-react-hooks": "^4.6.0",
      "eslint-plugin-react-refresh": "^0.4.4"
    }
  };

  return JSON.stringify(pkg, null, 2);
}
