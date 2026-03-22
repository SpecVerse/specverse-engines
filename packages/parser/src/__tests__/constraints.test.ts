import { describe, it, expect } from 'vitest';
import { ConventionProcessor } from '../convention-processor.js';

describe('Behavioural Constraints Processing', () => {
  const processor = new ConventionProcessor();

  it('should expand constraints into Quint invariants', () => {
    const yamlData = {
      components: {
        TestComponent: {
          version: '3.5.0',
          models: {
            User: {
              attributes: {
                id: 'UUID required unique',
                name: 'String required',
              },
            },
          },
          constraints: [
            'models must have attributes',
            'models must have id',
          ],
        },
      },
    };

    const result = processor.process(yamlData);
    const component = result.components[0];

    expect(component.constraints).toBeDefined();
    expect(component.constraints!.length).toBe(2);

    const [attr, id] = component.constraints!;
    expect(attr.type).toBe('invariant');
    expect(attr.name).toBe('modelsHaveAttributes');
    expect(attr.body).toContain('models.forall');

    expect(id.type).toBe('invariant');
    expect(id.name).toBe('modelsHaveId');
    expect(id.body).toContain('attributes.keys().contains("id")');
  });

  it('should warn on unrecognized constraints', () => {
    processor.clearWarnings();
    const yamlData = {
      components: {
        TestComponent: {
          version: '3.5.0',
          models: {},
          constraints: [
            'models must have attributes',
            'this is not a real convention',
          ],
        },
      },
    };

    const result = processor.process(yamlData);
    const component = result.components[0];

    // One recognized, one not
    expect(component.constraints!.length).toBe(1);

    // Warning generated for the unrecognized one
    const warnings = processor.getWarnings();
    expect(warnings.some(w => w.includes('Unrecognized constraint'))).toBe(true);
    expect(warnings.some(w => w.includes('this is not a real convention'))).toBe(true);
  });

  it('should handle components without constraints', () => {
    const yamlData = {
      components: {
        TestComponent: {
          version: '3.5.0',
          models: {},
        },
      },
    };

    const result = processor.process(yamlData);
    const component = result.components[0];

    // No constraints property when not specified
    expect(component.constraints).toBeUndefined();
  });

  it('should include source metadata in expanded constraints', () => {
    const yamlData = {
      components: {
        TestComponent: {
          version: '3.5.0',
          models: {},
          constraints: ['models must not be orphaned'],
        },
      },
    };

    const result = processor.process(yamlData);
    const constraint = result.components[0].constraints![0];

    expect(constraint.source.convention).toBe('must_not_be_orphaned');
    expect(constraint.source.entity).toBe('models');
    expect(constraint.source.input).toBe('models must not be orphaned');
  });

  it('should expand cross-entity constraints', () => {
    const yamlData = {
      components: {
        TestComponent: {
          version: '3.5.0',
          models: {},
          constraints: [
            'models must have attributes',
            'deprecated patterns never generated',
            'main bus must exist',
          ],
        },
      },
    };

    const result = processor.process(yamlData);
    const constraints = result.components[0].constraints!;

    expect(constraints.length).toBe(3);
    // From models grammar
    expect(constraints[0].source.entity).toBe('models');
    // From services grammar
    expect(constraints[1].source.entity).toBe('services');
    // From deployments grammar
    expect(constraints[2].source.entity).toBe('deployments');
  });

  it('should not warn about constraints as unknown property', () => {
    processor.clearWarnings();
    const yamlData = {
      components: {
        TestComponent: {
          version: '3.5.0',
          models: {},
          constraints: ['models must have attributes'],
        },
      },
    };

    processor.process(yamlData);
    const warnings = processor.getWarnings();

    // Should NOT warn about "unknown property: constraints"
    expect(warnings.every(w => !w.includes('unknown properties'))).toBe(true);
  });
});
