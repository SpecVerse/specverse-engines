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

  // Find the project root (contains prompts/ directory)
  const possibleRoots = [
    resolve(__dirname, '../../'),      // From src/ai/ to project root
    resolve(__dirname, '../../../'),   // From dist/ai/ to project root
    resolve(__dirname, '../../../../'), // From node_modules/@specverse/lang/dist/ai/
  ];

  let projectRoot: string | null = null;
  for (const root of possibleRoots) {
    if (existsSync(join(root, 'prompts'))) {
      projectRoot = root;
      break;
    }
  }

  if (!projectRoot) {
    throw new Error('Could not locate prompts directory');
  }

  // Resolve version to path
  if (pver === 'default' || pver.match(/^v\d+$/)) {
    // All versions (default, v1, v2, v3, ...) live in subdirectories
    let versionPath = join(projectRoot, 'prompts/core/standard', pver);

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

    // Get the project root
    const __filename = basePath || fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const possibleRoots = [
      resolve(__dirname, '../../'),
      resolve(__dirname, '../../../'),
      resolve(__dirname, '../../../../'),
    ];

    let projectRoot: string | null = null;
    for (const root of possibleRoots) {
      if (existsSync(join(root, 'prompts'))) {
        projectRoot = root;
        break;
      }
    }

    if (!projectRoot) {
      return [];
    }

    // Dynamically discover all vN directories
    const standardPath = join(projectRoot, 'prompts/core/standard');
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