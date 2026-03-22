/**
 * Instance Factory Validator
 *
 * Validates instance factory compatibility and requirements.
 */

import semver from 'semver';
import type { InstanceFactory, ResolvedImplementation } from '../types/index.js';

/**
 * Compatibility validation result
 */
export interface CompatibilityResult {
  /** Whether the instance factory is compatible */
  compatible: boolean;

  /** Error messages if incompatible */
  errors?: string[];

  /** Warning messages */
  warnings?: string[];
}

/**
 * Dependency resolution result
 */
export interface DependencyResolutionResult {
  /** Whether all dependencies are satisfied */
  satisfied: boolean;

  /** Missing dependencies */
  missing?: string[];

  /** Version conflicts */
  conflicts?: Array<{
    capability: string;
    required: string;
    available?: string;
  }>;
}

/**
 * Validator for instance factory compatibility
 */
export class InstanceFactoryValidator {
  /**
   * Validate instance factory against SpecVerse version
   */
  validateCompatibility(
    factory: InstanceFactory,
    options: {
      specverseVersion?: string;
      nodeVersion?: string;
    } = {}
  ): CompatibilityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check SpecVerse version compatibility
    if (factory.compatibility?.specverse && options.specverseVersion) {
      if (!semver.satisfies(options.specverseVersion, factory.compatibility.specverse)) {
        errors.push(
          `Instance factory "${factory.name}" requires SpecVerse ${factory.compatibility.specverse}, ` +
          `but version ${options.specverseVersion} is installed`
        );
      }
    }

    // Check Node.js version compatibility
    if (factory.compatibility?.node && options.nodeVersion) {
      // Extract major version from node version string (e.g., "v20.11.0" -> "20.11.0")
      const cleanNodeVersion = options.nodeVersion.replace(/^v/, '');

      if (!semver.satisfies(cleanNodeVersion, factory.compatibility.node)) {
        errors.push(
          `Instance factory "${factory.name}" requires Node.js ${factory.compatibility.node}, ` +
          `but version ${options.nodeVersion} is installed`
        );
      }
    }

    // Check for required technology stack elements
    if (!factory.technology.runtime) {
      warnings.push(`Instance factory "${factory.name}" does not specify runtime`);
    }

    if (!factory.technology.language) {
      warnings.push(`Instance factory "${factory.name}" does not specify language`);
    }

    // Check for at least one code template
    if (Object.keys(factory.codeTemplates).length === 0) {
      errors.push(`Instance factory "${factory.name}" has no code templates`);
    }

    // Validate code templates
    for (const [templateName, template] of Object.entries(factory.codeTemplates)) {
      // Ensure template has required fields based on engine type
      if (template.engine === 'typescript' && !template.generator) {
        errors.push(
          `Template "${templateName}" uses TypeScript engine but has no generator path`
        );
      }

      if (template.engine === 'handlebars' && !template.template) {
        errors.push(
          `Template "${templateName}" uses Handlebars engine but has no template content`
        );
      }

      if (template.engine === 'ai' && !template.prompt) {
        errors.push(
          `Template "${templateName}" uses AI engine but has no prompt`
        );
      }

      // Validate output pattern
      if (!template.outputPattern) {
        errors.push(`Template "${templateName}" has no output pattern`);
      }
    }

    return {
      compatible: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate that all required capabilities are provided
   */
  validateCapabilities(
    factory: InstanceFactory,
    availableCapabilities: string[]
  ): CompatibilityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if this implementation provides at least one capability
    if (factory.capabilities.provides.length === 0) {
      errors.push(
        `Instance factory "${factory.name}" does not provide any capabilities`
      );
    }

    // Check if all required capabilities are available
    if (factory.capabilities.requires) {
      for (const required of factory.capabilities.requires) {
        // Support wildcard matching
        const matches = availableCapabilities.some(available => {
          if (required.includes('*')) {
            const pattern = required.replace(/\*/g, '.*');
            return new RegExp(`^${pattern}$`).test(available);
          }
          return available === required;
        });

        if (!matches) {
          errors.push(
            `Instance factory "${factory.name}" requires capability "${required}" ` +
            `which is not available`
          );
        }
      }
    }

    return {
      compatible: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate dependencies between resolved implementations
   */
  validateDependencies(
    resolved: ResolvedImplementation[]
  ): DependencyResolutionResult {
    const missing: string[] = [];
    const conflicts: Array<{
      capability: string;
      required: string;
      available?: string;
    }> = [];

    // Build map of provided capabilities
    const provided = new Map<string, string>();
    for (const impl of resolved) {
      for (const capability of impl.instanceFactory.capabilities.provides) {
        provided.set(capability, impl.instanceFactory.name);
      }
    }

    // Check each implementation's requirements
    for (const impl of resolved) {
      if (!impl.instanceFactory.capabilities.requires) {
        continue;
      }

      for (const required of impl.instanceFactory.capabilities.requires) {
        // Support wildcard matching
        const matches = Array.from(provided.keys()).some(available => {
          if (required.includes('*')) {
            const pattern = required.replace(/\*/g, '.*');
            return new RegExp(`^${pattern}$`).test(available);
          }
          return available === required;
        });

        if (!matches) {
          const availableProvider = provided.get(required);
          if (!availableProvider) {
            missing.push(
              `Instance factory "${impl.instanceFactory.name}" requires capability "${required}" ` +
              `but no instance factory provides it`
            );
          } else {
            conflicts.push({
              capability: required,
              required: impl.instanceFactory.name,
              available: availableProvider
            });
          }
        }
      }
    }

    return {
      satisfied: missing.length === 0 && conflicts.length === 0,
      missing: missing.length > 0 ? missing : undefined,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    };
  }

  /**
   * Validate that an instance factory can extend another
   */
  validateExtension(
    child: InstanceFactory,
    parent: InstanceFactory
  ): CompatibilityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that categories match
    if (child.category !== parent.category) {
      errors.push(
        `Cannot extend "${parent.name}" (${parent.category}) with "${child.name}" (${child.category}): ` +
        `categories must match`
      );
    }

    // Check that runtime matches
    if (child.technology.runtime !== parent.technology.runtime) {
      warnings.push(
        `Child "${child.name}" has different runtime (${child.technology.runtime}) ` +
        `than parent "${parent.name}" (${parent.technology.runtime})`
      );
    }

    // Check that language matches
    if (child.technology.language !== parent.technology.language) {
      warnings.push(
        `Child "${child.name}" has different language (${child.technology.language}) ` +
        `than parent "${parent.name}" (${parent.technology.language})`
      );
    }

    return {
      compatible: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate complete instance factory
   */
  validateComplete(
    factory: InstanceFactory,
    options: {
      specverseVersion?: string;
      nodeVersion?: string;
      availableCapabilities?: string[];
    } = {}
  ): CompatibilityResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate compatibility
    const compatResult = this.validateCompatibility(factory, options);
    if (compatResult.errors) allErrors.push(...compatResult.errors);
    if (compatResult.warnings) allWarnings.push(...compatResult.warnings);

    // Validate capabilities if provided
    if (options.availableCapabilities) {
      const capResult = this.validateCapabilities(factory, options.availableCapabilities);
      if (capResult.errors) allErrors.push(...capResult.errors);
      if (capResult.warnings) allWarnings.push(...capResult.warnings);
    }

    return {
      compatible: allErrors.length === 0,
      errors: allErrors.length > 0 ? allErrors : undefined,
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    };
  }
}
