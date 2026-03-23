/**
 * PostgreSQL Docker Compose Generator
 *
 * Generates Docker Compose configuration for PostgreSQL instances
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate Docker Compose configuration for PostgreSQL
 */
export default function generatePostgreSQLDocker(context: TemplateContext): string {
  const { instance, implType } = context;
  const config = implType.configuration || {};
  const instanceName = instance?.name || 'postgres';

  return `# PostgreSQL Docker Compose Configuration
# Instance: ${instanceName}
# Generated from SpecVerse specification

version: '3.8'

services:
  ${instanceName}:
    image: postgres:15-alpine
    container_name: ${instanceName}
    restart: unless-stopped

    ports:
      - "\${${instanceName.toUpperCase()}_DB_PORT:-${config.port || 5432}}:5432"

    environment:
      POSTGRES_DB: \${${instanceName.toUpperCase()}_DB_NAME:-app}
      POSTGRES_USER: \${${instanceName.toUpperCase()}_DB_USER:-postgres}
      POSTGRES_PASSWORD: \${${instanceName.toUpperCase()}_DB_PASSWORD}

      # Performance settings
      POSTGRES_MAX_CONNECTIONS: ${config.settings?.max_connections || 100}
      POSTGRES_SHARED_BUFFERS: ${config.settings?.shared_buffers || '256MB'}

    volumes:
      - ${instanceName}_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${${instanceName.toUpperCase()}_DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  ${instanceName}_data:
    driver: local
`;
}
