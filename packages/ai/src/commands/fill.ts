/**
 * Action 2: Parameter-Filled Template
 * Fill template with user requirements and parameters
 */

import type { AIOperation, FilledPrompt, UserRequirements, AICommandOptions } from '../types/index.js';
import { getTemplate } from './template.js';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, basename, resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

function getDirectoryStructure(dirPath: string, maxDepth: number = 3): string {
  try {
    // Use ls to get directory structure
    const result = execSync(`ls -la "${dirPath}" | head -30`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Also try to get subdirectories
    let subDirs = '';
    try {
      subDirs = execSync(`find "${dirPath}" -type d -maxdepth 2 | head -20`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch {
      // Ignore subdirectory errors
    }

    return `=== Main Directory ===\n${result}\n\n=== Subdirectories ===\n${subDirs}`;
  } catch (error) {
    return `Unable to read directory structure: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function getKeyFilesContent(dirPath: string): string {
  const filePatterns = [
    'package.json', 'requirements.txt', 'pom.xml', 'build.gradle',
    'app.ts', 'app.js', 'server.ts', 'server.js', 'main.ts', 'main.js',
    'index.ts', 'index.js', '*.model.ts', '*.model.js', 'schema.ts', 'schema.js', 'schema.sql'
  ];

  let content = '';

  // Try to read package.json if it exists
  const packageJsonPath = join(dirPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkgContent = readFileSync(packageJsonPath, 'utf8');
      content += `\n=== package.json ===\n${pkgContent.split('\n').slice(0, 50).join('\n')}\n`;
    } catch {
      // Ignore read errors
    }
  }

  // Try to read schema.sql if it exists
  const schemaPath = join(dirPath, 'schema.sql');
  if (existsSync(schemaPath)) {
    try {
      const schemaContent = readFileSync(schemaPath, 'utf8');
      content += `\n=== schema.sql ===\n${schemaContent}\n`;
    } catch {
      // Ignore read errors
    }
  }

  // Try to read any TypeScript files in app directory
  const appDir = join(dirPath, 'app');
  if (existsSync(appDir)) {
    try {
      const appFiles = readdirSync(appDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      for (const file of appFiles.slice(0, 3)) {
        const filePath = join(appDir, file);
        const fileContent = readFileSync(filePath, 'utf8');
        content += `\n=== app/${file} ===\n${fileContent.split('\n').slice(0, 100).join('\n')}\n`;
      }
    } catch {
      // Ignore read errors
    }
  }

  return content || 'No key files found';
}

export async function fillTemplate(
  operation: AIOperation,
  requirements: UserRequirements,
  options: AICommandOptions = {}
): Promise<FilledPrompt> {
  try {
    const template = await getTemplate(operation, options);

    // Construct schema paths based on package installation (like ai docs does)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const schemaDir = resolve(__dirname, '../../../schema');
    const aiSchemaPath = join(schemaDir, 'SPECVERSE-V3.1-SCHEMA-AI.yaml');
    const referenceSchemaPath = join(schemaDir, 'MINIMAL-SYNTAX-REFERENCE.specly');

    // Prepare variables for substitution
    let variables: Record<string, any> = {
      requirements: requirements.requirements,
      scale: requirements.scale || 'business',
      framework: requirements.framework || 'auto-detect',
      domain: requirements.domain || 'general',
      compliance: requirements.compliance?.join(', ') || 'none',
      technology_preferences: requirements.technology_preferences?.join(', ') || 'auto-detect',
      preferredTech: requirements.technology_preferences?.join(', ') || 'auto-detect',
      aiSchemaPath,
      referenceSchemaPath,
      ...options // Allow additional options to override (includes referenceExamplePath if client provides it)
    };

    // Special handling for analyse operation
    if (operation === 'analyse') {
      // Extract path from requirements if provided - look for path patterns
      // Try to match paths that start with /, ./, ../, or contain /
      const pathMatch = requirements.requirements?.match(/\b((?:\.\.?\/)?(?:[\w-]+\/)+[\w-]*\/?)\b/) ||
                        requirements.requirements?.match(/\bat\s+([^\s]+)$/);
      const applicationPath = pathMatch ? pathMatch[1] : '.';

      // Resolve path relative to current working directory
      const resolvedPath = resolve(process.cwd(), applicationPath);

      if (existsSync(resolvedPath)) {
        variables.implementationPath = applicationPath;
        variables.applicationPath = applicationPath;
        variables.frameworkType = 'auto-detect';
        variables.directoryStructure = getDirectoryStructure(resolvedPath);
        variables.filesContent = getKeyFilesContent(resolvedPath);
      } else {
        // Fallback if path doesn't exist
        variables.implementationPath = applicationPath;
        variables.applicationPath = applicationPath;
        variables.frameworkType = 'auto-detect';
        variables.directoryStructure = `Directory not found: ${resolvedPath}`;
        variables.filesContent = 'Unable to read files';
      }
    }

    // Special handling for materialise operation
    if (operation === 'materialise') {
      // Extract spec file from requirements or use default
      const specFileMatch = requirements.requirements?.match(/([^\s]+\.specly)/);
      variables.specificationFile = specFileMatch ? specFileMatch[1] : requirements.requirements || 'specification.specly';
      variables.targetFramework = requirements.framework || 'auto-detect';
      variables.implementationStyle = 'production-ready';
      variables.developmentEnvironment = 'production';
      variables.componentSpec = 'See specification file';
      variables.implementationManifest = 'Auto-generated based on specification';
      variables.deploymentSpec = 'See specification deployment section';
      variables.dataConsistencyLevel = 'strong';
      variables.errorHandlingStrategy = 'comprehensive';
      variables.validationDepth = 'full';
      variables.setupAutomation = 'enabled';
    }

    // Special handling for realize operation
    if (operation === 'realize') {
      // Extract spec file from requirements or use default
      const specFileMatch = requirements.requirements?.match(/([^\s]+\.specly)/);
      variables.specificationFile = specFileMatch ? specFileMatch[1] : requirements.requirements || 'specification.specly';
      variables.environmentType = 'production';
      variables.cloudProvider = 'auto-detect';
      variables.scaleRequirements = requirements.scale || 'business';
      variables.componentSpec = 'See specification file';
      variables.deploymentSpec = 'See specification deployment section';
    }
    
    // Simple template variable substitution
    let systemPrompt = template.system;
    let userPrompt = template.user;
    let contextPrompt = template.context;
    
    // Replace {{variable}} patterns
    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      systemPrompt = systemPrompt.replace(pattern, String(value));
      userPrompt = userPrompt.replace(pattern, String(value));
      if (contextPrompt) {
        contextPrompt = contextPrompt.replace(pattern, String(value));
      }
    });
    
    return {
      systemPrompt,
      userPrompt,
      contextPrompt,
      variables
    };
  } catch (error) {
    throw new Error(`Failed to fill template for operation '${operation}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default fillTemplate;