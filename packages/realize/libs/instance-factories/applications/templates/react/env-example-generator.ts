/**
 * .env.example Generator for React Frontend
 *
 * Generates example environment configuration
 */

import type { TemplateContext } from '@specverse/engine-realize';
import { getApiBaseUrl, getPathConfig } from '../../../shared/path-resolver.js';

export default function generateEnvExample(context: TemplateContext): string {
  const pathConfig = getPathConfig(context);
  const defaultApiUrl = getApiBaseUrl(pathConfig);

  return `# API Configuration
# Base URL for backend API
VITE_API_BASE_URL=${defaultApiUrl}

# API Path Prefix
VITE_API_PREFIX=/api

# Application Mode
VITE_APP_MODE=development
`;
}
