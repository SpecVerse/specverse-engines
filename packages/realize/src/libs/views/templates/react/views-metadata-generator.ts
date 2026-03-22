/**
 * Views Metadata JSON Generator
 *
 * Generates views-metadata.json with controller-based view definitions
 */

import type { TemplateContext } from '../../../../../src/realize/types/index.js';

/**
 * Generate views-metadata.json
 */
export default function generateViewsMetadata(context: TemplateContext): string {
  const { spec, views = [] } = context;

  // Extract views from spec if not provided
  const specViews = views.length > 0 ? views : (spec?.views || []);
  const viewsArray = Array.isArray(specViews) ? specViews : Object.values(specViews);

  // Build metadata object
  const metadata: Record<string, any> = {};

  viewsArray.forEach((viewDef: any) => {
    const viewName = viewDef.name;

    // Extract only the essential metadata for runtime
    metadata[viewName] = {
      name: viewName,
      type: viewDef.type || 'list',
      ...(viewDef.description && { description: viewDef.description }),
      model: viewDef.model,  // Keep as-is (string or array for multi-model views)
      ...(viewDef.uiComponents && { uiComponents: viewDef.uiComponents }),
      ...(viewDef.subscriptions && viewDef.subscriptions.length > 0 && {
        subscriptions: viewDef.subscriptions
      }),
      routing: viewDef.routing || {
        path: `/${viewName.toLowerCase().replace(/view$/, '')}`
      }
    };
  });

  return JSON.stringify(metadata, null, 2);
}
