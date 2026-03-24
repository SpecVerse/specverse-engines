/**
 * Fastify Server Generator
 *
 * Generates main Fastify server bootstrap file
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate Fastify server bootstrap
 */
export default function generateFastifyServer(context: TemplateContext): string {
  const { spec, implType } = context;
  const config = implType.configuration || {};

  return `/**
 * Fastify Server
 * Generated from SpecVerse specification
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

// Initialize Fastify
const fastify = Fastify({
  logger: ${JSON.stringify(config.server?.logger || { level: 'info' })},
  trustProxy: ${config.server?.trustProxy || true},
  requestIdLogLabel: '${config.server?.requestIdLogLabel || 'reqId'}'
});

// Register plugins
await fastify.register(cors, ${JSON.stringify(config.middleware?.cors || { origin: true, credentials: true })});
await fastify.register(helmet, ${JSON.stringify(config.middleware?.helmet || { enabled: true })});
await fastify.register(rateLimit, ${JSON.stringify(config.middleware?.rateLimit || { max: 100, timeWindow: '1 minute' })});

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

// Register routes (TODO: Auto-import route files)
// await fastify.register(import('./routes/user.js'));

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: parseInt(process.env.PORT || '${config.server?.port || 3000}'),
      host: process.env.HOST || '${config.server?.host || '0.0.0.0'}'
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
`;
}
