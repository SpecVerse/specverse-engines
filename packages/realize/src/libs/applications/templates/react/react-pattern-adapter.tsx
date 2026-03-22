/**
 * React Pattern Adapter
 *
 * Maps tech-independent composite view patterns from @specverse/lang
 * to React-specific implementations with hooks and Tailwind styling.
 *
 * This adapter implements the unified view architecture by:
 * 1. Using COMPOSITE_VIEW_PATTERNS as the single source of truth
 * 2. Mapping semantic CURVED operations to React hooks/API calls
 * 3. Rendering using ATOMIC_COMPONENTS_REGISTRY via Tailwind
 *
 * Stage 2: React Adapter Refactor
 */

import { useMemo } from 'react';
import {
  COMPOSITE_VIEW_PATTERNS,
  ATOMIC_COMPONENTS_REGISTRY,
  type CompositeViewPattern,
  type CURVEDOperation
} from '@specverse/lang/browser';
import { createUniversalTailwindAdapter } from './tailwind-adapter-generator';

/**
 * React-specific protocol mapping for CURVED operations
 *
 * Maps semantic operations to HTTP methods and endpoints.
 * This is what lives in instance factories for code generation,
 * but for runtime we need it here.
 */
export const REACT_PROTOCOL_MAPPING: Record<CURVEDOperation, {
  method: string;
  pathPattern: string;
}> = {
  create: {
    method: 'POST',
    pathPattern: '/api/{resource}'
  },
  update: {
    method: 'PUT',
    pathPattern: '/api/{resource}/{id}'
  },
  retrieve: {
    method: 'GET',
    pathPattern: '/api/{resource}/{id}'
  },
  retrieve_many: {
    method: 'GET',
    pathPattern: '/api/{resource}'
  },
  validate: {
    method: 'POST',
    pathPattern: '/api/{resource}/validate'
  },
  evolve: {
    method: 'POST',
    pathPattern: '/api/{resource}/{id}/evolve'
  },
  delete: {
    method: 'DELETE',
    pathPattern: '/api/{resource}/{id}'
  }
};

/**
 * React Pattern Adapter Configuration
 */
export interface ReactPatternAdapterConfig {
  // API base URL
  apiBaseUrl?: string;

  // Custom protocol mapping (overrides defaults)
  protocolMapping?: Partial<typeof REACT_PROTOCOL_MAPPING>;

  // Tailwind adapter instance
  tailwindAdapter?: ReturnType<typeof createUniversalTailwindAdapter>;
}

/**
 * Pattern rendering context with React-specific data
 */
export interface PatternRenderContext {
  // Pattern being rendered
  pattern: CompositeViewPattern;

  // View spec from API
  viewSpec: any;

  // Model data (entity instances)
  modelData: Record<string, any[]>;

  // Model schemas (structure definitions with attributes and relationships)
  modelSchemas?: Record<string, any>;

  // Primary model name
  primaryModel?: string;

  // Selected entity (for detail/dashboard views)
  selectedEntity?: any;

  // Entities for primary model
  primaryEntities?: any[];

  // Protocol mapping
  protocolMapping: typeof REACT_PROTOCOL_MAPPING;

  // Tailwind adapter
  tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>;
}

/**
 * React Pattern Adapter
 *
 * Provides React-specific rendering of tech-independent composite patterns.
 */
export class ReactPatternAdapter {
  private tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>;

  constructor(config: ReactPatternAdapterConfig = {}) {
    this.tailwindAdapter = config.tailwindAdapter || createUniversalTailwindAdapter();
    // Store for future use
    // this._config = config;
    // this._protocolMapping = { ...REACT_PROTOCOL_MAPPING, ...config.protocolMapping };
  }

  /**
   * Detect pattern type from view spec
   */
  detectPattern(viewSpec: any): CompositeViewPattern | null {
    const viewType = viewSpec.type?.toLowerCase();

    // Map view type to pattern ID
    const typeToPattern: Record<string, string> = {
      'form': 'form-view',
      'list': 'list-view',
      'detail': 'detail-view',
      'dashboard': 'dashboard-view'
    };

    const patternId = typeToPattern[viewType];
    if (!patternId) return null;

    return COMPOSITE_VIEW_PATTERNS[patternId];
  }

  /**
   * Render a pattern to HTML
   */
  renderPattern(context: PatternRenderContext): string {
    const { pattern } = context;

    // Render based on pattern category
    switch (pattern.category) {
      case 'data-entry':
        return this.renderFormView(context);
      case 'data-display':
        if (pattern.id === 'list-view') {
          return this.renderListView(context);
        } else if (pattern.id === 'detail-view') {
          return this.renderDetailView(context);
        }
        return this.renderGenericDataDisplay(context);
      case 'dashboard':
        return this.renderDashboardView(context);
      default:
        return this.renderFallback(context);
    }
  }

  /**
   * Render FormView pattern
   */
  private renderFormView(context: PatternRenderContext): string {
    const { viewSpec, modelData, modelSchemas, primaryModel } = context;
    let components = viewSpec.uiComponents || {};

    // FALLBACK: Generate default form component if none defined
    if (Object.keys(components).length === 0 && primaryModel) {
      components = {
        [`${primaryModel}Form`]: {
          type: 'form',
          properties: {
            model: primaryModel,
            sections: [
              {
                title: `${primaryModel} Details`,
                fields: this.inferFieldsFromSchema(modelSchemas, primaryModel)
              }
            ]
          }
        }
      };
    }

    let html = '<div class="space-y-4">';

    // Render form components
    for (const [componentName, componentDef] of Object.entries(components)) {
      const def = componentDef as any;
      const type = def.type?.toLowerCase();
      const properties = def.properties || def;

      if (type === 'form') {
        html += this.renderFormComponent(componentName, def, modelData, modelSchemas, primaryModel, this.tailwindAdapter);
      } else if (this.tailwindAdapter.components[type]) {
        html += this.renderAtomicComponent(componentName, type, properties, this.tailwindAdapter);
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Render ListView pattern
   */
  private renderListView(context: PatternRenderContext): string {
    const { viewSpec, modelData, primaryModel } = context;
    let components = viewSpec.uiComponents || {};

    // FALLBACK: Generate default table component if none defined
    if (Object.keys(components).length === 0 && primaryModel) {
      const columns = this.inferFieldsFromModel(modelData, primaryModel);
      components = {
        [`${primaryModel}Table`]: {
          type: 'table',
          properties: {
            model: primaryModel,
            columns: columns
          }
        }
      };
    }

    let html = '<div class="space-y-4">';

    // Render list components (filters, table/list, pagination)
    for (const [componentName, componentDef] of Object.entries(components)) {
      const def = componentDef as any;
      const type = def.type?.toLowerCase();
      const properties = def.properties || def;

      if (type === 'table') {
        html += this.renderTableComponent(componentName, def, modelData, primaryModel, this.tailwindAdapter);
      } else if (type === 'list') {
        html += this.renderListComponent(componentName, def, modelData, primaryModel, this.tailwindAdapter);
      } else if (this.tailwindAdapter.components[type]) {
        html += this.renderAtomicComponent(componentName, type, properties, this.tailwindAdapter);
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Render DetailView pattern
   */
  private renderDetailView(context: PatternRenderContext): string {
    const { viewSpec, selectedEntity, primaryModel, modelData, modelSchemas } = context;
    let components = viewSpec.uiComponents || {};

    if (!selectedEntity) {
      return '<div class="p-4 text-gray-500 dark:text-gray-400">No entity selected</div>';
    }

    // FALLBACK: Generate default components if none defined
    if (Object.keys(components).length === 0 && primaryModel) {
      // Get fields from schema or fall back to data inference
      const fields = this.inferFieldsFromSchema(modelSchemas, primaryModel);

      // Start with content component
      components = {
        [`${primaryModel}Content`]: {
          type: 'content',
          fields: fields,
          properties: {
            model: primaryModel
          }
        }
      };

      // Add list components for hasMany relationships (from schema)
      if (modelSchemas && modelSchemas[primaryModel]?.relationships) {
        const schemaRelationships = modelSchemas[primaryModel].relationships;

        for (const [relName, relDef] of Object.entries(schemaRelationships)) {
          const relDefObj = relDef as any;

          // Only include hasMany relationships (these show as lists in detail view)
          if (relDefObj.type === 'hasMany') {
            const targetModel = relDefObj.targetModel || relDefObj.model || relName.charAt(0).toUpperCase() + relName.slice(1);

            // Infer fields for the related model
            const relatedFields = this.inferFieldsFromSchema(modelSchemas, targetModel);

            components[`${relName}List`] = {
              type: 'list',
              fields: relatedFields.slice(0, 5), // Limit to first 5 fields for table
              properties: {
                model: targetModel,
                relationship: relName
              }
            };
          }
        }
      }
    }

    let html = '<div class="space-y-4">';

    // Render detail components
    for (const [componentName, componentDef] of Object.entries(components)) {
      const def = componentDef as any;
      const type = def.type?.toLowerCase();
      const properties = def.properties || def;

      if (type === 'content') {
        html += this.renderContentComponent(componentName, def, selectedEntity, this.tailwindAdapter);
      } else if (type === 'list') {
        html += this.renderDetailListComponent(componentName, def, modelData, selectedEntity, primaryModel, this.tailwindAdapter);
      } else if (type === 'card') {
        html += this.renderCardComponent(componentName, def, selectedEntity, this.tailwindAdapter);
      } else if (this.tailwindAdapter.components[type]) {
        html += this.renderAtomicComponent(componentName, type, properties, this.tailwindAdapter);
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Render DashboardView pattern
   */
  private renderDashboardView(context: PatternRenderContext): string {
    const { viewSpec, modelData } = context;
    const components = viewSpec.uiComponents || {};

    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">';

    // Render dashboard components (metrics, charts, etc.)
    for (const [componentName, componentDef] of Object.entries(components)) {
      const def = componentDef as any;
      const type = def.type?.toLowerCase();
      const properties = def.properties || def;

      if (type === 'card' && properties.variant === 'metric') {
        html += this.renderMetricCard(componentName, def, modelData, this.tailwindAdapter);
      } else if (this.tailwindAdapter.components[type]) {
        html += this.renderAtomicComponent(componentName, type, properties, this.tailwindAdapter);
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Render generic data display (fallback)
   */
  private renderGenericDataDisplay(_context: PatternRenderContext): string {
    return '<div class="p-4 text-gray-500 dark:text-gray-400">Generic data display</div>';
  }

  /**
   * Render fallback for unknown patterns
   */
  private renderFallback(context: PatternRenderContext): string {
    const { pattern } = context;
    return `<div class="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
      <p class="text-yellow-800 dark:text-yellow-200">Pattern not yet implemented: ${pattern.name}</p>
    </div>`;
  }

  /**
   * Helper: Render form component
   *
   * Generates a complete form with:
   * - Inferred field types from model data (text, number, boolean)
   * - Proper input types and validation
   * - Required field indicators
   * - Submit and reset buttons
   * - Professional styling matching admin-demo
   */
  private renderFormComponent(
    componentName: string,
    componentDef: any,
    modelData: Record<string, any[]>,
    modelSchemas: Record<string, any> | undefined,
    primaryModel: string | undefined,
    _tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>
  ): string {
    const properties = componentDef.properties || componentDef;
    const sections = properties.sections || [];
    const model = properties.model || primaryModel;

    // Infer field types from model schema or data
    const fieldTypes = this.inferFieldTypes(modelSchemas, modelData, model);

    let html = `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-200">${componentName}</h4>
        </div>
        <div class="p-6">
          <form class="space-y-6">
    `;

    // Render form sections
    for (const section of sections) {
      const fields = section.fields || [];
      html += `
        <div>
          ${section.title ? `<h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">${section.title}</h5>` : ''}
          <div class="space-y-4">
      `;

      // Show helpful message if no fields
      if (fields.length === 0) {
        html += `
          <div class="text-sm text-gray-500 dark:text-gray-400 italic p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
            No fields available for this form. Model data may be empty or all fields are system-generated.
          </div>
        `;
      }

      for (const field of fields) {
        const fieldName = typeof field === 'string' ? field : field.name || field.fieldName;
        const fieldLabel = typeof field === 'string'
          ? this.humanizeFieldName(fieldName)
          : field.label || this.humanizeFieldName(fieldName);
        const fieldType = fieldTypes[fieldName] || 'string';
        const isRequired = field.required !== false; // Default to required

        html += `<div>`;
        html += `
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            ${fieldLabel}
            ${isRequired ? '<span class="text-red-500 dark:text-red-400 ml-1">*</span>' : ''}
          </label>
        `;

        // Generate appropriate input based on field type
        if (fieldType === 'boolean') {
          html += `
            <div class="flex items-center">
              <input
                type="checkbox"
                name="${fieldName}"
                class="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-300">Yes/No</span>
            </div>
          `;
        } else if (fieldType === 'number') {
          html += `
            <input
              type="number"
              name="${fieldName}"
              placeholder="Enter ${fieldLabel.toLowerCase()}"
              ${isRequired ? 'required' : ''}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          `;
        } else {
          // Text input (default)
          html += `
            <input
              type="text"
              name="${fieldName}"
              placeholder="Enter ${fieldLabel.toLowerCase()}"
              ${isRequired ? 'required' : ''}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          `;
        }

        html += `</div>`;
      }

      html += `
          </div>
        </div>
      `;
    }

    // Add relationship fields (belongsTo) as select dropdowns
    const relationshipFields = this.inferRelationshipFields(modelSchemas, modelData, model);
    if (relationshipFields.length > 0) {
      html += `
        <div>
          <h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Relationships</h5>
          <div class="space-y-4">
      `;

      for (const relField of relationshipFields) {
        const relatedEntities = modelData[relField.targetModel] || [];

        html += `
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              ${this.humanizeFieldName(relField.name)}
            </label>
            <select
              name="${relField.foreignKey}"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select ${relField.targetModel} --</option>
              ${relatedEntities.map((entity: any) => {
                const displayName = entity.data?.name || entity.data?.title || entity.id;
                return `<option value="${entity.id}">${displayName}</option>`;
              }).join('')}
            </select>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    // Add form action buttons
    html += `
            <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="submit"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
              >
                Create ${model || 'Entity'}
              </button>
              <button
                type="reset"
                class="px-6 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 rounded font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Helper: Infer relationship fields from model schema or data
   *
   * Reads relationship definitions from the model schema (like original FormView).
   * Falls back to inferring from foreign keys in data if no schema available.
   *
   * Strategy:
   * 1. Read from schema.relationships (preferred - matches original FormView)
   * 2. If entities exist, scan their fields for foreign keys
   * 3. If no entities, look at available models and infer common relationships
   */
  private inferRelationshipFields(
    modelSchemas: Record<string, any> | undefined,
    modelData: Record<string, any[]>,
    modelName: string | undefined
  ): Array<{
    name: string;
    foreignKey: string;
    targetModel: string;
  }> {
    const relationships: Array<{
      name: string;
      foreignKey: string;
      targetModel: string;
    }> = [];

    if (!modelName) return relationships;

    // Strategy 1: Read from schema.relationships (like original FormView)
    if (modelSchemas && modelSchemas[modelName]?.relationships) {
      const schemaRelationships = modelSchemas[modelName].relationships;

      // Extract belongsTo relationships (these need form dropdowns)
      for (const [relName, relDef] of Object.entries(schemaRelationships)) {
        const relDefObj = relDef as any;

        // Only include belongsTo relationships in forms
        if (relDefObj.type === 'belongsTo') {
          relationships.push({
            name: relName,
            foreignKey: relDefObj.foreignKey || `${relName}Id`,
            targetModel: relDefObj.targetModel || relDefObj.model || relName.charAt(0).toUpperCase() + relName.slice(1)
          });
        }
      }

      return relationships;
    }

    // Strategy 2: If we have entities, scan for foreign keys
    const entities = modelData[modelName] || [];
    if (entities.length > 0 && entities[0]?.data) {
      const firstEntity = entities[0];

      // Look for foreign key fields (ending in "Id")
      for (const fieldName of Object.keys(firstEntity.data)) {
        if (fieldName.endsWith('Id') && fieldName !== 'id') {
          // Extract relationship name (e.g., "authorId" -> "author")
          const relName = fieldName.slice(0, -2);
          // Capitalize to get model name (e.g., "author" -> "Author")
          const targetModel = relName.charAt(0).toUpperCase() + relName.slice(1);

          // Check if this model exists in modelData
          if (modelData[targetModel]) {
            relationships.push({
              name: relName,
              foreignKey: fieldName,
              targetModel: targetModel
            });
          }
        }
      }
    }

    // Strategy 3: If no entities or no relationships found, infer from available models
    // This ensures forms are usable even when creating the first entity
    if (relationships.length === 0) {
      const availableModels = Object.keys(modelData);

      // Common relationship patterns based on model names
      for (const targetModel of availableModels) {
        if (targetModel !== modelName) {
          // Create lowercase version for foreign key
          const relName = targetModel.charAt(0).toLowerCase() + targetModel.slice(1);
          const foreignKey = `${relName}Id`;

          // Add as potential relationship
          relationships.push({
            name: relName,
            foreignKey: foreignKey,
            targetModel: targetModel
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Helper: Humanize field name
   * Converts camelCase/snake_case to readable labels
   */
  private humanizeFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Helper: Infer field types from model schema or data
   * Prefers schema definitions, falls back to examining actual data
   */
  private inferFieldTypes(modelSchemas: Record<string, any> | undefined, modelData: Record<string, any[]>, modelName: string | undefined): Record<string, string> {
    const types: Record<string, string> = {};

    if (!modelName) return types;

    // Strategy 1: Use schema if available
    if (modelSchemas && modelSchemas[modelName]?.attributes) {
      const attributes = modelSchemas[modelName].attributes;
      for (const [fieldName, attrDef] of Object.entries(attributes)) {
        const typeStr = typeof attrDef === 'string' ? attrDef : (attrDef as any)?.type || 'string';

        if (typeStr.toLowerCase().includes('bool')) {
          types[fieldName] = 'boolean';
        } else if (typeStr.toLowerCase().includes('int') || typeStr.toLowerCase().includes('number') || typeStr.toLowerCase().includes('float')) {
          types[fieldName] = 'number';
        } else {
          types[fieldName] = 'string';
        }
      }
      return types;
    }

    // Strategy 2: Examine actual data if no schema
    if (!modelData[modelName] || modelData[modelName].length === 0) return types;

    const firstEntity = modelData[modelName][0];
    if (!firstEntity || !firstEntity.data) return types;

    for (const [fieldName, value] of Object.entries(firstEntity.data)) {
      if (typeof value === 'boolean') {
        types[fieldName] = 'boolean';
      } else if (typeof value === 'number') {
        types[fieldName] = 'number';
      } else {
        types[fieldName] = 'string';
      }
    }

    return types;
  }

  /**
   * Helper: Infer field names from model schema
   * Reads schema.attributes to get field definitions
   */
  private inferFieldsFromSchema(modelSchemas: Record<string, any> | undefined, modelName: string | undefined): string[] {
    if (!modelName || !modelSchemas || !modelSchemas[modelName]) {
      // No schema - return common default fields
      return ['name', 'title', 'description'];
    }

    const schema = modelSchemas[modelName];
    if (!schema.attributes) {
      return ['name', 'title', 'description'];
    }

    // Get field names from schema attributes, filter out system fields
    const fields = Object.keys(schema.attributes).filter(field =>
      field !== 'id' &&
      field !== 'createdAt' &&
      field !== 'updatedAt' &&
      !this.isAutoGeneratedField(field, schema.attributes[field])
    );

    return fields.length > 0 ? fields : ['name', 'title', 'description'];
  }

  /**
   * Helper: Check if field is auto-generated (shouldn't show in forms)
   */
  private isAutoGeneratedField(fieldName: string, attrDef: any): boolean {
    // System fields
    if (['id', 'createdAt', 'updatedAt'].includes(fieldName)) return true;

    // Check attribute definition for auto flag
    if (typeof attrDef === 'object' && attrDef.auto) return true;

    return false;
  }

  /**
   * Helper: Render table component
   *
   * Generates a data table with:
   * - Column headers with proper formatting
   * - Data type-aware value rendering (objects, booleans, etc.)
   * - Empty state handling
   * - Hover effects and professional styling
   * - Responsive scrolling
   */
  private renderTableComponent(
    componentName: string,
    componentDef: any,
    modelData: Record<string, any[]>,
    primaryModel: string | undefined,
    _tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>
  ): string {
    const properties = componentDef.properties || componentDef;
    const tableModel = properties.model || primaryModel;
    const entities = modelData[tableModel || ''] || [];
    const columns = properties.columns || [];

    let html = `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-200">${componentName}</h4>
        </div>
        <div class="overflow-auto max-h-96">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                ${columns.map((col: string) => `
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    ${this.humanizeFieldName(col)}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    `;

    if (entities.length === 0) {
      html += `
        <tr>
          <td colspan="${columns.length}" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400 italic">
            No ${tableModel || 'data'} entities yet
          </td>
        </tr>
      `;
    } else {
      for (const entity of entities) {
        html += `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">`;

        for (const col of columns) {
          const value = entity.data?.[col];
          let displayValue: string;

          // Format value based on type
          if (value === undefined || value === null || value === '') {
            displayValue = '<span class="text-gray-400 dark:text-gray-500">—</span>';
          } else if (typeof value === 'boolean') {
            displayValue = `
              <span class="inline-block px-2 py-1 rounded text-xs font-medium ${
                value
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }">
                ${value ? 'Yes' : 'No'}
              </span>
            `;
          } else if (typeof value === 'object') {
            // Show [Object] for objects in tables
            displayValue = '<span class="text-gray-500 dark:text-gray-400 italic">[Object]</span>';
          } else {
            // Escape HTML for safe rendering
            displayValue = String(value)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
          }

          html += `<td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">${displayValue}</td>`;
        }

        html += `</tr>`;
      }
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Helper: Render list component
   *
   * Generates a list view with:
   * - Flexible field display (comma-separated or multi-line)
   * - Data type-aware rendering
   * - Empty state handling
   * - Professional card-based styling
   */
  private renderListComponent(
    componentName: string,
    componentDef: any,
    modelData: Record<string, any[]>,
    primaryModel: string | undefined,
    _tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>
  ): string {
    const properties = componentDef.properties || componentDef;
    const listModel = properties.model || primaryModel;
    const entities = modelData[listModel || ''] || [];
    const fields = properties.fields || [];

    let html = `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-200">${componentName}</h4>
        </div>
        <div class="p-4">
    `;

    if (entities.length === 0) {
      html += `
        <div class="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
          No ${listModel || 'items'} yet
        </div>
      `;
    } else {
      html += '<ul class="space-y-2">';

      for (const entity of entities) {
        html += `
          <li class="p-3 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div class="text-sm text-gray-900 dark:text-gray-100">
        `;

        // Render each field
        const fieldValues: string[] = [];
        for (const field of fields) {
          const value = entity.data?.[field];

          if (value === undefined || value === null || value === '') {
            continue; // Skip empty values
          }

          let displayValue: string;

          if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
          } else if (typeof value === 'object') {
            displayValue = '[Object]';
          } else {
            displayValue = String(value)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
          }

          fieldValues.push(`<strong>${this.humanizeFieldName(field)}:</strong> ${displayValue}`);
        }

        html += fieldValues.join(' • ');

        html += `
            </div>
          </li>
        `;
      }

      html += '</ul>';
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Helper: Render content component (for detail views)
   *
   * Displays specific fields from an entity with rich formatting.
   * This matches the original DetailView's "content" component behavior.
   */
  private renderContentComponent(
    componentName: string,
    componentDef: any,
    selectedEntity: any,
    _tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>
  ): string {
    let fields = componentDef.fields || [];
    const entityData = selectedEntity?.data || selectedEntity || {};

    // FALLBACK: If no fields, infer from entity data
    if (fields.length === 0 && entityData) {
      fields = Object.keys(entityData).filter(key =>
        key !== 'id' &&
        !key.endsWith('Id') &&
        !['createdAt', 'updatedAt'].includes(key)
      );
    }

    let html = `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-200 capitalize">${componentName}</h4>
        </div>
        <div class="p-4">
    `;

    // Show debug info if still no fields
    if (fields.length === 0) {
      html += `
        <p class="text-sm text-yellow-600 dark:text-yellow-400 italic">
          No fields available (entity keys: ${Object.keys(entityData).join(', ')})
        </p>
      `;
    } else {
      html += '<div class="space-y-3">';

      let displayedFields = 0;
      for (const fieldName of fields) {
        // Skip id fields
        if (fieldName === 'id') continue;

        const value = entityData[fieldName];

        // Format the value (show even if null/undefined/empty)
        let formattedValue: string;

        if (value === undefined || value === null) {
          formattedValue = '<span class="text-gray-400 dark:text-gray-500 italic">Not set</span>';
        } else if (typeof value === 'object') {
          // Objects: Show as formatted JSON
          const jsonStr = JSON.stringify(value, null, 2)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          formattedValue = `
            <pre class="bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-600 text-xs overflow-auto text-gray-900 dark:text-gray-100">${jsonStr}</pre>
          `;
        } else if (typeof value === 'boolean') {
          // Booleans: Show as Yes/No badge
          formattedValue = `
            <span class="inline-block px-2 py-1 rounded text-xs font-medium ${
              value
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }">
              ${value ? 'Yes' : 'No'}
            </span>
          `;
        } else if (value === '') {
          formattedValue = '<span class="text-gray-400 dark:text-gray-500 italic">Empty</span>';
        } else {
          // Other values: Escape HTML and show as text
          formattedValue = String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        }

        html += `
          <div class="grid grid-cols-[120px_1fr] gap-4 items-start">
            <label class="font-semibold text-sm text-gray-700 dark:text-gray-200 capitalize text-left">${fieldName}</label>
            <div class="text-sm text-gray-900 dark:text-gray-100">${formattedValue}</div>
          </div>
        `;
        displayedFields++;
      }

      if (displayedFields === 0) {
        html += '<p class="text-sm text-gray-500 dark:text-gray-400 italic">No fields to display</p>';
      }

      html += '</div>'; // Close space-y-3
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Helper: Render list component in detail view (for related entities)
   *
   * Shows related entities in a table format.
   * This matches the original DetailView's "list" component behavior.
   */
  private renderDetailListComponent(
    componentName: string,
    componentDef: any,
    modelData: Record<string, any[]>,
    selectedEntity: any,
    primaryModel: string | undefined,
    _tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>
  ): string {
    const properties = componentDef.properties || componentDef;
    let fields = componentDef.fields || properties.fields || [];
    let relatedModel = properties.model;

    // FALLBACK: Infer model from component name if not specified
    // E.g., "commentsList" -> "Comment", "postsList" -> "Post"
    if (!relatedModel) {
      const lowerName = componentName.toLowerCase();
      // Try to extract model name from component name
      for (const modelName of Object.keys(modelData)) {
        if (lowerName.includes(modelName.toLowerCase())) {
          relatedModel = modelName;
          break;
        }
      }
    }

    // Get all entities for the related model
    const allRelatedEntities = relatedModel ? modelData[relatedModel] || [] : [];

    // Filter by foreign key relationship
    // For example, if viewing Post (primaryModel), filter Comments by postId
    const foreignKey = primaryModel ? `${primaryModel.charAt(0).toLowerCase()}${primaryModel.slice(1)}Id` : null;
    const relatedEntities = foreignKey && selectedEntity?.id
      ? allRelatedEntities.filter((e: any) => e.data?.[foreignKey] === selectedEntity.id)
      : allRelatedEntities;

    // If no fields specified, infer from first entity
    if (fields.length === 0 && relatedEntities.length > 0) {
      const firstEntity = relatedEntities[0];
      if (firstEntity.data) {
        fields = Object.keys(firstEntity.data)
          .filter(key => key !== 'id' && !key.endsWith('Id'))
          .slice(0, 5); // Limit to first 5 fields
      }
    }

    let html = `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-200 capitalize">${componentName}</h4>
        </div>
        <div class="p-4">
    `;

    if (relatedEntities.length === 0) {
      html += `
        <p class="text-sm text-gray-500 dark:text-gray-400 italic">
          No ${relatedModel || 'related'} entities ${foreignKey ? `with ${foreignKey} = ${selectedEntity?.id}` : ''}
        </p>
      `;
    } else if (fields.length === 0) {
      html += `
        <p class="text-sm text-gray-500 dark:text-gray-400 italic">
          ${relatedEntities.length} ${relatedModel} entities found but no fields to display
        </p>
      `;
    } else {
      html += `
        <div class="overflow-auto max-h-96">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                ${fields.map((fieldName: string) => `
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    ${fieldName}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              ${relatedEntities.map((entity: any) => `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  ${fields.map((fieldName: string) => `
                    <td class="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      ${entity.data?.[fieldName] ?? '—'}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Helper: Render card component
   *
   * Displays entity fields with sophisticated formatting:
   * - Objects: Formatted JSON in code block
   * - Booleans: Yes/No badges
   * - Other values: Plain text
   */
  private renderCardComponent(
    componentName: string,
    _componentDef: any,
    selectedEntity: any,
    _tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>
  ): string {
    const entityData = selectedEntity.data || {};
    const fields = Object.keys(entityData);

    let html = `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-200">${componentName}</h4>
        </div>
        <div class="p-4">
          <div class="space-y-3">
            ${fields.map(field => {
              const value = entityData[field];

              // Skip undefined/null values
              if (value === undefined || value === null) return '';

              // Format value based on type
              let formattedValue: string;

              if (typeof value === 'object') {
                // Objects: Show as formatted JSON
                const jsonStr = JSON.stringify(value, null, 2)
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;');
                formattedValue = `
                  <pre class="bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-600 text-xs overflow-auto text-gray-900 dark:text-gray-100">${jsonStr}</pre>
                `;
              } else if (typeof value === 'boolean') {
                // Booleans: Show as Yes/No badge
                formattedValue = `
                  <span class="inline-block px-2 py-1 rounded text-xs font-medium ${
                    value
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }">
                    ${value ? 'Yes' : 'No'}
                  </span>
                `;
              } else {
                // Other values: Escape HTML and show as text
                const escaped = String(value)
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;');
                formattedValue = escaped || '—';
              }

              return `
                <div class="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label class="font-semibold text-sm text-gray-700 dark:text-gray-200 capitalize">${field}:</label>
                  <div class="text-sm text-gray-900 dark:text-gray-100">${formattedValue}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Helper: Render metric card
   */
  private renderMetricCard(
    componentName: string,
    componentDef: any,
    modelData: Record<string, any[]>,
    _tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>
  ): string {
    const properties = componentDef.properties || componentDef;
    const metric = properties.metric;
    const metricModel = properties.model;
    const entities = modelData[metricModel] || [];

    // Calculate metric value
    let metricValue = '0';
    if (entities.length > 0 && metric) {
      const values = entities
        .map((e: any) => e.data?.[metric])
        .filter((v: any) => v !== undefined && v !== null);

      if (values.length > 0 && typeof values[0] === 'number') {
        const sum = values.reduce((acc: number, v: number) => acc + v, 0);
        metricValue = String(Math.round(sum));
      } else {
        metricValue = String(values.length);
      }
    }

    return `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          ${metric || componentName}
        </p>
        <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
          ${metricValue}
        </p>
      </div>
    `;
  }

  /**
   * Helper: Render atomic component
   */
  private renderAtomicComponent(
    componentName: string,
    type: string,
    properties: Record<string, any>,
    _tailwindAdapter: ReturnType<typeof createUniversalTailwindAdapter>
  ): string {
    if (!this.tailwindAdapter.components[type]) {
      return `<div class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded">
        <p class="text-red-800 dark:text-red-200">Unknown component type: ${type}</p>
      </div>`;
    }

    return `
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-200">${componentName}</h4>
        </div>
        <div class="p-4">
          ${this.tailwindAdapter.components[type].render({ properties })}
        </div>
      </div>
    `;
  }

  /**
   * Helper: Infer field names from model data
   *
   * Extracts field names from the first entity in modelData for the given model.
   * Filters out system fields like id, createdAt, updatedAt, and foreign key fields.
   *
   * @param modelData - Map of model names to entity arrays
   * @param modelName - Name of the model to extract fields from
   * @returns Array of field names suitable for display
   */
  private inferFieldsFromModel(modelData: Record<string, any[]>, modelName: string | undefined): string[] {
    if (!modelName || !modelData[modelName]) {
      // No model data - return common default fields
      return ['name', 'title', 'description'];
    }

    const entities = modelData[modelName];
    if (entities.length === 0) {
      // No entities yet - return common default fields for this model
      return ['name', 'title', 'description'];
    }

    const firstEntity = entities[0];
    if (!firstEntity || !firstEntity.data) {
      return ['name', 'title', 'description'];
    }

    // Get field names from entity data, filter out system fields
    const fields = Object.keys(firstEntity.data).filter(field =>
      field !== 'id' &&
      !field.endsWith('Id') &&
      field !== 'createdAt' &&
      field !== 'updatedAt'
    );

    // If after filtering we have no fields, return common defaults
    return fields.length > 0 ? fields : ['name', 'title', 'description'];
  }
}

/**
 * Hook: Use pattern adapter
 */
export function usePatternAdapter(config: ReactPatternAdapterConfig = {}) {
  return useMemo(() => new ReactPatternAdapter(config), [config]);
}

/**
 * Export pattern registry for external use
 */
export { COMPOSITE_VIEW_PATTERNS, ATOMIC_COMPONENTS_REGISTRY };
