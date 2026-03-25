/**
 * Prisma Controller Generator
 *
 * Generates model-specific business logic controllers with CURED operations
 * Controllers manage models and can publish/subscribe to events
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate Prisma controller for a model
 */
export default function generatePrismaController(context: TemplateContext): string {
  const { controller, model, spec, models: allModels } = context;

  if (!controller) {
    throw new Error('Controller is required in template context');
  }

  if (!model) {
    throw new Error('Model is required for controller generation');
  }

  const controllerName = controller.name;
  const modelName = model.name;
  const rawModelVar = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  // Avoid JavaScript reserved words as variable names
  const RESERVED_WORDS = new Set(['import', 'export', 'default', 'class', 'function', 'return', 'delete', 'new', 'this', 'switch', 'case', 'break', 'continue', 'for', 'while', 'do', 'if', 'else', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'let', 'const', 'var', 'void', 'with', 'yield', 'async', 'await', 'enum', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'super', 'extends']);
  const modelVar = RESERVED_WORDS.has(rawModelVar) ? `${rawModelVar}Item` : rawModelVar;
  const curedOps = controller.cured || {};

  // Determine ID type for proper parsing
  const idAttr = (Array.isArray(model.attributes) ? model.attributes : Object.values(model.attributes || {}))
    .find((a: any) => a.name === 'id');
  const idType = idAttr?.type || 'UUID';
  const needsIntParse = idType === 'Integer' || idType === 'Int' || idType === 'Number';

  return `/**
 * ${controllerName}
 * Model-specific business logic for ${modelName}
 * ${controller.description || ''}
 */

import { PrismaClient } from '@prisma/client';
${hasEventPublishing(curedOps, controller) ? `import { eventBus, EventName } from '../events/eventBus.js';` : ''}

const prisma = new PrismaClient();

/** Parse ID from string to the correct type for this model */
function parseId(id: string): ${needsIntParse ? 'number' : 'string'} {
  ${needsIntParse ? 'return parseInt(id, 10);' : 'return id;'}
}

/**
 * ${controllerName} class
 */
export class ${controllerName} {
  ${generateValidateMethod(model, modelName)}
  ${curedOps.create ? generateCreateMethod(model, modelName, modelVar, controller, allModels) : ''}
  ${curedOps.retrieve ? generateRetrieveMethod(model, modelName, modelVar) : ''}
  ${curedOps.update ? generateUpdateMethod(model, modelName, modelVar, controller, allModels) : ''}
  ${curedOps.evolve ? generateEvolveMethod(model, modelName, modelVar, controller) : ''}
  ${curedOps.delete ? generateDeleteMethod(model, modelName, modelVar, controller) : ''}
  ${generateCustomActions(controller, modelName, modelVar)}
}

// Export singleton instance
export const ${modelVar}Controller = new ${controllerName}();
export default ${modelVar}Controller;
`;
}

/**
 * Generate validate method (unified validation for all operations)
 */
function generateValidateMethod(model: any, modelName: string): string {
  return `
  /**
   * Validate ${modelName} data
   * Unified validation method for all operations
   */
  public validate(
    _data: any,
    _context: { operation: 'create' | 'update' | 'evolve' }
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    ${generateValidationLogic(model, '_data', '_context')}

    return {
      valid: errors.length === 0,
      errors
    };
  }
`;
}

/**
 * Generate validation logic based on model attributes
 */
function generateValidationLogic(model: any, dataParam: string = '_data', contextParam: string = '_context'): string {
  if (!model.attributes) return '// No validation rules defined';

  const validations: string[] = [];

  const attrList = Array.isArray(model.attributes)
    ? model.attributes.map((a: any) => [a.name, a])
    : Object.entries(model.attributes);
  // Fields that are auto-generated and should not be required on create
  const AUTO_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at', 'createdBy', 'updatedBy']);

  attrList.forEach(([name, attr]: [string, any]) => {
    // Required validation — skip auto-generated fields
    if (attr.required && !attr.auto && !AUTO_FIELDS.has(name)) {
      validations.push(`
    // ${name} is required
    if (${contextParam}.operation === 'create' && !${dataParam}.${name}) {
      errors.push('${name} is required');
    }`);
    }

    // String length validation
    if (attr.type === 'String' || attr.type === 'string') {
      if (attr.min) {
        validations.push(`
    if (${dataParam}.${name} && ${dataParam}.${name}.length < ${attr.min}) {
      errors.push('${name} must be at least ${attr.min} characters');
    }`);
      }
      if (attr.max) {
        validations.push(`
    if (${dataParam}.${name} && ${dataParam}.${name}.length > ${attr.max}) {
      errors.push('${name} must be at most ${attr.max} characters');
    }`);
      }
    }

    // Enum validation
    if (attr.values && Array.isArray(attr.values)) {
      const values = attr.values.map((v: string) => `'${v}'`).join(', ');
      validations.push(`
    if (${dataParam}.${name} && ![${values}].includes(${dataParam}.${name})) {
      errors.push('${name} must be one of: ${attr.values.join(', ')}');
    }`);
    }

    // Email validation
    if (attr.format === 'email') {
      validations.push(`
    if (${dataParam}.${name} && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${dataParam}.${name})) {
      errors.push('${name} must be a valid email address');
    }`);
    }
  });

  return validations.join('\n') || '// No validation rules defined';
}

/**
 * Generate create method
 */
function generateCreateMethod(model: any, modelName: string, modelVar: string, controller: any, allModels?: any[]): string {
  const hasEvents = controller.publishes && Array.isArray(controller.publishes);
  const createEvent = hasEvents ? controller.publishes.find((e: string) => e.includes('Created')) : null;

  return `
  /**
   * Create a new ${modelName}
   */
  public async create(data: any): Promise<any> {
    // Validate input
    const validationResult = this.validate(data, { operation: 'create' });
    if (!validationResult.valid) {
      throw new Error(\`Validation failed: \${validationResult.errors.join(', ')}\`);
    }

    // Transform FK fields to Prisma connect format
    const prismaData = { ...data };
    ${generateFKTransform(model, 'prismaData', allModels)}

    // Create record
    const ${modelVar} = await prisma.${modelVar}.create({
      data: prismaData${generateIncludeRelationships(model)}
    });

    ${createEvent ? `
    // Publish event
    eventBus.publish(EventName.${createEvent}, {
      ${modelVar},
      timestamp: new Date().toISOString()
    });
    ` : ''}

    return ${modelVar};
  }
`;
}

/**
 * Generate retrieve method
 */
function generateRetrieveMethod(model: any, modelName: string, modelVar: string): string {
  return `
  /**
   * Retrieve ${modelName} by ID
   */
  public async retrieve(id: string): Promise<any> {
    const ${modelVar} = await prisma.${modelVar}.findUnique({
      where: { id: parseId(id) }${generateIncludeRelationships(model)}
    });

    if (!${modelVar}) {
      throw new Error('${modelName} not found');
    }

    return ${modelVar};
  }

  /**
   * Retrieve all ${modelName}s
   */
  public async retrieveAll(options: { skip?: number; take?: number } = {}): Promise<any[]> {
    return await prisma.${modelVar}.findMany({
      skip: options.skip,
      take: options.take${generateIncludeRelationships(model)}
    });
  }
`;
}

/**
 * Generate update method
 */
function generateUpdateMethod(model: any, modelName: string, modelVar: string, controller: any, allModels?: any[]): string {
  const hasEvents = controller.publishes && Array.isArray(controller.publishes);
  const updateEvent = hasEvents ? controller.publishes.find((e: string) => e.includes('Updated')) : null;

  return `
  /**
   * Update ${modelName}
   */
  public async update(id: string, data: any): Promise<any> {
    // Validate input
    const validationResult = this.validate(data, { operation: 'update' });
    if (!validationResult.valid) {
      throw new Error(\`Validation failed: \${validationResult.errors.join(', ')}\`);
    }

    // Strip nested relations and id — only send scalar fields to Prisma
    const updateData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue;
      if (Array.isArray(value)) continue;
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) continue;
      updateData[key] = value;
    }

    // Transform FK fields to Prisma connect format
    ${generateFKTransform(model, 'updateData', allModels)}

    // Update record
    const ${modelVar} = await prisma.${modelVar}.update({
      where: { id: parseId(id) },
      data: updateData${generateIncludeRelationships(model)}
    });

    ${updateEvent ? `
    // Publish event
    eventBus.publish(EventName.${updateEvent}, {
      ${modelVar},
      timestamp: new Date().toISOString()
    });
    ` : ''}

    return ${modelVar};
  }
`;
}

/**
 * Generate evolve method (lifecycle-aware updates)
 */
function generateEvolveMethod(model: any, modelName: string, modelVar: string, controller: any): string {
  // Extract lifecycle — handle both array and object format
  const lifecycles = Array.isArray(model.lifecycles) ? model.lifecycles :
    (model.lifecycles ? Object.entries(model.lifecycles).map(([name, lc]: [string, any]) => ({ name, ...lc })) : []);
  const lifecycle = lifecycles[0];
  const lifecycleName = lifecycle?.name || 'status';
  const states = lifecycle?.states || [];

  // Build transition map from the lifecycle flow
  const validTransitions: Record<string, string[]> = {};
  if (states.length > 1) {
    for (let i = 0; i < states.length - 1; i++) {
      validTransitions[states[i]] = [states[i + 1]];
    }
  }
  // Add cancel transitions if spec defines them
  if (lifecycle?.transitions) {
    const transitions = Array.isArray(lifecycle.transitions) ? lifecycle.transitions :
      Object.entries(lifecycle.transitions).map(([name, t]: [string, any]) => ({ name, ...t }));
    for (const t of transitions) {
      const fromStates = Array.isArray(t.from) ? t.from : [t.from];
      for (const from of fromStates) {
        if (!validTransitions[from]) validTransitions[from] = [];
        if (!validTransitions[from].includes(t.to)) validTransitions[from].push(t.to);
      }
    }
  }

  return `
  /**
   * Evolve ${modelName} through lifecycle
   * States: ${states.join(' → ')}
   */
  public async evolve(id: string, data: any): Promise<any> {
    // Validate input
    const validationResult = this.validate(data, { operation: 'evolve' });
    if (!validationResult.valid) {
      throw new Error(\`Validation failed: \${validationResult.errors.join(', ')}\`);
    }

    // Get current record to check lifecycle state
    const current = await prisma.${modelVar}.findUnique({ where: { id: parseId(id) } });
    if (!current) {
      throw new Error('${modelName} not found');
    }

    ${states.length > 0 ? `
    // Validate lifecycle transition
    const currentState = (current as any).${lifecycleName};
    const newState = data.${lifecycleName};
    if (newState) {
      const validTransitions: Record<string, string[]> = ${JSON.stringify(validTransitions)};
      const allowed = validTransitions[currentState] || [];
      if (!allowed.includes(newState)) {
        throw new Error(\`Invalid transition: \${currentState} → \${newState}. Allowed: \${allowed.join(', ') || 'none'}\`);
      }
    }
    ` : ''}

    // Update record
    const ${modelVar} = await prisma.${modelVar}.update({
      where: { id: parseId(id) },
      data${generateIncludeRelationships(model)}
    });

    return ${modelVar};
  }
`;
}

/**
 * Generate delete method
 */
function generateDeleteMethod(model: any, modelName: string, modelVar: string, controller: any): string {
  const hasEvents = controller.publishes && Array.isArray(controller.publishes);
  const deleteEvent = hasEvents ? controller.publishes.find((e: string) => e.includes('Deleted')) : null;

  return `
  /**
   * Delete ${modelName}
   */
  public async delete(id: string): Promise<void> {
    ${deleteEvent ? `
    // Get record before deletion for event
    const ${modelVar} = await prisma.${modelVar}.findUnique({ where: { id: parseId(id) } });
    ` : ''}

    await prisma.${modelVar}.delete({
      where: { id: parseId(id) }
    });

    ${deleteEvent ? `
    // Publish event
    if (${modelVar}) {
      eventBus.publish(EventName.${deleteEvent}, {
        ${modelVar},
        timestamp: new Date().toISOString()
      });
    }
    ` : ''}
  }
`;
}

/**
 * Generate custom actions defined in controller
 */
function generateCustomActions(controller: any, modelName: string, modelVar: string): string {
  if (!controller.actions || Object.keys(controller.actions).length === 0) {
    return '';
  }

  const actions: string[] = [];

  Object.entries(controller.actions).forEach(([actionName, action]: [string, any]) => {
    actions.push(`
  /**
   * ${actionName}
   * ${action.description || ''}
   */
  public async ${actionName}(${generateActionParams(action)}): Promise<any> {
    // TODO: Implement ${actionName} logic
    throw new Error('${actionName} not implemented');
  }`);
  });

  return actions.join('\n');
}

/**
 * Generate action parameters
 */
function generateActionParams(action: any): string {
  if (!action.parameters || Object.keys(action.parameters).length === 0) {
    return '';
  }

  const params = Object.entries(action.parameters).map(([name, param]: [string, any]) => {
    const optional = !param.required;
    return `${name}${optional ? '?' : ''}: ${mapTypeToTypeScript(param.type)}`;
  });

  return params.join(', ');
}

/**
 * Map SpecVerse types to TypeScript types
 */
function mapTypeToTypeScript(type: string): string {
  const typeMap: Record<string, string> = {
    String: 'string',
    Integer: 'number',
    Float: 'number',
    Boolean: 'boolean',
    Date: 'Date',
    DateTime: 'Date',
    UUID: 'string',
    JSON: 'any'
  };

  return typeMap[type] || 'any';
}

/**
 * Generate FK field transformation for Prisma create/update.
 * Converts flat FK IDs (guesthouseId: "uuid") to Prisma connect format
 * (guesthouse: { connect: { id: "uuid" } })
 */
function generateFKTransform(model: any, varName: string = 'prismaData', allModels?: any[]): string {
  const rels = Array.isArray(model.relationships)
    ? model.relationships
    : Object.values(model.relationships || {});

  const belongsToRels = (rels as any[]).filter(r => r.type === 'belongsTo');
  if (belongsToRels.length === 0) return '';

  return belongsToRels.map((rel: any) => {
    const relName = rel.name;
    const fkField = `${relName}Id`;

    // Determine target model's ID type for correct parsing
    let parseExpr = `${varName}.${fkField}`;
    if (allModels) {
      const targetModel = allModels.find((m: any) => m.name === rel.target);
      if (targetModel) {
        const idAttr = (Array.isArray(targetModel.attributes) ? targetModel.attributes : Object.values(targetModel.attributes || {}))
          .find((a: any) => a.name === 'id');
        const idType = idAttr?.type || 'String';
        if (idType === 'Integer' || idType === 'Int' || idType === 'Number') {
          parseExpr = `parseInt(${varName}.${fkField}, 10)`;
        }
      }
    }

    return `if (${varName}.${fkField}) {
      ${varName}.${relName} = { connect: { id: ${parseExpr} } };
      delete ${varName}.${fkField};
    }`;
  }).join('\n    ');
}

/**
 * Generate include clause for relationships
 */
function generateIncludeRelationships(model: any): string {
  if (!model.relationships) {
    return '';
  }

  // Handle different relationship formats
  let relationshipKeys: string[];

  if (Array.isArray(model.relationships)) {
    // Array format: could be array of strings or array of objects
    relationshipKeys = model.relationships.map((rel: any) => {
      if (typeof rel === 'string') {
        return rel;
      } else if (typeof rel === 'object' && rel.name) {
        return rel.name;
      } else {
        return null;
      }
    }).filter((rel): rel is string => rel !== null);
  } else if (typeof model.relationships === 'object') {
    // Object format: { author: {...}, comments: {...} }
    relationshipKeys = Object.keys(model.relationships);
  } else {
    return '';
  }

  if (relationshipKeys.length === 0) {
    return '';
  }

  const includes = relationshipKeys
    .map(rel => `        ${rel}: true`)
    .join(',\n');

  return `,
      include: {
${includes}
      }`;
}

/**
 * Check if controller publishes events
 */
function hasEventPublishing(curedOps: any, controller: any): boolean {
  return controller.publishes && Array.isArray(controller.publishes) && controller.publishes.length > 0;
}
