/**
 * Generic README Generator
 *
 * Generates README based on spec and manifest choices
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateReadme(context: TemplateContext): string {
  const { spec, manifest } = context;

  const sections: string[] = [];

  // Title and description
  sections.push(`# ${spec.metadata?.component || 'SpecVerse Application'}`);
  sections.push('');
  sections.push(spec.metadata?.description || 'Generated with SpecVerse');
  sections.push('');

  // Tech stack (inferred from manifest)
  const techStack = inferTechStack(manifest);
  if (techStack.length > 0) {
    sections.push('## Tech Stack');
    sections.push('');
    for (const tech of techStack) {
      sections.push(`- **${tech.category}**: ${tech.items.join(', ')}`);
    }
    sections.push('');
  }

  // Prerequisites
  sections.push('## Getting Started');
  sections.push('');
  sections.push('### Prerequisites');
  sections.push('');
  sections.push('- Node.js 18+');
  sections.push('- npm or yarn');

  if (usesPrisma(manifest)) {
    sections.push('- PostgreSQL (or your database of choice)');
  }

  sections.push('');

  // Installation
  sections.push('### Installation');
  sections.push('');
  sections.push('```bash');
  sections.push('npm install');
  sections.push('```');
  sections.push('');

  // Environment setup
  const hasEnvVars = manifestHasEnvVars(manifest);
  if (hasEnvVars) {
    sections.push('### Environment Setup');
    sections.push('');
    sections.push('```bash');
    sections.push('cp .env.example .env');
    sections.push('```');
    sections.push('');
    sections.push('Configure your environment variables in `.env`');
    sections.push('');
  }

  // Database setup if using Prisma
  if (usesPrisma(manifest)) {
    sections.push('### Database Setup');
    sections.push('');
    sections.push('**Important**: Create the database before running Prisma commands.');
    sections.push('');
    sections.push('```bash');
    sections.push('# Create database (PostgreSQL example)');
    sections.push('createdb your_database_name');
    sections.push('');
    sections.push('# Or using psql:');
    sections.push('# psql postgres');
    sections.push('# CREATE DATABASE your_database_name;');
    sections.push('# \\q');
    sections.push('');
    sections.push('# Update DATABASE_URL in .env with your database name');
    sections.push('# DATABASE_URL="postgresql://localhost:5432/your_database_name"');
    sections.push('');
    sections.push('# Generate Prisma client');
    sections.push('npm run db:generate');
    sections.push('');
    sections.push('# Push schema to database (for development)');
    sections.push('npm run db:push');
    sections.push('');
    sections.push('# Or use migrations (for production)');
    sections.push('npm run db:migrate');
    sections.push('```');
    sections.push('');
  }

  // Development
  sections.push('### Development');
  sections.push('');
  sections.push('```bash');
  sections.push('npm run dev');
  sections.push('```');
  sections.push('');

  // Production
  sections.push('### Production Build');
  sections.push('');
  sections.push('```bash');
  sections.push('npm run build');
  sections.push('npm start');
  sections.push('```');
  sections.push('');

  // API Documentation
  if (hasRestAPI(manifest)) {
    sections.push('## API');
    sections.push('');
    sections.push('The API server runs on `http://localhost:${PORT}` (default: 3000)');
    sections.push('');

    // List controllers if present
    if (spec.controllers && spec.controllers.length > 0) {
      sections.push('### Endpoints');
      sections.push('');
      for (const controller of spec.controllers) {
        sections.push(`- **${controller.name}**: \`${controller.basePath || '/api'}\``);
      }
      sections.push('');
    }
  }

  // Generated notice
  sections.push('---');
  sections.push('');
  sections.push('_Generated with [SpecVerse](https://github.com/specverse/specverse-lang)_');

  return sections.join('\n');
}

function inferTechStack(manifest: any): Array<{category: string, items: string[]}> {
  const stack: Array<{category: string, items: string[]}> = [];

  if (!manifest || !manifest.capabilityMappings) {
    return stack;
  }

  // Runtime
  stack.push({
    category: 'Runtime',
    items: ['Node.js', 'TypeScript']
  });

  // Framework - extract from capability mapping
  const apiMapping = manifest.capabilityMappings.find((m: any) =>
    m.capability === 'api.rest'
  );
  if (apiMapping) {
    stack.push({
      category: 'Web Framework',
      items: [apiMapping.instanceFactory]
    });
  }

  // ORM - extract from capability mapping
  const ormMapping = manifest.capabilityMappings.find((m: any) =>
    m.capability === 'orm.client' || m.capability === 'orm.schema'
  );
  if (ormMapping) {
    stack.push({
      category: 'ORM',
      items: [ormMapping.instanceFactory]
    });
  }

  return stack;
}

function usesPrisma(manifest: any): boolean {
  if (!manifest || !manifest.capabilityMappings) {
    return false;
  }

  return manifest.capabilityMappings.some((m: any) =>
    m.instanceFactory?.toLowerCase().includes('prisma')
  );
}

function hasRestAPI(manifest: any): boolean {
  if (!manifest || !manifest.capabilityMappings) {
    return false;
  }

  return manifest.capabilityMappings.some((m: any) =>
    m.capability === 'api.rest'
  );
}

function manifestHasEnvVars(manifest: any): boolean {
  // In v3.3, we always assume there are env vars if we have database or server config
  if (!manifest || !manifest.capabilityMappings) {
    return false;
  }

  // Check if there are database or API capabilities (they typically need env vars)
  return manifest.capabilityMappings.some((m: any) =>
    m.capability === 'storage.database' || m.capability === 'api.rest'
  );
}
