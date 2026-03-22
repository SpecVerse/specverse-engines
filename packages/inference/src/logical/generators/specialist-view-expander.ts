/**
 * Specialist View Expander for v3.4.0 Phase 3
 *
 * Expands abstract specialist view types (dashboard, analytics, board, etc.)
 * into concrete UI component specifications using v3.4 atomic types.
 *
 * Updated for Phase 2: Uses domain-specific ExpansionTemplateRuleFile format directly
 */

import { ExpansionTemplateRuleFile, SpecialistViewTemplate, ComponentTemplate } from '../../core/rule-file-types.js';

export interface SpecialistViewDefinition {
  type: string;
  model?: string;
  metrics?: string[];
  charts?: string[];
  columns?: string[];
  groupBy?: string;
  filters?: any;
  [key: string]: any;
}

// Legacy interface for backward compatibility
export interface SpecialistViewRules {
  version: string;
  description: string;
  logical_inference: {
    specialist_views: Record<string, SpecialistViewTemplate>;
  };
}

export class SpecialistViewExpander {
  private templates: Record<string, SpecialistViewTemplate> | null = null;
  private version: string = '';

  /**
   * Load specialist view rules from domain-specific format
   */
  loadRulesFromDomainSpecific(ruleFile: ExpansionTemplateRuleFile): void {
    if (ruleFile.ruleFileType !== 'expansion-template') {
      throw new Error('Invalid rule file type - expected expansion-template');
    }
    if (ruleFile.category !== 'specialist-views') {
      throw new Error('Invalid category - expected specialist-views');
    }
    this.templates = ruleFile.templates;
    this.version = ruleFile.version;
  }

  /**
   * Load specialist view rules from legacy JSON format (backward compatibility)
   */
  loadRules(rules: SpecialistViewRules): void {
    this.templates = rules.logical_inference.specialist_views;
    this.version = rules.version;
  }

  /**
   * Check if a view type is a specialist view
   */
  isSpecialistView(viewType: string): boolean {
    if (!this.templates) return false;
    return viewType in this.templates;
  }

  /**
   * Check if rules are loaded
   */
  isLoaded(): boolean {
    return this.templates !== null;
  }

  /**
   * Get available specialist view types
   */
  getAvailableTypes(): string[] {
    if (!this.templates) return [];
    return Object.keys(this.templates);
  }

  /**
   * Expand a specialist view into concrete components
   */
  expandSpecialistView(viewDef: SpecialistViewDefinition): Record<string, any> {
    if (!this.templates) {
      throw new Error('Specialist view rules not loaded');
    }

    const pattern = this.templates[viewDef.type];
    if (!pattern) {
      throw new Error(`Unknown specialist view type: ${viewDef.type}`);
    }

    const components: Record<string, any> = {};

    // Process each component template
    for (const template of pattern.components) {
      if (template.for) {
        // This is a repeating component
        this.expandRepeatingComponent(template, viewDef, components);
      } else {
        // This is a single component
        this.expandSingleComponent(template, viewDef, components);
      }
    }

    return components;
  }

  /**
   * Expand a single component from template
   */
  private expandSingleComponent(
    template: ComponentTemplate,
    viewDef: SpecialistViewDefinition,
    components: Record<string, any>
  ): void {
    const name = this.substituteVariables(template.name, viewDef);
    components[name] = {
      type: template.type,
      properties: {
        ...template.properties,
        model: viewDef.model
      }
    };
  }

  /**
   * Expand a repeating component (e.g., for each metric, chart, column)
   */
  private expandRepeatingComponent(
    template: ComponentTemplate,
    viewDef: SpecialistViewDefinition,
    components: Record<string, any>
  ): void {
    const forClause = template.for!;

    if (forClause === 'each metric' && viewDef.metrics) {
      // Expand for each metric
      for (const metric of viewDef.metrics) {
        const name = template.name.replace('{{metricName}}', metric);
        components[name] = {
          type: template.type,
          properties: {
            ...template.properties,
            metric,
            model: viewDef.model
          }
        };
      }
    } else if (forClause === 'each chart' && viewDef.charts) {
      // Expand for each chart
      for (const chart of viewDef.charts) {
        const name = template.name.replace('{{chartName}}', chart);
        components[name] = {
          type: template.type,
          properties: {
            ...template.properties,
            chartType: chart,
            model: viewDef.model
          }
        };
      }
    } else if (forClause === 'each column' && viewDef.columns) {
      // Expand for each column
      for (const column of viewDef.columns) {
        const name = template.name.replace('{{columnName}}', column);
        components[name] = {
          type: template.type,
          properties: {
            ...template.properties,
            column,
            model: viewDef.model
          }
        };
      }
    } else if (forClause === 'visualizations') {
      // Default visualizations if not specified
      const defaultCharts = viewDef.charts || ['trend', 'distribution'];
      for (const chart of defaultCharts) {
        const name = template.name.replace('{{chartName}}', chart);
        components[name] = {
          type: template.type,
          properties: {
            ...template.properties,
            chartType: chart,
            model: viewDef.model
          }
        };
      }
    }
  }

  /**
   * Substitute variables in template strings
   */
  private substituteVariables(template: string, viewDef: SpecialistViewDefinition): string {
    let result = template;

    // Replace {{modelName}}
    if (viewDef.model) {
      result = result.replace(/\{\{modelName\}\}/g, viewDef.model.toLowerCase());
    }

    return result;
  }

  /**
   * Get description for a specialist view type
   */
  getDescription(viewType: string): string | null {
    if (!this.templates) return null;
    const pattern = this.templates[viewType];
    return pattern?.description || null;
  }

  /**
   * Get loaded rules version
   */
  getVersion(): string | null {
    return this.version || null;
  }
}
