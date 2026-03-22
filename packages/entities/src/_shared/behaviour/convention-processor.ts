/**
 * Behavioural Convention Processor
 *
 * Expands human-readable behavioural conventions into Quint specifications.
 * This is the behavioural half of the convention layer — just as structural
 * conventions expand "email: Email required unique" into .specly definitions,
 * behavioural conventions expand "models must not be orphaned" into Quint invariants.
 *
 * Both halves use the same convention engine pattern:
 *   pattern matching → placeholder extraction → template instantiation
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { resolve, dirname } from 'path';

// ─── Types ───────────────────────────────────────────────────────────

export interface BehaviouralConvention {
  name: string;
  pattern: string;
  expandsTo: string;
  description: string;
  template: {
    name: string;
    body: string;
  };
}

export interface BehaviouralGrammar {
  domain: string;
  entity: string;
  conventions: Record<string, BehaviouralConvention>;
}

export interface QuintOutput {
  type: 'invariant' | 'rule' | 'temporal';
  name: string;
  body: string;
  source: {
    convention: string;
    entity: string;
    input: string;
  };
}

// ─── Processor ───────────────────────────────────────────────────────

export class BehaviouralConventionProcessor {
  private grammars: BehaviouralGrammar[] = [];

  /**
   * Load a grammar.yaml file and register its conventions.
   */
  loadGrammar(grammarPath: string): void {
    const content = readFileSync(grammarPath, 'utf-8');
    const parsed = parseYaml(content) as any;

    const grammar: BehaviouralGrammar = {
      domain: parsed.domain || 'quint',
      entity: parsed.entity || '',
      conventions: {},
    };

    if (parsed.conventions) {
      for (const [name, def] of Object.entries(parsed.conventions) as [string, any][]) {
        grammar.conventions[name] = {
          name,
          pattern: def.pattern,
          expandsTo: def.expands_to,
          description: def.description || '',
          template: {
            name: def.template.name,
            body: def.template.body,
          },
        };
      }
    }

    this.grammars.push(grammar);
  }

  /**
   * Load all grammar.yaml files from entity module behaviour/conventions/ directories.
   */
  loadGrammarsFromEntities(entitiesDir: string): void {
    const { readdirSync, statSync, existsSync } = require('fs');

    const scanDir = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir)) {
        const fullPath = resolve(dir, entry);
        if (statSync(fullPath).isDirectory()) {
          const grammarPath = resolve(fullPath, 'behaviour', 'conventions', 'grammar.yaml');
          if (existsSync(grammarPath)) {
            this.loadGrammar(grammarPath);
          }
        }
      }
    };

    scanDir(resolve(entitiesDir, 'core'));
    scanDir(resolve(entitiesDir, 'extensions'));
  }

  /**
   * Get all registered conventions.
   */
  getConventions(): BehaviouralConvention[] {
    return this.grammars.flatMap(g => Object.values(g.conventions));
  }

  /**
   * Get all registered grammars.
   */
  getGrammars(): BehaviouralGrammar[] {
    return [...this.grammars];
  }

  /**
   * Find the convention that matches a human-readable input string.
   * Returns null if no convention matches.
   */
  findMatch(input: string): { grammar: BehaviouralGrammar; convention: BehaviouralConvention; placeholders: Record<string, string> } | null {
    for (const grammar of this.grammars) {
      for (const convention of Object.values(grammar.conventions)) {
        const placeholders = this.matchPattern(convention.pattern, input);
        if (placeholders !== null) {
          return { grammar, convention, placeholders };
        }
      }
    }
    return null;
  }

  /**
   * Expand a human-readable convention string into a Quint output.
   *
   * Example:
   *   expand("models must not be orphaned")
   *   → { type: "invariant", name: "noOrphanModels", body: "models.forall(...)" }
   */
  expand(input: string): QuintOutput | null {
    const match = this.findMatch(input);
    if (!match) return null;

    const { grammar, convention, placeholders } = match;

    // Determine output type from expandsTo
    const outputType = convention.expandsTo.replace('quint:', '') as QuintOutput['type'];

    // Instantiate template with placeholders
    const name = this.instantiate(convention.template.name, placeholders);
    const body = this.instantiate(convention.template.body, placeholders);

    return {
      type: outputType,
      name,
      body,
      source: {
        convention: convention.name,
        entity: grammar.entity,
        input,
      },
    };
  }

  /**
   * Expand multiple convention strings and generate a complete Quint module.
   */
  expandToModule(moduleName: string, inputs: string[]): string {
    const outputs = inputs.map(input => this.expand(input)).filter((o): o is QuintOutput => o !== null);

    if (outputs.length === 0) return '';

    const lines: string[] = [
      `// Auto-generated from behavioural conventions`,
      `// Do not edit — regenerate with: behavioural-convention-processor`,
      ``,
      `module ${moduleName} {`,
      ``,
      `  import specverseTypes.* from "../../../_shared/behaviour/types"`,
      ``,
    ];

    for (const output of outputs) {
      lines.push(`  /// Convention: "${output.source.input}"`);
      lines.push(`  /// Source: ${output.source.entity}/${output.source.convention}`);
      if (output.type === 'invariant') {
        lines.push(`  val ${output.name}: bool =`);
        lines.push(`    ${output.body}`);
      } else if (output.type === 'temporal') {
        lines.push(`  temporal ${output.name}: bool =`);
        lines.push(`    ${output.body}`);
      }
      lines.push(``);
    }

    lines.push(`}`);
    return lines.join('\n');
  }

  // ─── Private Helpers ─────────────────────────────────────────────

  /**
   * Match a pattern against an input string, extracting placeholders.
   *
   * Pattern: "{entities} must not be orphaned"
   * Input:   "models must not be orphaned"
   * Result:  { entities: "models", Entities: "Models", entity: "model", Entity: "Model" }
   */
  private matchPattern(pattern: string, input: string): Record<string, string> | null {
    // Extract placeholder names from pattern
    const placeholderNames: string[] = [];
    const regexParts: string[] = [];
    let lastIndex = 0;

    const placeholderRegex = /\{(\w+)\}/g;
    let match;

    while ((match = placeholderRegex.exec(pattern)) !== null) {
      // Escape the literal part before this placeholder
      const literal = pattern.slice(lastIndex, match.index);
      regexParts.push(this.escapeRegex(literal));
      placeholderNames.push(match[1]);
      regexParts.push('([\\w]+)');
      lastIndex = match.index + match[0].length;
    }

    // Add any trailing literal
    regexParts.push(this.escapeRegex(pattern.slice(lastIndex)));

    const fullRegex = new RegExp('^' + regexParts.join('') + '$', 'i');
    const inputMatch = fullRegex.exec(input);

    if (!inputMatch) return null;

    const placeholders: Record<string, string> = {};

    for (let i = 0; i < placeholderNames.length; i++) {
      const name = placeholderNames[i];
      const value = inputMatch[i + 1];
      placeholders[name] = value;

      // Auto-generate case variants
      placeholders[this.capitalize(name)] = this.capitalize(value);

      // Auto-generate singular/plural variants
      if (name.endsWith('ies')) {
        // entities → entity
        const singular = name.slice(0, -3) + 'y';
        placeholders[singular] = value.endsWith('ies') ? value.slice(0, -3) + 'y' : value;
        placeholders[this.capitalize(singular)] = this.capitalize(placeholders[singular]);
      } else if (name.endsWith('s') && !name.endsWith('ss')) {
        // models → model
        const singular = name.slice(0, -1);
        placeholders[singular] = value.endsWith('s') ? value.slice(0, -1) : value;
        placeholders[this.capitalize(singular)] = this.capitalize(placeholders[singular]);
      }
    }

    return placeholders;
  }

  /**
   * Replace {placeholder} tokens in a template string.
   */
  private instantiate(template: string, placeholders: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, name) => {
      return placeholders[name] ?? `{${name}}`;
    });
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
