/**
 * Generic Main Application Generator
 *
 * Detects framework from manifest and generates appropriate entry point
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateMain(context: TemplateContext): string {
  const { spec, manifest } = context;

  // Detect which framework from manifest capability mappings
  // In v3.3 format, we need to find the capability mapping for api.rest
  let framework = 'fastify'; // default

  if (manifest.capabilityMappings) {
    const apiMapping = manifest.capabilityMappings.find((m: any) =>
      m.capability === 'api.rest'
    );

    // Extract framework hint from instanceFactory name (e.g., "FastifyAPI" -> "fastify")
    if (apiMapping?.instanceFactory) {
      const factoryName = apiMapping.instanceFactory.toLowerCase();
      if (factoryName.includes('fastify')) framework = 'fastify';
      else if (factoryName.includes('express')) framework = 'express';
      else if (factoryName.includes('nestjs')) framework = 'nestjs';
    }
  }

  // Route to framework-specific generator
  switch (framework) {
    case 'fastify':
      return generateFastifyMain(spec);
    case 'express':
      return generateExpressMain(spec);
    case 'nestjs':
      return generateNestJSMain(spec);
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}

function generateFastifyMain(spec: any): string {
  const controllers = spec.controllers || [];
  const services = spec.services || [];

  const routeImports = controllers.map((ctrl: any) =>
    `import ${ctrl.name.replace('Controller', '')}Routes from './routes/${ctrl.name}.js';`
  ).join('\n');

  // MetaRoutes disabled for now - enable when meta-routes generator is integrated
  // const metaRoutesImport = `import MetaRoutes from './routes/MetaRoutes.js';`;
  const metaRoutesImport = ``;

  const serviceImports = services.map((svc: any) =>
    `import { ${svc.name} } from './services/${svc.name}.js';`
  ).join('\n');

  const controllerImports = controllers.map((ctrl: any) =>
    `import { ${ctrl.name} } from './controllers/${ctrl.name}.js';`
  ).join('\n');

  const serviceInstantiations = services.map((svc: any) =>
    `  const ${svc.name.charAt(0).toLowerCase() + svc.name.slice(1)} = new ${svc.name}(prisma);`
  ).join('\n');

  const controllerInstantiations = controllers.map((ctrl: any) =>
    `  const ${ctrl.name.charAt(0).toLowerCase() + ctrl.name.slice(1)} = new ${ctrl.name}();`
  ).join('\n');

  const serviceMap = services.map((svc: any) =>
    `    ${svc.name}: ${svc.name.charAt(0).toLowerCase() + svc.name.slice(1)}`
  ).join(',\n');

  const controllerMap = controllers.map((ctrl: any) =>
    `    ${ctrl.name}: ${ctrl.name.charAt(0).toLowerCase() + ctrl.name.slice(1)}`
  ).join(',\n');

  const routeRegistrations = controllers.map((ctrl: any) => {
    // Generate RESTful path: /api/{model-name-plural}
    // E.g., UserController -> /api/users, EventController -> /api/events
    let prefix = ctrl.basePath;
    if (!prefix) {
      const modelName = ctrl.model || ctrl.name.replace('Controller', '');
      const pluralModel = modelName.toLowerCase() + 's';
      prefix = `/api/${pluralModel}`;
    }
    return `  await app.register(${ctrl.name.replace('Controller', '')}Routes, {
    prefix: '${prefix}',
    controllers: {
      ${ctrl.name}: ${ctrl.name.charAt(0).toLowerCase() + ctrl.name.slice(1)}
    },
    services: services
  });`;
  }).join('\n');

  return `import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
${routeImports}
${metaRoutesImport}
${serviceImports}
${controllerImports}

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

const prisma = new PrismaClient();

async function start() {
  try {
    // Initialize services and controllers
${serviceInstantiations}
${controllerInstantiations}
${controllers.length > 0 ? `
    const services = {
${serviceMap}
    };` : ''}

    // Register plugins
    await app.register(cors, {
      origin: true,
      credentials: true
    });

    // Register routes
  // MetaRoutes disabled for now - enable when meta-routes generator is integrated
  // await app.register(MetaRoutes, {
  //   prefix: '/api'
  // });
${routeRegistrations}

    const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    // Try to start server with automatic port fallback
    let port = preferredPort;
    let started = false;
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts && !started; i++) {
      port = preferredPort + i;
      try {
        await app.listen({ port, host });
        started = true;

        if (i > 0) {
          console.log(\`⚠️  Port \${preferredPort} was in use, using \${port} instead\`);
        }
        console.log(\`🚀 Server running on http://\${host}:\${port}\`);
        console.log(\`📚 Environment: \${process.env.NODE_ENV || 'development'}\`);
      } catch (err: any) {
        if (err.code === 'EADDRINUSE' && i < maxAttempts - 1) {
          // Port in use, try next port
          continue;
        } else {
          // Different error or ran out of attempts
          throw err;
        }
      }
    }

    if (!started) {
      throw new Error(\`Could not find available port in range \${preferredPort}-\${preferredPort + maxAttempts - 1}\`);
    }
  } catch (err) {
    app.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n👋 Shutting down gracefully...');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\\n👋 Shutting down gracefully...');
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
`;
}

function generateExpressMain(spec: any): string {
  const controllers = spec.controllers || [];

  const routeImports = controllers.map((ctrl: any) =>
    `import ${ctrl.name.replace('Controller', '')}Router from './routes/${ctrl.name}.js';`
  ).join('\n');

  const routeRegistrations = controllers.map((ctrl: any) =>
    `app.use('${ctrl.basePath || '/api'}', ${ctrl.name.replace('Controller', '')}Router);`
  ).join('\n');

  return `import express from 'express';
import cors from 'cors';
${routeImports}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
${routeRegistrations}

async function start() {
  const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const host = process.env.HOST || '0.0.0.0';
  const maxAttempts = 10;

  // Try to start server with automatic port fallback
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, host, () => {
          if (i > 0) {
            console.log(\`⚠️  Port \${preferredPort} was in use, using \${port} instead\`);
          }
          console.log(\`🚀 Server running on http://\${host}:\${port}\`);
          console.log(\`📚 Environment: \${process.env.NODE_ENV || 'development'}\`);
          resolve(server);
        }).on('error', (err: any) => {
          if (err.code === 'EADDRINUSE' && i < maxAttempts - 1) {
            resolve(null); // Try next port
          } else {
            reject(err);
          }
        });
      });
      break; // Successfully started
    } catch (err) {
      if (i === maxAttempts - 1) {
        console.error(\`Could not find available port in range \${preferredPort}-\${preferredPort + maxAttempts - 1}\`);
        process.exit(1);
      }
    }
  }
}

start();

export default app;
`;
}

function generateNestJSMain(spec: any): string {
  return `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose']
  });

  app.enableCors({
    origin: true,
    credentials: true
  });

  const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const host = process.env.HOST || '0.0.0.0';
  const maxAttempts = 10;

  // Try to start server with automatic port fallback
  let started = false;
  for (let i = 0; i < maxAttempts && !started; i++) {
    const port = preferredPort + i;
    try {
      await app.listen(port, host);
      started = true;

      if (i > 0) {
        console.log(\`⚠️  Port \${preferredPort} was in use, using \${port} instead\`);
      }
      console.log(\`🚀 Server running on http://\${host}:\${port}\`);
      console.log(\`📚 Environment: \${process.env.NODE_ENV || 'development'}\`);
    } catch (err: any) {
      if (err.code === 'EADDRINUSE' && i < maxAttempts - 1) {
        // Port in use, try next port
        continue;
      } else {
        throw err;
      }
    }
  }

  if (!started) {
    throw new Error(\`Could not find available port in range \${preferredPort}-\${preferredPort + maxAttempts - 1}\`);
  }
}

bootstrap();
`;
}
