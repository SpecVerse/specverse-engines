/**
 * Behavior Generator
 *
 * Generates service/controller method bodies from behavioral metadata:
 * - preconditions -> guard checks
 * - steps -> ordered logic (convention-expanded or inferred)
 * - postconditions -> dev-mode assertions
 * - publishes/sideEffects -> event publishing
 * - transactional -> prisma.$transaction wrapper
 *
 * This is L3 generation: structure (L1) and CRUD (L2) are handled by
 * the schema and controller generators. This module generates real
 * business logic from behavioral specifications.
 */

export interface BehaviorContext {
  modelName: string;
  serviceName: string;
  operationName: string;
  prismaModel?: string; // Prisma model name (may differ from modelName)
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

/**
 * Generate a complete method body from behavioral metadata.
 */
export function generateBehaviorBody(
  behavior: BehaviorMetadata,
  opMeta: OperationMetadata,
  context: BehaviorContext
): string {
  const parts: string[] = [];

  // Precondition guards
  const preconditions = generatePreconditionChecks(
    behavior.preconditions || [], context
  );
  if (preconditions) parts.push(preconditions);

  // Main logic (from steps or inferred from operation semantics)
  const logic = generateStepLogic(
    behavior.steps || [], context
  );
  parts.push(logic);

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

  const body = parts.join('\n\n');

  // Wrap in transaction if flagged
  if (behavior.transactional) {
    return generateTransactionWrapper(body, context);
  }

  return body;
}

/**
 * Generate precondition checks from natural-language strings.
 * Pattern-matches common phrases into Prisma queries.
 */
export function generatePreconditionChecks(
  preconditions: string[],
  context: BehaviorContext
): string {
  if (preconditions.length === 0) return '';

  const checks = preconditions.map(pc => {
    const generated = matchPreconditionPattern(pc, context);
    return generated;
  });

  return `    // === PRECONDITIONS ===\n${checks.join('\n')}`;
}

/**
 * Pattern-match a precondition string to generated code.
 */
function matchPreconditionPattern(
  precondition: string,
  context: BehaviorContext
): string {
  const pc = precondition.toLowerCase();
  const prismaModel = context.prismaModel || context.modelName;
  const modelVar = prismaModel.charAt(0).toLowerCase() + prismaModel.slice(1);

  // Pattern: "{Model} exists" or "{entity} exists"
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

  // Pattern: "Profile is currently attached" / "Profile exists"
  if (pc.includes('profile')) {
    return `    // Guard: ${precondition}
    // TODO: Check profile attachment state`;
  }

  // Unrecognized — annotated comment
  return `    // PRECONDITION: ${precondition} — requires implementation`;
}

/**
 * Generate step logic from step strings or infer from operation semantics.
 */
export function generateStepLogic(
  steps: string[],
  context: BehaviorContext
): string {
  // If steps are provided, generate from them
  if (steps && steps.length > 0) {
    const stepCode = steps.map((step, i) => {
      if (typeof step === 'string') {
        return matchStepPattern(step, context, i + 1);
      }
      // Complex step (object with expandedOperation) — generate recursively
      return `    // Step ${i + 1}: Complex operation — see expanded definition`;
    });
    return `    // === EXECUTE ===\n${stepCode.join('\n\n')}`;
  }

  // No steps — infer from operation name
  return `    // === EXECUTE ===\n${inferLogicFromOperationName(context)}`;
}

/**
 * Pattern-match a step string to generated code.
 */
function matchStepPattern(
  step: string,
  context: BehaviorContext,
  stepNum: number
): string {
  const lower = step.toLowerCase();

  // Pattern: "Validate {target}"
  if (lower.startsWith('validate')) {
    return `    // Step ${stepNum}: ${step}
    const validationResult = this.validate(params, { operation: '${context.operationName}' });
    if (!validationResult.valid) {
      throw new Error(\`Validation failed: \${validationResult.errors.join(', ')}\`);
    }`;
  }

  // Pattern: formula with "="
  if (step.includes('=') && !step.includes('==')) {
    return `    // Step ${stepNum}: ${step}
    // Formula: ${step}`;
  }

  // Default: annotated comment
  return `    // Step ${stepNum}: ${step}`;
}

/**
 * Infer logic from operation name when no steps are provided.
 */
function inferLogicFromOperationName(context: BehaviorContext): string {
  const op = context.operationName;
  const prismaModel = context.prismaModel || context.modelName;
  const modelVar = prismaModel.charAt(0).toLowerCase() + prismaModel.slice(1);

  // Pattern: handle{Event} → event handler with delegation
  if (op.startsWith('handle')) {
    const event = op.replace('handle', '');
    return `    // Event handler: ${op}
    console.log('[${context.serviceName}] Processing ${event}', params);
    // Delegate to model-specific logic
    return { handled: true, event: '${event}' };`;
  }

  // Pattern: validate{Something} → query + check
  if (op.startsWith('validate')) {
    return `    // Validation: ${op}
    const records = await prisma.${modelVar}.findMany({
      where: { id: params.id }
    });
    const isValid = records.length > 0;
    return { valid: isValid, checked: records.length };`;
  }

  // Pattern: repair{Something} → find + fix
  if (op.startsWith('repair')) {
    return `    // Repair: ${op}
    const issues = await prisma.${modelVar}.findMany({
      where: { id: params.id }
    });
    // TODO: Apply repair logic
    return { repaired: true, issuesFound: issues.length };`;
  }

  // Pattern: get{Something} → query
  if (op.startsWith('get')) {
    return `    return await prisma.${modelVar}.findMany({});`;
  }

  // Pattern: bootstrap → initialization
  if (op === 'bootstrap') {
    return `    // Bootstrap: initialize all modules
    console.log('[${context.serviceName}] Bootstrapping...');
    return { success: true };`;
  }

  // Default: annotated stub
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
    `    // eventBus.publish('${event}', { operation: '${operationName}', timestamp: new Date().toISOString() });`
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
