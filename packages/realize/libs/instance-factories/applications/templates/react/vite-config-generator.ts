/**
 * Vite Config Generator for React App
 *
 * Generates Vite configuration with React plugin and proxy
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';
import { getApiBaseUrl, getPathConfig } from '../../../shared/path-resolver.js';

export default function generateViteConfig(context: TemplateContext): string {
  const { configuration } = context;
  const pathConfig = getPathConfig(context);

  const vitePort = configuration?.vite?.port || 5173;
  const viteHost = configuration?.vite?.host || 'localhost';
  const apiBaseUrl = getApiBaseUrl(pathConfig);
  const apiProxy = configuration?.vite?.proxy?.['/api'] || apiBaseUrl;

  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: ${vitePort},
    host: '${viteHost}',
    proxy: {
      '/api': {
        target: '${apiProxy}',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Prevent React duplication when using local packages
    dedupe: ['react', 'react-dom'],
  },
});
`;
}
