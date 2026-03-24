import { describe, it, expect, beforeEach, beforeAll } from "vitest";
/**
 * Tests for namespace utilities
 */

import {
  parseNamespace,
  parseReference,
  validateNamespace,
  validateReference,
  resolveReference,
  qualifiedName
} from '../namespace-utils';

describe('parseNamespace', () => {
  test('parses scoped two-level namespace', () => {
    const result = parseNamespace('@acme/ecommerce');
    expect(result).toEqual({
      organization: '@acme',
      domain: 'ecommerce',
      module: undefined,
      full: '@acme/ecommerce',
      isScoped: true
    });
  });

  test('parses scoped three-level namespace', () => {
    const result = parseNamespace('@acme/ecommerce/checkout');
    expect(result).toEqual({
      organization: '@acme',
      domain: 'ecommerce',
      module: 'checkout',
      full: '@acme/ecommerce/checkout',
      isScoped: true
    });
  });

  test('parses unscoped namespace', () => {
    const result = parseNamespace('local-app');
    expect(result).toEqual({
      organization: undefined,
      domain: 'local-app',
      module: undefined,
      full: 'local-app',
      isScoped: false
    });
  });

  test('throws on invalid scoped format', () => {
    expect(() => parseNamespace('@acme')).toThrow('Invalid scoped namespace format');
    expect(() => parseNamespace('@acme/')).toThrow('Invalid scoped namespace format');
  });

  test('throws on unscoped with slash', () => {
    expect(() => parseNamespace('local/app')).toThrow('Unscoped namespace cannot contain');
  });

  test('throws on empty namespace', () => {
    expect(() => parseNamespace('')).toThrow('Namespace name cannot be empty');
  });
});

describe('parseReference', () => {
  test('parses unqualified reference', () => {
    const result = parseReference('Product');
    expect(result).toEqual({
      type: 'Product',
      isQualified: false
    });
  });

  test('parses qualified reference', () => {
    const result = parseReference('@acme/ecommerce.Product');
    expect(result).toEqual({
      namespace: '@acme/ecommerce',
      type: 'Product',
      isQualified: true
    });
  });

  test('handles multiple dots (uses last one)', () => {
    const result = parseReference('@acme/api.v2.Product');
    expect(result).toEqual({
      namespace: '@acme/api.v2',
      type: 'Product',
      isQualified: true
    });
  });

  test('throws on invalid qualified reference', () => {
    expect(() => parseReference('.')).toThrow('Invalid qualified reference');
    expect(() => parseReference('.Product')).toThrow('Invalid qualified reference');
    expect(() => parseReference('@acme/api.')).toThrow('Invalid qualified reference');
  });

  test('throws on empty reference', () => {
    expect(() => parseReference('')).toThrow('Reference cannot be empty');
  });
});

describe('validateNamespace', () => {
  test('validates correct scoped namespace', () => {
    expect(validateNamespace('@acme/ecommerce')).toEqual([]);
    expect(validateNamespace('@big-co/user-management')).toEqual([]);
  });

  test('validates correct unscoped namespace', () => {
    expect(validateNamespace('local-app')).toEqual([]);
    expect(validateNamespace('myapp123')).toEqual([]);
  });

  test('catches invalid organization format', () => {
    const errors = validateNamespace('@ACME/ecommerce');
    expect(errors[0]).toContain('Invalid organization format: @ACME');
  });

  test('catches invalid domain format', () => {
    const errors = validateNamespace('@acme/ECOMMERCE');
    expect(errors[0]).toContain('Invalid domain format: ECOMMERCE');
  });

  test('catches invalid module format', () => {
    const errors = validateNamespace('@acme/ecommerce/CHECKOUT');
    expect(errors[0]).toContain('Invalid module format: CHECKOUT');
  });
});

describe('validateReference', () => {
  test('validates unqualified reference', () => {
    const allowedNamespaces = new Set(['@acme/auth']);
    const errors = validateReference('User', allowedNamespaces);
    expect(errors).toEqual([]);
  });

  test('validates qualified reference with allowed namespace', () => {
    const allowedNamespaces = new Set(['@acme/auth']);
    const errors = validateReference('@acme/auth.User', allowedNamespaces);
    expect(errors).toEqual([]);
  });

  test('catches unknown namespace', () => {
    const allowedNamespaces = new Set(['@acme/auth']);
    const errors = validateReference('@unknown/namespace.User', allowedNamespaces);
    expect(errors.some(e => e.includes('Unknown namespace: @unknown/namespace'))).toBe(true);
  });

  test('catches invalid type name', () => {
    const allowedNamespaces = new Set(['@acme/auth']);
    const errors = validateReference('user', allowedNamespaces);
    expect(errors.some(e => e.includes('Invalid type name: user'))).toBe(true);
  });
});

describe('resolveReference', () => {
  test('resolves local reference', () => {
    const result = resolveReference(
      'User',
      '@myapp/current',
      new Map()
    );
    
    expect(result).toEqual({
      resolvedNamespace: '@myapp/current',
      type: 'User',
      isLocal: true,
      errors: []
    });
  });

  test('resolves qualified reference with imported type', () => {
    const imports = new Map([
      ['@acme/auth', ['User', 'Role']]
    ]);
    
    const result = resolveReference(
      '@acme/auth.User',
      '@myapp/current',
      imports
    );
    
    expect(result).toEqual({
      resolvedNamespace: '@acme/auth',
      type: 'User',
      isLocal: false,
      errors: []
    });
  });

  test('catches unimported namespace', () => {
    const result = resolveReference(
      '@unknown/namespace.User',
      '@myapp/current',
      new Map()
    );
    
    expect(result.errors.some(e => e.includes('Namespace @unknown/namespace not imported'))).toBe(true);
  });

  test('catches unimported type', () => {
    const imports = new Map([
      ['@acme/auth', ['Role']] // User not imported
    ]);
    
    const result = resolveReference(
      '@acme/auth.User',
      '@myapp/current',
      imports
    );
    
    expect(result.errors.some(e => e.includes('Type User not imported from @acme/auth'))).toBe(true);
  });
});

describe('qualifiedName', () => {
  test('generates qualified name', () => {
    expect(qualifiedName('@acme/auth', 'User')).toBe('@acme/auth.User');
  });
});