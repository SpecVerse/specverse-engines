/**
 * useApi Hooks Generator
 * Generates React Query hooks for API operations in generated projects
 */

export interface UseApiHooksGeneratorContext {
  spec: any;
  manifest: any;
}

export async function generate(context: UseApiHooksGeneratorContext): Promise<string> {
  return `/**
 * useApi - React Query Hooks
 *
 * Custom hooks for API operations using React Query
 * Simplified version for generated projects (no Zustand store dependency)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getModelSchema,
  listEntities,
  executeOperation,
  transitionState
} from '../lib/apiClient';
import type { ModelSchema, Entity, ApiResponse } from '../types/api';

/**
 * Query hook for model schema
 */
export function useModelSchemaQuery(modelName: string | null) {
  return useQuery({
    queryKey: ['modelSchema', modelName],
    queryFn: async (): Promise<ModelSchema> => {
      if (!modelName) throw new Error('Model name is required');
      return await getModelSchema(modelName);
    },
    enabled: !!modelName,
    staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
    refetchOnWindowFocus: false  // Schema rarely changes
  });
}

/**
 * Query hook for entities
 */
export function useEntitiesQuery(controllerName: string | null, modelName: string | null) {
  return useQuery({
    queryKey: ['entities', modelName],
    queryFn: async (): Promise<Entity[]> => {
      if (!controllerName || !modelName) {
        throw new Error('Controller and model names are required');
      }
      return await listEntities(controllerName);
    },
    enabled: !!controllerName && !!modelName,
    refetchInterval: 5000  // Refetch every 5 seconds for real-time feel
  });
}

/**
 * Mutation hook for executing operations
 */
export function useExecuteOperationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      controllerName,
      operationName,
      params
    }: {
      controllerName: string;
      operationName: string;
      params: Record<string, any>;
    }): Promise<ApiResponse> => executeOperation(controllerName, operationName, params),
    onSuccess: (_data, variables) => {
      // Invalidate entities query to refetch
      const modelName = variables.controllerName.replace(/Controller$/, '');
      queryClient.invalidateQueries({ queryKey: ['entities', modelName] });
    }
  });
}

/**
 * Mutation hook for lifecycle transitions
 */
export function useTransitionStateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      modelName,
      entityId,
      toState,
      lifecycleName
    }: {
      modelName: string;
      entityId: string;
      toState: string;
      lifecycleName?: string;
    }): Promise<ApiResponse> => transitionState(modelName, entityId, toState, lifecycleName),
    onSuccess: (_data, variables) => {
      // Invalidate entities query to refetch
      queryClient.invalidateQueries({ queryKey: ['entities', variables.modelName] });
    }
  });
}

/**
 * Hook for invalidating all queries (useful for manual refresh)
 */
export function useInvalidateAll() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries();
  };
}
`;
}
