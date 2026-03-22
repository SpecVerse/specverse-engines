import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { modelsModule } from '../core/models/index.js';
import { modelGenerators } from '../core/models/generators/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../');

describe('Models Entity Generators', () => {

  describe('generator metadata', () => {
    it('should declare 4 generators', () => {
      expect(modelGenerators).toHaveLength(4);
    });

    it('should all have names', () => {
      for (const gen of modelGenerators) {
        expect(gen.name).toBeTruthy();
      }
    });

    it('should all have capabilities', () => {
      for (const gen of modelGenerators) {
        expect(gen.capability).toBeTruthy();
      }
    });

    it('should all have factory paths', () => {
      for (const gen of modelGenerators) {
        expect(gen.factoryPath).toBeTruthy();
      }
    });

    it('should have unique names', () => {
      const names = modelGenerators.map(g => g.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('should include prisma-schema generator', () => {
      const prisma = modelGenerators.find(g => g.name === 'prisma-schema');
      expect(prisma).toBeDefined();
      expect(prisma!.capability).toBe('storage.database');
    });

    it('should include storage generators', () => {
      const storage = modelGenerators.filter(g =>
        g.capability?.startsWith('storage.')
      );
      expect(storage.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('factory file existence', () => {
    for (const gen of modelGenerators) {
      it(`should have factory file for ${gen.name}`, () => {
        const fullPath = resolve(projectRoot, gen.factoryPath!);
        expect(
          existsSync(fullPath),
          `Factory file not found: ${gen.factoryPath}`
        ).toBe(true);
      });
    }
  });

  describe('module integration', () => {
    it('should be included in the models module', () => {
      expect(modelsModule.generators).toBeDefined();
      expect(modelsModule.generators).toBe(modelGenerators);
    });
  });
});
