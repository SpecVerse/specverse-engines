/**
 * AI Config Loader - Load and parse AI configuration files
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { AIConfig, UserRequirements } from './types/index.js';

/**
 * Load AI configuration from YAML file
 * @param configPath Path to the config file
 * @returns Parsed AI config
 */
export function loadAIConfig(configPath: string): AIConfig {
  const resolvedPath = resolve(configPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`AI config file not found: ${resolvedPath}`);
  }

  try {
    const content = readFileSync(resolvedPath, 'utf8');
    const config = yaml.load(content) as AIConfig;

    // Validate required structure
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid AI config format - must be a YAML object');
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse AI config: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Merge AI config with command-line options
 * Config file takes precedence over CLI options
 * @param config AI config from file
 * @param cliOptions Options from command line
 * @returns Merged UserRequirements
 */
export function mergeConfigWithOptions(
  config: AIConfig,
  cliOptions: Partial<UserRequirements>
): UserRequirements {
  return {
    requirements: config.requirements || cliOptions.requirements || '',
    scale: config.scale || cliOptions.scale || 'business',
    framework: config.framework || cliOptions.framework,
    domain: config.domain || cliOptions.domain,
    compliance: config.compliance || cliOptions.compliance,
    technology_preferences: config.technology || cliOptions.technology_preferences
  };
}

/**
 * Check if config specifies libraries (for auto-enhancement)
 * @param config AI config
 * @returns True if libraries are specified
 */
export function hasLibraries(config: AIConfig): boolean {
  return Array.isArray(config.libraries) && config.libraries.length > 0;
}

/**
 * Get libraries from config
 * @param config AI config
 * @returns Array of library names
 */
export function getLibraries(config: AIConfig): string[] {
  return config.libraries || [];
}
