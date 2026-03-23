/**
 * App.tsx Generator for React App
 *
 * Generates the root App component with React Router
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

export default function generateAppTsx(context: TemplateContext): string {
  const { spec } = context;

  // Get all views/controllers from spec for routing
  // Handle both array and object formats for views
  let views: string[] = [];
  if (spec.views) {
    if (Array.isArray(spec.views)) {
      views = spec.views.map((v: any) => v.name || 'UnnamedView');
    } else {
      views = Object.keys(spec.views);
    }
  }

  const controllers = spec.controllers ? Object.keys(spec.controllers) : [];

  // Generate imports for view components
  const viewImports = views.map(viewName => {
    return `import ${viewName} from './components/${viewName}';`;
  }).join('\n');

  // Generate routes for each view
  const routes = views.map(viewName => {
    const path = `/${viewName.toLowerCase().replace('view', '')}`;
    return `        <Route path="${path}" element={<${viewName} />} />`;
  }).join('\n');

  // If no views, create a simple home route
  const defaultRoute = views.length === 0
    ? `        <Route path="/" element={<div className="p-8"><h1 className="text-3xl font-bold">Welcome to ${spec.metadata?.component || 'SpecVerse App'}</h1></div>} />`
    : `        <Route path="/" element={<${views[0]} />} />`;

  return `import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
${viewImports}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link to="/" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                  Home
                </Link>
${views.map(viewName => {
  const path = `/${viewName.toLowerCase().replace('view', '')}`;
  const label = viewName.replace('View', '');
  return `                <Link to="${path}" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                  ${label}
                </Link>`;
}).join('\n')}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
${defaultRoute}
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
