/**
 * View Router Generator (Hybrid v0.9.0)
 *
 * Generates ViewRouter with hybrid routing:
 * - Forms → FormView (controller-based with React hooks)
 * - Display views → Pattern-based rendering
 */

export interface ViewRouterGeneratorContext {
  spec: any;
  manifest: any;
}

export async function generate(context: ViewRouterGeneratorContext): Promise<string> {
  return `/**
 * ViewRouter - Hybrid View Router
 *
 * Pattern-Based Rendering Architecture:
 * - Forms (interactive) → FormView (controller-based with React hooks)
 * - Display views → Pattern-based rendering (list, detail, dashboard)
 *
 * Benefits:
 * - Forms get React hooks, state management, UUID handling
 * - Display views get schema-driven pattern rendering
 * - Both approaches coexist seamlessly
 */

import type { View } from '../../types/api';
import { FormView } from './FormView';
import { ListView } from './ListView';
import { DetailView } from './DetailView';
import { DashboardView } from './DashboardView';

interface ViewRouterProps {
  view: View;
  spec?: any;  // Full spec for controller access
}

export function ViewRouter({ view, spec }: ViewRouterProps) {
  const viewType = view.type?.toLowerCase();

  // Determine rendering strategy
  const useFormRenderer = (type: string): boolean => {
    // Forms require React hooks and state - use FormView (controller-based)
    const interactiveTypes = ['form', 'create', 'edit', 'create-form', 'edit-form'];
    return interactiveTypes.includes(type);
  };

  // Route to appropriate renderer
  if (useFormRenderer(viewType)) {
    // Controller-based form with React hooks
    return <FormView view={view} spec={spec} />;
  }

  // Pattern-based rendering for display views
  switch (viewType) {
    case 'list':
    case 'table':
      return <ListView view={view} spec={spec} />;

    case 'detail':
    case 'master-detail':
      return <DetailView view={view} spec={spec} />;

    case 'dashboard':
      return <DashboardView view={view} spec={spec} />;

    default:
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Unknown View Type: {view.type}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              View "{view.name}" has an unsupported type.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Supported types: list, detail, dashboard, form
            </p>
          </div>
        </div>
      );
  }
}

export default ViewRouter;
`;
}
