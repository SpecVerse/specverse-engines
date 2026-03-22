/**
 * Convention Definition Processor
 *
 * Processes convention definitions from .specly files into structured AST.
 * This is the meta-circular processor: conventions defining how conventions work.
 *
 * Example input:
 * ```yaml
 * conventions:
 *   Email:
 *     baseType: String
 *     implies:
 *       format: "email"
 *       validation: "RFC 5322"
 *     when_modified_by:
 *       verified: { adds: [verification_token, verified_at] }
 *       unique: { adds: [unique_index] }
 * ```
 */

import { AbstractProcessor } from '@specverse/types';

export interface ConventionDefinitionSpec {
  name: string;
  baseType: string;
  description?: string;
  implies?: { [key: string]: any };
  when_modified_by?: { [modifier: string]: ModifierEffect };
  appliesTo?: string[];  // entity types this convention applies to
}

export interface ModifierEffect {
  adds?: string[];
  sets?: { [key: string]: any };
  validates?: string;
}

/**
 * Processes raw convention definition YAML into ConventionDefinitionSpec[].
 *
 * Convention definitions are meta-circular: the conventions entity type
 * defines how convention processing works for all entity types.
 */
export class ConventionDefinitionProcessor extends AbstractProcessor<any, ConventionDefinitionSpec[]> {
  process(conventionsData: any): ConventionDefinitionSpec[] {
    if (!conventionsData || typeof conventionsData !== 'object') {
      return [];
    }

    return Object.entries(conventionsData).map(([convName, convDef]: [string, any]) => {
      if (!convDef || typeof convDef !== 'object') {
        this.addWarning(`Convention '${convName}' has invalid definition, skipping`);
        return null;
      }

      if (!convDef.baseType) {
        this.addWarning(`Convention '${convName}' missing required 'baseType' property`);
      }

      const spec: ConventionDefinitionSpec = {
        name: convName,
        baseType: convDef.baseType,
      };
      if (convDef.description) spec.description = convDef.description;
      if (convDef.implies) spec.implies = convDef.implies;
      if (convDef.when_modified_by) spec.when_modified_by = convDef.when_modified_by;
      if (convDef.appliesTo) spec.appliesTo = convDef.appliesTo;
      return spec;
    }).filter((spec): spec is ConventionDefinitionSpec => spec !== null);
  }
}
