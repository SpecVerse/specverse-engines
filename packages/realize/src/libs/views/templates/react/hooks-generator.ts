/**
 * React Hooks Generator
 *
 * Generates React custom hooks for data fetching and mutations
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate React custom hook for a model
 */
export default function generateReactHook(context: TemplateContext): string {
  const { model, controller, spec } = context;

  if (!model) {
    throw new Error('Model is required in template context');
  }

  const modelName = model.name;
  const hookName = `use${modelName}`;
  const controllerName = `${modelName}Controller`;

  return `/**
 * ${hookName}
 * Custom React hook for ${modelName} data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executeOperation } from '../lib/apiClient';
import type { ${modelName} } from '../types/${modelName}';

interface Use${modelName}Options {
  id?: string;
  list?: boolean;
  filters?: Record<string, any>;
}

/**
 * ${hookName} - Fetch and mutate ${modelName} data
 */
export function ${hookName}(options: Use${modelName}Options = {}) {
  const queryClient = useQueryClient();
  const { id, list, filters } = options;

  // Fetch single ${modelName}
  const { data: ${modelName.toLowerCase()}, isLoading: singleLoading, error: singleError } = useQuery({
    queryKey: ['${modelName.toLowerCase()}', id],
    queryFn: async () => {
      if (!id) return null;
      return await executeOperation('${controllerName}', 'retrieve', { id });
    },
    enabled: !!id && !list,
  });

  // Fetch list of ${modelName}s
  const { data: ${modelName.toLowerCase()}s, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ['${modelName.toLowerCase()}s', filters],
    queryFn: async () => {
      return await executeOperation('${controllerName}', 'list', filters || {});
    },
    enabled: list,
  });

  const isLoading = list ? listLoading : singleLoading;
  const error = list ? listError : singleError;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<${modelName}>) => {
      return await executeOperation('${controllerName}', 'create', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${modelName.toLowerCase()}s'] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<${modelName}> }) => {
      return await executeOperation('${controllerName}', 'update', { id, ...data });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['${modelName.toLowerCase()}', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['${modelName.toLowerCase()}s'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await executeOperation('${controllerName}', 'delete', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${modelName.toLowerCase()}s'] });
    },
  });

  // Refetch functions
  const refetch = () => {
    if (list) {
      queryClient.invalidateQueries({ queryKey: ['${modelName.toLowerCase()}s'] });
    } else if (id) {
      queryClient.invalidateQueries({ queryKey: ['${modelName.toLowerCase()}', id] });
    }
  };

  return {
    ${modelName.toLowerCase()},
    ${modelName.toLowerCase()}s,
    isLoading,
    error,
    refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
`;
}
