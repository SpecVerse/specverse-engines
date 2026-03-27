/**
 * Backend Package.json Generator
 *
 * Generates package.json for backend workspace in monorepo
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateBackendPackageJson(context: TemplateContext): string {
  const { spec } = context;

  const appName = (spec.metadata?.component || 'app').toLowerCase().replace(/\s+/g, '-');

  const pkg: Record<string, any> = {
    name: `${appName}-backend`,
    version: spec.metadata?.version || '1.0.0',
    description: `Backend API for ${spec.metadata?.component || 'application'}`,
    type: 'module',
    bin: {
      [appName]: './bin/cli.mjs'
    },

    scripts: {
      // Development
      'dev': 'tsx watch src/main.ts',
      'dev:debug': 'tsx watch --inspect src/main.ts',

      // Build
      'build': 'tsc',
      'build:watch': 'tsc --watch',

      // Production
      'start': 'node dist/main.js',

      // Database
      'db:setup': 'prisma generate && prisma db push',
      'db:generate': 'prisma generate',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev',
      'db:studio': 'prisma studio',
      'db:seed': 'tsx prisma/seed.ts',

      // Testing
      'test': 'vitest run --passWithNoTests',
      'test:watch': 'vitest watch',
      'test:coverage': 'vitest --coverage',

      // Linting
      'lint': 'eslint src --ext .ts',
      'lint:fix': 'eslint src --ext .ts --fix',

      // Type checking
      'typecheck': 'tsc --noEmit'
    },

    dependencies: {
      '@prisma/client': '^5.7.0',
      'fastify': '^4.25.0',
      '@fastify/cors': '^8.4.0',
      '@fastify/helmet': '^11.1.1',
      '@fastify/rate-limit': '^9.1.0',
      'zod': '^3.22.0',
      'dotenv': '^16.3.0'
    },

    devDependencies: {
      'typescript': '^5.3.0',
      '@types/node': '^20.10.0',
      'tsx': '^4.7.0',
      'prisma': '^5.7.0',
      'vitest': '^1.0.0',
      '@vitest/coverage-v8': '^1.0.0',
      'eslint': '^8.55.0',
      '@typescript-eslint/eslint-plugin': '^6.15.0',
      '@typescript-eslint/parser': '^6.15.0'
    },

    engines: {
      node: '>=18.0.0'
    }
  };

  return JSON.stringify(pkg, null, 2);
}
