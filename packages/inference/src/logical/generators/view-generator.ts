/**
 * View Generator for V3.4.0 Logical Inference
 * Generates views with relationship-aware components and event subscriptions
 * Now uses dynamic component type resolution from v3.4 rules
 */

import {
  ModelDefinition,
  ViewSpec,
  InferenceContext,
  InferenceRule,
  ValidationResult,
  ViewComponent,
  LogicalGenerator
} from '../../core/types.js';
import { RuleEngine } from '../../core/rule-engine.js';
import { InferenceContextManager, ContextUtils } from '../../core/context.js';
import { ComponentTypeResolver, type ComponentMappingRules } from './component-type-resolver.js';
import { SpecialistViewExpander, type SpecialistViewRules } from './specialist-view-expander.js';
import { ExpansionTemplateRuleFile, ConfigurationRuleFile } from '../../core/rule-file-types.js';
import { pluralize } from '@specverse/types';

export interface ViewGenerationResult {
  views: Record<string, ViewSpec>;
  rulesUsed: number;
  validation: ValidationResult;
}

export class ViewGenerator implements LogicalGenerator<ModelDefinition, ViewSpec> {
  name = 'ViewGenerator';

  private ruleEngine: RuleEngine<ModelDefinition, ViewSpec>;
  private contextManager: InferenceContextManager;
  private componentResolver: ComponentTypeResolver;
  private specialistExpander: SpecialistViewExpander;
  private rulesLoaded = false;

  constructor(private debug: boolean = false) {
    this.ruleEngine = new RuleEngine<ModelDefinition, ViewSpec>(debug);
    this.contextManager = new InferenceContextManager(debug);
    this.componentResolver = new ComponentTypeResolver();
    this.specialistExpander = new SpecialistViewExpander();
  }

  /**
   * Load component mapping rules from domain-specific format (v3.4.0 Phase 2)
   */
  loadComponentMappingsFromDomainSpecific(ruleFile: ConfigurationRuleFile): void {
    this.componentResolver.loadRulesFromDomainSpecific(ruleFile);
    if (this.debug) {
      console.log(`📋 Loaded component mappings (domain-specific): ${ruleFile.version}`);
    }
  }

  /**
   * Load component mapping rules from legacy format (backward compatibility)
   */
  loadComponentMappings(rules: ComponentMappingRules): void {
    this.componentResolver.loadRules(rules);
    if (this.debug) {
      console.log(`📋 Loaded component mapping rules (legacy): ${rules.version}`);
    }
  }

  /**
   * Load specialist view rules from domain-specific format (v3.4.0 Phase 3)
   */
  loadSpecialistViewRulesFromDomainSpecific(ruleFile: ExpansionTemplateRuleFile): void {
    this.specialistExpander.loadRulesFromDomainSpecific(ruleFile);
    if (this.debug) {
      console.log(`📋 Loaded specialist views (domain-specific): ${ruleFile.version}`);
      console.log(`   Types: ${this.specialistExpander.getAvailableTypes().join(', ')}`);
    }
  }

  /**
   * Load specialist view rules from legacy format (backward compatibility)
   */
  loadSpecialistViewRules(rules: SpecialistViewRules): void {
    this.specialistExpander.loadRules(rules);
    if (this.debug) {
      console.log(`📋 Loaded specialist view rules (legacy): ${rules.version}`);
      console.log(`   Specialist types: ${this.specialistExpander.getAvailableTypes().join(', ')}`);
    }
  }

  /**
   * Load view inference rules
   */
  async loadRules(rules: InferenceRule<ModelDefinition, ViewSpec>[]): Promise<ValidationResult> {
    if (this.debug) {
      console.log(`📋 Loading ${rules.length} view rules`);
    }

    const validation = this.ruleEngine.loadRules('views', rules);
    
    if (validation.valid) {
      this.rulesLoaded = true;
      
      if (this.debug) {
        console.log(`✅ View rules loaded successfully`);
      }
    } else {
      console.error('❌ Failed to load view rules:', validation.errors);
    }

    return validation;
  }

  /**
   * Check if this generator supports the given input
   */
  supports(input: ModelDefinition, context: InferenceContext): boolean {
    return this.rulesLoaded && input.name !== undefined;
  }

  /**
   * Generate views for all models
   */
  async generate(
    models: ModelDefinition[], 
    baseContext: InferenceContext
  ): Promise<ViewGenerationResult> {
    const views: Record<string, ViewSpec> = {};
    let rulesUsed = 0;
    
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!this.rulesLoaded) {
      validation.errors.push({
        code: 'RULES_NOT_LOADED',
        message: 'View rules not loaded. Call loadRules() first.',
        location: 'ViewGenerator.generate'
      });
      validation.valid = false;
      return { views, rulesUsed, validation };
    }

    try {
      // Process user-specified views first (Phase 4)
      // User views come from the parsed .specly file, passed via metadata
      const userViews = baseContext.metadata?.userSpecifiedViews || {};
      if (Object.keys(userViews).length > 0) {
        if (this.debug) {
          console.log(`👁️ Processing ${Object.keys(userViews).length} user-specified views`);
        }

        for (const [viewName, userViewSpec] of Object.entries(userViews)) {
          views[viewName] = this.processUserSpecifiedView(viewName, userViewSpec as any, models);
          rulesUsed++;

          if (this.debug) {
            console.log(`   ✅ Processed user-specified view: ${viewName} (${(userViewSpec as any).type})`);
          }
        }
      }

      // Generate auto views for each model (standard + specialist)
      for (const model of models) {
        if (this.debug) {
          console.log(`👁️ Generating views for model: ${model.name}`);
        }

        // Create model-specific context
        const modelContext = ContextUtils.withCurrentModel(baseContext, model, this.contextManager);

        // Generate standard views (but skip if user already defined them)
        const standardViews = this.generateStandardViews(model, modelContext);
        for (const [viewName, viewSpec] of Object.entries(standardViews)) {
          // Only add if not already defined by user
          if (!views[viewName]) {
            views[viewName] = viewSpec;
            rulesUsed++;

            if (this.debug) {
              console.log(`   ✅ Generated standard view: ${viewName} (${viewSpec.type})`);
            }
          } else if (this.debug) {
            console.log(`   ⏭️  Skipped standard view (user-defined): ${viewName}`);
          }
        }

        // Generate specialist views (but skip if user already defined them)
        const specialistViews = this.generateSpecialistViews(model, modelContext);
        for (const [viewName, viewSpec] of Object.entries(specialistViews)) {
          // Only add if not already defined by user
          if (!views[viewName]) {
            views[viewName] = viewSpec;
            rulesUsed++;

            if (this.debug) {
              console.log(`   ✅ Generated specialist view: ${viewName} (${viewSpec.type})`);
            }
          } else if (this.debug) {
            console.log(`   ⏭️  Skipped specialist view (user-defined): ${viewName}`);
          }
        }

        // Generate relationship views
        if (model.relationships && model.relationships.length > 0) {
          const relationshipViews = this.generateRelationshipViews(model, models, modelContext);
          for (const [viewName, viewSpec] of Object.entries(relationshipViews)) {
            views[viewName] = viewSpec;
            rulesUsed++;
            
            if (this.debug) {
              console.log(`   ✅ Generated relationship view: ${viewName} (${viewSpec.type})`);
            }
          }
        }

        // Apply custom view rules
        const matchingRules = this.ruleEngine.findMatches('views', model, modelContext);
        for (const rule of matchingRules) {
          try {
            const ruleViews = this.ruleEngine.apply(rule, model, modelContext);
            
            // Handle both single view and multiple views from rules
            if (typeof ruleViews === 'object' && ruleViews !== null) {
              if ('type' in ruleViews) {
                // Single view
                const viewName = this.generateViewName(model, rule);
                views[viewName] = ruleViews as ViewSpec;
                rulesUsed++;
              } else {
                // Multiple views
                for (const [viewName, viewSpec] of Object.entries(ruleViews)) {
                  views[viewName] = viewSpec as ViewSpec;
                  rulesUsed++;
                }
              }
            }
            
            if (this.debug) {
              console.log(`   ✅ Applied rule: ${rule.name} (${rule.pattern})`);
            }
            
          } catch (error) {
            validation.errors.push({
              code: 'RULE_APPLICATION_ERROR',
              message: `Failed to apply rule '${rule.name}' to model '${model.name}': ${error instanceof Error ? error.message : String(error)}`,
              location: `model:${model.name}:rule:${rule.name}`
            });
            validation.valid = false;
          }
        }
      }

      // Generate aggregate views for related models
      const aggregateViews = this.generateAggregateViews(models, baseContext);
      for (const [viewName, viewSpec] of Object.entries(aggregateViews)) {
        views[viewName] = viewSpec;
        rulesUsed++;
        
        if (this.debug) {
          console.log(`   ✅ Generated aggregate view: ${viewName} (${viewSpec.type})`);
        }
      }

      // Validate all generated views
      for (const [viewName, viewSpec] of Object.entries(views)) {
        const viewValidation = this.validateViewSpec(viewSpec, viewName);
        validation.errors.push(...viewValidation.errors);
        validation.warnings.push(...viewValidation.warnings);
        
        if (!viewValidation.valid) {
          validation.valid = false;
        }
      }

    } catch (error) {
      validation.errors.push({
        code: 'GENERATION_ERROR',
        message: `View generation failed: ${error instanceof Error ? error.message : String(error)}`,
        location: 'ViewGenerator.generate'
      });
      validation.valid = false;
    }

    if (this.debug) {
      console.log(`👁️ View generation complete:`);
      console.log(`   Models processed: ${models.length}`);
      console.log(`   Views generated: ${Object.keys(views).length}`);
      console.log(`   Rules applied: ${rulesUsed}`);
      console.log(`   Validation: ${validation.valid ? 'PASSED' : 'FAILED'} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`);
    }

    return { views, rulesUsed, validation };
  }

  // ===============================
  // Private Implementation
  // ===============================

  /**
   * Generate standard views for a model (list, detail, form)
   */
  private generateStandardViews(model: ModelDefinition, context: InferenceContext): Record<string, ViewSpec> {
    const views: Record<string, ViewSpec> = {};
    
    // List View
    // List View - Runtime auto-infers table from model
    views[`${model.name}ListView`] = {
      type: 'list',
      model: model.name,
      description: `List view for ${model.name}s`,
      subscribes_to: this.generateListViewSubscriptions(model)
      // Runtime auto-infers: table columns, filters, pagination, sorting
    };

    // Detail View - Runtime auto-infers layout from model and relationships
    const detailView: any = {
      type: 'detail',
      description: `Detail view for ${model.name}`,
      subscribes_to: this.generateDetailViewSubscriptions(model)
    };

    // Always add minimal uiComponents for detail views
    const uiComponents: any = {};

    // Add related models if there are child relationships
    if (context.relationships?.childRelationships && context.relationships.childRelationships.length > 0) {
      const relatedModels = [model.name];
      const uniqueRelated = new Set<string>();
      context.relationships.childRelationships.forEach(rel => {
        uniqueRelated.add(rel.targetModel);
      });
      relatedModels.push(...Array.from(uniqueRelated));
      detailView.model = relatedModels;

      // Main model content
      uiComponents[`${model.name.toLowerCase()}Content`] = {
        type: 'content'
        // Fields auto-inferred from model
      };

      // Related model lists
      Array.from(uniqueRelated).forEach(relatedModel => {
        uiComponents[`${relatedModel.toLowerCase()}List`] = {
          type: 'list'
          // Fields auto-inferred from related model
        };
      });
    } else {
      // Single model detail view - just content component
      detailView.model = model.name;

      uiComponents[`${model.name.toLowerCase()}Content`] = {
        type: 'content'
        // Fields auto-inferred from model
      };
    }

    detailView.uiComponents = uiComponents;
    views[`${model.name}DetailView`] = detailView;

    // Form View - Runtime auto-infers all UI components
    views[`${model.name}FormView`] = {
      type: 'form',
      model: model.name,
      description: `Form view for creating and editing ${model.name}`,
      subscribes_to: [`${model.name}Created`, `${model.name}Updated`]
      // Runtime auto-infers: form fields, relationship selectors, submit buttons
    };

    return views;
  }

  /**
   * Generate specialist views if expander is loaded (v3.4.0 Phase 3)
   * Specialist views include: dashboard, analytics, board, calendar, timeline, etc.
   *
   * DISABLED: Phase 2 - Reduce view generation to essentials only
   * Only list, detail, and form views are generated per model
   * No specialist views (dashboard, analytics, board, timeline, workflow, calendar)
   */
  private generateSpecialistViews(model: ModelDefinition, context: InferenceContext): Record<string, ViewSpec> {
    const views: Record<string, ViewSpec> = {};

    // DISABLED: Phase 2 view reduction - return empty to disable all specialist views
    // This reduces view count from 21 to ~9 views (3 per model + optional aggregate dashboard)
    return views;

    // ===========================================
    // ORIGINAL CODE DISABLED BELOW
    // ===========================================

    // Only generate if specialist expander has rules loaded
    if (!this.specialistExpander.isLoaded()) {
      return views;
    }

    // Check if model should have specialist views
    // For now, generate dashboard for models with metrics (numeric attributes or relationships)
    const hasMetrics = model.attributes?.some(attr =>
      ['integer', 'number', 'money', 'decimal', 'float'].includes(attr.type.toLowerCase())
    );
    const hasRelationships = model.relationships && model.relationships!.length > 0;

    if (hasMetrics || hasRelationships) {
      // Generate dashboard view
      if (this.specialistExpander.isSpecialistView('dashboard')) {
        try {
          const metrics = model.attributes
            ?.filter(attr => ['integer', 'number', 'money'].includes(attr.type.toLowerCase()))
            .map(attr => attr.name)
            .slice(0, 3) || [];  // Limit to 3 metrics

          if (metrics.length > 0) {
            const dashboardComponents = this.specialistExpander.expandSpecialistView({
              type: 'dashboard',
              model: model.name,
              metrics
            });

            views[`${model.name}DashboardView`] = {
              type: 'dashboard',
              model: model.name,
              description: `Dashboard view for ${model.name} with metrics and summary`,
              subscribes_to: this.generateListViewSubscriptions(model),
              uiComponents: dashboardComponents
            };

            if (this.debug) {
              console.log(`   ✅ Generated specialist dashboard view for ${model.name}`);
            }
          }
        } catch (error) {
          if (this.debug) {
            console.warn(`   ⚠️  Failed to generate dashboard for ${model.name}:`, error);
          }
        }
      }

      // Generate analytics view for models with lifecycle or temporal data
      if (this.specialistExpander.isSpecialistView('analytics') && (model.lifecycle || hasMetrics)) {
        try {
          const charts = ['trend', 'distribution'];
          const analyticsComponents = this.specialistExpander.expandSpecialistView({
            type: 'analytics',
            model: model.name,
            charts
          });

          views[`${model.name}AnalyticsView`] = {
            type: 'analytics',
            model: model.name,
            description: `Analytics view for ${model.name} with charts and filters`,
            subscribes_to: this.generateListViewSubscriptions(model),
            uiComponents: analyticsComponents
          };

          if (this.debug) {
            console.log(`   ✅ Generated specialist analytics view for ${model.name}`);
          }
        } catch (error) {
          if (this.debug) {
            console.warn(`   ⚠️  Failed to generate analytics for ${model.name}:`, error);
          }
        }
      }

      // Generate board view for models with workflow/lifecycle
      if (this.specialistExpander.isSpecialistView('board') && model.lifecycle) {
        try {
          // Use lifecycle states as board columns
          const states = model.lifecycle?.states || [];
          if (states.length > 0) {
            // Handle both string[] and object[] state formats
            const stateNames = states.map(s => typeof s === 'string' ? s : (s as any).name);
            const boardComponents = this.specialistExpander.expandSpecialistView({
              type: 'board',
              model: model.name,
              columns: stateNames
            });

            views[`${model.name}BoardView`] = {
              type: 'board',
              model: model.name,
              description: `Kanban board view for ${model.name} workflow`,
              subscribes_to: [...this.generateListViewSubscriptions(model), `${model.name}Evolved`],
              uiComponents: boardComponents
            };

            if (this.debug) {
              console.log(`   ✅ Generated specialist board view for ${model.name}`);
            }
          }
        } catch (error) {
          if (this.debug) {
            console.warn(`   ⚠️  Failed to generate board for ${model.name}:`, error);
          }
        }
      }

      // Generate timeline view for models with temporal attributes (createdAt, updatedAt, timestamps)
      const hasTemporalAttributes = model.attributes?.some(attr =>
        ['datetime', 'date', 'timestamp'].includes(attr.type.toLowerCase()) ||
        ['createdAt', 'updatedAt', 'timestamp', 'date'].includes(attr.name.toLowerCase())
      );

      if (this.specialistExpander.isSpecialistView('timeline') && hasTemporalAttributes) {
        try {
          const timelineComponents = this.specialistExpander.expandSpecialistView({
            type: 'timeline',
            model: model.name
          });

          views[`${model.name}TimelineView`] = {
            type: 'timeline',
            model: model.name,
            description: `Timeline view for ${model.name} chronological history`,
            subscribes_to: this.generateListViewSubscriptions(model),
            uiComponents: timelineComponents
          };

          if (this.debug) {
            console.log(`   ✅ Generated specialist timeline view for ${model.name}`);
          }
        } catch (error) {
          if (this.debug) {
            console.warn(`   ⚠️  Failed to generate timeline for ${model.name}:`, error);
          }
        }
      }

      // Generate calendar view for models with date/time scheduling attributes
      const hasSchedulingAttributes = model.attributes?.some(attr =>
        ['startDate', 'endDate', 'scheduledAt', 'dueDate'].some(name =>
          attr.name.toLowerCase().includes(name.toLowerCase())
        )
      );

      if (this.specialistExpander.isSpecialistView('calendar') && hasSchedulingAttributes) {
        try {
          const calendarComponents = this.specialistExpander.expandSpecialistView({
            type: 'calendar',
            model: model.name
          });

          views[`${model.name}CalendarView`] = {
            type: 'calendar',
            model: model.name,
            description: `Calendar view for ${model.name} scheduling`,
            subscribes_to: this.generateListViewSubscriptions(model),
            uiComponents: calendarComponents
          };

          if (this.debug) {
            console.log(`   ✅ Generated specialist calendar view for ${model.name}`);
          }
        } catch (error) {
          if (this.debug) {
            console.warn(`   ⚠️  Failed to generate calendar for ${model.name}:`, error);
          }
        }
      }

      // Generate workflow view for models with complex lifecycles (3+ states)
      if (this.specialistExpander.isSpecialistView('workflow') && model.lifecycle) {
        const states = model.lifecycle?.states || [];
        if (states.length >= 3) {
          try {
            const workflowComponents = this.specialistExpander.expandSpecialistView({
              type: 'workflow',
              model: model.name
            });

            views[`${model.name}WorkflowView`] = {
              type: 'workflow',
              model: model.name,
              description: `Workflow state machine for ${model.name}`,
              subscribes_to: [...this.generateListViewSubscriptions(model), `${model.name}Evolved`],
              uiComponents: workflowComponents
            };

            if (this.debug) {
              console.log(`   ✅ Generated specialist workflow view for ${model.name}`);
            }
          } catch (error) {
            if (this.debug) {
              console.warn(`   ⚠️  Failed to generate workflow for ${model.name}:`, error);
            }
          }
        }
      }
    }

    return views;
  }

  /**
   * Process user-specified view from .specly file (Phase 4)
   * User views can be simple (just type) or detailed (full uiComponents)
   */
  private processUserSpecifiedView(
    viewName: string,
    userSpec: any,
    models: ModelDefinition[]
  ): ViewSpec {
    const viewSpec: ViewSpec = {
      type: userSpec.type,
      model: userSpec.model,
      models: userSpec.models,
      description: userSpec.description || `User-defined ${userSpec.type} view`,
      subscribes_to: userSpec.subscribes_to || []
    };

    // If user provided full uiComponents, use them
    if (userSpec.uiComponents) {
      viewSpec.uiComponents = userSpec.uiComponents;
    }
    // If user requested a specialist view but didn't provide components, expand it
    else if (this.specialistExpander.isSpecialistView(userSpec.type)) {
      // Build expansion parameters from user spec
      const expansionParams: any = {
        type: userSpec.type,
        model: userSpec.model || viewName.replace(/View$/, '')
      };

      // Extract type-specific parameters
      if (userSpec.metrics) expansionParams.metrics = userSpec.metrics;
      if (userSpec.charts) expansionParams.charts = userSpec.charts;
      if (userSpec.columns) expansionParams.columns = userSpec.columns;

      // Expand using specialist expander
      viewSpec.uiComponents = this.specialistExpander.expandSpecialistView(expansionParams);
    }
    // Otherwise, create minimal components
    else {
      viewSpec.uiComponents = {
        container: {
          type: 'container',
          properties: {
            model: userSpec.model
          }
        }
      };
    }

    return viewSpec;
  }

  /**
   * Generate relationship-specific views
   *
   * DISABLED: Phase 2 - master_detail views disabled
   * Only association views for many-to-many relationships are generated
   */
  private generateRelationshipViews(
    model: ModelDefinition,
    allModels: ModelDefinition[],
    context: InferenceContext
  ): Record<string, ViewSpec> {
    const views: Record<string, ViewSpec> = {};

    if (!model.relationships) return views;

    const relationships = context.relationships;

    // DISABLED: Phase 2 - master_detail view type not supported
    // Generate master-detail views for parent-child relationships
    // if (relationships?.childRelationships && relationships.childRelationships.length > 0) {
    //   views[`${model.name}MasterDetailView`] = {
    //     type: 'master_detail',
    //     model: model.name,
    //     description: `Master-detail view showing ${model.name} with related entities`,
    //     subscribes_to: this.generateMasterDetailSubscriptions(model, relationships.childRelationships),
    //     uiComponents: this.generateMasterDetailComponents(model, relationships.childRelationships, context)
    //   };
    // }

    // Generate relationship management views for many-to-many
    if (relationships?.manyToManyRelationships && relationships.manyToManyRelationships.length > 0) {
      for (const relationship of relationships.manyToManyRelationships) {
        views[`${model.name}${relationship.targetModel}AssociationView`] = {
          type: 'list',
          model: model.name,
          description: `Manage ${model.name} associations with ${relationship.targetModel}`,
          subscribes_to: [
            `${model.name}AssociatedWith${relationship.targetModel}`,
            `${model.name}DisassociatedFrom${relationship.targetModel}`
          ],
          uiComponents: this.generateAssociationViewComponents(model, relationship, context)
        };
      }
    }

    return views;
  }

  /**
   * Generate aggregate views for dashboard and overview purposes
   */
  private generateAggregateViews(models: ModelDefinition[], context: InferenceContext): Record<string, ViewSpec> {
    const views: Record<string, ViewSpec> = {};
    
    if (models.length < 2) return views;

    // Find root models (models without parent relationships)
    const rootModels = models.filter(model => {
      if (!model.relationships) return true;
      return !model.relationships.some(rel => rel.type === 'belongsTo');
    });

    if (rootModels.length > 1) {
      // System dashboard view - using models array for dashboard type
      views['SystemDashboardView'] = {
        type: 'dashboard',
        models: rootModels.map(m => m.name),
        description: 'System-wide dashboard showing overview of all main entities',
        subscribes_to: rootModels.flatMap(model => [
          `${model.name}Created`,
          `${model.name}Updated`,
          `${model.name}Deleted`
        ]),
        uiComponents: this.generateDashboardComponents(rootModels, context)
      };
    }

    return views;
  }

  /**
   * Generate list view event subscriptions
   */
  private generateListViewSubscriptions(model: ModelDefinition): string[] {
    const subscriptions = [
      `${model.name}Created`,
      `${model.name}Updated`,
      `${model.name}Deleted`
    ];

    // Add lifecycle subscriptions
    if (model.lifecycle) {
      subscriptions.push(`${model.name}Evolved`);
    }

    return subscriptions;
  }

  /**
   * Generate detail view event subscriptions
   */
  private generateDetailViewSubscriptions(model: ModelDefinition): string[] {
    const subscriptions = [`${model.name}Updated`];

    // Add lifecycle subscriptions
    if (model.lifecycle) {
      subscriptions.push(`${model.name}Evolved`);
    }

    // Add relationship subscriptions (use PascalCase for event names to match event generator)
    if (model.relationships) {
      for (const rel of model.relationships) {
        if (rel.type === 'hasMany' || rel.type === 'hasOne') {
          const relationshipNamePascal = this.pascalCase(rel.name);
          subscriptions.push(`${relationshipNamePascal}AddedTo${model.name}`);
          subscriptions.push(`${relationshipNamePascal}RemovedFrom${model.name}`);
        }
      }
    }

    return subscriptions;
  }

  /**
   * Generate master-detail view subscriptions
   */
  private generateMasterDetailSubscriptions(model: ModelDefinition, childRelationships: any[]): string[] {
    const subscriptions = [`${model.name}Updated`];
    
    for (const rel of childRelationships) {
      subscriptions.push(`${rel.targetModel}Created`);
      subscriptions.push(`${rel.targetModel}Updated`);
      subscriptions.push(`${rel.targetModel}Deleted`);
    }
    
    return subscriptions;
  }

  /**
   * Generate list view components
   */
  private generateListViewComponents(model: ModelDefinition, context: InferenceContext): Record<string, any> {
    // v3.4.0: Use pattern from component mapping rules if available
    const pattern = this.componentResolver.getListViewPattern();
    if (pattern) {
      return {
        searchBar: {
          type: pattern.searchBar.type,  // 'input' from v3.4 rules
          properties: {
            placeholder: `Search ${pluralize(model.name.toLowerCase())}...`,
            debounce: 300
          }
        },
        filters: {
          type: pattern.filterPanel.type,  // 'filterPanel' from v3.4 rules
          properties: {
            model: model.name,
            filterFields: this.getFilterableFields(model)
          }
        },
        [`${model.name.toLowerCase()}List`]: {
          type: pattern.table.type,  // 'table' from v3.4 rules
          properties: {
            model: model.name,
            itemTemplate: `${model.name}Card`,
            pagination: true,
            sortable: true,
            selectable: true
          }
        },
        actionToolbar: {
          type: 'button-group',  // v3.4 atomic type
          properties: {
            actions: [
              { name: 'create', label: `Create ${model.name}`, icon: 'plus' },
              { name: 'delete', label: 'Delete Selected', icon: 'trash', bulk: true },
              { name: 'export', label: 'Export', icon: 'download' }
            ]
          }
        }
      };
    }

    // Fallback to legacy types
    return {
      searchBar: {
        type: 'SearchInput',
        properties: {
          placeholder: `Search ${pluralize(model.name.toLowerCase())}...`,
          debounce: 300
        }
      },
      filters: {
        type: 'FilterPanel',
        properties: {
          model: model.name,
          filterFields: this.getFilterableFields(model)
        }
      },
      [`${model.name.toLowerCase()}List`]: {
        type: 'List',
        properties: {
          model: model.name,
          itemTemplate: `${model.name}Card`,
          pagination: true,
          sortable: true,
          selectable: true
        }
      },
      actionToolbar: {
        type: 'ActionToolbar',
        properties: {
          actions: [
            { name: 'create', label: `Create ${model.name}`, icon: 'plus' },
            { name: 'delete', label: 'Delete Selected', icon: 'trash', bulk: true },
            { name: 'export', label: 'Export', icon: 'download' }
          ]
        }
      }
    };
  }

  /**
   * Generate detail view components
   */
  private generateDetailViewComponents(model: ModelDefinition, context: InferenceContext): Record<string, any> {
    // v3.4.0: Use pattern from component mapping rules if available
    const pattern = this.componentResolver.getDetailViewPattern();

    const components: Record<string, any> = {
      detailHeader: {
        type: pattern?.header?.type || 'header',  // 'header' from v3.4 rules
        properties: {
          title: `${model.name} Details`,
          model: model.name,
          showBreadcrumb: true
        }
      },
      detailsPanel: {
        type: pattern?.card?.type || 'card',  // 'card' from v3.4 rules
        properties: {
          model: model.name,
          layout: 'card',
          showMetadata: true
        }
      },
      actions: {
        type: pattern?.actions?.type || 'button-group',  // 'button-group' from v3.4 rules
        properties: {
          buttons: [
            { name: 'edit', label: 'Edit', icon: 'edit' },
            { name: 'delete', label: 'Delete', icon: 'trash' }
          ]
        }
      }
    };

    // Related data sections based on relationships
    const relationships = context.relationships;
    if (relationships?.childRelationships) {
      for (const rel of relationships.childRelationships) {
        // v3.4.0: Use relationship type resolver
        const relType = this.componentResolver.isLoaded()
          ? this.componentResolver.resolveRelationshipComponentType(rel)
          : { type: 'list' };  // v3.4 atomic type

        components[`related${rel.targetModel}Section`] = {
          type: relType.type,  // 'list' from v3.4 rules for hasMany
          properties: {
            title: `Related ${pluralize(rel.targetModel)}`,
            model: rel.targetModel,
            relationship: rel.type,
            allowCreate: true,
            allowEdit: true,
            allowDelete: !rel.cascadeDelete
          }
        };
      }
    }

    // Lifecycle controls if model has lifecycle
    if (model.lifecycle) {
      components.lifecycleControls = {
        type: 'LifecycleControls',
        properties: {
          model: model.name,
          lifecycle: model.lifecycle.name,
          showHistory: true
        }
      };
    }

    return components;
  }

  /**
   * Generate form view components
   */
  private generateFormViewComponents(model: ModelDefinition, context: InferenceContext): Record<string, any> {
    // v3.4.0: Use pattern from component mapping rules if available
    const pattern = this.componentResolver.getFormViewPattern();

    // Phase 1: Removed formHeader - runtime auto-infers headers
    const components: Record<string, any> = {};

    // Form container
    const formComponent: Record<string, any> = {
      type: pattern?.form?.type || 'form',  // 'form' from v3.4 rules
      properties: {
        model: model.name,
        sections: []
      }
    };

    // Form sections based on attributes
    const sections = this.groupAttributesIntoSections(model);
    for (const [sectionName, attributes] of Object.entries(sections)) {
      // Phase 2: Filter out id and auto-generated fields from forms
      const editableAttrs = attributes.filter(attr =>
        attr.name !== 'id' && !attr.auto
      );

      if (editableAttrs.length > 0) {
        formComponent.properties.sections.push({
          title: sectionName,
          fields: editableAttrs.map(attr => ({
            name: attr.name,
            type: this.getInputType(attr),  // Uses v3.4 resolver
            label: this.humanize(attr.name),
            required: attr.required,
            validation: attr.constraints
          }))
        });
      }
    }

    components.form = formComponent;

    // Relationship fields
    const relationships = context.relationships;
    if (relationships?.parentRelationships) {
      for (const rel of relationships.parentRelationships) {
        // v3.4.0: Use relationship resolver
        const relType = this.componentResolver.isLoaded()
          ? this.componentResolver.resolveRelationshipComponentType(rel)
          : { type: 'autocomplete' };  // v3.4 atomic type

        components[`${rel.name}Selector`] = {
          type: relType.type,  // 'autocomplete' from v3.4 rules for belongsTo
          properties: {
            name: `${rel.name}Id`,
            label: `Select ${rel.targetModel}`,
            model: rel.targetModel,
            required: true,
            searchable: true
          }
        };
      }
    }

    // Submit controls
    components.formActions = {
      type: pattern?.actions?.type || 'button-group',  // 'button-group' from v3.4 rules
      properties: {
        buttons: [
          { name: 'submit', label: `Save ${model.name}`, type: 'primary' },
          { name: 'cancel', label: 'Cancel', type: 'secondary' }
        ],
        showValidation: true
      }
    };

    return components;
  }

  /**
   * Generate master-detail view components
   */
  private generateMasterDetailComponents(
    model: ModelDefinition, 
    childRelationships: any[], 
    context: InferenceContext
  ): Record<string, any> {
    const components: Record<string, any> = {
      masterPane: {
        type: 'MasterPane',
        properties: {
          model: model.name,
          displayMode: 'detail',
          resizable: true
        }
      }
    };

    // Detail panes for each child relationship
    for (const rel of childRelationships) {
      components[`${rel.targetModel.toLowerCase()}DetailPane`] = {
        type: 'DetailPane',
        properties: {
          title: `${pluralize(rel.targetModel)}`,
          model: rel.targetModel,
          parentModel: model.name,
          relationshipType: rel.type,
          allowCreate: true,
          allowEdit: true,
          allowDelete: !rel.cascadeDelete
        }
      };
    }

    return components;
  }

  /**
   * Generate association view components for many-to-many relationships
   */
  private generateAssociationViewComponents(
    model: ModelDefinition, 
    relationship: any, 
    context: InferenceContext
  ): Record<string, any> {
    return {
      associationManager: {
        type: 'AssociationManager',
        properties: {
          sourceModel: model.name,
          targetModel: relationship.targetModel,
          relationshipType: 'manyToMany',
          allowAdd: true,
          allowRemove: true,
          showAssociationData: true,
          searchable: true
        }
      }
    };
  }

  /**
   * Generate dashboard components
   */
  private generateDashboardComponents(models: ModelDefinition[], context: InferenceContext): Record<string, any> {
    // v3.4.0 Phase 3: Use specialist view expander if rules are loaded
    if (this.specialistExpander.isLoaded() && this.specialistExpander.isSpecialistView('dashboard')) {
      const metrics = models.map(m => m.name.toLowerCase());
      const viewDef = {
        type: 'dashboard',
        model: models[0]?.name || 'System',
        metrics: metrics.slice(0, 3) // Limit to first 3 for dashboard overview
      };
      return this.specialistExpander.expandSpecialistView(viewDef);
    }

    // Fallback to legacy component types
    const components: Record<string, any> = {};

    // Summary cards for each model
    for (const model of models) {
      components[`${model.name.toLowerCase()}Summary`] = {
        type: 'SummaryCard',
        properties: {
          model: model.name,
          title: `${pluralize(model.name)} Overview`,
          showCount: true,
          showRecentActivity: true,
          showTrends: true
        }
      };
    }

    // Recent activity feed
    components.activityFeed = {
      type: 'ActivityFeed',
      properties: {
        title: 'Recent Activity',
        models: models.map(m => m.name),
        limit: 20,
        groupByDate: true
      }
    };

    return components;
  }

  // Utility methods
  
  private generateViewName(model: ModelDefinition, rule: InferenceRule<ModelDefinition, ViewSpec>): string {
    switch (rule.pattern) {
      case 'CustomListView':
        return `${model.name}CustomListView`;
      case 'ReportView':
        return `${model.name}ReportView`;
      case 'AnalyticsView':
        return `${model.name}AnalyticsView`;
      default:
        return `${model.name}CustomView`;
    }
  }

  private getFilterableFields(model: ModelDefinition): string[] {
    return model.attributes
      .filter(attr => ['String', 'Text', 'Integer', 'Boolean', 'DateTime'].includes(attr.type))
      .map(attr => attr.name);
  }

  private groupAttributesIntoSections(model: ModelDefinition): Record<string, any[]> {
    // Phase 4: Semantic section grouping based on attribute semantics
    const sections: Record<string, any[]> = {
      'Basic Information': [],
      'Publishing': [],
      'Metadata': []
    };

    for (const attr of model.attributes) {
      const attrName = attr.name.toLowerCase();

      // Core identifying fields
      if (['name', 'title', 'content', 'description', 'bio'].includes(attrName)) {
        sections['Basic Information'].push(attr);
      }
      // Publishing/visibility related fields
      else if (['publishedat', 'publishdate', 'status', 'visibility', 'ispublished'].includes(attrName.replace('_', ''))) {
        sections['Publishing'].push(attr);
      }
      // Metadata fields
      else if (['createdat', 'updatedat', 'joinedat', 'viewcount', 'metadata'].includes(attrName.replace('_', ''))) {
        sections['Metadata'].push(attr);
      }
      // Everything else goes to Basic Information
      else {
        sections['Basic Information'].push(attr);
      }
    }

    // Remove empty sections
    Object.keys(sections).forEach(key => {
      if (sections[key].length === 0) {
        delete sections[key];
      }
    });

    return sections;
  }

  private getInputType(attribute: any): string {
    // Phase 3: Semantic type mapping based on attribute type and name
    const attrType = attribute.type.toLowerCase();
    const attrName = attribute.name.toLowerCase();

    // Map to simple, semantic types matching TARGET specification
    if (attrName.includes('content') || attrName.includes('description') || attrName.includes('bio')) {
      return 'textarea';
    }

    switch (attrType) {
      case 'string':
      case 'text':
        return 'text';
      case 'integer':
      case 'number':
        return 'number';
      case 'money':
        return 'currency';
      case 'boolean':
        return 'checkbox';
      case 'datetime':
      case 'date':
        return 'datetime';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  }

  private humanize(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, c => c.toUpperCase())
      .trim();
  }


  /**
   * Convert string to PascalCase
   */
  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Validate generated view specification
   */
  private validateViewSpec(spec: ViewSpec, viewName: string): ValidationResult {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    if (!spec.type) {
      validation.errors.push({
        code: 'MISSING_VIEW_TYPE',
        message: `View '${viewName}' missing type`,
        location: `view:${viewName}:type`
      });
      validation.valid = false;
    }

    // Validate view type
    const validTypes = [
      'list', 'detail', 'form', 'dashboard', 'master_detail',
      'analytics', 'board', 'calendar', 'timeline', 'map',
      'wizard', 'feed', 'profile', 'settings', 'workflow', 'comparison'
    ];
    if (spec.type && !validTypes.includes(spec.type)) {
      validation.errors.push({
        code: 'INVALID_VIEW_TYPE',
        message: `View '${viewName}' has invalid type '${spec.type}'. Valid types: ${validTypes.join(', ')}`,
        location: `view:${viewName}:type`
      });
      validation.valid = false;
    }

    // Check model consistency
    if (spec.type !== 'dashboard' && !spec.model && (!spec.models || spec.models.length === 0)) {
      validation.warnings.push({
        code: 'NO_MODEL_REFERENCE',
        message: `View '${viewName}' should reference at least one model`,
        location: `view:${viewName}:model`
      });
    }

    // Validate UI components
    if (!spec.uiComponents || Object.keys(spec.uiComponents).length === 0) {
      validation.warnings.push({
        code: 'NO_UI_COMPONENTS',
        message: `View '${viewName}' has no UI components`,
        location: `view:${viewName}:uiComponents`
      });
    }

    return validation;
  }
}