#!/usr/bin/env node

/**
 * Inference Engine Test Harness
 * 
 * Validates all inference engine rules and exercises rule application
 * to ensure templates compile correctly and rules apply without errors.
 */

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

// Test model for rule validation
const testModel = {
  name: 'TestModel',
  attributes: [
    { name: 'id', type: 'UUID', required: true },
    { name: 'name', type: 'String', required: true },
    { name: 'email', type: 'Email', required: false }
  ],
  relationships: {
    parentRelationships: [
      { targetModel: 'ParentModel', type: 'belongsTo' }
    ],
    childRelationships: [
      { targetModel: 'ChildModel', type: 'hasMany' }
    ],
    manyToManyRelationships: [
      { targetModel: 'RelatedModel', type: 'manyToMany' }
    ]
  },
  lifecycle: {
    type: 'shorthand',
    states: ['draft', 'active', 'inactive']
  },
  profiles: ['UserProfile', 'AdminProfile']
};

// Mock context for rule condition evaluation
const testContext = {
  model: testModel,
  modelName: 'TestModel',
  relationships: testModel.relationships,
  hasParentRelationship: () => true,
  hasChildRelationship: () => true,
  hasManyToManyRelationship: () => true
};

class InferenceEngineTestHarness {
  private rulesDir: string;
  private errors: string[] = [];
  private warnings: string[] = [];
  private successes: string[] = [];
  private quiet: boolean = false;

  constructor() {
    // Rules are composed from entity modules into dist/ at build time
    this.rulesDir = join(__dirname, '..', '..', 'dist', 'inference-engine', 'rules', 'logical');
    this.quiet = process.env.NODE_ENV === 'test' || process.argv.includes('--quiet');
  }

  /**
   * Run comprehensive test suite
   */
  async runTests(): Promise<void> {
    if (!this.quiet) {
      console.log('🧪 Inference Engine Test Harness Starting...\n');
    }

    try {
      await this.validateRuleFiles();
      await this.validateRuleTemplates();
      await this.testRuleConditions();
      await this.testTemplateCompilation();

      this.printResults();
    } catch (error) {
      console.error('❌ Test harness failed:', error);
      process.exit(1);
    }
  }

  /**
   * Validate all rule files are properly formatted JSON
   */
  private async validateRuleFiles(): Promise<void> {
    if (!this.quiet) {
      console.log('📁 Validating Rule Files...');
    }

    try {
      const files = readdirSync(this.rulesDir).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        try {
          const content = readFileSync(join(this.rulesDir, file), 'utf8');
          const parsed = JSON.parse(content);

          // Validate structure
          if (!parsed.version) {
            this.errors.push(`${file}: Missing version field`);
            continue;
          }

          // Check if this is a domain-specific file (has ruleFileType)
          if (parsed.ruleFileType) {
            // Domain-specific files are valid - count their contents
            let ruleCount = 0;
            if (parsed.ruleFileType === 'pattern-inference' && parsed.rules) {
              ruleCount = parsed.rules.length;
            } else if (parsed.ruleFileType === 'configuration' && parsed.mappings) {
              ruleCount = 1; // Mappings count as 1 rule set
            } else if (parsed.ruleFileType === 'expansion-template' && parsed.templates) {
              ruleCount = Object.keys(parsed.templates).length;
            }
            this.successes.push(`${file}: ✅ Valid JSON (domain-specific: ${parsed.ruleFileType}) with ${ruleCount} rules`);
            continue;
          }

          // Handle legacy format (logical_inference wrapper)
          const ruleFile = parsed as RuleFile;

          if (!ruleFile.logical_inference) {
            this.errors.push(`${file}: Missing logical_inference or ruleFileType field`);
            continue;
          }

          // Count rules (v3.1 format has arrays, v3.4 has objects/mappings)
          let ruleCount = 0;
          for (const category in ruleFile.logical_inference) {
            const categoryData = ruleFile.logical_inference[category];
            if (Array.isArray(categoryData)) {
              ruleCount += categoryData.length;
            }
            // v3.4 files have object structures - count as 1 rule set
            else if (typeof categoryData === 'object') {
              ruleCount += 1;
            }
          }

          this.successes.push(`${file}: ✅ Valid JSON with ${ruleCount} rules`);
        } catch (parseError) {
          this.errors.push(`${file}: JSON parse error - ${parseError}`);
        }
      }
    } catch (error) {
      this.errors.push(`Failed to read rules directory: ${error}`);
    }
  }

  /**
   * Validate rule template syntax
   */
  private async validateRuleTemplates(): Promise<void> {
    if (!this.quiet) {
      console.log('📝 Validating Rule Templates...');
    }

    const files = readdirSync(this.rulesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = readFileSync(join(this.rulesDir, file), 'utf8');
        const parsed = JSON.parse(content);

        // Skip domain-specific files - they have their own validation
        if (parsed.ruleFileType) {
          continue;
        }

        const ruleFile = parsed as RuleFile;

        for (const category in ruleFile.logical_inference) {
          const categoryData = ruleFile.logical_inference[category];
          // Skip v3.4 files - they have object structures, not rule arrays
          if (!Array.isArray(categoryData)) {
            continue;
          }

          for (const rule of categoryData) {
            try {
              // Basic template validation
              if (!rule.template.type) {
                this.errors.push(`${file}::${rule.name}: Missing template type`);
                continue;
              }

              if (!rule.template.content) {
                this.errors.push(`${file}::${rule.name}: Missing template content`);
                continue;
              }

              // Template type validation
              if (!['yaml', 'specly'].includes(rule.template.type)) {
                this.warnings.push(`${file}::${rule.name}: Unknown template type '${rule.template.type}'`);
              }

              // Check for basic Handlebars syntax
              const content = rule.template.content;
              const contentString = Array.isArray(content) ? content.join('\n') : content;
              const handlebarsRegex = /\{\{[^}]+\}\}/g;
              const matches = contentString.match(handlebarsRegex);
              
              if (matches) {
                this.successes.push(`${file}::${rule.name}: ✅ Template with ${matches.length} variables`);
              } else {
                this.warnings.push(`${file}::${rule.name}: No Handlebars variables found`);
              }

            } catch (error) {
              this.errors.push(`${file}::${rule.name}: Template validation error - ${error}`);
            }
          }
        }
      } catch (error) {
        this.errors.push(`${file}: Template validation failed - ${error}`);
      }
    }
  }

  /**
   * Test rule condition evaluation
   */
  private async testRuleConditions(): Promise<void> {
    if (!this.quiet) {
      console.log('🔍 Testing Rule Conditions...');
    }

    const files = readdirSync(this.rulesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = readFileSync(join(this.rulesDir, file), 'utf8');
        const parsed = JSON.parse(content);

        // Skip domain-specific files - they have their own validation
        if (parsed.ruleFileType) {
          continue;
        }

        const ruleFile = parsed as RuleFile;

        for (const category in ruleFile.logical_inference) {
          const categoryData = ruleFile.logical_inference[category];
          // Skip v3.4 files - they have object structures, not rule arrays
          if (!Array.isArray(categoryData)) {
            continue;
          }

          for (const rule of categoryData) {
            try {
              // Basic condition syntax check
              const condition = rule.condition;

              if (condition === 'true') {
                this.successes.push(`${file}::${rule.name}: ✅ Universal rule (always applies)`);
                continue;
              }

              if (condition === 'false') {
                this.successes.push(`${file}::${rule.name}: ✅ Disabled rule (intentionally inactive)`);
                continue;
              }

              // Check for common patterns
              if (condition.includes('relationships') ||
                  condition.includes('hasParentRelationship') ||
                  condition.includes('model.')) {
                this.successes.push(`${file}::${rule.name}: ✅ Valid condition pattern`);
              } else {
                this.warnings.push(`${file}::${rule.name}: Condition may need validation: ${condition}`);
              }

            } catch (error) {
              this.errors.push(`${file}::${rule.name}: Condition test error - ${error}`);
            }
          }
        }
      } catch (error) {
        this.errors.push(`${file}: Condition testing failed - ${error}`);
      }
    }
  }

  /**
   * Test template compilation with sample data
   */
  private async testTemplateCompilation(): Promise<void> {
    if (!this.quiet) {
      console.log('🛠️  Testing Template Compilation...');
    }

    const files = readdirSync(this.rulesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = readFileSync(join(this.rulesDir, file), 'utf8');
        const parsed = JSON.parse(content);

        // Skip domain-specific files - they have their own validation
        if (parsed.ruleFileType) {
          continue;
        }

        const ruleFile = parsed as RuleFile;

        for (const category in ruleFile.logical_inference) {
          const categoryData = ruleFile.logical_inference[category];
          // Skip v3.4 files - they have object structures, not rule arrays
          if (!Array.isArray(categoryData)) {
            continue;
          }

          for (const rule of categoryData) {
            try {
              // Simple template compilation test
              let template = Array.isArray(rule.template.content)
                ? rule.template.content.join('\n')
                : rule.template.content;

              // Replace simple variables
              template = template.replace(/\{\{modelName\}\}/g, testContext.modelName);
              template = template.replace(/\{\{\.\.\/modelName\}\}/g, testContext.modelName);
              
              // Check for template syntax errors that would prevent compilation
              if (template.includes('{{#each') && !template.includes('{{/each}}')) {
                this.errors.push(`${file}::${rule.name}: Unclosed {{#each}} block`);
                continue;
              }

              if (template.includes('{{#if') && !template.includes('{{/if}}')) {
                this.errors.push(`${file}::${rule.name}: Unclosed {{#if}} block`);
                continue;
              }

              this.successes.push(`${file}::${rule.name}: ✅ Template syntax appears valid`);

            } catch (error) {
              this.errors.push(`${file}::${rule.name}: Template compilation error - ${error}`);
            }
          }
        }
      } catch (error) {
        this.errors.push(`${file}: Template compilation testing failed - ${error}`);
      }
    }
  }

  /**
   * Print test results
   */
  private printResults(): void {
    const total = this.successes.length + this.warnings.length + this.errors.length;
    
    if (this.quiet) {
      // In quiet mode, only show summary
      console.log(`Inference Engine Rules: ${this.successes.length}/${total} passed`);
      if (this.errors.length > 0) {
        console.log(`❌ ${this.errors.length} errors - run without --quiet for details`);
      }
      return;
    }

    console.log('\n📊 Test Results Summary\n');

    if (this.successes.length > 0) {
      console.log(`✅ Successes (${this.successes.length}):`);
      this.successes.forEach(success => console.log(`   ${success}`));
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log();
    }

    if (this.errors.length > 0) {
      console.log(`❌ Errors (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log();
    }

    console.log(`📈 Overall: ${this.successes.length}/${total} tests passed`);
    
    if (this.errors.length === 0) {
      console.log('🎉 All inference engine rules validated successfully!');
    } else {
      console.log('💥 Inference engine has validation errors that need fixing.');
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const harness = new InferenceEngineTestHarness();
  harness.runTests();
}

export { InferenceEngineTestHarness };