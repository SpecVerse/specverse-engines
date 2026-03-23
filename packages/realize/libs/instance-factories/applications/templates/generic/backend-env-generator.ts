/**
 * Backend .env Generator
 *
 * Generates .env file for backend workspace
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateBackendEnv(context: TemplateContext): string {
  const { spec } = context;

  const projectName = (spec.metadata?.component || 'app')
    .toLowerCase()
    .replace(/\s+/g, '-');

  const dbName = `spv_${projectName}_dev`;
  const dbUser = process.env.USER || 'postgres';

  return `# Backend Environment Configuration
# Database
DATABASE_URL="postgresql://${dbUser}:@localhost:5432/${dbName}"

# API Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# CORS
CORS_ORIGINS="http://localhost:5173"
`;
}
