/**
 * SpecVerse AI Configuration System
 * Loads and manages .specverse configuration files for providers and workflows.
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';
import yaml from 'js-yaml';
import type { LLMProviderConfig } from '../providers/llm-provider.js';

export interface SpecVerseConfig {
  version?: string;
  providers?: {
    [name: string]: LLMProviderConfig & {
      type: 'openai' | 'anthropic' | 'azure' | 'local' | 'interactive';
      enabled?: boolean;
      default?: boolean;
      interface?: 'chatgpt' | 'claude' | 'gemini' | 'generic';
      outputFile?: string;
      waitForInput?: boolean;
      formatInstructions?: boolean;
    };
  };
  defaults?: {
    provider?: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  };
  prompts?: {
    directory?: string;
    custom?: { [name: string]: string };
  };
  outputs?: {
    directory?: string;
    format?: 'yaml' | 'json';
    diagrams?: {
      enabled?: boolean;
      types?: string[];
      output?: string;
    };
  };
  features?: {
    inference?: boolean;
    streaming?: boolean;
    caching?: boolean;
  };
}

export class ConfigLoader {
  private static readonly DEFAULT_CONFIG_NAMES = [
    '.specverse.yml',
    '.specverse.yaml',
    'specverse.config.yml',
    'specverse.config.yaml'
  ];

  private config: SpecVerseConfig = {};
  private configPath?: string;

  async loadConfig(searchPath?: string): Promise<SpecVerseConfig> {
    const configPath = this.findConfigFile(searchPath);

    if (configPath) {
      this.configPath = configPath;
      const content = readFileSync(configPath, 'utf8');
      let config = yaml.load(content) as SpecVerseConfig;

      if (!config || typeof config !== 'object') {
        throw new Error('Configuration file must contain a valid YAML object');
      }

      config = this.expandEnvironmentVariables(config);
      config = this.applyEnvironmentOverrides(config);
      this.config = config;
      this.validateConfig();
    } else {
      this.config = this.getDefaultConfig();
    }

    return this.config;
  }

  load(searchPath?: string): SpecVerseConfig {
    if (searchPath && existsSync(searchPath)) {
      const content = readFileSync(searchPath, 'utf8');
      this.config = yaml.load(content) as SpecVerseConfig;
      this.configPath = searchPath;
      this.config = this.expandEnvironmentVariables(this.config);
      this.config = this.applyEnvironmentOverrides(this.config);
      this.validateConfig();
    } else {
      this.config = this.getDefaultConfig();
    }

    if (!this.config.defaults) {
      this.config.defaults = this.getDefaultConfig().defaults;
    }

    return this.config;
  }

  getConfig(): SpecVerseConfig {
    return { ...this.config };
  }

  getConfigPath(): string | undefined {
    return this.configPath;
  }

  getProviderConfig(name?: string): (LLMProviderConfig & { type: string }) | undefined {
    const providers = this.config.providers || {};

    if (!name) {
      if (this.config.defaults?.provider) {
        name = this.config.defaults.provider;
      } else {
        const defaultProvider = Object.entries(providers).find(([_, config]) => config.default);
        if (defaultProvider) name = defaultProvider[0];
        else {
          const enabledProvider = Object.entries(providers).find(([_, config]) => config.enabled !== false);
          if (enabledProvider) name = enabledProvider[0];
        }
      }
    }

    if (!name || !providers[name]) return undefined;

    const providerConfig = providers[name];
    if (providerConfig.enabled === false) {
      throw new Error(`Provider '${name}' is disabled`);
    }

    return {
      ...providerConfig,
      model: providerConfig.model || this.config.defaults?.model || this.getDefaultModelForType(providerConfig.type),
      timeout: providerConfig.timeout || 30000,
      retries: providerConfig.retries || 3,
      defaultOptions: {
        temperature: this.config.defaults?.temperature || 0.7,
        max_tokens: this.config.defaults?.max_tokens || 4000,
        ...providerConfig.defaultOptions
      }
    };
  }

  getEnabledProviders(): Array<{ name: string; config: LLMProviderConfig & { type: string } }> {
    const providers = this.config.providers || {};
    return Object.entries(providers)
      .filter(([_, config]) => config.enabled !== false)
      .map(([name, config]) => ({
        name,
        config: {
          ...config,
          model: config.model || this.getDefaultModelForType(config.type),
          timeout: config.timeout || 30000,
          retries: config.retries || 3,
        }
      }));
  }

  private findConfigFile(searchPath?: string): string | undefined {
    const startPath = searchPath ? resolve(searchPath) : process.cwd();

    if (searchPath && existsSync(searchPath) && !statSync(searchPath).isDirectory()) {
      return resolve(searchPath);
    }

    let currentPath = startPath;
    while (true) {
      for (const configName of ConfigLoader.DEFAULT_CONFIG_NAMES) {
        const configPath = join(currentPath, configName);
        if (existsSync(configPath)) return configPath;
      }
      const parentPath = resolve(currentPath, '..');
      if (parentPath === currentPath) break;
      currentPath = parentPath;
    }

    return undefined;
  }

  private expandEnvironmentVariables(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (match, varExpr) => {
        const [varName, defaultValue] = varExpr.split(':-');
        return process.env[varName] || defaultValue || match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.expandEnvironmentVariables(item));
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.expandEnvironmentVariables(value);
      }
      return result;
    }
    return obj;
  }

  private validateConfig(): void {
    const config = this.config;
    if (config.providers) {
      for (const [name, providerConfig] of Object.entries(config.providers)) {
        if (!providerConfig.type) {
          throw new Error(`Provider '${name}' must specify a type`);
        }
        if (!['openai', 'anthropic', 'azure', 'local', 'interactive'].includes(providerConfig.type)) {
          throw new Error(`Provider '${name}' has invalid type: ${providerConfig.type}`);
        }
      }
    }
    if (config.defaults?.provider && !config.providers?.[config.defaults.provider]) {
      throw new Error(`Default provider '${config.defaults.provider}' is not configured`);
    }
  }

  private applyEnvironmentOverrides(config: SpecVerseConfig): SpecVerseConfig {
    const envConfig = { ...config };
    if (envConfig.providers) {
      for (const [name, providerConfig] of Object.entries(envConfig.providers)) {
        const envApiKey = process.env[`SPECVERSE_${name.toUpperCase()}_API_KEY`];
        if (envApiKey && !providerConfig.apiKey) providerConfig.apiKey = envApiKey;
      }
    }
    if (process.env.SPECVERSE_DEFAULT_PROVIDER) {
      envConfig.defaults = envConfig.defaults || {};
      envConfig.defaults.provider = process.env.SPECVERSE_DEFAULT_PROVIDER;
    }
    return envConfig;
  }

  private getDefaultConfig(): SpecVerseConfig {
    return {
      defaults: { temperature: 0.7, max_tokens: 4000 },
      outputs: { directory: 'outputs', format: 'yaml' },
      features: { inference: true, streaming: true, caching: false },
    };
  }

  private getDefaultModelForType(type: string): string {
    const defaults: Record<string, string> = {
      openai: 'gpt-4', anthropic: 'claude-3-sonnet-20240229',
      azure: 'gpt-4', local: 'local-model', interactive: 'interactive-generic',
    };
    return defaults[type] || 'unknown';
  }
}

export const configLoader = new ConfigLoader();
