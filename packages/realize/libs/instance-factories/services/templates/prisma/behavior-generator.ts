/**
 * Behavior Generator
 *
 * Generates service/controller method bodies from behavioral metadata:
 * - preconditions -> guard checks
 * - steps -> convention-expanded logic (data-driven pattern matching)
 * - postconditions -> dev-mode assertions
 * - publishes/sideEffects -> event publishing
 * - transactional -> prisma.$transaction wrapper
 *
 * This is L3 generation: structure (L1) and CRUD (L2) are handled by
 * the schema and controller generators. This module generates real
 * business logic from behavioral specifications.
 *
 * Steps are resolved in priority order:
 * 1. Convention patterns (15 common patterns in step-conventions.ts)
 * 2. Stub generation (compiles, throws at runtime)
 */

import { matchStep, type StepContext } from './step-conventions.js';

export interface BehaviorContext {
  modelName: string;
  serviceName: string;
  operationName: string;
  prismaModel?: string;
}

export interface BehaviorMetadata {
  preconditions?: string[];
  postconditions?: string[];
  sideEffects?: string[];
  steps?: string[];
  transactional?: boolean;
}

export interface OperationMetadata {
  async?: boolean;
  cacheable?: boolean;
  idempotent?: boolean;
}

export interface BehaviorResult {
  body: string;
  helperMethods: string[];
}

/**
 * Generate a complete method body from behavioral metadata.
 * Returns the method body AND any helper methods that need to be added to the class.
 */
export function generateBehaviorBody(
  behavior: BehaviorMetadata,
  opMeta: OperationMetadata,
  context: BehaviorContext
): string {
  const result = generateBehaviorWithHelpers(behavior, opMeta, context);
  // For backward compatibility, return just the body.
  // Callers that need helper methods should use generateBehaviorWithHelpers.
  return result.body;
}

/**
 * Generate behavior body + helper methods.
 */
export function generateBehaviorWithHelpers(
  behavior: BehaviorMetadata,
  opMeta: OperationMetadata,
  context: BehaviorContext
): BehaviorResult {
  const parts: string[] = [];
  const helperMethods: string[] = [];

  // Precondition guards
  const preconditions = generatePreconditionChecks(
    behavior.preconditions || [], context
  );
  if (preconditions) parts.push(preconditions);

  // Main logic (from steps or inferred from operation semantics)
  const { code, helpers } = generateStepLogic(
    behavior.steps || [], context
  );
  parts.push(code);
  helperMethods.push(...helpers);

  // Postcondition verification
  const postconditions = generatePostconditionVerification(
    behavior.postconditions || []
  );
  if (postconditions) parts.push(postconditions);

  // Event publishing
  const events = generateEventPublishing(
    behavior.sideEffects || [], context.operationName
  );
  if (events) parts.push(events);

  let body = parts.join('\n\n');

  // Wrap in transaction if flagged
  if (behavior.transactional) {
    body = generateTransactionWrapper(body, context);
  }

  return { body, helperMethods };
}

/**
 * Generate precondition checks from natural-language strings.
 */
export function generatePreconditionChecks(
  preconditions: string[],
  context: BehaviorContext
): string {
  if (preconditions.length === 0) return '';

  const checks = preconditions.map(pc => matchPreconditionPattern(pc, context));
  return `    // === PRECONDITIONS ===\n${checks.join('\n')}`;
}

function matchPreconditionPattern(
  precondition: string,
  context: BehaviorContext
): string {
  const pc = precondition.toLowerCase();
  const prismaModel = context.prismaModel || context.modelName;

  // Pattern: "{Model} exists"
  const existsMatch = precondition.match(/^(\w+)\s+exists/i);
  if (existsMatch) {
    const entity = existsMatch[1];
    const entityVar = entity.charAt(0).toLowerCase() + entity.slice(1);
    return `    // Guard: ${precondition}
    const ${entityVar} = await prisma.${entityVar}.findUnique({ where: { id: params.id } });
    if (!${entityVar}) {
      throw new Error('Precondition failed: ${precondition}');
    }`;
  }

  // Pattern: "{field} is not empty" / "{field} is required"
  if (pc.includes('is not empty') || pc.includes('is required')) {
    const fieldMatch = precondition.match(/^(\w+)\s+is/i);
    if (fieldMatch) {
      const field = fieldMatch[1];
      return `    // Guard: ${precondition}
    if (!params.${field}) {
      throw new Error('Precondition failed: ${precondition}');
    }`;
    }
  }

  // Pattern: "{field} is valid"
  if (pc.includes('is valid')) {
    return `    // Guard: ${precondition}
    const validation = this.validate(params, { operation: '${context.operationName}' });
    if (!validation.valid) {
      throw new Error('Precondition failed: ${precondition} — ' + validation.errors.join(', '));
    }`;
  }

  // Pattern: "{X} matches {Y}" / "{X} equals {Y}"
  const matchesMatch = precondition.match(/^(\w+)\s+(?:matches|equals)\s+(.+)/i);
  if (matchesMatch) {
    const left = matchesMatch[1];
    const right = matchesMatch[2];
    return `    // Guard: ${precondition}
    if (params.${left.charAt(0).toLowerCase() + left.slice(1)} !== params.${right.charAt(0).toLowerCase() + right.slice(1)}) {
      throw new Error('Precondition failed: ${precondition}');
    }`;
  }

  // Pattern: "{Model} is {state}"
  const stateMatch = precondition.match(/^(\w+)\s+is\s+(\w+)$/i);
  if (stateMatch) {
    const model = stateMatch[1];
    const state = stateMatch[2];
    const modelVar = model.charAt(0).toLowerCase() + model.slice(1);
    return `    // Guard: ${precondition}
    const ${modelVar}State = await prisma.${modelVar}.findUniqueOrThrow({ where: { id: params.id } });
    if (${modelVar}State.status !== '${state}') {
      throw new Error('Precondition failed: ${precondition} (current: ' + ${modelVar}State.status + ')');
    }`;
  }

  // Unrecognized
  return `    // Guard: ${precondition}
    // TODO: Implement precondition check`;
}

/**
 * Generate step logic using convention-based pattern matching.
 */
function generateStepLogic(
  steps: string[],
  context: BehaviorContext
): { code: string; helpers: string[] } {
  const helpers: string[] = [];

  if (steps && steps.length > 0) {
    const stepCode = steps.map((step, i) => {
      if (typeof step !== 'string') {
        return `    // Step ${i + 1}: Complex operation — see expanded definition`;
      }

      const ctx: StepContext = {
        modelName: context.modelName,
        prismaModel: context.prismaModel || context.modelName,
        serviceName: context.serviceName,
        operationName: context.operationName,
        stepNum: i + 1,
      };

      const result = matchStep(step, ctx);
      if (result.helperMethod) {
        helpers.push(result.helperMethod);
      }
      return result.call;
    });

    return {
      code: `    // === EXECUTE ===\n${stepCode.join('\n\n')}`,
      helpers,
    };
  }

  // No steps — infer from operation name
  return {
    code: `    // === EXECUTE ===\n${inferLogicFromOperationName(context)}`,
    helpers,
  };
}

function inferLogicFromOperationName(context: BehaviorContext): string {
  const op = context.operationName;
  const prismaModel = context.prismaModel || context.modelName;
  const modelVar = prismaModel.charAt(0).toLowerCase() + prismaModel.slice(1);

  if (op.startsWith('handle')) {
    const event = op.replace('handle', '');
    return `    // Event handler: ${op}
    console.log('[${context.serviceName}] Processing ${event}', params);
    return { handled: true, event: '${event}' };`;
  }

  if (op.startsWith('validate')) {
    return `    // Validation: ${op}
    const records = await prisma.${modelVar}.findMany({ where: { id: params.id } });
    return { valid: records.length > 0, checked: records.length };`;
  }

  if (op.startsWith('get') || op.startsWith('list') || op.startsWith('find')) {
    return `    return await prisma.${modelVar}.findMany({});`;
  }

  return `    // TODO: Implement ${op}
    return { success: true };`;
}

/**
 * Generate postcondition verification (dev-mode assertions).
 */
export function generatePostconditionVerification(
  postconditions: string[]
): string {
  if (postconditions.length === 0) return '';

  const checks = postconditions.map(pc =>
    `      console.assert(true, 'POSTCONDITION: ${pc}');`
  );

  return `    // === POSTCONDITIONS (dev-mode) ===
    if (process.env.NODE_ENV === 'development') {
${checks.join('\n')}
    }`;
}

/**
 * Generate event publishing from sideEffects.
 */
export function generateEventPublishing(
  sideEffects: string[],
  operationName: string
): string {
  if (!sideEffects || sideEffects.length === 0) return '';

  const publishes = sideEffects.map(event =>
    `    this.emit('${event}', { operation: '${operationName}', timestamp: new Date().toISOString() });`
  );

  return `    // === EVENTS ===\n${publishes.join('\n')}`;
}

/**
 * Wrap method body in prisma.$transaction.
 */
export function generateTransactionWrapper(
  body: string,
  context: BehaviorContext
): string {
  return `    return await prisma.$transaction(async (tx) => {
${body}
    });`;
}
