/**
 * Frontend Package JSON Generator
 *
 * Generates package.json for the frontend workspace with React dependencies
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate frontend workspace package.json
 */
export default function generateFrontendPackageJson(context: TemplateContext): string {
  const { spec } = context;

  const componentName = spec?.name || 'app';
  const packageName = `${componentName.toLowerCase()}-frontend`;

  const packageJson = {
    name: packageName,
    version: '1.0.0',
    description: `Frontend for ${spec?.description || componentName}`,
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
      'type-check': 'tsc --noEmit'
    },
    dependencies: {
      'react': '^18.3.1',
      'react-dom': '^18.3.1',
      'react-router-dom': '^6.26.2',
      '@tanstack/react-query': '^5.56.2',
      'zustand': '^4.5.5',
      'axios': '^1.7.7'
    },
    devDependencies: {
      '@types/react': '^18.3.9',
      '@types/react-dom': '^18.3.0',
      '@typescript-eslint/eslint-plugin': '^8.7.0',
      '@typescript-eslint/parser': '^8.7.0',
      '@vitejs/plugin-react': '^4.3.1',
      'eslint': '^9.11.1',
      'eslint-plugin-react-hooks': '^5.1.0-rc.0',
      'eslint-plugin-react-refresh': '^0.4.12',
      'typescript': '^5.6.2',
      'vite': '^5.4.8'
    }
  };

  return JSON.stringify(packageJson, null, 2);
}
