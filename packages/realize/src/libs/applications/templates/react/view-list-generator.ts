/**
 * ListView Generator (Pattern-Based v0.9.0)
 * Generates pattern-based ListView using RuntimeView architecture
 */

export interface ViewListGeneratorContext {
  spec: any;
  manifest: any;
}

export async function generate(context: ViewListGeneratorContext): Promise<string> {
  return `/**
 * ListView - Pattern-Based List View Component
 *
 * Uses pattern-based rendering with ReactPatternAdapter.
 * Reads from modelSchemas for schema-driven field generation.
 */

import { useMemo } from 'react';
import { useEntitiesQuery, useModelSchemaQuery } from '../../hooks/useApi';
import { usePatternAdapter, REACT_PROTOCOL_MAPPING } from '../../lib/react-pattern-adapter';
import type { View } from '../../types/api';

interface ListViewProps {
  view: View;
  spec?: any;
}

export function ListView({ view, spec }: ListViewProps) {
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
  const { data: entities = [], isLoading } = useEntitiesQuery(controllerName, modelName);
  const { data: schema } = useModelSchemaQuery(modelName);

  // Build model data and schemas
  const modelData = useMemo(() => ({
    [modelName]: entities
  }), [modelName, entities]);

  const modelSchemas = useMemo(() =>
    schema ? { [modelName]: schema } : {}
  , [modelName, schema]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  // Detect pattern
  const pattern = patternAdapter.detectPattern({ ...view, type: 'list' });

  if (!pattern) {
    return (
      <div className="p-4 text-red-600">
        Pattern not found for list view
      </div>
    );
  }

  // Build render context
  const context = {
    pattern,
    viewSpec: { ...view, type: 'list', model: modelName },
    modelData,
    modelSchemas,
    primaryModel: modelName,
    selectedEntity: null,
    primaryEntities: entities,
    protocolMapping: REACT_PROTOCOL_MAPPING,
    tailwindAdapter: patternAdapter['tailwindAdapter']
  };

  // Render pattern
  const html = patternAdapter.renderPattern(context);

  return (
    <div className="runtime-view-container p-4 h-full overflow-auto">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default ListView;
`;
}
