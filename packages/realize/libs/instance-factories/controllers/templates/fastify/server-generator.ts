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
  const { spec, models } = context;

  // Extract model names for route registration
  const allModels = models || (spec?.models ? Object.values(spec.models) : []);
  const modelNames = allModels.map((m: any) => m.name).filter(Boolean);

  // Generate route imports and registrations
  const routeImports = modelNames.map((name: string) =>
    `import ${name}Routes from './routes/${name}Controller.js';`
  ).join('\n');

  const routeRegistrations = modelNames.map((name: string) => {
    const path = `/api/${name.toLowerCase()}s`;
    return `  await fastify.register(${name}Routes, { prefix: '${path}', controllers: { ${name}Controller: new (await import('./controllers/${name}Controller.js')).${name}Controller() } });`;
  }).join('\n');

  return `/**
 * Fastify Server
 * Generated from SpecVerse specification
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Fastify
const fastify = Fastify({
  logger: { level: 'info' },
});

// Register plugins
await fastify.register(cors, { origin: true, credentials: true });

// Health check
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
fastify.get('/', async () => ({ name: 'SpecVerse Generated API', models: ${JSON.stringify(modelNames)} }));

// Register routes
${routeImports}

async function registerRoutes() {
${routeRegistrations}
}

// Start server
const start = async () => {
  try {
    await registerRoutes();
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(\`Server running at http://localhost:\${port}\`);
    console.log(\`API endpoints: ${modelNames.map((n: string) => `/api/${n.toLowerCase()}s`).join(', ')}\`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
`;
}
