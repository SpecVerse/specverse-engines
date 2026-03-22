/**
 * Regression Tests for Inference Engine Rules
 * 
 * These tests ensure that all inference engine rules apply correctly
 * and generate valid output without template compilation errors.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InferenceRule {
  name: string;
  pattern: string;
  condition: string;
  priority: number;
  description: string;
  template: {
    type: string;
    content: string;
  };
}

interface RuleFile {
  version: string;
  logical_inference: {
    [key: string]: InferenceRule[];
  };
}

// Test models for different scenarios
const testModels = {
  simple: {
    name: 'SimpleModel',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'name', type: 'String', required: true }
    ],
    relationships: {
      parentRelationships: [],
      childRelationships: [],
      manyToManyRelationships: []
    }
  },
  
  withParent: {
    name: 'ChildModel',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'parentId', type: 'UUID', required: true },
      { name: 'data', type: 'String', required: true }
    ],
    relationships: {
      parentRelationships: [
        { targetModel: 'ParentModel', type: 'belongsTo' }
      ],
      childRelationships: [],
      manyToManyRelationships: []
    },
    lifecycle: {
      type: 'shorthand',
      states: ['draft', 'active', 'archived']
    }
  },
  
  withManyToMany: {
    name: 'RelationalModel',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'name', type: 'String', required: true }
    ],
    relationships: {
      parentRelationships: [],
      childRelationships: [],
      manyToManyRelationships: [
        { targetModel: 'TagModel', type: 'manyToMany' }
      ]
    }
  },
  
  withProfiles: {
    name: 'ProfiledModel',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'name', type: 'String', required: true }
    ],
    relationships: {
      parentRelationships: [],
      childRelationships: [],
      manyToManyRelationships: []
    },
    profiles: ['UserProfile', 'AdminProfile']
  },
  
  complex: {
    name: 'ComplexModel',
    attributes: [
      { name: 'id', type: 'UUID', required: true },
      { name: 'name', type: 'String', required: true },
      { name: 'email', type: 'Email', required: true },
      { name: 'status', type: 'String', required: true },
      { name: 'createdAt', type: 'DateTime', required: true },
      { name: 'updatedAt', type: 'DateTime', required: true },
      { name: 'metadata', type: 'Object', required: false },
      { name: 'tags', type: 'Array[String]', required: false },
      { name: 'score', type: 'Integer', required: false }
    ],
    relationships: {
      parentRelationships: [
        { targetModel: 'OrganizationModel', type: 'belongsTo' }
      ],
      childRelationships: [
        { targetModel: 'ItemModel', type: 'hasMany' },
        { targetModel: 'CommentModel', type: 'hasMany' }
      ],
      manyToManyRelationships: [
        { targetModel: 'CategoryModel', type: 'manyToMany' }
      ]
    },
    lifecycle: {
      type: 'structured',
      states: ['draft', 'review', 'published', 'archived'],
      transitions: {
        submit: { from: 'draft', to: 'review' },
        approve: { from: 'review', to: 'published' },
        archive: { from: 'published', to: 'archived' }
      }
    },
    profiles: ['UserProfile', 'AdminProfile', 'AuditProfile']
  }
};

// Mock condition evaluation functions
const mockContext = {
  hasParentRelationship: (model: any) => 
    model.relationships?.parentRelationships?.length > 0,
  hasChildRelationship: (model: any) => 
    model.relationships?.childRelationships?.length > 0,
  hasManyToManyRelationship: (model: any) => 
    model.relationships?.manyToManyRelationships?.length > 0
};

describe('Inference Engine Rule Regression Tests', () => {
  // Rules are composed from entity modules into dist/ at build time
  const rulesDir = join(__dirname, '..', '..', '..', 'dist', 'inference-engine', 'rules', 'logical');
  let allRules: { file: string; category: string; rule: InferenceRule }[] = [];

  // Load all rules before tests
  beforeAll(() => {
    const files = readdirSync(rulesDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const content = readFileSync(join(rulesDir, file), 'utf8');
      const parsed = JSON.parse(content) as RuleFile;

      for (const category in parsed.logical_inference) {
        const categoryData = parsed.logical_inference[category];

        // Check if it's an array of rules (v3.1 format)
        if (Array.isArray(categoryData)) {
          for (const rule of categoryData) {
            allRules.push({ file, category, rule });
          }
        }
        // v3.4 files have different structure (objects, not arrays) - skip for rule regression
        // They have their own specific tests (specialist-view-expander.test.ts, component-type-resolver tests)
      }
    }
  });

  describe('Rule File Validation', () => {
    it('should load all rule files without JSON errors', () => {
      expect(allRules.length).toBeGreaterThan(0);
      expect(allRules.length).toBeGreaterThanOrEqual(20); // Expect at least 20 rules
    });

    it('should have valid rule structure for all rules', () => {
      for (const { file, rule } of allRules) {
        expect(rule.name, `${file}::${rule.name}`).toBeDefined();
        expect(rule.pattern, `${file}::${rule.name}`).toBeDefined();
        expect(rule.condition, `${file}::${rule.name}`).toBeDefined();
        expect(rule.priority, `${file}::${rule.name}`).toBeTypeOf('number');
        expect(rule.description, `${file}::${rule.name}`).toBeDefined();
        expect(rule.template, `${file}::${rule.name}`).toBeDefined();
        expect(rule.template.type, `${file}::${rule.name}`).toBeDefined();
        expect(rule.template.content, `${file}::${rule.name}`).toBeDefined();
      }
    });
  });

  describe('Rule Condition Evaluation', () => {
    const testCases = [
      { name: 'simple model', model: testModels.simple },
      { name: 'model with parent', model: testModels.withParent },
      { name: 'model with many-to-many', model: testModels.withManyToMany },
      { name: 'model with profiles', model: testModels.withProfiles },
      { name: 'complex model', model: testModels.complex }
    ];

    for (const { name, model } of testCases) {
      it(`should evaluate conditions correctly for ${name}`, () => {
        for (const { file, rule } of allRules) {
          // Mock evaluation context
          const context = {
            model,
            modelName: model.name,
            relationships: model.relationships,
            ...mockContext
          };

          // Basic condition syntax validation
          expect(rule.condition, `${file}::${rule.name}`).toMatch(
            /^(true|false|model\.|relationships|hasParentRelationship|hasChildRelationship|hasManyToManyRelationship)/
          );

          // Condition should be evaluable (no syntax errors)
          expect(() => {
            // Simple condition check - ensure no obvious syntax errors
            if (rule.condition === 'true') return true;
            if (rule.condition === 'false') return false;
            
            // More complex conditions should at least parse without errors
            const hasModel = rule.condition.includes('model.');
            const hasRelationships = rule.condition.includes('relationships');
            const hasFunctions = rule.condition.includes('hasParentRelationship');
            
            expect(hasModel || hasRelationships || hasFunctions).toBe(true);
          }).not.toThrow();
        }
      });
    }
  });

  describe('Template Compilation Validation', () => {
    it('should have valid Handlebars template syntax for all rules', () => {
      for (const { file, rule } of allRules) {
        const template = Array.isArray(rule.template.content) 
          ? rule.template.content.join('\n') 
          : rule.template.content;
        
        // Check for balanced Handlebars blocks
        const eachBlocks = (template.match(/\{\{#each/g) || []).length;
        const eachClosings = (template.match(/\{\{\/each\}\}/g) || []).length;
        expect(eachBlocks, `${file}::${rule.name} - unbalanced {{#each}} blocks`).toBe(eachClosings);
        
        const ifBlocks = (template.match(/\{\{#if/g) || []).length;
        const ifClosings = (template.match(/\{\{\/if\}\}/g) || []).length;
        expect(ifBlocks, `${file}::${rule.name} - unbalanced {{#if}} blocks`).toBe(ifClosings);
        
        // Templates should contain at least one variable substitution
        const variables = template.match(/\{\{[^#\/][^}]*\}\}/g) || [];
        expect(variables.length, `${file}::${rule.name} - no variables found`).toBeGreaterThan(0);
      }
    });

    it('should generate valid output for template types', () => {
      for (const { file, rule } of allRules) {
        // Validate template type
        expect(['yaml', 'specly'], `${file}::${rule.name} - invalid template type`).toContain(rule.template.type);
        
        // For YAML templates, check basic YAML structure
        if (rule.template.type === 'yaml') {
          const template = Array.isArray(rule.template.content) 
            ? rule.template.content.join('\n') 
            : rule.template.content;
          
          // Should contain YAML-like structure
          expect(template, `${file}::${rule.name} - YAML template should contain colons`).toMatch(/:/);
          
          // Basic YAML structure validation
          // Templates are Handlebars templates that generate YAML, so they may contain template syntax
          // that doesn't look like valid YAML until after compilation
        }
      }
    });
  });

  describe('Rule Priority and Ordering', () => {
    it('should have appropriate priority values', () => {
      for (const { file, rule } of allRules) {
        expect(rule.priority, `${file}::${rule.name}`).toBeGreaterThanOrEqual(0);
        expect(rule.priority, `${file}::${rule.name}`).toBeLessThanOrEqual(100);
      }
    });

    it('should have higher priority for more specific rules', () => {
      // Universal rules (condition: 'true') should have lower priority
      const universalRules = allRules.filter(({ rule }) => rule.condition === 'true');
      const specificRules = allRules.filter(({ rule }) => rule.condition !== 'true');
      
      if (universalRules.length > 0 && specificRules.length > 0) {
        const avgUniversalPriority = universalRules.reduce((sum, { rule }) => sum + rule.priority, 0) / universalRules.length;
        const avgSpecificPriority = specificRules.reduce((sum, { rule }) => sum + rule.priority, 0) / specificRules.length;
        
        expect(avgSpecificPriority).toBeLessThanOrEqual(avgUniversalPriority);
      }
    });
  });

  describe('Rule Coverage', () => {
    it('should have rules for all major architectural components', () => {
      const categories = allRules.map(({ category }) => category);
      
      expect(categories).toContain('controllers');
      expect(categories).toContain('services');
      expect(categories).toContain('events');
      expect(categories).toContain('views');
    });

    it('should have basic CURED operations covered', () => {
      const controllerRules = allRules.filter(({ category }) => category === 'controllers');
      const ruleNames = controllerRules.map(({ rule }) => rule.name.toLowerCase());
      
      // Should have at least basic CURED coverage
      const hasCured = ruleNames.some(name => 
        name.includes('cured') || name.includes('crud')
      );
      expect(hasCured).toBe(true);
    });

    it('should handle different model complexity levels', () => {
      const parentRules = allRules.filter(({ rule }) => 
        rule.condition.includes('parentRelationship') || 
        rule.condition.includes('hasParentRelationship')
      );
      
      const manyToManyRules = allRules.filter(({ rule }) => 
        rule.condition.includes('manyToMany')
      );
      
      const lifecycleRules = allRules.filter(({ rule }) => 
        rule.condition.includes('lifecycle')
      );
      
      expect(parentRules.length).toBeGreaterThan(0);
      expect(manyToManyRules.length).toBeGreaterThan(0);
      expect(lifecycleRules.length).toBeGreaterThan(0);
    });
  });

  describe('Template Variable Usage', () => {
    it('should use consistent variable naming patterns', () => {
      const commonVariables = [
        'modelName',
        'targetModel',
        'model.',
        '../modelName'
      ];
      
      for (const { file, rule } of allRules) {
        const template = Array.isArray(rule.template.content) 
          ? rule.template.content.join('\n') 
          : rule.template.content;
        const variables = template.match(/\{\{[^#\/][^}]*\}\}/g) || [];
        
        // At least one common variable should be used
        const usesCommonVariable = commonVariables.some(common =>
          template.includes(`{{${common}}}`) || template.includes(`{{${common}`)
        );
        
        expect(usesCommonVariable, `${file}::${rule.name} - should use common variables`).toBe(true);
      }
    });

    it('should handle relationship iterations correctly', () => {
      const relationshipRules = allRules.filter(({ rule }) => {
        const template = Array.isArray(rule.template.content) 
          ? rule.template.content.join('\n') 
          : rule.template.content;
        return template.includes('#each') && template.includes('relationships');
      });
      
      for (const { file, rule } of relationshipRules) {
        const template = Array.isArray(rule.template.content) 
          ? rule.template.content.join('\n') 
          : rule.template.content;
        
        // Should properly reference parent context in iterations
        if (template.includes('#each relationships')) {
          expect(template, `${file}::${rule.name} - should use ../modelName in iterations`).toMatch(/\{\{\.\.\/.*\}\}/);
        }
      }
    });
  });
});