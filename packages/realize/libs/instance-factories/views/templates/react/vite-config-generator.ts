/**
 * Vite Configuration Generator
 *
 * Generates vite.config.ts for React application with backend proxy
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate vite.config.ts
 */
export default function generateViteConfig(context: TemplateContext): string {
  const { backendPort = 3000 } = context;

  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:${backendPort}',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
`;
}
