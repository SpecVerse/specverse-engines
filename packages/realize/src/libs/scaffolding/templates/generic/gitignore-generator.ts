/**
 * Generic .gitignore Generator
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateGitIgnore(context: TemplateContext): string {
  const { manifest } = context;

  const ignorePatterns = [
    '# Dependencies',
    'node_modules/',
    '',
    '# Build output',
    'dist/',
    'build/',
    '',
    '# Environment',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '# TypeScript',
    '*.tsbuildinfo',
    '',
    '# Logs',
    'logs/',
    '*.log',
    'npm-debug.log*',
    '',
  ];

  // Add Prisma specific ignores if using Prisma
  if (usesPrisma(manifest)) {
    ignorePatterns.push(
      '# Prisma',
      'prisma/migrations/',
      '',
    );
  }

  ignorePatterns.push(
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Testing',
    'coverage/',
    '.nyc_output/'
  );

  return ignorePatterns.join('\n');
}

function usesPrisma(manifest: any): boolean {
  if (!manifest || !manifest.capabilityMappings) {
    return false;
  }

  return manifest.capabilityMappings.some((m: any) =>
    m.instanceFactory?.toLowerCase().includes('prisma')
  );
}
