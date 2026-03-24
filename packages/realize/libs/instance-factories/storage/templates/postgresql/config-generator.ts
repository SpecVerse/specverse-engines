/**
 * PostgreSQL Configuration Generator
 *
 * Generates database configuration for PostgreSQL instances
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate PostgreSQL configuration
 */
export default function generatePostgreSQLConfig(context: TemplateContext): string {
  const { instance, implType } = context;
  const config = implType.configuration || {};
  const instanceName = instance?.name || 'default';

  return `/**
 * PostgreSQL Database Configuration
 * Instance: ${instanceName}
 * Generated from SpecVerse specification
 */

import { Pool, PoolConfig } from 'pg';

export const ${instanceName}Config: PoolConfig = {
  host: process.env.${instanceName.toUpperCase()}_DB_HOST || ${JSON.stringify(config.host || 'localhost')},
  port: parseInt(process.env.${instanceName.toUpperCase()}_DB_PORT || '${config.port || 5432}'),
  database: process.env.${instanceName.toUpperCase()}_DB_NAME || ${JSON.stringify(config.database || 'app')},
  user: process.env.${instanceName.toUpperCase()}_DB_USER,
  password: process.env.${instanceName.toUpperCase()}_DB_PASSWORD,

  // Connection pool settings
  min: ${config.pool?.min || 2},
  max: ${config.pool?.max || 10},
  idleTimeoutMillis: ${config.pool?.idleTimeoutMillis || 30000},
  connectionTimeoutMillis: ${config.pool?.connectionTimeoutMillis || 2000},

  // Performance settings
  statement_timeout: 30000,
  query_timeout: 30000,
};

// Create connection pool
export const ${instanceName}Pool = new Pool(${instanceName}Config);

// Handle pool errors
${instanceName}Pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client (${instanceName})', err);
  process.exit(-1);
});

export default ${instanceName}Pool;
`;
}
