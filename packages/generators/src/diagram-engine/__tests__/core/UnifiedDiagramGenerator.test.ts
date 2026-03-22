/**
 * Tests for UnifiedDiagramGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedDiagramGenerator } from '../../core/UnifiedDiagramGenerator.js';
import { BaseDiagramPlugin } from '../../core/BaseDiagramPlugin.js';
import { DiagramContext, DiagramType, MermaidDiagram, ValidationResult } from '../../types/index.js';
import { SpecVerseAST } from '../../../parser/convention-processor.js';

/**
 * Mock plugin for testing
 */
class MockDiagramPlugin extends BaseDiagramPlugin {
  name = 'mock-plugin';
  version = '1.0.0';
  description = 'Mock plugin for testing';
  supportedTypes: DiagramType[] = ['er-diagram'];

  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    this.validateType(type);

    const diagram = this.createEmptyDiagram('erDiagram');
    diagram.title = 'Mock Diagram';

    // Add a simple node
    diagram.nodes.push({
      id: 'TestModel',
      label: 'Test Model',
      type: 'model',
      color: context.theme.colors.model
    });

    return diagram;
  }
}

describe('UnifiedDiagramGenerator', () => {
  let generator: UnifiedDiagramGenerator;
  let mockAST: SpecVerseAST;

  beforeEach(() => {
    // Create a simple mock AST
    mockAST = {
      components: [
        {
          name: 'TestComponent',
          version: '1.0.0',
          models: [
            {
              name: 'TestModel',
              attributes: [],
              relationships: [],
              lifecycles: [],
              behaviors: {}
            }
          ],
          controllers: [],
          services: [],
          views: [],
          events: []
        }
      ],
      deployments: []
    };

    // Create generator with mock plugin
    generator = new UnifiedDiagramGenerator({
      plugins: [new MockDiagramPlugin()],
      theme: 'default'
    });
  });

  describe('Plugin Management', () => {
    it('should register plugins', () => {
      expect(generator.getAvailableTypes()).toContain('er-diagram');
    });

    it('should check if type is supported', () => {
      expect(generator.isTypeSupported('er-diagram')).toBe(true);
      expect(generator.isTypeSupported('event-flow-layered' as DiagramType)).toBe(false);
    });

    it('should unregister plugins', () => {
      generator.unregisterPlugin('er-diagram');
      expect(generator.isTypeSupported('er-diagram')).toBe(false);
    });

    it('should get plugin for type', () => {
      const plugin = generator.getPlugin('er-diagram');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('mock-plugin');
    });
  });

  describe('Diagram Generation', () => {
    it('should generate diagram', () => {
      const diagram = generator.generate(mockAST, 'er-diagram');
      expect(diagram).toContain('erDiagram');
      expect(diagram).toContain('TestModel');
    });

    it('should throw error for unsupported type', () => {
      expect(() => {
        generator.generate(mockAST, 'event-flow-layered' as DiagramType);
      }).toThrow('No plugin registered');
    });

    it('should apply custom options', () => {
      const diagram = generator.generate(mockAST, 'er-diagram', {
        title: 'Custom Title'
      });
      expect(diagram).toBeDefined();
    });

    it('should use custom theme', () => {
      const diagram = generator.generate(mockAST, 'er-diagram', {
        theme: 'dark-mode'
      });
      expect(diagram).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate AST', () => {
      const result = generator.validate(mockAST, 'er-diagram');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for unsupported type', () => {
      const result = generator.validate(mockAST, 'event-flow-layered' as DiagramType);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata', () => {
    it('should get diagram metadata', () => {
      const metadata = generator.getMetadata();
      expect(metadata).toHaveLength(1);
      expect(metadata[0].type).toBe('er-diagram');
      expect(metadata[0].plugin).toBe('mock-plugin');
    });

    it('should get options for type', () => {
      const options = generator.getOptionsForType('er-diagram');
      expect(options).toBeDefined();
    });
  });

  describe('Theme Management', () => {
    it('should get available themes', () => {
      const themes = generator.getAvailableThemes();
      expect(themes).toContain('default');
      expect(themes).toContain('dark-mode');
      expect(themes).toContain('colorblind-safe');
      expect(themes).toContain('presentation');
    });

    it('should register custom theme', () => {
      generator.registerTheme({
        name: 'custom',
        colors: {
          model: '#custom',
          profile: '#custom',
          controller: '#custom',
          service: '#custom',
          event: '#custom',
          view: '#custom',
          domainEvent: '#custom',
          appEvent: '#custom',
          lifecycle: '#custom',
          deployment: '#custom',
          manifest: '#custom'
        },
        shapes: {
          model: 'rectangle',
          controller: 'rounded',
          service: 'rounded',
          event: 'hexagon',
          view: 'rounded'
        },
        layout: {
          rankDir: 'TB',
          nodeSpacing: 50,
          rankSpacing: 100,
          edgeSpacing: 10
        }
      });

      expect(generator.getAvailableThemes()).toContain('custom');
    });
  });
});
