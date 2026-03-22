/**
 * React Components Generator
 *
 * Generates React components from SpecVerse views
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate React component for a view
 */
export default function generateReactComponent(context: TemplateContext): string {
  const { view, model, spec } = context;

  if (!view) {
    throw new Error('View is required in template context');
  }

  const componentName = view.name || `${model?.name || 'Unknown'}View`;

  // Handle model reference - could be string or array
  let modelName: string;
  if (model?.name) {
    modelName = model.name;
  } else if (Array.isArray(view.model)) {
    modelName = view.model[0]; // Use first model if array
  } else if (view.model) {
    modelName = view.model;
  } else if (Array.isArray(view.modelReference)) {
    modelName = view.modelReference[0]; // Use first model if array
  } else {
    modelName = view.modelReference || 'Unknown';
  }

  // Generate imports
  const imports = generateImports(view, modelName);

  // Generate component body
  const componentBody = generateComponentBody(view, modelName, model);

  // Generate the complete component file
  return `${imports}

/**
 * ${componentName}
 * ${view.description || 'Generated React component'}
 *
 * Model: ${modelName}
 * Type: ${view.type || 'component'}
 */
function ${componentName}() {
${componentBody.split('\n').map(line => '  ' + line).join('\n')}
}

export default ${componentName};
`;
}

/**
 * Generate imports for the component
 */
function generateImports(view: any, modelName: string): string {
  const imports = [];

  // Determine which React hooks are needed
  const viewType = view.type || 'list';
  const reactHooks = [];

  // Pattern-based views need useMemo
  if (viewType === 'list' || viewType === 'detail' || viewType === 'dashboard') {
    reactHooks.push('useMemo');

    // Detail and dashboard views need useState for entity selection
    if (viewType === 'detail' || viewType === 'dashboard') {
      reactHooks.push('useState', 'useEffect');
    }
  }

  if (reactHooks.length > 0) {
    imports.push(`import { ${reactHooks.join(', ')} } from 'react';`);
  }

  // Add react-router-dom imports for form views
  if (viewType === 'form') {
    imports.push(`import { useNavigate, useParams } from 'react-router-dom';`);
  }

  // Pattern-based views use pattern adapter and generic hooks
  if (viewType === 'list' || viewType === 'detail' || viewType === 'dashboard') {
    imports.push(`import { usePatternAdapter, REACT_PROTOCOL_MAPPING } from '../lib/react-pattern-adapter';`);
    imports.push(`import { useEntitiesQuery, useModelSchemaQuery } from '../hooks/useApi';`);
  } else {
    // Form views use model-specific hooks
    if (view.model && Array.isArray(view.model)) {
      view.model.forEach((m: string) => {
        imports.push(`import type { ${m} } from '../types/${m}';`);
        imports.push(`import { use${m} } from '../hooks/use${m}';`);
      });
    } else {
      imports.push(`import type { ${modelName} } from '../types/${modelName}';`);
      imports.push(`import { use${modelName} } from '../hooks/use${modelName}';`);
    }
  }

  // Add Form component import for form views
  if (viewType === 'form') {
    imports.push(`import { ${modelName}Form } from './forms/${modelName}Form';`);
  }

  return imports.join('\n');
}

/**
 * Generate component body based on view type
 */
function generateComponentBody(view: any, modelName: string, model?: any): string {
  const viewType = view.type || 'list';

  switch (viewType) {
    case 'list':
      return generateListViewBody(view, modelName, model);
    case 'detail':
      return generateDetailViewBody(view, modelName);
    case 'form':
      return generateFormViewBody(view, modelName);
    case 'dashboard':
      return generateDashboardViewBody(view, modelName);
    default:
      return generateGenericViewBody(view, modelName);
  }
}

/**
 * Generate list view body (PATTERN-BASED)
 */
function generateListViewBody(view: any, modelName: string, model?: any): string {
  const controllerName = `${modelName}Controller`;

  return `const patternAdapter = usePatternAdapter();

// Fetch data using generic hooks
const { data: entities = [], isLoading } = useEntitiesQuery('${controllerName}', '${modelName}');
const { data: schema } = useModelSchemaQuery('${modelName}');

// Build model data and schemas
const modelData = useMemo(() => ({
  ${modelName}: entities
}), [entities]);

const modelSchemas = useMemo(() =>
  schema ? { ${modelName}: schema } : {}
, [schema]);

if (isLoading) {
  return <div className="p-4">Loading...</div>;
}

// Detect pattern
const pattern = patternAdapter.detectPattern({ type: 'list', model: '${modelName}' });

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
  viewSpec: { type: 'list', model: '${modelName}', name: '${view.name || modelName + 'ListView'}' },
  modelData,
  modelSchemas,
  primaryModel: '${modelName}',
  selectedEntity: null,
  primaryEntities: modelData.${modelName},
  protocolMapping: REACT_PROTOCOL_MAPPING,
  tailwindAdapter: patternAdapter['tailwindAdapter']
};

// Render pattern
const html = patternAdapter.renderPattern(context);

return (
  <div className="runtime-view-container p-4 h-full overflow-auto">
    <div dangerouslySetInnerHTML={{ __html: html }} />
  </div>
);`;
}

/**
 * Get displayable columns from model attributes
 */
function getModelDisplayColumns(model: any): string[] {
  if (!model || !model.attributes) {
    return ['id'];
  }

  // Handle both array and object formats
  let attributes = model.attributes;
  if (Array.isArray(attributes)) {
    // Convert array to object format: [{ name: 'foo', type: 'String' }] -> { foo: { type: 'String' } }
    const obj: Record<string, any> = {};
    attributes.forEach((attr: any) => {
      if (attr && attr.name) {
        obj[attr.name] = attr;
      }
    });
    attributes = obj;
  }

  const excludeFields = ['id', 'createdBy', 'updatedBy', 'updatedAt'];
  const displayFields: string[] = [];

  // Get important fields first
  for (const [attrName, attrDef] of Object.entries(attributes)) {
    if (excludeFields.includes(attrName)) continue;

    const def = attrDef as any;
    // Prioritize required fields and common display fields
    const isRequired = def.required || def.constraints?.required;
    if (isRequired || ['name', 'title', 'email', 'status', 'message', 'description'].includes(attrName)) {
      displayFields.push(attrName);
    }
  }

  // If no required fields, add first 3 non-excluded fields
  if (displayFields.length === 0) {
    for (const [attrName] of Object.entries(attributes)) {
      if (!excludeFields.includes(attrName) && displayFields.length < 3) {
        displayFields.push(attrName);
      }
    }
  }

  // Always add createdAt if it exists and not already included
  const hasCreatedAt = attributes.createdAt || attributes.find?.((a: any) => a.name === 'createdAt');
  if (hasCreatedAt && !displayFields.includes('createdAt')) {
    displayFields.push('createdAt');
  }

  return displayFields.length > 0 ? displayFields : ['id'];
}

/**
 * Generate detail view body (PATTERN-BASED)
 */
function generateDetailViewBody(view: any, modelName: string): string {
  const lowerModel = modelName.toLowerCase();
  const pluralModel = `${lowerModel}s`;

  // Handle both single model and multi-model detail views
  const models = Array.isArray(view.model) ? view.model : [modelName];
  const primaryModel = models[0];

  // Build hooks for fetching data
  const fetchHooks = models.map((m: string) => {
    const lower = m.toLowerCase();
    const plural = `${lower}s`;
    return `const { ${plural}, isLoading: isLoading${m} } = use${m}({ list: true });`;
  }).join('\n');

  const isLoadingCheck = models.map((m: string) => `isLoading${m}`).join(' || ');

  return `const patternAdapter = usePatternAdapter();

// Fetch all entities
${fetchHooks}

// Track selected entity ID
const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

// Build model data from fetched entities
// Wrap entities in expected format: { id, data: {...} }
const modelData = useMemo(() => ({
${models.map((m: string) => `  ${m}: (${m.toLowerCase()}s || []).map((item: any) => ({ id: item.id, data: item }))`).join(',\n')}
}), [${models.map((m: string) => `${m.toLowerCase()}s`).join(', ')}]);

// Entity selection
const entities = ${pluralModel} || [];
useEffect(() => {
  if (entities.length > 0 && !selectedEntityId) {
    setSelectedEntityId(entities[0].id);
  }
}, [entities, selectedEntityId]);

// Find selected entity in wrapped modelData
const selectedEntity = useMemo(
  () => modelData.${modelName}?.find((e: any) => e.id === selectedEntityId) || null,
  [modelData, selectedEntityId]
);

// Note: In generated apps, we use runtime schema from the fetched data
const modelSchemas = useMemo(() => ({}), []);

// Attach event handler for entity selector (MUST be before early returns)
useEffect(() => {
  const selector = document.getElementById('entity-selector') as HTMLSelectElement;
  if (selector) {
    const handler = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      setSelectedEntityId(target.value);
    };
    selector.addEventListener('change', handler);
    return () => selector.removeEventListener('change', handler);
  }
}, [selectedEntityId]);

if (${isLoadingCheck}) {
  return <div className="p-4">Loading...</div>;
}

// Detect pattern
const pattern = patternAdapter.detectPattern({ type: 'detail', model: '${primaryModel}' });

if (!pattern) {
  return (
    <div className="p-4 text-red-600">
      Pattern not found for detail view
    </div>
  );
}

// Build render context
const context = {
  pattern,
  viewSpec: { type: 'detail', model: ${JSON.stringify(models)}, name: '${view.name || modelName + 'DetailView'}' },
  modelData,
  modelSchemas,
  primaryModel: '${primaryModel}',
  selectedEntity,
  primaryEntities: modelData.${primaryModel},
  protocolMapping: REACT_PROTOCOL_MAPPING,
  tailwindAdapter: patternAdapter['tailwindAdapter']
};

// Render pattern
let html = '';

// Add entity selector if multiple entities
if (entities.length > 1) {
  html += \`
    <div class="mb-4">
      <select
        id="entity-selector"
        class="px-4 py-2 border rounded"
        value="\${selectedEntityId || ''}"
      >
        \${entities.map((e: any) =>
          \`<option value="\${e.id}">\${e.name || e.title || e.id}</option>\`
        ).join('')}
      </select>
    </div>
  \`;
}

html += patternAdapter.renderPattern(context);

return (
  <div className="runtime-view-container p-4 h-full overflow-auto">
    <div dangerouslySetInnerHTML={{ __html: html }} />
  </div>
);`;
}

/**
 * Generate form view body
 */
function generateFormViewBody(view: any, modelName: string): string {
  const lowerModel = modelName.toLowerCase();
  const pluralModel = `${lowerModel}s`;

  return `const [selectedId, setSelectedId] = useState<string | null>(null);

// Fetch single ${lowerModel} if selected
const { ${lowerModel}, create, update, delete: delete${modelName}, validate, isDeleting, isValidating } = use${modelName}(
  selectedId ? { id: selectedId } : {}
);

// Fetch all ${pluralModel} for the list
const { ${pluralModel}, isLoading: listLoading } = use${modelName}({ list: true });

const handleSubmit = async (data: any) => {
  try {
    if (selectedId) {
      await update({ id: selectedId, data });
    } else {
      await create(data);
    }
    setSelectedId(null); // Clear selection after save
  } catch (error) {
    console.error('Error saving ${lowerModel}:', error);
  }
};

const handleValidate = async (data: any) => {
  try {
    const result = await validate(data);
    alert('Validation successful: ' + JSON.stringify(result, null, 2));
  } catch (error: any) {
    alert('Validation failed: ' + (error.message || JSON.stringify(error)));
  }
};

const handleDelete = async () => {
  if (!selectedId) return;
  if (!confirm('Are you sure you want to delete this ${lowerModel}?')) return;

  try {
    await delete${modelName}(selectedId);
    setSelectedId(null); // Clear selection after delete
  } catch (error) {
    console.error('Error deleting ${lowerModel}:', error);
    alert('Failed to delete ${lowerModel}');
  }
};

const handleSelect${modelName} = (id: string) => {
  setSelectedId(id);
};

const handleCancel = () => {
  setSelectedId(null);
};

return (
  <div className="view-${view.name?.toLowerCase() || `${lowerModel}formview`} min-h-screen bg-slate-900 text-gray-200">
    {/* Content */}
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* CURVED Form Section */}
      <div className="curved-form-section bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-1">
          {selectedId ? 'Edit ${modelName}' : 'Create ${modelName}'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Form view for creating and editing ${modelName}
        </p>
        <${modelName}Form
          ${lowerModel}={${lowerModel}}
          onSubmit={handleSubmit}
          onValidate={handleValidate}
          onDelete={selectedId ? handleDelete : undefined}
          onCancel={handleCancel}
          isDeleting={isDeleting}
          isValidating={isValidating}
        />
      </div>

      {/* CURVED List Section */}
      <div className="curved-list-section bg-slate-800 rounded-lg border border-slate-700 p-6">
        {listLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-400">Loading ${pluralModel}...</p>
            </div>
          </div>
        ) : ${pluralModel}?.length === 0 ? (
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-1">No ${pluralModel} yet</p>
            <p className="text-sm text-gray-500">Create your first ${lowerModel} using the form above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  {/* Table headers will be dynamically generated based on model attributes */}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {${pluralModel}?.map((${lowerModel}: ${modelName}) => (
                  <tr
                    key={${lowerModel}.id}
                    className={\`border-b border-slate-700 transition-colors \${
                      selectedId === ${lowerModel}.id ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'
                    }\`}
                  >
                    {/* Table cells will be dynamically generated based on model attributes */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSelect${modelName}(${lowerModel}.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
);`;
}

/**
 * Generate dashboard view body (PATTERN-BASED)
 */
function generateDashboardViewBody(view: any, modelName: string): string {
  const lowerModel = modelName.toLowerCase();
  const pluralModel = `${lowerModel}s`;

  return `const patternAdapter = usePatternAdapter();

// Fetch entities
const { ${pluralModel}, isLoading, error } = use${modelName}({ list: true });

// Track selected entity ID
const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

// Build model data from fetched entities
const modelData = useMemo(() => ({
  ${modelName}: ${pluralModel} || []
}), [${pluralModel}]);

// Entity selection
const entities = ${pluralModel} || [];
useEffect(() => {
  if (entities.length > 0 && !selectedEntityId) {
    setSelectedEntityId(entities[0].id);
  }
}, [entities, selectedEntityId]);

// Find selected entity in wrapped modelData
const selectedEntity = useMemo(
  () => modelData.${modelName}?.find((e: any) => e.id === selectedEntityId) || null,
  [modelData, selectedEntityId]
);

// Note: In generated apps, we use runtime schema from the fetched data
const modelSchemas = useMemo(() => ({}), []);

// Attach event handler for entity selector (MUST be before early returns)
useEffect(() => {
  const selector = document.getElementById('entity-selector') as HTMLSelectElement;
  if (selector) {
    const handler = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      setSelectedEntityId(target.value);
    };
    selector.addEventListener('change', handler);
    return () => selector.removeEventListener('change', handler);
  }
}, [selectedEntityId]);

if (isLoading) {
  return <div className="p-4">Loading dashboard...</div>;
}

if (error) {
  return <div className="p-4 text-red-600">Error: {error.message}</div>;
}

// Detect pattern
const pattern = patternAdapter.detectPattern({ type: 'dashboard', model: '${modelName}' });

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
  viewSpec: { type: 'dashboard', model: '${modelName}', name: '${view.name || modelName + 'DashboardView'}' },
  modelData,
  modelSchemas,
  primaryModel: '${modelName}',
  selectedEntity,
  primaryEntities: modelData.${modelName},
  protocolMapping: REACT_PROTOCOL_MAPPING,
  tailwindAdapter: patternAdapter['tailwindAdapter']
};

// Render pattern
let html = '';

// Add entity selector if multiple entities
if (entities.length > 1) {
  html += \`
    <div class="mb-4">
      <select
        id="entity-selector"
        class="px-4 py-2 border rounded"
        value="\${selectedEntityId || ''}"
      >
        \${entities.map((e: any) =>
          \`<option value="\${e.id}">\${e.name || e.title || e.id}</option>\`
        ).join('')}
      </select>
    </div>
  \`;
}

html += patternAdapter.renderPattern(context);

return (
  <div className="runtime-view-container p-4 h-full overflow-auto">
    <div dangerouslySetInnerHTML={{ __html: html }} />
  </div>
);`;
}

/**
 * Generate generic view body
 */
function generateGenericViewBody(view: any, modelName: string): string {
  return `return (
  <div className="view-${view.name?.toLowerCase() || 'component'}">
    <h1>${view.description || modelName}</h1>
    {/* TODO: Implement component logic */}
  </div>
);`;
}
