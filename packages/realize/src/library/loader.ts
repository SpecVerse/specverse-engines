/**
 * Instance Factory Loader
 *
 * Loads instance factory definitions from YAML files
 * and validates them against the JSON Schema.
 */

import { readFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import yaml from 'yaml';
import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
const Ajv = (AjvModule as any).default || AjvModule;
const addFormats = (addFormatsModule as any).default || addFormatsModule;
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { InstanceFactory } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load JSON Schema for validation
let instanceFactorySchema: any;

async function loadSchema(): Promise<any> {
  if (!instanceFactorySchema) {
    // Schema was consolidated into SPECVERSE-SCHEMA.json in Phase 2
    // Extract InstanceFactoryDefinition from the consolidated schema
    const schemaPath = path.join(__dirname, '../../../schema/SPECVERSE-SCHEMA.json');
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const fullSchema = JSON.parse(schemaContent);

    // Get the InstanceFactoryDefinition from $defs
    instanceFactorySchema = fullSchema.$defs?.InstanceFactoryDefinition;

    if (!instanceFactorySchema) {
      throw new Error('InstanceFactoryDefinition not found in SPECVERSE-SCHEMA.json');
    }
  }
  return instanceFactorySchema;
}

/**
 * Load options for instance factories
 */
export interface LoadOptions {
  /** Base directory to search from */
  baseDir: string;

  /** Glob pattern to match instance factory files (default: **\/*.yaml) */
  pattern?: string;

  /** Whether to validate against schema (default: true) */
  validate?: boolean;

  /** Whether to ignore invalid files (default: false) */
  ignoreInvalid?: boolean;
}

/**
 * Load result for a single instance factory
 */
export interface LoadResult {
  /** The loaded instance factory */
  type: InstanceFactory;

  /** Source file path */
  filePath: string;

  /** Any warnings during load */
  warnings?: string[];
}

/**
 * Validation error for an implementation type
 */
export interface ValidationError {
  /** File that failed validation */
  filePath: string;

  /** Validation errors */
  errors: string[];
}

/**
 * Result of loading multiple implementation types
 */
export interface LoadManyResult {
  /** Successfully loaded types */
  types: LoadResult[];

  /** Files that failed validation */
  errors: ValidationError[];
}

/**
 * Load a single instance factory from a YAML file
 */
export async function loadInstanceFactory(
  filePath: string,
  options: { validate?: boolean } = {}
): Promise<LoadResult> {
  const validate = options.validate !== false;

  // Read and parse YAML
  const content = await readFile(filePath, 'utf-8');
  const parsed = yaml.parse(content);

  // Validate against schema if requested
  if (validate) {
    const schema = await loadSchema();

    // Skip validation if no schema available (schema was consolidated)
    if (schema) {
      const ajv = new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);  // Add support for format validators like "uri"
      const validateFn = ajv.compile(schema);

      if (!validateFn(parsed)) {
        const errors = validateFn.errors?.map(err => {
          const path = err.instancePath || '/';
          return `${path}: ${err.message}`;
        }) || ['Unknown validation error'];

        throw new Error(
          `Instance factory validation failed for ${filePath}:\n` +
          errors.map(e => `  - ${e}`).join('\n')
        );
      }
    }
  }

  const warnings: string[] = [];

  // Check for optional but recommended fields
  if (!parsed.description) {
    warnings.push('Missing recommended field: description');
  }
  if (!parsed.metadata?.author) {
    warnings.push('Missing recommended metadata: author');
  }

  return {
    type: parsed as InstanceFactory,
    filePath,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Load all instance factories from a directory
 */
export async function loadInstanceFactories(
  options: LoadOptions
): Promise<LoadManyResult> {
  const {
    baseDir,
    pattern = '**/*.yaml',
    validate = true,
    ignoreInvalid = false
  } = options;

  const types: LoadResult[] = [];
  const errors: ValidationError[] = [];

  // Find all YAML files matching the pattern
  const files = await glob(pattern, {
    cwd: baseDir,
    absolute: true,
    nodir: true
  });

  // Load each file
  for (const filePath of files) {
    try {
      const result = await loadInstanceFactory(filePath, { validate });
      types.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (ignoreInvalid) {
        errors.push({
          filePath,
          errors: [errorMessage]
        });
      } else {
        throw error;
      }
    }
  }

  return { types, errors };
}

/**
 * Load instance factories from multiple directories
 *
 * Directories are searched in order, with earlier directories
 * taking precedence for duplicate type names.
 */
export async function loadFromMultipleSources(
  sources: Array<{ path: string; pattern?: string }>,
  options: { validate?: boolean; ignoreInvalid?: boolean } = {}
): Promise<LoadManyResult> {
  const allTypes: LoadResult[] = [];
  const allErrors: ValidationError[] = [];
  const seenTypes = new Set<string>();

  for (const source of sources) {
    const result = await loadInstanceFactories({
      baseDir: source.path,
      pattern: source.pattern,
      validate: options.validate,
      ignoreInvalid: options.ignoreInvalid
    });

    // Filter out duplicate types (first source wins)
    for (const loadResult of result.types) {
      const typeName = loadResult.type.name;
      if (!seenTypes.has(typeName)) {
        seenTypes.add(typeName);
        allTypes.push(loadResult);
      } else {
        // Add warning about duplicate
        const existing = allTypes.find(t => t.type.name === typeName);
        if (existing) {
          existing.warnings = existing.warnings || [];
          existing.warnings.push(
            `Duplicate type "${typeName}" found in ${loadResult.filePath} (ignored)`
          );
        }
      }
    }

    allErrors.push(...result.errors);
  }

  return {
    types: allTypes,
    errors: allErrors
  };
}
