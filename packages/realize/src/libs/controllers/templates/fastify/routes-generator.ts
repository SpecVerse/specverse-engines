/**
 * Fastify Routes Generator
 *
 * Generates Fastify route handlers from SpecVerse controllers
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate Fastify routes for a controller
 */
export default function generateFastifyRoutes(context: TemplateContext): string {
  const { controller, model, spec, implType } = context;

  if (!controller) {
    throw new Error('Controller is required in template context');
  }

  const modelName = model?.name || controller.modelReference;
  const controllerName = controller.name;
  const routeName = controllerName || `${modelName}Controller`;

  // Determine if this is a model controller or abstract service
  const isModelController = !!modelName;
  const handlerName = isModelController ? `${modelName}Controller` : controllerName;

  // Generate imports
  const imports = generateImports(controller, modelName, handlerName, isModelController, implType);

  // Convert CURED operations to endpoints if endpoints don't exist
  let endpoints = controller.endpoints;
  if (!endpoints || endpoints.length === 0) {
    if (controller.cured) {
      endpoints = curedToEndpoints(controller.cured, modelName);
    }
  }

  // Generate route handlers for each endpoint
  if (!endpoints || endpoints.length === 0) {
    console.warn(`Warning: Controller ${controllerName} has no endpoints. Generating empty routes file.`);
  }

  const routeHandlers = endpoints?.map((endpoint: any) => {
    return generateRouteHandler(endpoint, modelName, handlerName, isModelController, implType, controllerName);
  }).join('\n\n') || '';

  // Generate the complete route file
  return `${imports}

/**
 * ${routeName} Routes
 * Generated from SpecVerse specification
 *
 * ${isModelController ? `Model: ${modelName}` : `Service: ${controllerName}`}
 * Operations: ${controller.endpoints?.map((e: any) => e.operation).join(', ') || 'CURED'}
 */
export default async function ${routeName.replace('Controller', '')}Routes(
  fastify: FastifyInstance,
  options: any
) {
  const handler = ${isModelController ? 'options.controllers' : 'options.services'}.${handlerName};

${routeHandlers.split('\n').map(line => '  ' + line).join('\n')}
}
`;
}

/**
 * Generate imports for the route file
 */
function generateImports(
  controller: any,
  modelName: string,
  handlerName: string,
  isModelController: boolean,
  implType: any
): string {
  const imports = [
    `import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';`,
  ];

  // Don't import controller/service - they're passed via options
  // Handlers are accessed via options.controllers or options.services

  // Add validation imports if Zod is configured
  if (implType?.technology?.validation === 'zod' && modelName) {
    imports.push(`import { ${modelName}Schema } from '../validation/${modelName}.schema.js';`);
  }

  return imports.join('\n');
}

/**
 * Generate a single route handler
 */
function generateRouteHandler(
  endpoint: any,
  modelName: string,
  handlerName: string,
  isModelController: boolean,
  implType: any,
  controllerName?: string
): string {
  // Try to get operation from multiple sources
  let operation = endpoint.operation || endpoint.name;

  // If operation is 'custom' from serviceOperation, extract from path
  if (!operation || operation === 'custom') {
    const serviceOp = endpoint.serviceOperation?.type;
    if (serviceOp === 'custom' && endpoint.path) {
      // Extract action name from path like "/user/attach-profile" → "attachProfile"
      const pathParts = endpoint.path.split('/').filter((p: string) => p);
      const lastPart = pathParts[pathParts.length - 1];
      // Convert kebab-case to camelCase
      operation = lastPart.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    } else if (!operation) {
      operation = serviceOp;
    }
  }

  // If still no operation, try to infer from method and path
  if (!operation) {
    operation = inferOperationFromMethodAndPath(endpoint.method, endpoint.path);
  }

  // Only warn if we couldn't infer operation after all attempts
  if (!operation || operation === 'unknown') {
    console.warn(`Warning: Could not determine operation for endpoint in ${controllerName || 'controller'}. Endpoint data:`, {
      operation: endpoint.operation,
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      serviceOperation: endpoint.serviceOperation
    });
  }

  const method = endpoint.method?.toLowerCase() || inferHttpMethod(operation);
  const path = inferPath(operation, endpoint); // Always call inferPath to handle path extraction
  const handler = generateHandlerBody(operation, modelName, handlerName, isModelController, implType);

  let route = `// ${operation} ${modelName}\n`;
  route += `fastify.${method}('${path}', {\n`;

  // Add schema if available
  if (implType?.technology?.validation === 'zod') {
    route += `  schema: {\n`;

    if (operation === 'create' || operation === 'update' || operation === 'evolve') {
      route += `    body: ${modelName}Schema.${operation},\n`;
    }

    if (operation === 'retrieve' || operation === 'update' || operation === 'delete') {
      route += `    params: ${modelName}Schema.params,\n`;
    }

    route += `    response: {\n`;
    route += `      200: ${modelName}Schema.response\n`;
    route += `    }\n`;
    route += `  },\n`;
  }

  // Use 'request' for operations that need request data (including custom actions with parameters)
  const usesRequest = ['create', 'retrieve', 'update', 'evolve', 'delete', 'validate'].includes(operation) ||
                      !['list'].includes(operation); // Custom actions likely need request data
  const requestParam = usesRequest ? 'request' : '_request';

  route += `  handler: async (${requestParam}: FastifyRequest, reply: FastifyReply) => {\n`;
  route += handler.split('\n').map(line => '    ' + line).join('\n') + '\n';
  route += `  }\n`;
  route += `});`;

  return route;
}

/**
 * Generate handler body for an operation
 */
function generateHandlerBody(
  operation: string,
  modelName: string,
  handlerName: string,
  isModelController: boolean,
  implType: any
): string {
  const rawLowerModel = modelName?.toLowerCase() || 'item';
  // Avoid JavaScript reserved words as variable names
  const RESERVED_WORDS = new Set(['import', 'export', 'default', 'class', 'function', 'return', 'delete', 'new', 'this', 'switch', 'case', 'break', 'continue', 'for', 'while', 'do', 'if', 'else', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'let', 'const', 'var', 'void', 'with', 'yield', 'async', 'await', 'enum', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'super', 'extends']);
  const lowerModel = RESERVED_WORDS.has(rawLowerModel) ? `${rawLowerModel}Item` : rawLowerModel;

  // Map service operation types to CURED operations
  const operationMap: { [key: string]: string } = {
    'custom': 'create',       // POST without ID -> create
    'findUnique': 'retrieve', // GET with ID -> retrieve
    'findMany': 'list',       // GET without ID -> list
    'updateUnique': 'update', // PUT with ID -> update
    'deleteUnique': 'delete'  // DELETE with ID -> delete
  };

  const mappedOperation = operationMap[operation] || operation;

  switch (mappedOperation) {
    case 'create':
      return `try {
  const ${lowerModel} = await handler.create(request.body as any);
  return reply.status(201).send(${lowerModel});
} catch (error) {
  return reply.status(400).send({
    error: 'Failed to create ${lowerModel}',
    message: error instanceof Error ? error.message : String(error)
  });
}`;

    case 'retrieve':
      return `try {
  const { id } = request.params as { id: string };
  const ${lowerModel} = await handler.retrieve(id);

  if (!${lowerModel}) {
    return reply.status(404).send({ error: '${modelName} not found' });
  }

  return reply.send(${lowerModel});
} catch (error) {
  return reply.status(500).send({
    error: 'Failed to retrieve ${lowerModel}',
    message: error instanceof Error ? error.message : String(error)
  });
}`;

    case 'update':
    case 'evolve':
      return `try {
  const { id } = request.params as { id: string };
  const ${lowerModel} = await handler.${operation}(id, request.body as any);
  return reply.send(${lowerModel});
} catch (error) {
  return reply.status(400).send({
    error: 'Failed to ${operation} ${lowerModel}',
    message: error instanceof Error ? error.message : String(error)
  });
}`;

    case 'delete':
      return `try {
  const { id } = request.params as { id: string };
  await handler.delete(id);
  return reply.status(204).send();
} catch (error) {
  return reply.status(500).send({
    error: 'Failed to delete ${lowerModel}',
    message: error instanceof Error ? error.message : String(error)
  });
}`;

    case 'list':
      return `try {
  const ${lowerModel}s = await handler.retrieveAll();
  return reply.send(${lowerModel}s);
} catch (error) {
  return reply.status(500).send({
    error: 'Failed to list ${lowerModel}s',
    message: error instanceof Error ? error.message : String(error)
  });
}`;

    case 'validate':
      return `try {
  const { data, operation: op } = request.body as { data: any; operation: string };
  const result = handler.validate(data, { operation: op });
  return reply.send(result);
} catch (error) {
  return reply.status(400).send({
    error: 'Validation failed',
    message: error instanceof Error ? error.message : String(error)
  });
}`;

    default:
      // For custom actions, generate a handler that calls the action method
      return `try {
  const result = await handler.${operation}(request.body as any);
  return reply.send(result);
} catch (error) {
  return reply.status(400).send({
    error: 'Failed to execute ${operation}',
    message: error instanceof Error ? error.message : String(error)
  });
}`;
  }
}

/**
 * Infer operation from HTTP method and path
 */
function inferOperationFromMethodAndPath(method: string, path: string): string {
  if (!method || !path) return 'unknown';

  const methodLower = method.toLowerCase();
  const hasIdParam = path.includes(':id');

  if (methodLower === 'post' && !hasIdParam) return 'create';
  if (methodLower === 'get' && hasIdParam) return 'retrieve';
  if (methodLower === 'get' && !hasIdParam) return 'list';
  if (methodLower === 'put' && hasIdParam) return 'update';
  if (methodLower === 'patch' && hasIdParam) return 'evolve';
  if (methodLower === 'delete' && hasIdParam) return 'delete';

  return 'unknown';
}

/**
 * Infer HTTP method from operation name
 */
function inferHttpMethod(operation: string): string {
  if (!operation) {
    console.warn('Warning: undefined operation in inferHttpMethod');
    return 'post'; // default
  }
  const opLower = operation.toLowerCase();

  if (opLower === 'create' || opLower === 'validate') return 'post';
  if (opLower === 'retrieve' || opLower === 'list') return 'get';
  if (opLower === 'update' || opLower === 'evolve') return 'put';
  if (opLower === 'delete') return 'delete';

  return 'post'; // default
}

/**
 * Infer path from operation name
 * Returns relative path (without base path) for use with Fastify route prefix
 */
function inferPath(operation: string, endpoint: any): string {
  // Endpoint paths from AI view generator are placeholders - ignore them
  // Always generate relative paths from operation for Fastify route registration
  // (The prefix is set in main.ts registration, e.g., prefix: '/api/users')

  const opLower = operation.toLowerCase();

  if (opLower === 'create') return '/';
  if (opLower === 'list') return '/';
  if (opLower === 'retrieve') return '/:id';
  if (opLower === 'update') return '/:id';
  if (opLower === 'evolve') return '/:id/evolve';
  if (opLower === 'delete') return '/:id';
  if (opLower === 'validate') return '/validate';

  // For custom actions, extract relative path from endpoint.path
  // e.g., "/user/attach-profile" → "/attach-profile"
  if (endpoint.path && endpoint.serviceOperation?.type === 'custom') {
    const pathParts = endpoint.path.split('/').filter((p: string) => p);
    const lastPart = pathParts[pathParts.length - 1];
    return `/${lastPart}`;
  }

  return `/${opLower}`;
}

/**
 * Convert CURED operations to endpoints
 */
function curedToEndpoints(cured: any, modelName: string): any[] {
  const endpoints: any[] = [];

  // Map CURED operations to endpoints with correct paths
  if (cured.create) {
    endpoints.push({ operation: 'create', method: 'POST' });
  }
  if (cured.retrieve) {
    endpoints.push({ operation: 'retrieve', method: 'GET' });
  }
  if (cured.retrieve_many) {
    endpoints.push({ operation: 'list', method: 'GET' });
  }
  if (cured.update) {
    endpoints.push({ operation: 'update', method: 'PUT' });
  }
  if (cured.evolve) {
    endpoints.push({ operation: 'evolve', method: 'PATCH' });
  }
  if (cured.delete) {
    endpoints.push({ operation: 'delete', method: 'DELETE' });
  }
  if (cured.validate) {
    endpoints.push({ operation: 'validate', method: 'POST' });
  }

  return endpoints;
}
