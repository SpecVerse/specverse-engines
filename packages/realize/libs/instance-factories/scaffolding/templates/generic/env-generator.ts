/**
 * Generic .env Generator
 *
 * Aggregates environment variables from all implementation types
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { TemplateContext } from '@specverse/engine-realize';

export default function generateEnv(context: TemplateContext): string {
  const { manifest } = context;

  const envVars = aggregateEnvironmentVariables(context.implementationTypes || []);

  // Try to read parent .env file for DATABASE_URL
  let parentDatabaseUrl: string | undefined;
  try {
    const parentEnvPath = join(process.cwd(), '.env');
    if (existsSync(parentEnvPath)) {
      const parentEnvContent = readFileSync(parentEnvPath, 'utf-8');
      const match = parentEnvContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
      if (match) {
        parentDatabaseUrl = match[1];
      }
    }
  } catch (err) {
    // Ignore errors, will use default
  }

  // Group by category
  const byCategory: Record<string, any[]> = {};
  for (const envVar of envVars) {
    const category = envVar.category || 'Configuration';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(envVar);
  }

  // Generate .env content
  const lines: string[] = [];

  for (const [category, vars] of Object.entries(byCategory)) {
    lines.push(`# ${category}`);

    for (const envVar of vars) {
      if (envVar.description) {
        lines.push(`# ${envVar.description}`);
      }

      // Use parent DATABASE_URL if available, otherwise use example value
      let value = envVar.example || '';
      if (envVar.name === 'DATABASE_URL' && parentDatabaseUrl) {
        value = parentDatabaseUrl;
      }
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
