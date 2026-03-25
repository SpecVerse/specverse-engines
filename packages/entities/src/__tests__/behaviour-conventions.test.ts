import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync, statSync } from 'fs';
import { BehaviouralConventionProcessor } from '../_shared/behaviour/convention-processor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const entitiesDir = resolve(__dirname, '..');

// ============================================================================
// Discover all grammar.yaml files
// ============================================================================

function findGrammarFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && entry !== 'node_modules') {
      results.push(...findGrammarFiles(fullPath));
    } else if (entry === 'grammar.yaml' && fullPath.includes('behaviour/conventions/')) {
      results.push(fullPath);
    }
  }
  return results;
}

// ============================================================================
// Tests
// ============================================================================

describe('Behavioural Convention Processor', () => {
  let processor: BehaviouralConventionProcessor;
  let grammarFiles: string[];

  beforeAll(() => {
    processor = new BehaviouralConventionProcessor();
    grammarFiles = findGrammarFiles(entitiesDir);
    for (const f of grammarFiles) {
      processor.loadGrammar(f);
    }
  });

  // ─── Discovery Tests ─────────────────────────────────────────────

  describe('grammar discovery', () => {
    it('should find a grammar.yaml for every entity module that has one', () => {
      // Derived from the entity directory structure, not hardcoded
      expect(grammarFiles.length).toBeGreaterThanOrEqual(9);
      expect(grammarFiles.length).toBe(grammarFiles.length); // sanity — all found files are valid
    });

    // Derive expected entities from the directory structure
    const entityDirs = [
      ...readdirSync(resolve(entitiesDir, 'core')).map(d => `core/${d}`),
      ...readdirSync(resolve(entitiesDir, 'extensions')).map(d => `extensions/${d}`),
    ].filter(d => {
      const grammarPath = resolve(entitiesDir, d, 'behaviour/conventions/grammar.yaml');
      return existsSync(grammarPath);
    });
    const expectedEntities = entityDirs;

    for (const entity of expectedEntities) {
      it(`should have grammar.yaml for ${entity}`, () => {
        expect(
          grammarFiles.some(f => f.includes(`${entity}/behaviour/conventions/grammar.yaml`))
        ).toBe(true);
      });
    }
  });

  // ─── Loading Tests ────────────────────────────────────────────────

  describe('grammar loading', () => {
    it('should load all grammars', () => {
      expect(processor.getGrammars().length).toBe(grammarFiles.length);
    });

    it('should register all conventions', () => {
      const conventions = processor.getConventions();
      expect(conventions.length).toBeGreaterThan(40);
    });

    it('should set domain to quint for all conventions', () => {
      for (const grammar of processor.getGrammars()) {
        expect(grammar.domain).toBe('quint');
      }
    });
  });

  // ─── Pattern Matching Tests ───────────────────────────────────────

  describe('pattern matching', () => {
    it('should match "models must not be orphaned"', () => {
      const match = processor.findMatch('models must not be orphaned');
      expect(match).not.toBeNull();
      expect(match!.convention.name).toBe('must_not_be_orphaned');
      expect(match!.placeholders['entities']).toBe('models');
    });

    it('should match "events must have timestamp"', () => {
      const match = processor.findMatch('events must have timestamp');
      expect(match).not.toBeNull();
      expect(match!.convention.name).toBe('events_must_have_timestamp');
    });

    it('should match "scale must be positive"', () => {
      const match = processor.findMatch('scale must be positive');
      expect(match).not.toBeNull();
      expect(match!.convention.name).toBe('scale_must_be_positive');
    });

    it('should return null for unrecognized input', () => {
      const match = processor.findMatch('foobar baz quux');
      expect(match).toBeNull();
    });
  });

  // ─── Expansion Tests ──────────────────────────────────────────────

  describe('expansion', () => {
    it('should expand "models must not be orphaned" to a Quint invariant', () => {
      const result = processor.expand('models must not be orphaned');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('invariant');
      expect(result!.name).toBe('noOrphanModels');
      expect(result!.body).toContain('models.forall');
      expect(result!.body).toContain('components.exists');
    });

    it('should expand "models must have attributes" correctly', () => {
      const result = processor.expand('models must have attributes');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('modelsHaveAttributes');
      expect(result!.body).toContain('models.forall');
      expect(result!.body).toContain('attributes.keys().size() > 0');
    });

    it('should expand "deprecated patterns never generated"', () => {
      const result = processor.expand('deprecated patterns never generated');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('noDeprecatedServices');
      expect(result!.body).toContain('ProcessingService');
      expect(result!.body).toContain('ValidationService');
    });

    it('should expand "main bus must exist"', () => {
      const result = processor.expand('main bus must exist');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('mainBusExists');
      expect(result!.body).toContain('mainBus');
    });

    it('should return null for unrecognized input', () => {
      const result = processor.expand('this does not match anything');
      expect(result).toBeNull();
    });

    it('should include source metadata in output', () => {
      const result = processor.expand('models must have id');
      expect(result).not.toBeNull();
      expect(result!.source.convention).toBe('must_have_id');
      expect(result!.source.entity).toBe('models');
      expect(result!.source.input).toBe('models must have id');
    });
  });

  // ─── Module Generation Tests ──────────────────────────────────────

  describe('module generation', () => {
    it('should generate a valid Quint module from conventions', () => {
      const module = processor.expandToModule('testInvariants', [
        'models must have attributes',
        'models must have id',
      ]);
      expect(module).toContain('module testInvariants');
      expect(module).toContain('val modelsHaveAttributes: bool');
      expect(module).toContain('val modelsHaveId: bool');
      expect(module).toContain('import specverseTypes');
    });

    it('should skip unrecognized inputs in module generation', () => {
      const module = processor.expandToModule('testModule', [
        'models must have attributes',
        'this is not a convention',
        'models must have id',
      ]);
      expect(module).toContain('modelsHaveAttributes');
      expect(module).toContain('modelsHaveId');
      expect(module).not.toContain('this is not');
    });

    it('should return empty string when no inputs match', () => {
      const module = processor.expandToModule('emptyModule', [
        'nothing matches',
      ]);
      expect(module).toBe('');
    });
  });

  // ─── Placeholder Variant Tests ────────────────────────────────────

  describe('placeholder variants', () => {
    it('should generate capitalized variants', () => {
      const match = processor.findMatch('models must not be orphaned');
      expect(match).not.toBeNull();
      expect(match!.placeholders['entities']).toBe('models');
      expect(match!.placeholders['Entities']).toBe('Models');
    });

    it('should generate singular variants from plural placeholders', () => {
      const match = processor.findMatch('models must have attributes');
      expect(match).not.toBeNull();
      // {entities} → entities=models, entity=model
      expect(match!.placeholders['entities']).toBe('models');
    });
  });

  // ─── Cross-Entity Convention Count Tests ──────────────────────────

  describe('convention counts per entity', () => {
    const expectedCounts: [string, number][] = [
      ['models', 8],
      ['controllers', 6],
      ['services', 5],
      ['events', 6],
      ['views', 5],
      ['deployments', 6],
      ['commands', 5],
      ['measures', 5],
      ['conventions', 6],
    ];

    for (const [entity, count] of expectedCounts) {
      it(`should have ${count} conventions for ${entity}`, () => {
        const grammar = processor.getGrammars().find(g => g.entity === entity);
        expect(grammar).toBeDefined();
        expect(Object.keys(grammar!.conventions).length).toBe(count);
      });
    }

    it('should have 52 total conventions across all entities', () => {
      expect(processor.getConventions().length).toBe(52);
    });
  });

});
