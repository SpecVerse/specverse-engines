import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, statSync } from 'fs';

// Quint tests are conditional — skip if quint binary not available
const hasQuint = globalThis.__TEST_ENV__?.hasQuint ?? (() => {
  try { execSync('npx quint --version', { stdio: 'pipe', timeout: 10000 }); return true; }
  catch { return false; }
})();
const itQuint = hasQuint ? it : it.skip;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');
const entitiesDir = resolve(__dirname, '..');

// ============================================================================
// Discover all .qnt files
// ============================================================================

function findQntFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && entry !== 'node_modules') {
      results.push(...findQntFiles(fullPath));
    } else if (entry.endsWith('.qnt')) {
      results.push(fullPath);
    }
  }
  return results;
}

const qntFiles = findQntFiles(entitiesDir);

// ============================================================================
// Tests
// ============================================================================

describe('Quint Behavioural Specifications', () => {

  it('should discover .qnt files from all entity modules', () => {
    // Derived from directory structure, not hardcoded
    expect(qntFiles.length).toBeGreaterThanOrEqual(25);
  });

  describe('typecheck', () => {
    for (const qntFile of qntFiles) {
      const relativePath = qntFile.replace(entitiesDir + '/', '');

      itQuint(`should typecheck ${relativePath}`, () => {
        try {
          execSync(`npx quint typecheck "${qntFile}"`, {
            cwd: projectRoot,
            stdio: 'pipe',
            timeout: 30000,
          });
        } catch (error: any) {
          const stderr = error.stderr?.toString() || '';
          const stdout = error.stdout?.toString() || '';
          expect.fail(
            `Quint typecheck failed for ${relativePath}:\n${stderr}\n${stdout}`
          );
        }
      });
    }
  });

  describe('shared types', () => {
    it('should include the shared types module', () => {
      expect(qntFiles.some(f => f.includes('_shared/behaviour/types.qnt'))).toBe(true);
    });
  });

  describe('entity coverage', () => {
    const expectedEntities = [
      'core/models',
      'core/controllers',
      'core/services',
      'core/events',
      'core/views',
      'core/deployments',
      'extensions/commands',
      'extensions/measures',
      'extensions/conventions',
    ];

    for (const entity of expectedEntities) {
      it(`should have invariants.qnt for ${entity}`, () => {
        expect(
          qntFiles.some(f => f.includes(`${entity}/behaviour/invariants.qnt`))
        ).toBe(true);
      });

      it(`should have rules.qnt for ${entity}`, () => {
        expect(
          qntFiles.some(f => f.includes(`${entity}/behaviour/rules.qnt`))
        ).toBe(true);
      });
    }
  });

});
