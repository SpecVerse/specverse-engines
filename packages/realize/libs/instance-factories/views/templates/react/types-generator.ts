/**
 * React TypeScript Types Generator
 *
 * Generates TypeScript interfaces from model definitions
 */

import type { TemplateContext } from '@specverse/engine-realize';

/**
 * Generate TypeScript interface for a model
 */
export default function generateModelTypes(context: TemplateContext): string {
  const { model } = context;

  if (!model) {
    throw new Error('Model is required in template context');
  }

  const modelName = model.name;

  // Convert attributes to object if it's an array
  let attributes = model.attributes || {};
  if (Array.isArray(attributes)) {
    const obj: Record<string, any> = {};
    attributes.forEach((attr: any) => {
      if (attr && typeof attr === 'object' && attr.name) {
        obj[attr.name] = attr;
      } else if (Array.isArray(attr) && attr.length >= 2) {
        obj[attr[0]] = attr[1];
      }
    });
    attributes = obj;
  }

  // Generate interface properties
  const properties = Object.entries(attributes).map(([name, attr]: [string, any]) => {
    const tsType = mapToTypeScript(attr.type);
    const optional = !attr.constraints?.required ? '?' : '';
    return `  ${name}${optional}: ${tsType};`;
  }).join('\n');

  return `/**
 * ${modelName} Type Definition
 * Auto-generated from SpecVerse model
 */

export interface ${modelName} {
${properties}
}

export type Create${modelName}Input = Omit<${modelName}, 'id' | 'createdAt' | 'updatedAt'>;
export type Update${modelName}Input = Partial<Create${modelName}Input>;
`;
}

/**
 * Map SpecVerse types to TypeScript types
 */
function mapToTypeScript(type: string): string {
  const typeMap: Record<string, string> = {
    'String': 'string',
    'Integer': 'number',
    'Float': 'number',
    'Boolean': 'boolean',
    'Date': 'string',
    'DateTime': 'string',
    'Timestamp': 'string',
    'UUID': 'string',
    'Email': 'string',
    'URL': 'string',
    'JSON': 'Record<string, any>',
    'Array': 'any[]',
  };

  return typeMap[type] || 'any';
}
