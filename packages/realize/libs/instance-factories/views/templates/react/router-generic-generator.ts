/**
 * React Router Generator (Generic Renderers)
 *
 * Generates App.tsx with clean navigation and routing.
 * Groups navigation by model: each model has List and Form links.
 */

import type { TemplateContext } from '@specverse/engine-realize';

export default function generateRouter(context: TemplateContext): string {
  const { spec, models = [], views = [] } = context;

  const specViews = views.length > 0 ? views : (spec?.views || []);
  const viewsArray = Array.isArray(specViews) ? specViews : Object.values(specViews);

  // Extract unique model names from views
  const modelNames = new Set<string>();
  const viewImports: string[] = [];
  const routeEntries: string[] = [];

  viewsArray.forEach((viewDef: any) => {
    const viewName = viewDef.name;
    if (!viewName) return;
    const model = Array.isArray(viewDef.model) ? viewDef.model[0] : viewDef.model;
    if (model) modelNames.add(model);

    const viewType = viewDef.type || 'list';
    const modelLower = model ? model.toLowerCase() : 'unknown';
    const path = `/${modelLower}${viewType}`;

    viewImports.push(`import ${viewName} from './components/${viewName}';`);
    routeEntries.push(`        <Route path="${path}" element={<${viewName} />} />`);
  });

  // Add dashboard if present
  const hasDashboard = viewsArray.some((v: any) => v.type === 'dashboard');
  if (hasDashboard) {
    const dashName = viewsArray.find((v: any) => v.type === 'dashboard')?.name || 'SystemDashboardView';
    if (!viewImports.some(i => i.includes(dashName))) {
      viewImports.push(`import ${dashName} from './components/${dashName}';`);
      routeEntries.push(`        <Route path="/dashboard" element={<${dashName} />} />`);
    }
  }

  // Build model nav items
  const modelNavItems = Array.from(modelNames).map(m => {
    const lower = m.toLowerCase();
    return `            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">${m}s</h3>
              <Link to="/${lower}list" className={\`block px-3 py-2 rounded-md text-sm \${location.pathname === '/${lower}list' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}\`}>
                List
              </Link>
              <Link to="/${lower}form" className={\`block px-3 py-2 rounded-md text-sm \${location.pathname === '/${lower}form' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}\`}>
                + New
              </Link>
            </div>`;
  }).join('\n');

  // Default route — first list view or dashboard
  const defaultModel = Array.from(modelNames)[0]?.toLowerCase() || 'unknown';
  const defaultRoute = hasDashboard ? '/dashboard' : `/${defaultModel}list`;

  return `import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
${viewImports.join('\n')}

function NavBar() {
  const location = useLocation();
  return (
    <div className="w-56 bg-white border-r min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">SpecVerse App</h1>
        <p className="text-xs text-gray-500">Generated from specification</p>
      </div>
      <nav className="space-y-4">
${hasDashboard ? `        <Link to="/dashboard" className={\`block px-3 py-2 rounded-md text-sm font-medium \${location.pathname === '/dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}\`}>
          Dashboard
        </Link>` : ''}
${modelNavItems}
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <NavBar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<${hasDashboard ? viewsArray.find((v: any) => v.type === 'dashboard')?.name || 'SystemDashboardView' : `${Array.from(modelNames)[0] || 'Unknown'}ListView`} />} />
${routeEntries.join('\n')}
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
