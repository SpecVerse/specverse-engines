import { AbstractProcessor } from './AbstractProcessor.js';
import { AttributeSpec, PrimitiveSpec } from '../types/ast.js';

/**
 * Attribute convention modifier definitions.
 * Each modifier defines how a convention keyword (e.g., "required", "unique")
 * or key=value pattern (e.g., "min=5", "default=hello") maps to AttributeSpec properties.
 *
 * This is data-driven — new modifiers can be added here without changing processing logic.
 */
interface BooleanModifier { kind: 'boolean'; field: keyof AttributeSpec; value: boolean }
interface StringModifier { kind: 'string'; field: keyof AttributeSpec }
interface NumberModifier { kind: 'number'; field: keyof AttributeSpec }
interface ArrayModifier { kind: 'array'; field: keyof AttributeSpec }
type ModifierDef = BooleanModifier | StringModifier | NumberModifier | ArrayModifier;

const ATTRIBUTE_MODIFIERS: Record<string, ModifierDef> = {
  // Boolean flags — keyword sets a boolean property to true
  'required':   { kind: 'boolean', field: 'required', value: true },
  'optional':   { kind: 'boolean', field: 'required', value: false },
  'unique':     { kind: 'boolean', field: 'unique', value: true },
  'verified':   { kind: 'boolean', field: 'verified', value: true },
  'searchable': { kind: 'boolean', field: 'searchable', value: true },
};

const ATTRIBUTE_KV_MODIFIERS: Record<string, ModifierDef> = {
  // key=value modifiers — keyword prefix extracts value after '='
  'auto':    { kind: 'string', field: 'auto' },
  'default': { kind: 'string', field: 'default' },
  'min':     { kind: 'number', field: 'min' },
  'max':     { kind: 'number', field: 'max' },
  'values':  { kind: 'array', field: 'values' },
};

export class AttributeProcessor extends AbstractProcessor<any, AttributeSpec> {
  /**
   * Process attribute definition
   * Supports: "Email required unique verified" or structured object
   */
  /**
   * Parse array type syntax and return normalized type and isArray flag
   * Supports: Array<Type>, Type[]
   */
  private parseArrayType(typeStr: string): { type: string; isArray: boolean } {
    // Check for Array<Type> syntax
    const arrayMatch = typeStr.match(/^Array<([A-Z][A-Za-z0-9_]*)>$/);
    if (arrayMatch) {
      return { type: arrayMatch[1], isArray: true };
    }

    // Check for Type[] syntax (legacy, still supported)
    if (typeStr.endsWith('[]')) {
      return { type: typeStr.slice(0, -2), isArray: true };
    }

    return { type: typeStr, isArray: false };
  }

  process(name: string, input: any): AttributeSpec {
    // If input is already an expanded object, return it as-is (with potential fixes)
    if (typeof input === 'object' && input !== null) {
      const { type, isArray } = this.parseArrayType(input.type || 'String');
      return {
        name: input.name || name,
        type,
        required: input.required || false,
        unique: input.unique || false,
        isArray: input.isArray || isArray || undefined,
        verified: input.verified,
        searchable: input.searchable,
        auto: input.auto,
        default: input.default,
        min: input.min,
        max: input.max,
        values: input.values
      };
    }

    // Parse string convention: "Email required unique verified"
    const parts = this.smartSplit(input.trim());
    const rawType = parts[0];
    const modifiers = parts.slice(1);

    // Parse array syntax
    const { type, isArray } = this.parseArrayType(rawType);

    const spec: AttributeSpec = {
      name,
      type,
      required: false,
      unique: false,
      isArray: isArray || undefined
    };
    
    for (const modifier of modifiers) {
      // Check boolean modifiers (exact keyword match)
      const boolMod = ATTRIBUTE_MODIFIERS[modifier];
      if (boolMod && boolMod.kind === 'boolean') {
        (spec as any)[boolMod.field] = boolMod.value;
        continue;
      }

      // Check key=value modifiers (prefix match before '=')
      const eqIndex = modifier.indexOf('=');
      if (eqIndex > 0) {
        const key = modifier.substring(0, eqIndex);
        const value = modifier.substring(eqIndex + 1);
        const kvMod = ATTRIBUTE_KV_MODIFIERS[key];

        if (kvMod) {
          switch (kvMod.kind) {
            case 'string':
              (spec as any)[kvMod.field] = value;
              break;
            case 'number':
              (spec as any)[kvMod.field] = parseInt(value);
              break;
            case 'array':
              // Parse values=["v1","v2","v3"] syntax
              if (value.startsWith('[') && value.endsWith(']')) {
                (spec as any)[kvMod.field] = value.slice(1, -1)
                  .split(',')
                  .map((v: string) => v.trim().replace(/"/g, ''));
              }
              break;
          }
        }
      }
    }
    
    return spec;
  }

  /**
   * Smart split that respects brackets and quotes
   */
  private smartSplit(text: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inBrackets = 0;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prevChar = i > 0 ? text[i - 1] : '';
      
      // Handle quotes
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        }
      }
      
      // Handle brackets (only when not in quotes)
      if (!inQuotes) {
        if (char === '[') inBrackets++;
        if (char === ']') inBrackets--;
      }
      
      // Split on whitespace only when not in brackets or quotes
      if (char.match(/\s/) && !inQuotes && inBrackets === 0) {
        if (current.trim()) {
          parts.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    // Add the last part
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    return parts;
  }
}
