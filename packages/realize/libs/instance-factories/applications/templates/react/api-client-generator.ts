/**
 * API Client Generator for React Applications
 *
 * Generates an apiClient.ts file that matches the backend routing instance factory.
 * Detects whether the backend uses controller-based endpoints or standard REST.
 */

export interface ApiClientGeneratorContext {
  spec: any;
  manifest: any;
  models: any[];
}

export async function generate(context: ApiClientGeneratorContext): Promise<string> {
  const { manifest } = context;

  // Determine API pattern from backend routing instance factory
  const apiPattern = detectApiPattern(manifest);

  return generateApiClient(apiPattern);
}

/**
 * Detect which API pattern the backend uses by checking the routing instance factory
 */
function detectApiPattern(manifest: any): 'rest' | 'controller' {
  // Find the routing capability mapping
  const routingCapability = manifest.capabilityMappings?.find(
    (mapping: any) => mapping.capability === 'api.rest'
  );

  if (!routingCapability) {
    // Default to REST if no routing capability specified
    return 'rest';
  }

  const instanceFactory = routingCapability.instanceFactory;

  // Map known instance factories to their API patterns
  const restFactories = ['FastifyAPI', 'ExpressAPI', 'NestJSAPI'];
  const controllerFactories = ['ControllerAPI', 'RuntimeAPI'];

  if (restFactories.includes(instanceFactory)) {
    return 'rest';
  } else if (controllerFactories.includes(instanceFactory)) {
    return 'controller';
  }

  // Default to REST for unknown factories
  return 'rest';
}

/**
 * Generate the apiClient.ts content based on the API pattern
 */
function generateApiClient(pattern: 'rest' | 'controller'): string {
  const commonImports = `/**
 * API Client
 *
 * HTTP client for interacting with the backend API
 * Generated based on backend routing instance factory
 */

import type { ApiResponse, RuntimeInfo, ModelSchema, View, Service, Behavior, Entity, Operation } from '../types/api';

// Get API URL from query parameter or default to proxy
const urlParams = new URLSearchParams(window.location.search);
const apiUrl = urlParams.get('api');

// API base URL
export const API_BASE = apiUrl ? \`\${apiUrl}/api\` : '/api';

// WebSocket URL - preserve path and use wss:// for https://
export const WS_URL = apiUrl
  ? \`\${apiUrl.replace(/^http/, 'ws')}/ws\`
  : \`\${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}/\${window.location.host}/ws\`;

/**
 * Generic API request helper
 */
async function apiRequest<T = any>(
  method: string,
  path: string,
  body: any = null
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(\`\${API_BASE}\${path}\`, options);

  if (!response.ok) {
    throw new Error(\`API request failed: \${response.statusText}\`);
  }

  return await response.json();
}

/**
 * Get full specification object
 */
export async function getSpec(): Promise<any> {
  return apiRequest('GET', '/spec');
}

/**
 * Get runtime information
 */
export async function getRuntimeInfo(): Promise<RuntimeInfo> {
  return apiRequest<RuntimeInfo>('GET', '/runtime/info');
}`;

  const metaFunctions = `
/**
 * Get all views
 */
export async function getViews(): Promise<View[]> {
  const result = await apiRequest<{ views: View[] }>('GET', '/views');
  return result.views || [];
}

/**
 * Get all services
 */
export async function getServices(): Promise<Service[]> {
  const result = await apiRequest<{ services: Service[] }>('GET', '/services');
  return result.services || [];
}

/**
 * Get operations for a controller
 */
export async function getControllerOperations(controllerName: string): Promise<Operation[]> {
  const result = await apiRequest<{ operations: Operation[] }>('GET', \`/controllers/\${controllerName}/operations\`);
  return result.operations || [];
}

/**
 * Get behaviors for a model
 */
export async function getBehaviors(modelName: string): Promise<Behavior[]> {
  const result = await apiRequest<{ behaviors: Behavior[] }>('GET', \`/behaviors/\${modelName}\`);
  return result.behaviors || [];
}

/**
 * Get event history
 */
export async function getEventHistory(limit: number = 100): Promise<Array<{
  eventName: string;
  payload: any;
  timestamp: string;
}>> {
  const result = await apiRequest<{
    history: Array<{ eventName: string; payload: any; timestamp: string }>;
  }>('GET', \`/events/history?limit=\${limit}\`);
  return result.history || [];
}

/**
 * Get diagram types
 */
export async function getDiagramTypes(): Promise<string[]> {
  const result = await apiRequest<{ types: string[] }>('GET', '/diagrams/types');
  return result.types || [];
}

/**
 * Generate diagram
 */
export async function generateDiagram(
  type: string,
  direction: 'TB' | 'LR' = 'TB'
): Promise<string> {
  const result = await apiRequest<{ success: boolean; diagram?: string; error?: string }>(
    'GET',
    \`/diagrams/\${type}?direction=\${direction}\`
  );

  if (!result.success || !result.diagram) {
    throw new Error(result.error || 'Failed to generate diagram');
  }

  return result.diagram;
}`;

  if (pattern === 'rest') {
    // Standard REST API pattern
    return `${commonImports}

/**
 * Get model schema
 */
export async function getModelSchema(modelName: string): Promise<ModelSchema> {
  const spec = await getSpec();

  // Find model in components and extract schema
  for (const component of Object.values(spec.components || {})) {
    const models = (component as any).models || {};
    if (models[modelName]) {
      const model = models[modelName];
      return {
        name: modelName,
        attributes: model.attributes || {},
        relationships: model.relationships || {}
      } as ModelSchema;
    }
  }

  throw new Error(\`Model schema not found: \${modelName}\`);
}

/**
 * List all entities for a model
 */
export async function listEntities(controllerName: string): Promise<Entity[]> {
  try {
    // Extract model name from controller name (e.g., "AuthorController" -> "authors")
    const modelName = controllerName
      .replace(/Controller$/, '')
      .toLowerCase() + 's';

    const entities = await apiRequest<Entity[]>('GET', \`/\${modelName}\`);
    return entities || [];
  } catch (error) {
    // Model endpoint might not exist
    return [];
  }
}

/**
 * Execute a controller operation
 * Maps CURVED operations to standard REST endpoints
 */
export async function executeOperation(
  controllerName: string,
  operationName: string,
  params: Record<string, any>
): Promise<ApiResponse> {
  // Extract model name from controller name (e.g., "AuthorController" -> "authors")
  const modelName = controllerName
    .replace(/Controller$/, '')
    .toLowerCase() + 's';

  let method: string;
  let path: string;

  switch (operationName) {
    case 'create':
      method = 'POST';
      path = \`/\${modelName}\`;
      break;

    case 'update':
      method = 'PUT';
      path = \`/\${modelName}/\${params.id}\`;
      // Remove id from body
      const { id: _id, ...updateData } = params;
      params = updateData;
      break;

    case 'retrieve':
      method = 'GET';
      path = \`/\${modelName}/\${params.id}\`;
      params = {};
      break;

    case 'retrieve_many':
    case 'list':
      method = 'GET';
      path = \`/\${modelName}\`;
      params = {};
      break;

    case 'delete':
      method = 'DELETE';
      path = \`/\${modelName}/\${params.id}\`;
      params = {};
      break;

    case 'validate':
      method = 'POST';
      path = \`/\${modelName}/validate\`;
      break;

    case 'evolve':
      method = 'POST';
      path = \`/\${modelName}/\${params.id}/evolve\`;
      break;

    default:
      // Custom operation
      method = 'POST';
      path = \`/\${modelName}/\${operationName}\`;
  }

  return apiRequest<ApiResponse>(method, path, Object.keys(params).length > 0 ? params : null);
}

/**
 * Transition entity lifecycle state
 */
export async function transitionState(
  modelName: string,
  entityId: string,
  toState: string,
  lifecycleName?: string
): Promise<ApiResponse> {
  const body: any = { toState };
  if (lifecycleName) {
    body.lifecycleName = lifecycleName;
  }

  const resource = modelName.toLowerCase() + 's';
  return apiRequest<ApiResponse>(
    'POST',
    \`/\${resource}/\${entityId}/transition\`,
    body
  );
}

/**
 * Get available transitions for an entity
 */
export async function getAvailableTransitions(
  modelName: string,
  entityId: string,
  lifecycleName?: string
): Promise<string[]> {
  const resource = modelName.toLowerCase() + 's';
  const url = lifecycleName
    ? \`/\${resource}/\${entityId}/transitions?lifecycleName=\${lifecycleName}\`
    : \`/\${resource}/\${entityId}/transitions\`;

  const result = await apiRequest<{ transitions: string[] }>('GET', url);
  return result.transitions || [];
}
${metaFunctions}
`;
  } else {
    // Controller-based API pattern (used by app-demo runtime)
    return `${commonImports}

/**
 * Get model schema
 */
export async function getModelSchema(modelName: string): Promise<ModelSchema> {
  return apiRequest<ModelSchema>('GET', \`/models/\${modelName}/schema\`);
}

/**
 * List all entities for a model via its controller
 * Returns empty array if controller doesn't exist (not all models have controllers)
 */
export async function listEntities(controllerName: string): Promise<Entity[]> {
  try {
    const result = await apiRequest<ApiResponse<{ entities: Entity[] }>>(
      'POST',
      \`/controllers/\${controllerName}/list\`,
      {}
    );

    if (!result.success) {
      // Controller might not exist for this model
      return [];
    }

    return result.data?.entities || [];
  } catch (error) {
    // Controller doesn't exist for this model - this is normal
    // Not all models have controllers
    // Silently return empty array (this is expected behavior)
    return [];
  }
}

/**
 * Execute a controller operation
 */
export async function executeOperation(
  controllerName: string,
  operationName: string,
  params: Record<string, any>
): Promise<ApiResponse> {
  return apiRequest<ApiResponse>(
    'POST',
    \`/controllers/\${controllerName}/\${operationName}\`,
    params
  );
}

/**
 * Transition entity lifecycle state
 */
export async function transitionState(
  modelName: string,
  entityId: string,
  toState: string,
  lifecycleName?: string
): Promise<ApiResponse> {
  const body: any = { toState };
  if (lifecycleName) {
    body.lifecycleName = lifecycleName;
  }

  return apiRequest<ApiResponse>(
    'POST',
    \`/lifecycle/\${modelName}/\${entityId}/transition\`,
    body
  );
}

/**
 * Get available transitions for an entity
 */
export async function getAvailableTransitions(
  modelName: string,
  entityId: string,
  lifecycleName?: string
): Promise<string[]> {
  const url = lifecycleName
    ? \`/lifecycle/\${modelName}/\${entityId}/transitions?lifecycleName=\${lifecycleName}\`
    : \`/lifecycle/\${modelName}/\${entityId}/transitions\`;

  const result = await apiRequest<{ transitions: string[] }>('GET', url);
  return result.transitions || [];
}
${metaFunctions}
`;
  }
}
