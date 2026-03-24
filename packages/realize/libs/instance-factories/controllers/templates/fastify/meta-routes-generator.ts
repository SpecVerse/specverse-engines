/**
 * Fastify Meta Routes Generator
 *
 * Generates meta API endpoints for serving spec and view metadata
 * These endpoints are needed by view-renderers architecture
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate Fastify meta routes for spec and views metadata
 */
export default function generateMetaRoutes(context: TemplateContext): string {
  const { spec } = context;

  return `/**
 * Meta API Routes
 *
 * Provides spec and view metadata endpoints for the frontend
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'yaml';

export default async function MetaRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Get specification
  fastify.get('/spec', async (request, reply) => {
    try {
      const specPath = join(process.cwd(), '../../../specs/main.specly');
      const specContent = await readFile(specPath, 'utf-8');
      const spec = parse(specContent);
      return spec;
    } catch (error: any) {
      reply.status(500).send({ error: \`Failed to load spec: \${error.message}\` });
    }
  });

  // Get all views
  fastify.get('/views', async (request, reply) => {
    try {
      const specPath = join(process.cwd(), '../../../specs/main.specly');
      const specContent = await readFile(specPath, 'utf-8');
      const spec = parse(specContent);

      // Extract views from the spec
      const views = [];
      if (spec.components && typeof spec.components === 'object') {
        // components is an object with component names as keys
        for (const [componentName, component] of Object.entries(spec.components)) {
          if (component && typeof component === 'object' && 'views' in component) {
            const componentViews = component.views as Record<string, any>;
            for (const [viewName, viewDef] of Object.entries(componentViews)) {
              views.push({
                name: viewName,
                ...viewDef as any
              });
            }
          }
        }
      }

      return { views };
    } catch (error: any) {
      reply.status(500).send({ error: \`Failed to load views: \${error.message}\` });
    }
  });

  // Get individual view by name
  fastify.get('/views/:viewName', async (request, reply) => {
    try {
      const { viewName } = request.params as { viewName: string };
      const specPath = join(process.cwd(), '../../../specs/main.specly');
      const specContent = await readFile(specPath, 'utf-8');
      const spec = parse(specContent);

      // Find the view
      if (spec.components && typeof spec.components === 'object') {
        for (const [componentName, component] of Object.entries(spec.components)) {
          if (component && typeof component === 'object' && 'views' in component) {
            const componentViews = component.views as Record<string, any>;
            if (componentViews[viewName]) {
              return {
                name: viewName,
                ...componentViews[viewName]
              };
            }
          }
        }
      }

      reply.status(404).send({ error: \`View \${viewName} not found\` });
    } catch (error: any) {
      reply.status(500).send({ error: \`Failed to load view: \${error.message}\` });
    }
  });
}
`;
}
