/**
 * Generic .env.example Generator
 *
 * Same as .env but for version control
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateEnvExample(context: TemplateContext): string {
  const { manifest } = context;

  const envVars = aggregateEnvironmentVariables(context.implementationTypes || []);

  // Group by category
  const byCategory: Record<string, any[]> = {};
  for (const envVar of envVars) {
    const category = envVar.category || 'Configuration';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(envVar);
  }

  // Generate .env.example content
  const lines: string[] = [
    '# Environment Configuration',
    '# Copy this file to .env and fill in your values',
    ''
  ];

  for (const [category, vars] of Object.entries(byCategory)) {
    lines.push(`# ${category}`);

    for (const envVar of vars) {
      if (envVar.description) {
        lines.push(`# ${envVar.description}`);
      }

      if (envVar.required) {
        lines.push(`# REQUIRED`);
      }

      // Use example value or empty
      const value = envVar.example || '';
      lines.push(`${envVar.name}="${value}"`);
    }

    lines.push(''); // Empty line between categories
  }

  return lines.join('\n');
}

function aggregateEnvironmentVariables(implementationTypes: any[]): any[] {
  const envVarsMap = new Map<string, any>();

  if (!implementationTypes || implementationTypes.length === 0) {
    return [];
  }

  // Deduplicate by environment variable name (keep first occurrence)
  for (const implType of implementationTypes) {
    if (implType.requirements?.environment) {
      for (const envVar of implType.requirements.environment) {
        if (!envVarsMap.has(envVar.name)) {
          envVarsMap.set(envVar.name, envVar);
        }
      }
    }
  }

  return Array.from(envVarsMap.values());
}
