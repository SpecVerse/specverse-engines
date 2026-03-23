/**
 * RelationshipField Generator
 * Generates RelationshipField component for handling model relationships
 */

export interface RelationshipFieldGeneratorContext {
  spec: any;
  manifest: any;
}

export async function generate(context: RelationshipFieldGeneratorContext): Promise<string> {
  return `/**
 * RelationshipField - Handles belongsTo, hasMany, hasOne relationships
 *
 * Renders appropriate UI based on relationship type:
 * - belongsTo: Dropdown select with target entities
 * - hasMany: Count display (in view mode)
 * - hasOne: Entity display (in view mode)
 */

import { useEntitiesQuery } from '../../hooks/useApi';
import type { RelationshipDefinition } from '../../types/api';

interface RelationshipFieldProps {
  /**
   * The attribute name (e.g., 'author')
   */
  name: string;

  /**
   * Relationship definition from schema
   */
  relationship: RelationshipDefinition;

  /**
   * Current value (entity ID for belongsTo, array for hasMany)
   */
  value: string | string[] | null;

  /**
   * Change handler
   */
  onChange: (value: string | string[] | null) => void;

  /**
   * Whether field is required
   */
  required?: boolean;

  /**
   * Whether in read-only mode
   */
  readOnly?: boolean;
}

/**
 * Get display name for an entity (prefers name, then title, then id)
 */
function getEntityDisplayName(entity: any): string {
  return entity.data?.name || entity.data?.title || entity.id;
}

export function RelationshipField({
  name,
  relationship,
  value,
  onChange,
  required = false,
  readOnly = false,
}: RelationshipFieldProps) {
  const relType = relationship.type;
  const targetModel = relationship.model || relationship.targetModel || null;
  const controllerName = targetModel ? \`\${targetModel}Controller\` : null;

  // Fetch target entities
  const { data: targetEntities = [], isLoading } = useEntitiesQuery(controllerName, targetModel);

  // Handle belongsTo relationships
  if (relType === 'belongsTo') {
    return (
      <div className="space-y-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-300">
          {name.charAt(0).toUpperCase() + name.slice(1)}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <select
          id={name}
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={readOnly || isLoading}
          required={required}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">-- Select {targetModel} --</option>
          {targetEntities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {getEntityDisplayName(entity)}
            </option>
          ))}
        </select>
        {isLoading && (
          <p className="text-sm text-gray-400">Loading {targetModel} options...</p>
        )}
      </div>
    );
  }

  // Handle hasMany relationships (read-only display)
  if (relType === 'hasMany') {
    const count = Array.isArray(value) ? value.length : 0;
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-300">
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </label>
        <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-gray-300">
          {count} {targetModel}(s)
        </div>
      </div>
    );
  }

  // Handle hasOne relationships (read-only display)
  if (relType === 'hasOne') {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-300">
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </label>
        <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-gray-300">
          {value ? \`\${targetModel} #\${value}\` : 'None'}
        </div>
      </div>
    );
  }

  // Fallback for unknown relationship types
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-300">
        {name.charAt(0).toUpperCase() + name.slice(1)}
      </label>
      <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-gray-400 italic">
        Unsupported relationship type: {relType}
      </div>
    </div>
  );
}
`;
}
