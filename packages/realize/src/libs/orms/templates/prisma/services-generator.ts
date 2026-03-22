/**
 * Prisma Services Generator
 *
 * Generates service classes with Prisma ORM integration
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate Prisma service for a model
 */
export default function generatePrismaService(context: TemplateContext): string {
  const { model, controller, spec, implType } = context;

  if (!model) {
    throw new Error('Model is required in template context');
  }

  const modelName = model.name;
  const serviceName = `${modelName}Service`;
  const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);

  // Generate imports
  const imports = generateImports(modelName, implType);

  // Generate CURED methods
  const methods = generateCRUDEMethods(modelName, prismaModel, model, implType);

  // Generate validation method
  const validateMethod = generateValidationMethod(modelName, model, implType);

  // Generate the complete service class
  return `${imports}

/**
 * ${serviceName}
 * Generated service for ${modelName} model
 *
 * Provides CURED operations (Create, Retrieve, Update, Evolve, Delete)
 * with Prisma ORM integration
 */
export class ${serviceName} {
  constructor(private prisma: PrismaClient) {}

${methods}

${validateMethod}
}
`;
}

/**
 * Generate imports for the service file
 */
function generateImports(modelName: string, implType: any): string {
  const imports = [
    `import { PrismaClient, ${modelName} } from '@prisma/client';`,
  ];

  return imports.join('\n');
}

/**
 * Generate CRUDE methods for the service
 */
function generateCRUDEMethods(
  modelName: string,
  prismaModel: string,
  model: any,
  implType: any
): string {
  const methods: string[] = [];

  // Create method
  methods.push(generateCreateMethod(modelName, prismaModel, model));

  // Retrieve method
  methods.push(generateRetrieveMethod(modelName, prismaModel, model));

  // Update method
  methods.push(generateUpdateMethod(modelName, prismaModel, model));

  // Evolve method (lifecycle-aware update)
  methods.push(generateEvolveMethod(modelName, prismaModel, model));

  // Delete method
  methods.push(generateDeleteMethod(modelName, prismaModel, model));

  // List method (bonus)
  methods.push(generateListMethod(modelName, prismaModel, model));

  return methods.join('\n\n');
}

/**
 * Generate create method
 */
function generateCreateMethod(
  modelName: string,
  prismaModel: string,
  model: any
): string {
  return `  /**
   * Create a new ${modelName}
   */
  async create(data: Omit<${modelName}, 'id' | 'createdAt' | 'updatedAt'>): Promise<${modelName}> {
    // Validate before creating
    const validationResult = this.validate(data, { operation: 'create' });
    if (!validationResult.valid) {
      throw new Error(\`Validation failed: \${validationResult.errors.join(', ')}\`);
    }

    return await this.prisma.${prismaModel}.create({
      data: data as any
    });
  }`;
}

/**
 * Generate retrieve method
 */
function generateRetrieveMethod(
  modelName: string,
  prismaModel: string,
  model: any
): string {
  return `  /**
   * Retrieve a ${modelName} by ID
   */
  async retrieve(id: string): Promise<${modelName} | null> {
    return await this.prisma.${prismaModel}.findUnique({
      where: { id }
    });
  }`;
}

/**
 * Generate update method
 */
function generateUpdateMethod(
  modelName: string,
  prismaModel: string,
  model: any
): string {
  return `  /**
   * Update a ${modelName}
   */
  async update(id: string, data: Partial<${modelName}>): Promise<${modelName}> {
    // Validate before updating
    const validationResult = this.validate(data, { operation: 'update' });
    if (!validationResult.valid) {
      throw new Error(\`Validation failed: \${validationResult.errors.join(', ')}\`);
    }

    return await this.prisma.${prismaModel}.update({
      where: { id },
      data: data as any
    });
  }`;
}

/**
 * Generate evolve method (lifecycle-aware)
 */
function generateEvolveMethod(
  modelName: string,
  prismaModel: string,
  model: any
): string {
  const hasLifecycle = model.lifecycle && model.lifecycle.length > 0;

  if (hasLifecycle) {
    return `  /**
   * Evolve a ${modelName} (lifecycle-aware update)
   * Handles state transitions according to lifecycle rules
   */
  async evolve(id: string, data: Partial<${modelName}>): Promise<${modelName}> {
    // Get current instance to check state
    const current = await this.retrieve(id);
    if (!current) {
      throw new Error('${modelName} not found');
    }

    // Validate state transition if status is being changed
    if (data.status && data.status !== current.status) {
      // TODO: Add lifecycle validation based on model.lifecycle
      // For now, allow any transition
    }

    // Validate data
    const validationResult = this.validate(data, { operation: 'evolve' });
    if (!validationResult.valid) {
      throw new Error(\`Validation failed: \${validationResult.errors.join(', ')}\`);
    }

    return await this.prisma.${prismaModel}.update({
      where: { id },
      data: data as any
    });
  }`;
  } else {
    return `  /**
   * Evolve a ${modelName} (same as update for models without lifecycle)
   */
  async evolve(id: string, data: Partial<${modelName}>): Promise<${modelName}> {
    return this.update(id, data);
  }`;
  }
}

/**
 * Generate delete method
 */
function generateDeleteMethod(
  modelName: string,
  prismaModel: string,
  model: any
): string {
  const hasSoftDelete = model.metadata?.softDelete;

  if (hasSoftDelete) {
    return `  /**
   * Delete a ${modelName} (soft delete)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.${prismaModel}.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isDeleted: true
      }
    });
  }`;
  } else {
    return `  /**
   * Delete a ${modelName}
   */
  async delete(id: string): Promise<void> {
    await this.prisma.${prismaModel}.delete({
      where: { id }
    });
  }`;
  }
}

/**
 * Generate list method
 */
function generateListMethod(
  modelName: string,
  prismaModel: string,
  model: any
): string {
  const hasSoftDelete = model.metadata?.softDelete;

  const whereClause = hasSoftDelete
    ? `\n      where: { isDeleted: false },`
    : '';

  return `  /**
   * List all ${modelName}s
   */
  async list(): Promise<${modelName}[]> {
    return await this.prisma.${prismaModel}.findMany({${whereClause}
      orderBy: { createdAt: 'desc' }
    });
  }`;
}

/**
 * Generate validation method
 */
function generateValidationMethod(
  modelName: string,
  model: any,
  implType: any
): string {
  return `  /**
   * Validate ${modelName} data
   * Unified validation method for all operations
   */
  validate(
    data: any,
    context: { operation: 'create' | 'update' | 'evolve' }
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation (for create operation)
    if (context.operation === 'create') {
      ${generateRequiredFieldValidation(model)}
    }

    // Type validation
    ${generateTypeValidation(model)}

    // Constraint validation
    ${generateConstraintValidation(model)}

    return {
      valid: errors.length === 0,
      errors
    };
  }`;
}

/**
 * Generate required field validation
 */
function generateRequiredFieldValidation(model: any): string {
  const requiredFields = model.attributes?.filter((attr: any) =>
    attr.constraints?.required &&
    !['id', 'createdAt', 'updatedAt'].includes(attr.name)
  ) || [];

  if (requiredFields.length === 0) {
    return '// No required fields';
  }

  const validations = requiredFields.map((field: any) =>
    `if (data.${field.name} === undefined || data.${field.name} === null) {
        errors.push('${field.name} is required');
      }`
  ).join('\n      ');

  return validations;
}

/**
 * Generate type validation
 */
function generateTypeValidation(model: any): string {
  const fields = model.attributes || [];

  if (fields.length === 0) {
    return '// No type validation';
  }

  const validations = fields
    .filter((field: any) => !['id', 'createdAt', 'updatedAt'].includes(field.name))
    .map((field: any) => {
      const typeName = inferJsType(field.type);
      if (typeName === 'string' || typeName === 'number' || typeName === 'boolean') {
        return `if (data.${field.name} !== undefined && typeof data.${field.name} !== '${typeName}') {
        errors.push('${field.name} must be a ${typeName}');
      }`;
      }
      return '';
    })
    .filter(v => v)
    .join('\n    ');

  return validations || '// No type validation needed';
}

/**
 * Generate constraint validation
 */
function generateConstraintValidation(model: any): string {
  const fields = model.attributes?.filter((attr: any) =>
    attr.constraints && Object.keys(attr.constraints).length > 0
  ) || [];

  if (fields.length === 0) {
    return '// No constraint validation';
  }

  const validations = fields.map((field: any) => {
    const constraints: string[] = [];

    if (field.constraints.unique) {
      constraints.push(`// TODO: Check uniqueness of ${field.name}`);
    }

    if (field.constraints.min !== undefined) {
      constraints.push(
        `if (data.${field.name} !== undefined && data.${field.name} < ${field.constraints.min}) {
        errors.push('${field.name} must be at least ${field.constraints.min}');
      }`
      );
    }

    if (field.constraints.max !== undefined) {
      constraints.push(
        `if (data.${field.name} !== undefined && data.${field.name} > ${field.constraints.max}) {
        errors.push('${field.name} must be at most ${field.constraints.max}');
      }`
      );
    }

    return constraints.join('\n    ');
  }).filter(v => v).join('\n    ');

  return validations || '// No constraint validation needed';
}

/**
 * Infer JavaScript type from SpecVerse type
 */
function inferJsType(type: string): string {
  const typeLower = type.toLowerCase();

  if (typeLower.includes('string') || typeLower.includes('text')) return 'string';
  if (typeLower.includes('int') || typeLower.includes('number')) return 'number';
  if (typeLower.includes('bool')) return 'boolean';
  if (typeLower.includes('date')) return 'object'; // Date objects

  return 'any';
}
