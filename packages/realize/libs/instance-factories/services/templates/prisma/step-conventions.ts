/**
 * Step Conventions — data-driven pattern matching for behavior steps.
 *
 * Each convention maps a natural language step pattern to generated code.
 * Patterns are tried in order; first match wins. Unmatched steps get stubs.
 */

export interface StepConvention {
  name: string;
  pattern: RegExp;
  generateCall: (match: RegExpMatchArray, ctx: StepContext) => string;
  generateMethod?: (match: RegExpMatchArray, ctx: StepContext) => string;
}

export interface StepContext {
  modelName: string;
  prismaModel: string;
  serviceName: string;
  operationName: string;
  stepNum: number;
}

function toVar(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function toMethod(words: string): string {
  return words.trim().replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^\w/, c => c.toLowerCase());
}

export const STEP_CONVENTIONS: StepConvention[] = [
  // --- Validation ---
  {
    name: 'validate',
    pattern: /^validate\s+(.+)/i,
    generateCall: (m, ctx) => `    // Step ${ctx.stepNum}: Validate ${m[1]}
    const validationResult = this.validate(params, { operation: '${ctx.operationName}' });
    if (!validationResult.valid) {
      throw new Error(\`Validation failed: \${validationResult.errors.join(', ')}\`);
    }`,
  },

  // --- Check / Guard ---
  {
    name: 'check',
    pattern: /^check\s+(.+)/i,
    generateCall: (m, ctx) => {
      const condition = m[1];
      const methodName = toMethod('check ' + condition);
      return `    // Step ${ctx.stepNum}: Check ${condition}
    const checkResult = await this.${methodName}(params);
    if (!checkResult) {
      throw new Error('Check failed: ${condition}');
    }`;
    },
    generateMethod: (m, ctx) => {
      const condition = m[1];
      const methodName = toMethod('check ' + condition);
      return `
  private async ${methodName}(params: any): Promise<boolean> {
    // TODO: Implement check — ${condition}
    const ${toVar(ctx.prismaModel)} = await this.prisma.${toVar(ctx.prismaModel)}.findUnique({ where: { id: params.id } });
    if (!${toVar(ctx.prismaModel)}) return false;
    return true;
  }`;
    },
  },

  // --- Find / Lookup ---
  {
    name: 'find',
    pattern: /^find\s+(\w+)\s+by\s+(\w+)/i,
    generateCall: (m, ctx) => {
      const model = m[1];
      const field = m[2];
      return `    // Step ${ctx.stepNum}: Find ${model} by ${field}
    const ${toVar(model)} = await this.prisma.${toVar(model)}.findUnique({ where: { ${field}: params.${field} } });
    if (!${toVar(model)}) {
      throw new Error('${model} not found by ${field}');
    }`;
    },
  },

  // --- Create ---
  {
    name: 'create',
    pattern: /^create\s+(\w+)(?:\s+record)?/i,
    generateCall: (m, ctx) => {
      const model = m[1];
      return `    // Step ${ctx.stepNum}: Create ${model}
    const ${toVar(model)} = await this.prisma.${toVar(model)}.create({ data: params });`;
    },
  },

  // --- Update field ---
  {
    name: 'update-field',
    pattern: /^update\s+(\w+)\s+(\w+)\s+to\s+(.+)/i,
    generateCall: (m, ctx) => {
      const model = m[1];
      const field = m[2];
      const value = m[3].trim().replace(/"/g, "'");
      const isString = /^[a-z]/.test(value) && !value.includes('.');
      const val = isString ? `'${value}'` : value;
      return `    // Step ${ctx.stepNum}: Update ${model} ${field} to ${value}
    await this.prisma.${toVar(model)}.update({
      where: { id: params.id },
      data: { ${field}: ${val} },
    });`;
    },
  },

  // --- Generic update ---
  {
    name: 'update',
    pattern: /^update\s+(\w+)(?:\s+(.+))?/i,
    generateCall: (m, ctx) => {
      const model = m[1];
      return `    // Step ${ctx.stepNum}: Update ${model}
    await this.prisma.${toVar(model)}.update({
      where: { id: params.id },
      data: params,
    });`;
    },
  },

  // --- Delete ---
  {
    name: 'delete',
    pattern: /^delete\s+(\w+)/i,
    generateCall: (m, ctx) => {
      const model = m[1];
      return `    // Step ${ctx.stepNum}: Delete ${model}
    await this.prisma.${toVar(model)}.delete({ where: { id: params.id } });`;
    },
  },

  // --- Transition / Evolve ---
  {
    name: 'transition',
    pattern: /^transition\s+(\w+)\s+to\s+(\w+)/i,
    generateCall: (m, ctx) => {
      const model = m[1];
      const state = m[2];
      return `    // Step ${ctx.stepNum}: Transition ${model} to ${state}
    const current = await this.prisma.${toVar(model)}.findUniqueOrThrow({ where: { id: params.id } });
    // Lifecycle validation would check valid transition here
    await this.prisma.${toVar(model)}.update({
      where: { id: params.id },
      data: { status: '${state}' },
    });`;
    },
  },

  // --- Set field ---
  {
    name: 'set',
    pattern: /^set\s+(\w+)\s+to\s+(.+)/i,
    generateCall: (m, ctx) => {
      const field = m[1];
      const value = m[2].trim();
      const isCurrentTime = /current time|now|timestamp/i.test(value);
      const val = isCurrentTime ? 'new Date()' : `'${value}'`;
      return `    // Step ${ctx.stepNum}: Set ${field} to ${value}
    await this.prisma.${toVar(ctx.prismaModel)}.update({
      where: { id: params.id },
      data: { ${field}: ${val} },
    });`;
    },
  },

  // --- Increment ---
  {
    name: 'increment',
    pattern: /^increment\s+(\w+)\s+by\s+(\w+)/i,
    generateCall: (m, ctx) => {
      const field = m[1];
      const amount = m[2];
      const amountVal = /^\d+$/.test(amount) ? amount : `params.${amount}`;
      return `    // Step ${ctx.stepNum}: Increment ${field} by ${amount}
    await this.prisma.${toVar(ctx.prismaModel)}.update({
      where: { id: params.id },
      data: { ${field}: { increment: ${amountVal} } },
    });`;
    },
  },

  // --- Decrement ---
  {
    name: 'decrement',
    pattern: /^decrement\s+(\w+)\s+by\s+(\w+)/i,
    generateCall: (m, ctx) => {
      const field = m[1];
      const amount = m[2];
      const amountVal = /^\d+$/.test(amount) ? amount : `params.${amount}`;
      return `    // Step ${ctx.stepNum}: Decrement ${field} by ${amount}
    const current${field} = await this.prisma.${toVar(ctx.prismaModel)}.findUniqueOrThrow({ where: { id: params.id } });
    if ((current${field}.${field} || 0) < ${amountVal}) {
      throw new Error('Cannot decrement ${field} below zero');
    }
    await this.prisma.${toVar(ctx.prismaModel)}.update({
      where: { id: params.id },
      data: { ${field}: { decrement: ${amountVal} } },
    });`;
    },
  },

  // --- Calculate ---
  {
    name: 'calculate',
    pattern: /^calculate\s+(.+)/i,
    generateCall: (m, ctx) => {
      const metric = m[1];
      const methodName = toMethod('calculate ' + metric);
      return `    // Step ${ctx.stepNum}: Calculate ${metric}
    const ${toVar(metric.replace(/\s+/g, ''))} = await this.${methodName}(params);`;
    },
    generateMethod: (m, ctx) => {
      const metric = m[1];
      const methodName = toMethod('calculate ' + metric);
      return `
  private async ${methodName}(params: any): Promise<number> {
    // TODO: Implement calculation — ${metric}
    return 0;
  }`;
    },
  },

  // --- Send event ---
  {
    name: 'send-event',
    pattern: /^(?:send|emit|publish)\s+(\w+)\s+event/i,
    generateCall: (m, ctx) => {
      const event = m[1];
      return `    // Step ${ctx.stepNum}: Emit ${event} event
    this.emit('${event}', { ${toVar(ctx.prismaModel)}Id: params.id, operation: '${ctx.operationName}', timestamp: new Date().toISOString() });`;
    },
  },

  // --- Send notification ---
  {
    name: 'send-notification',
    pattern: /^send\s+(\w+)\s+notification/i,
    generateCall: (m, ctx) => {
      const type = m[1];
      return `    // Step ${ctx.stepNum}: Send ${type} notification
    this.emit('${type}Notification', { ${toVar(ctx.prismaModel)}Id: params.id, operation: '${ctx.operationName}' });`;
    },
  },

  // --- Call service ---
  {
    name: 'call-service',
    pattern: /^call\s+(\w+)\.(\w+)/i,
    generateCall: (m, ctx) => {
      const service = m[1];
      const method = m[2];
      return `    // Step ${ctx.stepNum}: Call ${service}.${method}
    await this.${toVar(service)}.${method}(params);`;
    },
  },

  // --- Return ---
  {
    name: 'return',
    pattern: /^return\s+(.+)/i,
    generateCall: (m, ctx) => {
      const value = m[1].trim();
      const isModel = /^(updated|created|the)\s+/i.test(value) || value === ctx.modelName;
      if (isModel) {
        return `    // Step ${ctx.stepNum}: Return result
    return ${toVar(ctx.prismaModel)};`;
      }
      return `    // Step ${ctx.stepNum}: Return ${value}
    return ${value};`;
    },
  },
];

/**
 * Match a step string against all conventions. Returns the generated call
 * code and optionally a helper method to add to the class.
 */
export function matchStep(
  step: string,
  ctx: StepContext
): { call: string; helperMethod?: string } {
  for (const convention of STEP_CONVENTIONS) {
    const match = step.match(convention.pattern);
    if (match) {
      return {
        call: convention.generateCall(match, ctx),
        helperMethod: convention.generateMethod?.(match, ctx),
      };
    }
  }

  // No match — generate stub method
  const methodName = toMethod(step);
  return {
    call: `    // Step ${ctx.stepNum}: ${step}
    await this.${methodName}(params);`,
    helperMethod: `
  private async ${methodName}(params: any): Promise<void> {
    // TODO: Implement — ${step}
    throw new Error('Not implemented: ${methodName}');
  }`,
  };
}
