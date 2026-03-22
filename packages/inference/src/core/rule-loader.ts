/**
 * Rule Loader for V3.1 Inference Engine
 * Loads and validates inference rules from JSON configuration files
 *
 * Supports both legacy and domain-specific rule formats:
 * - Legacy: logical_inference wrapper (v3.1 pattern-based, v3.4 object-based)
 * - Domain-specific: ruleFileType discriminator (pattern-inference, configuration, expansion-template)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  InferenceRule,
  RuleSet,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ModelDefinition,
  ControllerSpec,
  ServiceSpec,
  EventSpec,
  ViewSpec,
  LogicalComponentSpec,
  LogicalInstance,
  LogicalChannel,
  LogicalBinding
} from './types.js';
import {
  RuleFile,
  RuleFileType,
  isPatternInferenceFile,
  isConfigurationFile,
  isExpansionTemplateFile,
  isDeploymentFile,
  isLegacyRuleFile,
  detectRuleFileType,
  migrateLegacyToNewFormat
} from './rule-file-types.js';

export class RuleLoader {
  private loadedRules: Map<string, RuleSet> = new Map();
  private loadedDomainSpecificFiles: Map<string, RuleFile> = new Map();

  constructor(private debug: boolean = false) {}

  /**
   * Load rules from the entity registry (runtime approach).
   * Each entity module with inference rules provides loader functions that
   * return the parsed JSON rule content directly — no filesystem needed.
   *
   * Returns true if rules were loaded from registry, false if registry
   * is unavailable (caller should fall back to loadRulesFromDirectory).
   */
  async loadRulesFromRegistry(): Promise<{ loaded: boolean; ruleSets: RuleSet[]; validation: ValidationResult }> {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    const ruleSets: RuleSet[] = [];

    try {
      // Dynamic import to avoid hard dependency on entity modules
      const { bootstrapEntityModules, getEntityRegistry } = await import('@specverse/engine-entities');
      bootstrapEntityModules();
      const registry = getEntityRegistry();
      const modules = registry.getInDependencyOrder();

      // Collect all rule loader functions from entity modules
      // Entity modules export functions like loadControllerRules(), loadServiceRules(), etc.
      const ruleLoaderModules: Array<{ entity: string; path: string }> = [
        { entity: 'models', path: '@specverse/engine-entities/core/models/inference/index.js' },
        { entity: 'events', path: '@specverse/engine-entities/core/events/inference/index.js' },
        { entity: 'views', path: '@specverse/engine-entities/core/views/inference/index.js' },
        { entity: 'deployments', path: '@specverse/engine-entities/core/deployments/inference/index.js' },
      ];

      for (const { entity, path: modulePath } of ruleLoaderModules) {
        try {
          const mod = await import(modulePath);
          // Each module exports load*Rules() functions that return parsed JSON
          for (const [key, fn] of Object.entries(mod)) {
            if (typeof fn === 'function' && key.startsWith('load') && key.endsWith('Rules')) {
              const content = (fn as () => any)();
              if (content) {
                const fileType = detectRuleFileType(content);
                const source = `entity:${entity}/${key}`;
                if (fileType === 'legacy') {
                  const { ruleSet, validation: v } = this.loadLegacyRuleSet(content, source, {
                    valid: true, errors: [], warnings: []
                  });
                  if (v.valid) ruleSets.push(ruleSet);
                  validation.errors.push(...v.errors);
                  validation.warnings.push(...v.warnings);
                } else {
                  const { ruleSet, validation: v } = this.loadDomainSpecificRuleSet(content as RuleFile, source, {
                    valid: true, errors: [], warnings: []
                  });
                  if (v.valid) ruleSets.push(ruleSet);
                  validation.errors.push(...v.errors);
                  validation.warnings.push(...v.warnings);
                }
              }
            }
          }
        } catch {
          // Entity module not available, skip
        }
      }

      if (ruleSets.length > 0) {
        if (this.debug) {
          console.log(`Loaded ${ruleSets.length} rule sets from entity registry`);
        }
        return { loaded: true, ruleSets, validation };
      }

      return { loaded: false, ruleSets: [], validation };
    } catch {
      // Entity registry not available
      return { loaded: false, ruleSets: [], validation };
    }
  }
  
  /**
   * Load rule set from a JSON file
   * Supports both legacy and domain-specific formats with automatic detection
   */
  async loadRuleSet(filePath: string): Promise<{ ruleSet: RuleSet; validation: ValidationResult }> {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check file exists
      if (!fs.existsSync(filePath)) {
        validation.errors.push({
          code: 'FILE_NOT_FOUND',
          message: `Rule file not found: ${filePath}`,
          location: filePath
        });
        validation.valid = false;
        return { ruleSet: this.createEmptyRuleSet(), validation };
      }

      // Read and parse JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsedContent = JSON.parse(fileContent);

      if (this.debug) {
        console.log(`Loading rules from: ${filePath}`);
      }

      // Detect rule file format
      const fileType = detectRuleFileType(parsedContent);

      if (fileType === 'legacy') {
        // Handle legacy format (logical_inference wrapper)
        return this.loadLegacyRuleSet(parsedContent, filePath, validation);
      } else {
        // Handle domain-specific format (ruleFileType discriminator)
        return this.loadDomainSpecificRuleSet(parsedContent as RuleFile, filePath, validation);
      }

    } catch (error) {
      validation.errors.push({
        code: 'PARSE_ERROR',
        message: `Failed to parse rule file: ${error instanceof Error ? error.message : String(error)}`,
        location: filePath
      });
      validation.valid = false;

      return { ruleSet: this.createEmptyRuleSet(), validation };
    }
  }

  /**
   * Load legacy format rule set (logical_inference wrapper)
   */
  private loadLegacyRuleSet(parsedContent: any, filePath: string, validation: ValidationResult): { ruleSet: RuleSet; validation: ValidationResult } {
    const ruleSet = parsedContent as RuleSet;

    if (this.debug) {
      console.log(`  Format: Legacy (logical_inference wrapper)`);
    }

    // Validate rule set structure
    const structureValidation = this.validateRuleSetStructure(ruleSet, filePath);
    validation.errors.push(...structureValidation.errors);
    validation.warnings.push(...structureValidation.warnings);

    if (structureValidation.errors.length > 0) {
      validation.valid = false;
      return { ruleSet: this.createEmptyRuleSet(), validation };
    }

    // Validate individual rules
    const rulesValidation = this.validateAllRules(ruleSet, filePath);
    validation.errors.push(...rulesValidation.errors);
    validation.warnings.push(...rulesValidation.warnings);

    if (rulesValidation.errors.length > 0) {
      validation.valid = false;
    }

    // Cache the loaded rule set
    this.loadedRules.set(filePath, ruleSet);

    if (this.debug && validation.valid) {
      console.log(`  Successfully loaded legacy rule set`);
      this.logRuleSetSummary(ruleSet);
    }

    return { ruleSet, validation };
  }

  /**
   * Load domain-specific format rule set (ruleFileType discriminator)
   */
  private loadDomainSpecificRuleSet(ruleFile: RuleFile, filePath: string, validation: ValidationResult): { ruleSet: RuleSet; validation: ValidationResult } {
    if (this.debug) {
      const type = (ruleFile as any).ruleFileType;
      const category = (ruleFile as any).category;
      console.log(`  Format: Domain-specific (${type}/${category})`);
    }

    // Check if this is a deployment file - handle separately
    if (isDeploymentFile(ruleFile)) {
      return this.loadDeploymentRuleSet(ruleFile, filePath, validation);
    }

    // Migrate domain-specific file to legacy format for backward compatibility
    const migratedRuleSets = migrateLegacyToNewFormat({
      version: ruleFile.version,
      description: ruleFile.description,
      logical_inference: this.convertDomainSpecificToLegacy(ruleFile)
    });

    if (migratedRuleSets.length === 0) {
      validation.errors.push({
        code: 'MIGRATION_FAILED',
        message: 'Failed to migrate domain-specific file to legacy format',
        location: filePath
      });
      validation.valid = false;
      return { ruleSet: this.createEmptyRuleSet(), validation };
    }

    // Use the first migrated rule set
    const ruleSet = migratedRuleSets[0] as RuleSet;

    // Cache both formats
    this.loadedRules.set(filePath, ruleSet);
    this.loadedDomainSpecificFiles.set(filePath, ruleFile);

    if (this.debug) {
      console.log(`  Successfully loaded domain-specific rule file`);
    }

    return { ruleSet, validation };
  }

  /**
   * Load deployment rule set directly without migration
   */
  private loadDeploymentRuleSet(ruleFile: any, filePath: string, validation: ValidationResult): { ruleSet: RuleSet; validation: ValidationResult } {
    if (this.debug) {
      console.log(`  Format: Deployment (deployment_inference)`);
    }

    // Create rule set directly from deployment file
    const ruleSet: RuleSet = {
      version: ruleFile.version,
      deployment_inference: ruleFile.deployment_inference,
      logical_inference: {
        controllers: [],
        services: [],
        events: [],
        views: []
      }
    };

    // Validate deployment rules structure
    const structureValidation = this.validateRuleSetStructure(ruleSet, filePath);
    validation.errors.push(...structureValidation.errors);
    validation.warnings.push(...structureValidation.warnings);

    if (structureValidation.errors.length > 0) {
      validation.valid = false;
      return { ruleSet: this.createEmptyRuleSet(), validation };
    }

    // Validate deployment rules
    const rulesValidation = this.validateAllRules(ruleSet, filePath);
    validation.errors.push(...rulesValidation.errors);
    validation.warnings.push(...rulesValidation.warnings);

    if (rulesValidation.errors.length > 0) {
      validation.valid = false;
    }

    // Cache the loaded rule set
    this.loadedRules.set(filePath, ruleSet);
    this.loadedDomainSpecificFiles.set(filePath, ruleFile);

    if (this.debug && validation.valid) {
      console.log(`  Successfully loaded deployment rule set`);
      this.logRuleSetSummary(ruleSet);
    }

    return { ruleSet, validation };
  }

  /**
   * Convert domain-specific file to legacy format structure
   */
  private convertDomainSpecificToLegacy(ruleFile: RuleFile): any {
    if (isPatternInferenceFile(ruleFile)) {
      // Pattern inference files convert directly
      return {
        [ruleFile.category]: ruleFile.rules
      };
    } else if (isConfigurationFile(ruleFile)) {
      // Configuration files use object structure (v3.4 style)
      if (ruleFile.category === 'component-mappings') {
        return {
          component_type_mapping: ruleFile.mappings
        };
      } else if (ruleFile.category === 'view-patterns') {
        return {
          view_patterns: ruleFile.mappings
        };
      }
    } else if (isExpansionTemplateFile(ruleFile)) {
      // Expansion template files use object structure (v3.4 style)
      return {
        specialist_views: ruleFile.templates
      };
    }

    return {};
  }
  
  /**
   * Load multiple rule sets from a directory
   */
  async loadRulesFromDirectory(directoryPath: string): Promise<{ ruleSets: RuleSet[]; validation: ValidationResult }> {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    const ruleSets: RuleSet[] = [];
    
    try {
      if (!fs.existsSync(directoryPath)) {
        validation.errors.push({
          code: 'DIRECTORY_NOT_FOUND',
          message: `Rules directory not found: ${directoryPath}`,
          location: directoryPath
        });
        validation.valid = false;
        return { ruleSets, validation };
      }
      
      const files = fs.readdirSync(directoryPath);
      const ruleFiles = files.filter(file => file.endsWith('.json'));
      
      if (ruleFiles.length === 0) {
        validation.warnings.push({
          code: 'NO_RULE_FILES',
          message: `No JSON rule files found in directory: ${directoryPath}`,
          location: directoryPath
        });
      }
      
      for (const file of ruleFiles) {
        const filePath = path.join(directoryPath, file);
        const { ruleSet, validation: fileValidation } = await this.loadRuleSet(filePath);
        
        validation.errors.push(...fileValidation.errors);
        validation.warnings.push(...fileValidation.warnings);
        
        if (fileValidation.valid) {
          ruleSets.push(ruleSet);
        } else {
          validation.valid = false;
        }
      }
      
    } catch (error) {
      validation.errors.push({
        code: 'DIRECTORY_READ_ERROR',
        message: `Failed to read rules directory: ${error instanceof Error ? error.message : String(error)}`,
        location: directoryPath
      });
      validation.valid = false;
    }
    
    return { ruleSets, validation };
  }
  
  /**
   * Get logical inference rules from loaded rule sets
   */
  getLogicalRules(): {
    controllers: InferenceRule<ModelDefinition, ControllerSpec>[];
    services: InferenceRule<ModelDefinition, ServiceSpec>[];
    events: InferenceRule<ModelDefinition, EventSpec>[];
    views: InferenceRule<ModelDefinition, ViewSpec>[];
  } {
    const controllers: InferenceRule<ModelDefinition, ControllerSpec>[] = [];
    const services: InferenceRule<ModelDefinition, ServiceSpec>[] = [];
    const events: InferenceRule<ModelDefinition, EventSpec>[] = [];
    const views: InferenceRule<ModelDefinition, ViewSpec>[] = [];
    
    for (const ruleSet of this.loadedRules.values()) {
      if (ruleSet.logical_inference) {
        if (ruleSet.logical_inference.controllers) {
          controllers.push(...ruleSet.logical_inference.controllers);
        }
        if (ruleSet.logical_inference.services) {
          services.push(...ruleSet.logical_inference.services);
        }
        if (ruleSet.logical_inference.events) {
          events.push(...ruleSet.logical_inference.events);
        }
        if (ruleSet.logical_inference.views) {
          views.push(...ruleSet.logical_inference.views);
        }
      }
    }
    
    return { controllers, services, events, views };
  }
  
  /**
   * Get deployment inference rules from loaded rule sets
   */
  getDeploymentRules(): {
    instances: InferenceRule<LogicalComponentSpec, LogicalInstance>[];
    channels: InferenceRule<LogicalComponentSpec, LogicalChannel>[];
    bindings: InferenceRule<LogicalComponentSpec, LogicalBinding>[];
  } {
    const instances: InferenceRule<LogicalComponentSpec, LogicalInstance>[] = [];
    const channels: InferenceRule<LogicalComponentSpec, LogicalChannel>[] = [];
    const bindings: InferenceRule<LogicalComponentSpec, LogicalBinding>[] = [];
    
    for (const ruleSet of this.loadedRules.values()) {
      if (ruleSet.deployment_inference) {
        if (ruleSet.deployment_inference.instances) {
          instances.push(...ruleSet.deployment_inference.instances);
        }
        if (ruleSet.deployment_inference.channels) {
          channels.push(...ruleSet.deployment_inference.channels);
        }
        if (ruleSet.deployment_inference.bindings) {
          bindings.push(...ruleSet.deployment_inference.bindings);
        }
      }
    }
    
    return { instances, channels, bindings };
  }
  
  /**
   * Clear all loaded rules
   */
  clearLoadedRules(): void {
    this.loadedRules.clear();
    this.loadedDomainSpecificFiles.clear();
  }

  /**
   * Get loaded domain-specific files by type
   */
  getDomainSpecificFiles(fileType?: RuleFileType): RuleFile[] {
    const files = Array.from(this.loadedDomainSpecificFiles.values());

    if (!fileType) {
      return files;
    }

    return files.filter(file => {
      if (fileType === 'pattern-inference') return isPatternInferenceFile(file);
      if (fileType === 'configuration') return isConfigurationFile(file);
      if (fileType === 'expansion-template') return isExpansionTemplateFile(file);
      if (fileType === 'deployment') return isDeploymentFile(file);
      return false;
    });
  }
  
  // ===============================
  // Private Implementation
  // ===============================
  
  private createEmptyRuleSet(): RuleSet {
    return {
      version: 'v3.1',
      logical_inference: {
        controllers: [],
        services: [],
        events: [],
        views: []
      },
      deployment_inference: {
        instances: [],
        channels: [],
        bindings: []
      }
    };
  }
  
  private validateRuleSetStructure(ruleSet: any, filePath: string): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check version
    if (!ruleSet.version) {
      validation.errors.push({
        code: 'MISSING_VERSION',
        message: 'Rule set must specify a version',
        location: `${filePath}:version`
      });
    } else if (ruleSet.version !== 'v3.1') {
      validation.warnings.push({
        code: 'VERSION_MISMATCH',
        message: `Rule set version ${ruleSet.version} may not be compatible with v3.1 inference engine`,
        location: `${filePath}:version`
      });
    }
    
    // Check structure
    if (!ruleSet.logical_inference && !ruleSet.deployment_inference) {
      validation.errors.push({
        code: 'EMPTY_RULE_SET',
        message: 'Rule set must contain either logical_inference or deployment_inference rules',
        location: filePath
      });
    }
    
    validation.valid = validation.errors.length === 0;
    return validation;
  }
  
  private validateAllRules(ruleSet: RuleSet, filePath: string): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Validate logical inference rules
    if (ruleSet.logical_inference) {
      const logicalValidation = this.validateLogicalRules(ruleSet.logical_inference, filePath);
      validation.errors.push(...logicalValidation.errors);
      validation.warnings.push(...logicalValidation.warnings);
      if (!logicalValidation.valid) validation.valid = false;
    }
    
    // Validate deployment inference rules
    if (ruleSet.deployment_inference) {
      const deploymentValidation = this.validateDeploymentRules(ruleSet.deployment_inference, filePath);
      validation.errors.push(...deploymentValidation.errors);
      validation.warnings.push(...deploymentValidation.warnings);
      if (!deploymentValidation.valid) validation.valid = false;
    }
    
    return validation;
  }
  
  private validateLogicalRules(logicalRules: any, filePath: string): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Discover categories from loaded rules (not hardcoded)
    const ruleCategories = Object.keys(logicalRules);

    for (const category of ruleCategories) {
      if (logicalRules[category]) {
        if (!Array.isArray(logicalRules[category])) {
          validation.errors.push({
            code: 'INVALID_RULE_CATEGORY',
            message: `Logical inference ${category} must be an array`,
            location: `${filePath}:logical_inference:${category}`
          });
          validation.valid = false;
          continue;
        }
        
        for (let i = 0; i < logicalRules[category].length; i++) {
          const rule = logicalRules[category][i];
          const ruleValidation = this.validateIndividualRule(rule, `${filePath}:logical_inference:${category}[${i}]`);
          validation.errors.push(...ruleValidation.errors);
          validation.warnings.push(...ruleValidation.warnings);
          if (!ruleValidation.valid) validation.valid = false;
        }
      }
    }
    
    return validation;
  }
  
  private validateDeploymentRules(deploymentRules: any, filePath: string): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Discover categories from loaded rules (not hardcoded)
    const ruleCategories = Object.keys(deploymentRules);

    for (const category of ruleCategories) {
      if (deploymentRules[category]) {
        if (!Array.isArray(deploymentRules[category])) {
          validation.errors.push({
            code: 'INVALID_RULE_CATEGORY',
            message: `Deployment inference ${category} must be an array`,
            location: `${filePath}:deployment_inference:${category}`
          });
          validation.valid = false;
          continue;
        }
        
        for (let i = 0; i < deploymentRules[category].length; i++) {
          const rule = deploymentRules[category][i];
          const ruleValidation = this.validateIndividualRule(rule, `${filePath}:deployment_inference:${category}[${i}]`);
          validation.errors.push(...ruleValidation.errors);
          validation.warnings.push(...ruleValidation.warnings);
          if (!ruleValidation.valid) validation.valid = false;
        }
      }
    }
    
    return validation;
  }
  
  private validateIndividualRule(rule: any, location: string): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Required fields
    const requiredFields = ['name', 'pattern', 'template'];
    for (const field of requiredFields) {
      if (!rule[field]) {
        validation.errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Rule missing required field: ${field}`,
          location: `${location}:${field}`
        });
        validation.valid = false;
      }
    }
    
    // Template validation
    if (rule.template) {
      if (!rule.template.type) {
        validation.errors.push({
          code: 'MISSING_TEMPLATE_TYPE',
          message: 'Template must specify type',
          location: `${location}:template:type`
        });
        validation.valid = false;
      }
      
      if (!rule.template.content || 
          (Array.isArray(rule.template.content) && rule.template.content.length === 0)) {
        validation.errors.push({
          code: 'MISSING_TEMPLATE_CONTENT',
          message: 'Template must have content',
          location: `${location}:template:content`
        });
        validation.valid = false;
      }
    }
    
    // Priority validation
    if (rule.priority !== undefined && typeof rule.priority !== 'number') {
      validation.errors.push({
        code: 'INVALID_PRIORITY',
        message: 'Priority must be a number',
        location: `${location}:priority`
      });
      validation.valid = false;
    }
    
    // Set default priority if not specified
    if (rule.priority === undefined) {
      rule.priority = 100;
      validation.warnings.push({
        code: 'DEFAULT_PRIORITY',
        message: 'Priority not specified, using default value of 100',
        location: `${location}:priority`
      });
    }
    
    // Check for missing description
    if (!rule.description) {
      validation.warnings.push({
        code: 'MISSING_DESCRIPTION',
        message: 'Rule should have a description for documentation',
        location: `${location}:description`
      });
    }
    
    return validation;
  }
  
  private logRuleSetSummary(ruleSet: RuleSet): void {
    if (ruleSet.logical_inference) {
      console.log('  Logical Rules:');
      if (ruleSet.logical_inference.controllers) {
        console.log(`    Controllers: ${ruleSet.logical_inference.controllers.length}`);
      }
      if (ruleSet.logical_inference.services) {
        console.log(`    Services: ${ruleSet.logical_inference.services.length}`);
      }
      if (ruleSet.logical_inference.events) {
        console.log(`    Events: ${ruleSet.logical_inference.events.length}`);
      }
      if (ruleSet.logical_inference.views) {
        console.log(`    Views: ${ruleSet.logical_inference.views.length}`);
      }
    }
    
    if (ruleSet.deployment_inference) {
      console.log('  Deployment Rules:');
      if (ruleSet.deployment_inference.instances) {
        console.log(`    Instances: ${ruleSet.deployment_inference.instances.length}`);
      }
      if (ruleSet.deployment_inference.channels) {
        console.log(`    Channels: ${ruleSet.deployment_inference.channels.length}`);
      }
      if (ruleSet.deployment_inference.bindings) {
        console.log(`    Bindings: ${ruleSet.deployment_inference.bindings.length}`);
      }
    }
  }
}