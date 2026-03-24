/**
 * Prompt Path Resolution for AI Commands
 * Supports versioned prompts (v1, v2, v3, ...) and custom paths
 */

import { resolve, dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Resolve prompt version to actual file system path
 */
export function resolvePromptPath(pver: string, basePath?: string): string {
  // Get the base directory (CLI directory or provided base path)
  const __filename = basePath || fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Find prompts directory — check engine package assets first, then project root
  const possiblePromptDirs = [
    resolve(__dirname, '../assets/prompts'),        // From src/ to assets/ (development)
    resolve(__dirname, '../../assets/prompts'),      // From dist/ to assets/ (built)
    resolve(__dirname, '../../../assets/prompts'),    // From dist/commands/ to assets/
    resolve(__dirname, '../../'),                     // Legacy: project root with prompts/ subdir
    resolve(__dirname, '../../../'),
    resolve(__dirname, '../../../../'),
  ];

  let promptsBase: string | null = null;
  for (const dir of possiblePromptDirs) {
    // Check for assets/prompts layout (core/standard/vN inside)
    if (existsSync(join(dir, 'core', 'standard'))) {
      promptsBase = dir;
      break;
    }
    // Check for legacy project root layout (prompts/core/standard/vN)
    if (existsSync(join(dir, 'prompts', 'core', 'standard'))) {
      promptsBase = join(dir, 'prompts');
      break;
    }
  }

  if (!promptsBase) {
    throw new Error('Could not locate prompts directory. Ensure @specverse/engine-ai assets are installed.');
  }

  // Resolve version to path
  if (pver === 'default' || pver.match(/^v\d+$/)) {
    let versionPath = join(promptsBase, 'core/standard', pver);

    // Handle 'default' - symlink may not survive npm package installation
    if (pver === 'default' && !existsSync(versionPath)) {
      // Fallback to latest version (v7)
      const latestVersion = 'v7';
      versionPath = join(projectRoot, 'prompts/core/standard', latestVersion);
      if (!existsSync(versionPath)) {
        throw new Error(`Default prompt version (${latestVersion}) not found at ${versionPath}`);
      }
    } else if (!existsSync(versionPath)) {
      throw new Error(`Prompt version ${pver} not found at ${versionPath}`);
    }

    return versionPath;
  } else if (pver.startsWith('custom=')) {
    const customPath = pver.substring(7); // Remove 'custom=' prefix
    return resolve(customPath);
  } else {
    throw new Error(`Invalid prompt version: ${pver}. Use default, v1, v2, v3, ... or custom=path`);
  }
}

/**
 * Validate that a prompt path exists and contains required prompt files
 */
export function validatePromptPath(promptPath: string, operation?: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!existsSync(promptPath)) {
    errors.push(`Prompt path does not exist: ${promptPath}`);
    return { valid: false, errors };
  }

  // Check for required prompt files if operation is specified
  if (operation) {
    const requiredFile = join(promptPath, `${operation}.prompt.yaml`);
    if (!existsSync(requiredFile)) {
      errors.push(`Required prompt file not found: ${requiredFile}`);
    }
  } else {
    // Check for all standard prompt files
    const requiredFiles = ['analyse.prompt.yaml', 'create.prompt.yaml', 'materialise.prompt.yaml', 'realize.prompt.yaml'];
    for (const file of requiredFiles) {
      const filePath = join(promptPath, file);
      if (!existsSync(filePath)) {
        errors.push(`Required prompt file not found: ${filePath}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get available prompt versions
 */
export function getAvailablePromptVersions(basePath?: string): { version: string; path: string; name: string }[] {
  try {
    const versions: { version: string; path: string; name: string }[] = [];

    // Find prompts using the same resolution as resolvePromptPath
    const __filename2 = basePath || fileURLToPath(import.meta.url);
    const __dirname2 = dirname(__filename2);
    const possiblePromptDirs2 = [
      resolve(__dirname2, '../assets/prompts'),
      resolve(__dirname2, '../../assets/prompts'),
      resolve(__dirname2, '../../../assets/prompts'),
      resolve(__dirname2, '../../'),
      resolve(__dirname2, '../../../'),
      resolve(__dirname2, '../../../../'),
    ];

    let standardPath: string | null = null;
    for (const dir of possiblePromptDirs2) {
      const candidate = join(dir, 'core', 'standard');
      if (existsSync(candidate)) { standardPath = candidate; break; }
      const legacy = join(dir, 'prompts', 'core', 'standard');
      if (existsSync(legacy)) { standardPath = legacy; break; }
    }

    if (!standardPath) return [];
    if (existsSync(standardPath)) {
      const entries = readdirSync(standardPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.match(/^v\d+$/)) {
          const versionPath = join(standardPath, entry.name);
          const versionNum = entry.name.substring(1); // Remove 'v' prefix

          // Determine version description based on version number
          let description = `Prompts (${entry.name})`;
          if (entry.name === 'v2') {
            description = 'Optimized Prompts (v2, 75% token reduction)';
          } else if (entry.name === 'v3') {
            description = 'Three-Layer Architecture Prompts (v3)';
          }

          versions.push({
            version: entry.name,
            path: versionPath,
            name: description
          });
        }
      }
    }

    // Sort versions by version number
    versions.sort((a, b) => {
      const aNum = parseInt(a.version.substring(1) || '1');
      const bNum = parseInt(b.version.substring(1) || '1');
      return aNum - bNum;
    });

    return versions;
  } catch (error) {
    return [];
  }
}