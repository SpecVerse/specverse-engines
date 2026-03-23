/**
 * DashboardView Generator (Pattern-Based v0.9.0)
 * Generates pattern-based DashboardView using RuntimeView architecture
 */

export interface ViewDashboardGeneratorContext {
  spec: any;
  manifest: any;
}

export async function generate(context: ViewDashboardGeneratorContext): Promise<string> {
  return `/**
 * DashboardView - Pattern-Based Dashboard View Component
 *
 * Uses pattern-based rendering with ReactPatternAdapter.
 * Supports multi-component dashboard layouts with entity selection.
 */

import { useState, useEffect, useMemo } from 'react';
import { useEntitiesQuery, useModelSchemaQuery } from '../../hooks/useApi';
import { usePatternAdapter, REACT_PROTOCOL_MAPPING } from '../../lib/react-pattern-adapter';
import type { View } from '../../types/api';

interface DashboardViewProps {
  view: View;
  spec?: any;
}

export function DashboardView({ view, spec }: DashboardViewProps) {
  const patternAdapter = usePatternAdapter();

  // Determine controller and model
  let controllerName: string;
  let modelName: string;

  if (view.controller && spec) {
    controllerName = view.controller;
    const controller = spec.controllers[view.controller];
    modelName = controller.model;
  } else {
    modelName = view.model as string;
    controllerName = \`\${modelName}Controller\`;
  }

  // Fetch data and schema
  const { data: entities = [] } = useEntitiesQuery(controllerName, modelName);
  const { data: schema } = useModelSchemaQuery(modelName);

  // Track selected entity
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    entities.length > 0 ? entities[0].id : null
  );

  // Update selected entity when entities change
  useEffect(() => {
    if (entities.length > 0 && !selectedEntityId) {
      setSelectedEntityId(entities[0].id);
    }
  }, [entities, selectedEntityId]);

  // Get selected entity
  const selectedEntity = useMemo(
    () => entities.find((e: any) => e.id === selectedEntityId) || null,
    [entities, selectedEntityId]
  );

  // Build model data and schemas
  const modelData = useMemo(() => ({
    [modelName]: entities
  }), [modelName, entities]);

  const modelSchemas = useMemo(() =>
    schema ? { [modelName]: schema } : {}
  , [modelName, schema]);

  if (entities.length === 0) {
    return <div className="p-4">No entities found</div>;
  }

  // Detect pattern
  const pattern = patternAdapter.detectPattern({ ...view, type: 'dashboard' });

  if (!pattern) {
    return (
      <div className="p-4 text-red-600">
        Pattern not found for dashboard view
      </div>
    );
  }

  // Build render context
  const context = {
    pattern,
    viewSpec: { ...view, type: 'dashboard', model: modelName },
    modelData,
    modelSchemas,
    primaryModel: modelName,
    selectedEntity,
    primaryEntities: entities,
    protocolMapping: REACT_PROTOCOL_MAPPING,
    tailwindAdapter: patternAdapter['tailwindAdapter']
  };

  // Render entity selector
  let html = '';
  if (entities.length > 0) {
    html += \`
      <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Select \${modelName}:
        </label>
        <select
          id="entity-selector"
          class="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          \${entities.map((entity: any) => {
            const displayName = entity.data?.name || entity.data?.title || entity.id;
            return \`<option value="\${entity.id}" \${entity.id === selectedEntityId ? 'selected' : ''}>\${displayName}</option>\`;
          }).join('')}
        </select>
      </div>
    \`;
  }

  // Render pattern
  html += patternAdapter.renderPattern(context);

  // Add event handler for selector
  useEffect(() => {
    const selector = document.getElementById('entity-selector') as HTMLSelectElement;
    if (selector) {
      const handler = (e: Event) => {
        const newId = (e.target as HTMLSelectElement).value;
        setSelectedEntityId(newId);
      };
      selector.addEventListener('change', handler);
      return () => selector.removeEventListener('change', handler);
    }
  }, [html]);

  return (
    <div className="runtime-view-container p-4 h-full overflow-auto">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default DashboardView;
`;
}
