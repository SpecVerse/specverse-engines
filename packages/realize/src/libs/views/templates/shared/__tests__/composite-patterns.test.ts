/**
 * Tests for Composite View Patterns
 */

import { describe, it, expect } from 'vitest';
import {
  COMPOSITE_VIEW_PATTERNS,
  FORM_VIEW_PATTERN,
  LIST_VIEW_PATTERN,
  DETAIL_VIEW_PATTERN,
  DASHBOARD_VIEW_PATTERN,
  getPattern,
  getPatternsByCategory,
  getPatternsByTag,
  getPatternIds,
  hasPattern
} from '../composite-patterns.js';
import { validatePattern, validatePatternRegistry } from '../pattern-validator.js';

describe('Composite View Patterns', () => {
  describe('Pattern Registry', () => {
    it('should export all 4 core patterns', () => {
      expect(Object.keys(COMPOSITE_VIEW_PATTERNS)).toHaveLength(4);
      expect(COMPOSITE_VIEW_PATTERNS['form-view']).toBeDefined();
      expect(COMPOSITE_VIEW_PATTERNS['list-view']).toBeDefined();
      expect(COMPOSITE_VIEW_PATTERNS['detail-view']).toBeDefined();
      expect(COMPOSITE_VIEW_PATTERNS['dashboard-view']).toBeDefined();
    });

    it('should have correct pattern IDs', () => {
      const ids = getPatternIds();
      expect(ids).toContain('form-view');
      expect(ids).toContain('list-view');
      expect(ids).toContain('detail-view');
      expect(ids).toContain('dashboard-view');
    });
  });

  describe('FormView Pattern', () => {
    it('should have correct identity', () => {
      expect(FORM_VIEW_PATTERN.id).toBe('form-view');
      expect(FORM_VIEW_PATTERN.name).toBe('FormView');
      expect(FORM_VIEW_PATTERN.version).toBe('1.0.0');
      expect(FORM_VIEW_PATTERN.category).toBe('data-entry');
    });

    it('should require form, input, and button components', () => {
      expect(FORM_VIEW_PATTERN.requiredAtomicComponents).toContain('form');
      expect(FORM_VIEW_PATTERN.requiredAtomicComponents).toContain('input');
      expect(FORM_VIEW_PATTERN.requiredAtomicComponents).toContain('button');
    });

    it('should support create, update, and validate operations', () => {
      expect(FORM_VIEW_PATTERN.supportedOperations).toContain('create');
      expect(FORM_VIEW_PATTERN.supportedOperations).toContain('update');
      expect(FORM_VIEW_PATTERN.supportedOperations).toContain('validate');
    });

    it('should validate successfully', () => {
      const result = validatePattern(FORM_VIEW_PATTERN);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('ListView Pattern', () => {
    it('should have correct identity', () => {
      expect(LIST_VIEW_PATTERN.id).toBe('list-view');
      expect(LIST_VIEW_PATTERN.name).toBe('ListView');
      expect(LIST_VIEW_PATTERN.category).toBe('data-display');
    });

    it('should require table and list components', () => {
      expect(LIST_VIEW_PATTERN.requiredAtomicComponents).toContain('table');
      expect(LIST_VIEW_PATTERN.requiredAtomicComponents).toContain('list');
    });

    it('should support retrieve_many operation', () => {
      expect(LIST_VIEW_PATTERN.supportedOperations).toContain('retrieve_many');
    });

    it('should validate successfully', () => {
      const result = validatePattern(LIST_VIEW_PATTERN);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('DetailView Pattern', () => {
    it('should have correct identity', () => {
      expect(DETAIL_VIEW_PATTERN.id).toBe('detail-view');
      expect(DETAIL_VIEW_PATTERN.name).toBe('DetailView');
      expect(DETAIL_VIEW_PATTERN.category).toBe('data-display');
    });

    it('should require content and profile components', () => {
      expect(DETAIL_VIEW_PATTERN.requiredAtomicComponents).toContain('content');
      expect(DETAIL_VIEW_PATTERN.requiredAtomicComponents).toContain('profile');
    });

    it('should support retrieve, update, and delete operations', () => {
      expect(DETAIL_VIEW_PATTERN.supportedOperations).toContain('retrieve');
      expect(DETAIL_VIEW_PATTERN.supportedOperations).toContain('update');
      expect(DETAIL_VIEW_PATTERN.supportedOperations).toContain('delete');
    });

    it('should validate successfully', () => {
      const result = validatePattern(DETAIL_VIEW_PATTERN);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('DashboardView Pattern', () => {
    it('should have correct identity', () => {
      expect(DASHBOARD_VIEW_PATTERN.id).toBe('dashboard-view');
      expect(DASHBOARD_VIEW_PATTERN.name).toBe('DashboardView');
      expect(DASHBOARD_VIEW_PATTERN.category).toBe('dashboard');
    });

    it('should require grid and card components', () => {
      expect(DASHBOARD_VIEW_PATTERN.requiredAtomicComponents).toContain('grid');
      expect(DASHBOARD_VIEW_PATTERN.requiredAtomicComponents).toContain('card');
    });

    it('should support retrieve_many operation', () => {
      expect(DASHBOARD_VIEW_PATTERN.supportedOperations).toContain('retrieve_many');
    });

    it('should validate successfully', () => {
      const result = validatePattern(DASHBOARD_VIEW_PATTERN);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Pattern Query Functions', () => {
    it('should get pattern by ID', () => {
      const pattern = getPattern('form-view');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('FormView');
    });

    it('should return undefined for non-existent pattern', () => {
      const pattern = getPattern('non-existent');
      expect(pattern).toBeUndefined();
    });

    it('should check if pattern exists', () => {
      expect(hasPattern('form-view')).toBe(true);
      expect(hasPattern('non-existent')).toBe(false);
    });

    it('should get patterns by category', () => {
      const dataEntryPatterns = getPatternsByCategory('data-entry');
      expect(dataEntryPatterns).toHaveLength(1);
      expect(dataEntryPatterns[0].name).toBe('FormView');

      const dataDisplayPatterns = getPatternsByCategory('data-display');
      expect(dataDisplayPatterns).toHaveLength(2);
    });

    it('should get patterns by tag', () => {
      const formPatterns = getPatternsByTag('form');
      expect(formPatterns.length).toBeGreaterThan(0);
      expect(formPatterns[0].tags).toContain('form');

      const tablePatterns = getPatternsByTag('table');
      expect(tablePatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Validation', () => {
    it('should validate all patterns in registry', () => {
      const results = validatePatternRegistry(COMPOSITE_VIEW_PATTERNS);
      expect(Object.keys(results)).toHaveLength(4);

      // All patterns should be valid
      for (const [id, result] of Object.entries(results)) {
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should detect missing required fields', () => {
      const invalidPattern: any = {
        id: '',
        name: '',
        version: '1.0.0',
        category: 'data-entry',
        requiredAtomicComponents: [],
        layoutStrategy: { type: 'single-column', responsive: true },
        dataBindings: {
          source: 'controller',
          operations: []
        },
        supportedOperations: []
      };

      const result = validatePattern(invalidPattern);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid category', () => {
      const invalidPattern: any = {
        ...FORM_VIEW_PATTERN,
        category: 'invalid-category'
      };

      const result = validatePattern(invalidPattern);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'category')).toBe(true);
    });

    it('should detect invalid version format', () => {
      const invalidPattern: any = {
        ...FORM_VIEW_PATTERN,
        version: 'not-a-version'
      };

      const result = validatePattern(invalidPattern);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
    });
  });

  describe('Framework Independence', () => {
    it('should have no React dependencies', () => {
      // Patterns should be pure data structures
      expect(typeof FORM_VIEW_PATTERN).toBe('object');
      expect(FORM_VIEW_PATTERN.requiredAtomicComponents).toBeInstanceOf(Array);
      expect(FORM_VIEW_PATTERN.frameworkHints).toBeDefined();
    });

    it('should support multiple frameworks in hints', () => {
      expect(FORM_VIEW_PATTERN.frameworkHints?.react).toBeDefined();
      expect(FORM_VIEW_PATTERN.frameworkHints?.vue).toBeDefined();
      expect(FORM_VIEW_PATTERN.frameworkHints?.svelte).toBeDefined();
    });
  });
});
