/**
 * Tests for Rule Loader - JSON rule loading and validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { RuleLoader } from '../rule-loader.js';
import { RuleSet } from '../types.js';

describe('RuleLoader', () => {
  let ruleLoader: RuleLoader;
  let tempDir: string;
  
  beforeEach(() => {
    ruleLoader = new RuleLoader(true);
    tempDir = '/tmp/specverse-test-rules';
    
    // Create temp directory for test files
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    ruleLoader.clearLoadedRules();
  });

  const createTestRuleFile = (filename: string, content: any) => {
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content));
    return filePath;
  };

  const createValidRuleSet = (): RuleSet => ({
    version: 'v3.1',
    logical_inference: {
      controllers: [
        {
          name: 'test_controller_rule',
          pattern: 'TestPattern',
          priority: 100,
          template: {
            type: 'json',
            content: '{"test": true}'
          }
        }
      ],
      services: [
        {
          name: 'test_service_rule',
          pattern: 'TestService',
          priority: 90,
          template: {
            type: 'yaml',
            content: 'description: Test service'
          }
        }
      ],
      events: [
        {
          name: 'test_event_rule',
          pattern: 'TestEvent',
          priority: 80,
          template: {
            type: 'json',
            content: '{"description": "Test event"}'
          }
        }
      ],
      views: [
        {
          name: 'test_view_rule',
          pattern: 'TestView',
          priority: 70,
          template: {
            type: 'yaml',
            content: 'type: list'
          }
        }
      ]
    },
    deployment_inference: {
      instances: [
        {
          name: 'test_instance_rule',
          pattern: 'TestInstance',
          priority: 100,
          template: {
            type: 'json',
            content: '{"type": "test"}'
          }
        }
      ],
      channels: [],
      bindings: []
    }
  });

  describe('loadRuleSet', () => {
    it('should load valid JSON rule file successfully', async () => {
      const ruleSet = createValidRuleSet();
      const jsonContent = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "test_controller_rule",
              "pattern": "TestPattern",
              "priority": 100,
              "template": {
                "type": "json",
                "content": "{\"test\": true}"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('valid-rules.json', jsonContent);
      const { ruleSet: loadedRuleSet, validation } = await ruleLoader.loadRuleSet(filePath);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(loadedRuleSet.version).toBe('v3.1');
      expect(loadedRuleSet.logical_inference?.controllers).toHaveLength(1);
      expect(loadedRuleSet.logical_inference?.controllers?.[0].name).toBe('test_controller_rule');
    });

    it('should handle missing rule file', async () => {
      const nonExistentPath = '/tmp/non-existent-rules.json';
      const { ruleSet, validation } = await ruleLoader.loadRuleSet(nonExistentPath);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0].code).toBe('FILE_NOT_FOUND');
      expect(ruleSet.version).toBe('v3.1');
      expect(ruleSet.logical_inference?.controllers).toHaveLength(0);
    });

    it('should handle invalid JSON syntax', async () => {
      const invalidJson = `{
  "version": "v3.1",
  "logical_inference": {
    "controllers": [
      {
        "name": "test",
        "invalid_json": [unclosed
      }
    ]
  }
`;
      
      const filePath = createTestRuleFile('invalid-syntax.json', invalidJson);
      const { validation } = await ruleLoader.loadRuleSet(filePath);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0].code).toBe('PARSE_ERROR');
    });

    it('should validate rule structure', async () => {
      const invalidStructure = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "missing_name": true,
              "pattern": "TestPattern",
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('invalid-structure.json', invalidStructure);
      const { validation } = await ruleLoader.loadRuleSet(filePath);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
    });

    it('should set default priority when not specified', async () => {
      const noPriorityRules = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "test_rule",
              "pattern": "TestPattern",
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('no-priority.json', noPriorityRules);
      const { ruleSet, validation } = await ruleLoader.loadRuleSet(filePath);

      expect(validation.valid).toBe(true);
      expect(validation.warnings.some(w => w.code === 'DEFAULT_PRIORITY')).toBe(true);
      expect(ruleSet.logical_inference?.controllers?.[0].priority).toBe(100);
    });

    it('should validate template structure', async () => {
      const invalidTemplate = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "test_rule",
              "pattern": "TestPattern",
              "priority": 100,
              "template": {
                "invalid_type": "xml",
                "content": "<test/>"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('invalid-template.json', invalidTemplate);
      const { validation } = await ruleLoader.loadRuleSet(filePath);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.code === 'MISSING_TEMPLATE_TYPE')).toBe(true);
    });

    it('should warn about missing descriptions', async () => {
      const noDescription = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "test_rule",
              "pattern": "TestPattern",
              "priority": 100,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('no-description.json', noDescription);
      const { validation } = await ruleLoader.loadRuleSet(filePath);

      expect(validation.valid).toBe(true);
      expect(validation.warnings.some(w => w.code === 'MISSING_DESCRIPTION')).toBe(true);
    });
  });

  describe('loadRulesFromDirectory', () => {
    it('should load multiple rule files from directory', async () => {
      // Create multiple valid rule files
      const rules1 = {
        version: "v3.1",
        logical_inference: {
          controllers: [
            {
              name: "controller_rule_1",
              pattern: "Pattern1",
              priority: 100,
              template: {
                type: "json",
                content: "{}"
              }
            }
          ]
        }
      };
      
      const rules2 = {
        version: "v3.1",
        logical_inference: {
          services: [
            {
              name: "service_rule_1",
              pattern: "ServicePattern1",
              priority: 90,
              template: {
                type: "json",
                content: "{}"
              }
            }
          ]
        }
      };

      createTestRuleFile('controllers.json', rules1);
      createTestRuleFile('services.json', rules2);

      const { ruleSets, validation } = await ruleLoader.loadRulesFromDirectory(tempDir);

      expect(validation.valid).toBe(true);
      expect(ruleSets).toHaveLength(2);
      
      // Check that both files were loaded
      const hasControllerRules = ruleSets.some(rs => 
        rs.logical_inference?.controllers && rs.logical_inference.controllers.length > 0
      );
      const hasServiceRules = ruleSets.some(rs => 
        rs.logical_inference?.services && rs.logical_inference.services.length > 0
      );
      
      expect(hasControllerRules).toBe(true);
      expect(hasServiceRules).toBe(true);
    });

    it('should handle non-existent directory', async () => {
      const nonExistentDir = '/tmp/non-existent-directory';
      const { ruleSets, validation } = await ruleLoader.loadRulesFromDirectory(nonExistentDir);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0].code).toBe('DIRECTORY_NOT_FOUND');
      expect(ruleSets).toHaveLength(0);
    });

    it('should warn about empty directory', async () => {
      // Create empty temp directory
      const emptyDir = '/tmp/empty-rules-dir';
      if (!fs.existsSync(emptyDir)) {
        fs.mkdirSync(emptyDir, { recursive: true });
      }

      const { ruleSets, validation } = await ruleLoader.loadRulesFromDirectory(emptyDir);

      expect(validation.valid).toBe(true);
      expect(validation.warnings.some(w => w.code === 'NO_RULE_FILES')).toBe(true);
      expect(ruleSets).toHaveLength(0);

      // Cleanup
      fs.rmSync(emptyDir, { recursive: true });
    });

    it('should skip non-JSON files', async () => {
      createTestRuleFile('valid-rules.json', {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "test_rule",
              "pattern": "TestPattern",
              "priority": 100,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      });
      
      // Create non-JSON file
      createTestRuleFile('readme.txt', 'This is not a JSON file');
      
      const { ruleSets, validation } = await ruleLoader.loadRulesFromDirectory(tempDir);

      expect(validation.valid).toBe(true);
      expect(ruleSets).toHaveLength(1); // Only JSON file should be loaded
    });

    it('should handle mixed valid and invalid files', async () => {
      // Valid file
      createTestRuleFile('valid.json', {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "valid_rule",
              "pattern": "ValidPattern",
              "priority": 100,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      });
      
      // Invalid file
      createTestRuleFile('invalid.json', {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "missing_required_fields": true
            }
          ]
        }
      });

      const { ruleSets, validation } = await ruleLoader.loadRulesFromDirectory(tempDir);

      expect(validation.valid).toBe(false); // Overall invalid due to one bad file
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(ruleSets).toHaveLength(1); // Only valid file loaded
    });
  });

  describe('getLogicalRules', () => {
    it('should return logical rules from loaded rule sets', async () => {
      const ruleSet = createValidRuleSet();
      const jsonContent = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "test_controller",
              "pattern": "TestController",
              "priority": 100,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ],
          "services": [
            {
              "name": "test_service",
              "pattern": "TestService",
              "priority": 90,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ],
          "events": [
            {
              "name": "test_event",
              "pattern": "TestEvent",
              "priority": 80,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ],
          "views": [
            {
              "name": "test_view",
              "pattern": "TestView",
              "priority": 70,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('complete-rules.json', jsonContent);
      await ruleLoader.loadRuleSet(filePath);

      const logicalRules = ruleLoader.getLogicalRules();

      expect(logicalRules.controllers).toHaveLength(1);
      expect(logicalRules.services).toHaveLength(1);
      expect(logicalRules.events).toHaveLength(1);
      expect(logicalRules.views).toHaveLength(1);
      
      expect(logicalRules.controllers[0].name).toBe('test_controller');
      expect(logicalRules.services[0].name).toBe('test_service');
      expect(logicalRules.events[0].name).toBe('test_event');
      expect(logicalRules.views[0].name).toBe('test_view');
    });

    it('should return empty arrays when no rules loaded', () => {
      const logicalRules = ruleLoader.getLogicalRules();

      expect(logicalRules.controllers).toHaveLength(0);
      expect(logicalRules.services).toHaveLength(0);
      expect(logicalRules.events).toHaveLength(0);
      expect(logicalRules.views).toHaveLength(0);
    });
  });

  describe('getDeploymentRules', () => {
    it('should return deployment rules from loaded rule sets', async () => {
      const jsonContent = {
        "version": "v3.1",
        "deployment_inference": {
          "instances": [
            {
              "name": "test_instance",
              "pattern": "TestInstance",
              "priority": 100,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ],
          "channels": [
            {
              "name": "test_channel",
              "pattern": "TestChannel",
              "priority": 90,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ],
          "bindings": [
            {
              "name": "test_binding",
              "pattern": "TestBinding",
              "priority": 80,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('deployment-rules.json', jsonContent);
      await ruleLoader.loadRuleSet(filePath);

      const deploymentRules = ruleLoader.getDeploymentRules();

      expect(deploymentRules.instances).toHaveLength(1);
      expect(deploymentRules.channels).toHaveLength(1);
      expect(deploymentRules.bindings).toHaveLength(1);
      
      expect(deploymentRules.instances[0].name).toBe('test_instance');
      expect(deploymentRules.channels[0].name).toBe('test_channel');
      expect(deploymentRules.bindings[0].name).toBe('test_binding');
    });
  });

  describe('clearLoadedRules', () => {
    it('should clear all loaded rules', async () => {
      const jsonContent = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "test_rule",
              "pattern": "TestPattern",
              "priority": 100,
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('test-rules.json', jsonContent);
      await ruleLoader.loadRuleSet(filePath);

      // Verify rules are loaded
      const rulesBefore = ruleLoader.getLogicalRules();
      expect(rulesBefore.controllers).toHaveLength(1);

      // Clear rules
      ruleLoader.clearLoadedRules();

      // Verify rules are cleared
      const rulesAfter = ruleLoader.getLogicalRules();
      expect(rulesAfter.controllers).toHaveLength(0);
    });
  });

  describe('Rule Validation Edge Cases', () => {
    it('should handle rules with all optional fields', async () => {
      const minimalRules = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "minimal_rule",
              "pattern": "MinimalPattern",
              "template": {
                "type": "json",
                "content": "{}"
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('minimal-rules.json', minimalRules);
      const { ruleSet, validation } = await ruleLoader.loadRuleSet(filePath);

      expect(validation.valid).toBe(true);
      expect(ruleSet.logical_inference?.controllers?.[0].priority).toBe(100); // Default
    });

    it('should handle complex nested rule structures', async () => {
      const complexRules = {
        "version": "v3.1",
        "logical_inference": {
          "controllers": [
            {
              "name": "complex_rule",
              "pattern": "ComplexPattern",
              "priority": 100,
              "description": "A complex rule with nested template",
              "condition": "model.attributes.length > 5",
              "template": {
                "type": "handlebars",
                "content": "{{controllerName}}:\n  model: {{modelName}}\n  actions:\n    {{#each attributes}}\n    get{{pascalCase name}}:\n      returns: {{type}}\n    {{/each}}",
                "partials": {
                  "attributeHelper": "{{#each this}}{{name}}: {{type}}{{/each}}"
                },
                "helpers": {
                  "pascalCase": "function(str) { return str.charAt(0).toUpperCase() + str.slice(1); }"
                }
              }
            }
          ]
        }
      };
      
      const filePath = createTestRuleFile('complex-rules.json', complexRules);
      const { ruleSet, validation } = await ruleLoader.loadRuleSet(filePath);

      expect(validation.valid).toBe(true);
      expect(ruleSet.logical_inference?.controllers?.[0].template.partials).toBeDefined();
      expect(ruleSet.logical_inference?.controllers?.[0].template.helpers).toBeDefined();
    });
  });
});