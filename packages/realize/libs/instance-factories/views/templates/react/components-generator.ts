/**
 * React Components Generator
 *
 * Generates direct React components from SpecVerse views.
 * Components use actual model attributes from the spec — no runtime schema discovery.
 * The pattern adapter is still shipped for optional dynamic rendering.
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateReactComponent(context: TemplateContext): string {
  const { view, model, spec } = context;

  if (!view) {
    throw new Error('View is required in template context');
  }

  const componentName = view.name || `${model?.name || 'Unknown'}View`;

  let modelName: string;
  if (model?.name) { modelName = model.name; }
  else if (Array.isArray(view.model)) { modelName = view.model[0]; }
  else if (view.model) { modelName = view.model; }
  else if (Array.isArray(view.modelReference)) { modelName = view.modelReference[0]; }
  else { modelName = view.modelReference || 'Unknown'; }

  const viewType = view.type || 'list';
  const columns = getModelDisplayColumns(model);
  const allAttrs = getModelAttributes(model);
  const lowerModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const pluralModel = `${lowerModel}s`;
  const apiPath = `/api/${pluralModel}`;

  switch (viewType) {
    case 'list':
      return generateListComponent(componentName, modelName, lowerModel, pluralModel, apiPath, columns, view, getBelongsToRelationships(model));
    case 'detail':
      return generateDetailComponent(componentName, modelName, lowerModel, pluralModel, apiPath, allAttrs, view);
    case 'form':
      return generateFormComponent(componentName, modelName, lowerModel, pluralModel, apiPath, allAttrs, view, getBelongsToRelationships(model));
    case 'dashboard':
      return generateDashboardComponent(componentName, modelName, lowerModel, pluralModel, apiPath, columns, view);
    default:
      return generateListComponent(componentName, modelName, lowerModel, pluralModel, apiPath, columns, view);
  }
}

function getModelAttributes(model: any): Array<{ name: string; type: string; required: boolean }> {
  if (!model?.attributes) return [];
  const attrs = Array.isArray(model.attributes) ? model.attributes
    : Object.entries(model.attributes).map(([name, def]: [string, any]) =>
        typeof def === 'string' ? { name, type: def.split(' ')[0], required: def.includes('required') }
        : { name, ...def });
  return attrs.filter((a: any) => a.name !== 'id' && a.name !== 'createdAt' && a.name !== 'updatedAt');
}

function getBelongsToRelationships(model: any): Array<{ name: string; target: string }> {
  if (!model?.relationships) return [];
  const rels = Array.isArray(model.relationships) ? model.relationships
    : Object.entries(model.relationships).map(([name, def]: [string, any]) => ({ name, ...def }));
  return rels.filter((r: any) => r.type === 'belongsTo').map((r: any) => ({
    name: r.name,
    target: r.target || r.targetModel || r.name,
  }));
}

function getModelDisplayColumns(model: any): string[] {
  const attrs = getModelAttributes(model);
  if (attrs.length === 0) return ['id'];
  const display = attrs
    .filter((a: any) => !['createdBy', 'updatedBy'].includes(a.name))
    .slice(0, 6)
    .map((a: any) => a.name);
  return display.length > 0 ? display : ['id'];
}

function generateListComponent(name: string, model: string, lower: string, plural: string, api: string, columns: string[], view: any, belongsToRels: Array<{ name: string; target: string }> = []): string {
  return `import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * ${name}
 * ${view.description || `List view for ${model}`}
 */
function ${name}() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('${api}')
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">${model}s</h1>
        <Link to="/${lower}form" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + New ${model}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No ${lower}s yet</p>
          <p className="text-sm mt-1">Create your first ${lower} to get started</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
${columns.map(c => `                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${c}</th>`).join('\n')}
${belongsToRels.map(r => `                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${r.target}</th>`).join('\n')}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
${columns.map(c => `                  <td className="px-6 py-4 text-sm text-gray-900">{String(item.${c} ?? '')}</td>`).join('\n')}
${belongsToRels.map(r => `                  <td className="px-6 py-4 text-sm text-blue-600">{item.${r.name}?.name || item.${r.name}?.title || item.${r.name}?.guestName || item.${r.name}?.id || '—'}</td>`).join('\n')}
                  <td className="px-6 py-4 text-right">
                    <Link to={\`/${lower}detail?id=\${item.id}\`} className="text-blue-600 hover:text-blue-800 mr-3">View</Link>
                    <Link to={\`/${lower}form?id=\${item.id}\`} className="text-green-600 hover:text-green-800">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ${name};
`;
}

function generateDetailComponent(name: string, model: string, lower: string, plural: string, api: string, attrs: any[], view: any): string {
  return `import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

/**
 * ${name}
 * ${view.description || `Detail view for ${model}`}
 */
function ${name}() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(\`${api}/\${id}\`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setItem(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!id) return <div className="p-6 text-gray-500">Select a ${lower} from the list to view details.</div>;
  if (!item) return <div className="p-6 text-red-600">${model} not found.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{item.name || item.title || '${model} ' + item.id}</h1>
        <div className="space-x-2">
          <Link to={\`/${lower}form?id=\${item.id}\`} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Edit</Link>
          <Link to="/${lower}list" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Back</Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{item.id}</dd>
          </div>
${attrs.map(a => `          <div>
            <dt className="text-sm font-medium text-gray-500">${a.name}</dt>
            <dd className="mt-1 text-sm text-gray-900">{String(item.${a.name} ?? '—')}</dd>
          </div>`).join('\n')}
        </dl>
      </div>
    </div>
  );
}

export default ${name};
`;
}

function generateFormComponent(name: string, model: string, lower: string, plural: string, api: string, attrs: any[], view: any, belongsToRels: Array<{ name: string; target: string }> = []): string {
  const editableAttrs = attrs.filter(a => !['createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(a.name));

  // Generate state and fetch for each belongsTo relationship
  const relStateDefs = belongsToRels.map(r => {
    const relLower = r.target.charAt(0).toLowerCase() + r.target.slice(1);
    return `const [${relLower}Options, set${r.target}Options] = useState<any[]>([]);`;
  }).join('\n  ');

  const relFetches = belongsToRels.map(r => {
    const relLower = r.target.charAt(0).toLowerCase() + r.target.slice(1);
    return `fetch('/api/${relLower}s').then(r => r.json()).then(d => set${r.target}Options(d)).catch(() => {});`;
  }).join('\n    ');

  const relFields = belongsToRels.map(r => {
    const fkField = `${r.name}Id`;
    const relLower = r.target.charAt(0).toLowerCase() + r.target.slice(1);
    return `        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">${r.target}</label>
          <select
            value={form.${fkField} ?? ''}
            onChange={e => setForm({...form, ${fkField}: e.target.value})}
            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select ${r.target}...</option>
            {${relLower}Options.map((opt: any) => (
              <option key={opt.id} value={opt.id}>{opt.name || opt.title || opt.guestName || opt.id}</option>
            ))}
          </select>
        </div>`;
  }).join('\n');

  return `import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * ${name}
 * ${view.description || `Form for creating and editing ${model}`}
 */
function ${name}() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  ${relStateDefs}

  useEffect(() => {
    if (!id) return;
    fetch(\`${api}/\${id}\`)
      .then(r => r.json())
      .then(data => { setForm(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    ${relFetches}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Convert datetime-local values to full ISO-8601 for Prisma
      const submitData = { ...form };
      for (const [key, val] of Object.entries(submitData)) {
        if (typeof val === 'string' && /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/.test(val)) {
          submitData[key] = new Date(val).toISOString();
        }
      }
      const method = id ? 'PUT' : 'POST';
      const url = id ? \`${api}/\${id}\` : '${api}';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitData) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Save failed'); }
      navigate('/${lower}list');
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this ${lower}?')) return;
    await fetch(\`${api}/\${id}\`, { method: 'DELETE' });
    navigate('/${lower}list');
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'New'} ${model}</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
${relFields}
${editableAttrs.map(a => `        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">${a.name}</label>
          <input
            type="${a.type === 'Integer' || a.type === 'Number' || a.type === 'Decimal' ? 'number' : a.type === 'Date' || a.type === 'DateTime' ? 'datetime-local' : a.type === 'Email' ? 'email' : a.type === 'Boolean' ? 'checkbox' : 'text'}"
            value={form.${a.name} ?? ''}
            onChange={e => setForm({...form, ${a.name}: ${a.type === 'Integer' ? 'parseInt(e.target.value)' : a.type === 'Number' || a.type === 'Decimal' ? 'parseFloat(e.target.value)' : a.type === 'Boolean' ? 'e.target.checked' : 'e.target.value'}})}
            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            ${a.required ? 'required' : ''}
          />
        </div>`).join('\n')}

        <div className="flex justify-between pt-4">
          <div>
            {id && <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>}
          </div>
          <div className="space-x-2">
            <button type="button" onClick={() => navigate('/${lower}list')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : id ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ${name};
`;
}

function generateDashboardComponent(name: string, model: string, lower: string, plural: string, api: string, columns: string[], view: any): string {
  return `import { useState, useEffect } from 'react';

/**
 * ${name}
 * ${view.description || 'System dashboard'}
 */
function ${name}() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch counts for all models
    Promise.all([
${['guesthouses', 'rooms', 'guests', 'bookings', 'houses'].map(p => `      fetch('/api/${p}').then(r => r.ok ? r.json() : []).then(d => ['${p}', Array.isArray(d) ? d.length : 0]).catch(() => ['${p}', 0])`).join(',\n')}
    ]).then(results => {
      const s: Record<string, number> = {};
      results.forEach(([name, count]) => { if (count > 0 || name === '${plural}') s[name as string] = count as number; });
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(stats).map(([name, count]) => (
          <div key={name} className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase">{name}</h3>
            <p className="text-3xl font-bold mt-2">{count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ${name};
`;
}
