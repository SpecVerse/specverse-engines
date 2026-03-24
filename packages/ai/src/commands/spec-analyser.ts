/**
 * Spec Analyser — analyses a parsed SpecVerse AST and suggests improvements.
 *
 * This is the engine behind `specverse ai suggest <file>`. It inspects
 * models, controllers, services, events, views, and relationships
 * to identify missing patterns, incomplete definitions, and opportunities.
 */

export interface Suggestion {
  severity: 'info' | 'warning' | 'improvement';
  category: string;
  target: string;
  description: string;
}

/**
 * Analyse a parsed AST and return actionable suggestions.
 */
export function analyseSpec(ast: any): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const components = ast?.components || [];

  for (const component of components) {
    const models = component.models || [];
    const controllers = component.controllers || [];
    const services = component.services || [];
    const events = component.events || [];
    const views = component.views || [];

    const modelNames = new Set(models.map((m: any) => m.name));
    const controllerModels = new Set(controllers.map((c: any) => c.modelReference || c.model));
    const viewModels = new Set(views.map((v: any) => v.primaryModel || v.model).filter(Boolean));

    // --- Model analysis ---
    for (const model of models) {
      const attrs = model.attributes || [];
      const rels = model.relationships || [];
      const attrNames = new Set(attrs.map((a: any) => a.name));
      const attrTypes = new Set(attrs.map((a: any) => a.type));

      // No attributes at all
      if (attrs.length === 0) {
        suggestions.push({
          severity: 'warning',
          category: 'model',
          target: model.name,
          description: `Model has no attributes defined. Add at least an id and a name/title field.`
        });
      }

      // Has email but no password (user-like model)
      if (attrTypes.has('Email') && !attrNames.has('password') && !attrNames.has('passwordHash')) {
        suggestions.push({
          severity: 'improvement',
          category: 'model',
          target: model.name,
          description: `Has Email attribute but no password/passwordHash field. If this is a user model, consider adding authentication fields.`
        });
      }

      // No lifecycle on a model with status-like fields
      const hasStatusField = attrs.some((a: any) =>
        a.name === 'status' || a.name === 'state' || a.name === 'phase'
      );
      const hasLifecycle = model.lifecycles && model.lifecycles.length > 0;
      if (hasStatusField && !hasLifecycle) {
        suggestions.push({
          severity: 'improvement',
          category: 'model',
          target: model.name,
          description: `Has a status/state field but no lifecycle defined. Add a lifecycle to define valid state transitions.`
        });
      }

      // No timestamps
      const hasTimestamps = attrNames.has('createdAt') || attrNames.has('created_at') ||
                           attrNames.has('updatedAt') || attrNames.has('updated_at');
      if (!hasTimestamps && attrs.length > 2) {
        suggestions.push({
          severity: 'info',
          category: 'model',
          target: model.name,
          description: `No timestamp fields (createdAt/updatedAt). Consider adding audit fields for data tracking.`
        });
      }

      // Relationship targets that don't exist as models
      for (const rel of rels) {
        const target = rel.target || rel.targetModel;
        if (target && !modelNames.has(target)) {
          suggestions.push({
            severity: 'warning',
            category: 'relationship',
            target: `${model.name}.${rel.name}`,
            description: `References model "${target}" which is not defined in this component. Add the model or use an import.`
          });
        }
      }

      // belongsTo without inverse hasMany
      for (const rel of rels) {
        if (rel.type === 'belongsTo') {
          const target = rel.target || rel.targetModel;
          const targetModel = models.find((m: any) => m.name === target);
          if (targetModel) {
            const inverseRels = (targetModel.relationships || []);
            const hasInverse = inverseRels.some((r: any) =>
              (r.type === 'hasMany' || r.type === 'hasOne') &&
              (r.target === model.name || r.targetModel === model.name)
            );
            if (!hasInverse) {
              suggestions.push({
                severity: 'info',
                category: 'relationship',
                target: `${model.name}.${rel.name}`,
                description: `belongsTo ${target}, but ${target} has no inverse hasMany/hasOne back to ${model.name}. Consider adding it for navigation.`
              });
            }
          }
        }
      }
    }

    // --- Controller coverage ---
    for (const model of models) {
      if (!controllerModels.has(model.name)) {
        suggestions.push({
          severity: 'info',
          category: 'controller',
          target: model.name,
          description: `No controller defined. The inference engine will generate one, but explicit controllers give you more control over endpoints.`
        });
      }
    }

    // --- Event analysis ---
    if (events.length === 0 && models.length > 2) {
      suggestions.push({
        severity: 'improvement',
        category: 'events',
        target: component.name,
        description: `No events defined. Events enable cross-model communication and are auto-generated by inference, but explicit events let you define custom payloads.`
      });
    }

    // Models with lifecycle but no corresponding events
    for (const model of models) {
      if (model.lifecycles && model.lifecycles.length > 0) {
        const lifecycle = model.lifecycles[0];
        const transitions = lifecycle.transitions || {};
        const transitionNames = Object.keys(transitions);
        if (transitionNames.length > 0) {
          const modelEvents = events.filter((e: any) =>
            e.name.includes(model.name) || (e.attributes || []).some((a: any) =>
              a.name.toLowerCase().includes(model.name.toLowerCase() + 'id')
            )
          );
          if (modelEvents.length === 0) {
            suggestions.push({
              severity: 'improvement',
              category: 'events',
              target: model.name,
              description: `Has lifecycle transitions (${transitionNames.join(', ')}) but no associated events. Consider adding events like ${model.name}Created, ${model.name}StatusChanged.`
            });
          }
        }
      }
    }

    // --- View coverage ---
    if (views.length === 0 && models.length > 0) {
      suggestions.push({
        severity: 'info',
        category: 'views',
        target: component.name,
        description: `No views defined. The inference engine will generate CRUD views, but explicit views let you define dashboards, custom layouts, and specialist view types.`
      });
    }

    for (const model of models) {
      if (!viewModels.has(model.name) && views.length > 0) {
        suggestions.push({
          severity: 'info',
          category: 'views',
          target: model.name,
          description: `Has no explicit view. Other models have views defined — consider adding one for consistency.`
        });
      }
    }

    // --- Service analysis ---
    if (services.length === 0 && models.length > 3) {
      suggestions.push({
        severity: 'improvement',
        category: 'services',
        target: component.name,
        description: `No services defined. Services encapsulate business logic beyond CRUD. With ${models.length} models, there's likely cross-model business logic worth making explicit.`
      });
    }
  }

  // Sort: warnings first, then improvements, then info
  const severityOrder = { warning: 0, improvement: 1, info: 2 };
  suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return suggestions;
}
