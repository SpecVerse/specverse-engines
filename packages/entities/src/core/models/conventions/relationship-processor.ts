import { AbstractProcessor } from '@specverse/types';
import { RelationshipSpec } from '@specverse/types';

export class RelationshipProcessor extends AbstractProcessor<any, RelationshipSpec> {
  /**
   * Process relationship definition
   * Supports: "hasMany Post cascade eager" or structured object
   */
  process(name: string, input: any): RelationshipSpec {
    // If input is already an expanded object, return it as-is
    if (typeof input === 'object' && input !== null) {
      return {
        name: input.name || name,
        type: input.type,
        target: input.target,
        cascade: input.cascade,
        dependent: input.dependent,
        eager: input.eager,
        lazy: input.lazy,
        through: input.through,
        optional: input.optional
      };
    }

    // Parse string convention: "hasMany Post cascade eager"
    const parts = input.trim().split(/\s+/);
    const relationType = parts[0] as 'hasMany' | 'hasOne' | 'belongsTo' | 'manyToMany';
    const target = parts[1];
    const modifiers = parts.slice(2);
    
    const spec: RelationshipSpec = {
      name,
      type: relationType,
      target
    };
    
    for (const modifier of modifiers) {
      if (modifier === 'cascade') {
        spec.cascade = true;
      } else if (modifier === 'dependent') {
        spec.dependent = true;
      } else if (modifier === 'eager') {
        spec.eager = true;
      } else if (modifier === 'lazy') {
        spec.lazy = true;
      } else if (modifier === 'optional') {
        spec.optional = true;
      } else if (modifier.startsWith('through=')) {
        spec.through = modifier.split('=')[1];
      }
    }
    
    return spec;
  }
}
