/**
 * App.tsx Generator for React App
 *
 * Generates root App component with sidebar navigation grouped by model.
 * Only List and +New are in the nav — Detail is accessed via list row clicks.
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateAppTsx(context: TemplateContext): string {
  const { spec } = context;

  // Get views — handle both array and object formats
  let viewList: any[] = [];
  if (spec.views) {
    viewList = Array.isArray(spec.views) ? spec.views
      : Object.entries(spec.views).map(([name, def]: [string, any]) => ({ name, ...def }));
  }

  // Group views by model
  const modelViews = new Map<string, { list?: string; detail?: string; form?: string; other: string[] }>();
  const dashboardView: string | null = viewList.find((v: any) => v.type === 'dashboard')?.name || null;

  for (const view of viewList) {
    const model = Array.isArray(view.model) ? view.model[0] : (view.model || view.primaryModel);
    if (!model) continue;
    if (!modelViews.has(model)) modelViews.set(model, { other: [] });
    const entry = modelViews.get(model)!;
    const type = view.type || 'list';
    if (type === 'list') entry.list = view.name;
    else if (type === 'detail') entry.detail = view.name;
    else if (type === 'form') entry.form = view.name;
    else if (type !== 'dashboard') entry.other.push(view.name);
  }

  // Generate imports
  const imports = viewList.map((v: any) => `import ${v.name} from './components/${v.name}';`).join('\n');

  // Generate routes
  const routes = viewList.map((v: any) => {
    const path = `/${v.name.toLowerCase().replace('view', '')}`;
    return `          <Route path="${path}" element={<${v.name} />} />`;
  }).join('\n');

  // Default route
  const defaultView = dashboardView || viewList[0]?.name || 'div';
  const defaultElement = defaultView === 'div' ? '<div className="p-8">Welcome</div>' : `<${defaultView} />`;

  // Sidebar nav items grouped by model
  const navGroups = Array.from(modelViews.entries()).map(([model, views]) => {
    const lower = model.charAt(0).toLowerCase() + model.slice(1);
    const listPath = views.list ? `/${views.list.toLowerCase().replace('view', '')}` : '';
    const formPath = views.form ? `/${views.form.toLowerCase().replace('view', '')}` : '';
    return `          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">${model}s</h3>
${listPath ? `            <a href="${listPath}" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded">Browse</a>` : ''}
${formPath ? `            <a href="${formPath}" className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded">+ New</a>` : ''}
          </div>`;
  }).join('\n');

  return `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
${imports}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 p-4 space-y-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">SpecVerse App</h1>
            <p className="text-xs text-gray-400">Generated from specification</p>
          </div>
${dashboardView ? `          <a href="/dashboard" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">Dashboard</a>` : ''}
${navGroups}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={${defaultElement}} />
${dashboardView ? `          <Route path="/dashboard" element={<${dashboardView} />} />` : ''}
${routes}
            <Route path="*" element={<div className="p-8"><h1 className="text-2xl">404 - Not Found</h1></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
`;
}
