/**
 * SpecVerse Namespace Utilities
 * 
 * Handles namespace parsing, validation, and reference resolution
 * Supports implicit string-based hierarchy: @org/package or @org/domain/module
 */

export interface ParsedNamespace {
  organization?: string;  // @acme
  domain: string;         // ecommerce
  module?: string;        // checkout
  full: string;          // @acme/ecommerce/checkout
  isScoped: boolean;     // true if starts with @
}

export interface QualifiedReference {
  namespace?: string;    // @acme/ecommerce
  type: string;         // Product
  isQualified: boolean; // true if contains dot
}

/**
 * Parse namespace from component/deployment name
 * 
 * Examples:
 * - "@acme/ecommerce" → { organization: "@acme", domain: "ecommerce", full: "@acme/ecommerce" }
 * - "@acme/ecommerce/checkout" → { organization: "@acme", domain: "ecommerce", module: "checkout" }
 * - "local-app" → { domain: "local-app", full: "local-app" }
 */
export function parseNamespace(namespaceName: string): ParsedNamespace {
  if (!namespaceName) {
    throw new Error('Namespace name cannot be empty');
  }

  const isScoped = namespaceName.startsWith('@');
  
  if (isScoped) {
    // Scoped package: @org/domain or @org/domain/module
    const match = namespaceName.match(/^(@[^/]+)\/([^/]+)(\/(.+))?$/);
    if (!match) {
      throw new Error(`Invalid scoped namespace format: ${namespaceName}. Expected @org/package or @org/domain/module`);
    }
    
    const [, organization, domain, , module] = match;
    return {
      organization,
      domain,
      module,
      full: namespaceName,
      isScoped: true
    };
  } else {
    // Unscoped package: package-name
    if (namespaceName.includes('/')) {
      throw new Error(`Unscoped namespace cannot contain '/': ${namespaceName}`);
    }
    
    return {
      domain: namespaceName,
      full: namespaceName,
      isScoped: false
    };
  }
}

/**
 * Parse qualified reference: "namespace.Type" or just "Type"
 * 
 * Examples:
 * - "Product" → { type: "Product", isQualified: false }
 * - "@acme/ecommerce.Product" → { namespace: "@acme/ecommerce", type: "Product", isQualified: true }
 */
export function parseReference(reference: string): QualifiedReference {
  if (!reference) {
    throw new Error('Reference cannot be empty');
  }

  const dotIndex = reference.lastIndexOf('.');
  if (dotIndex === -1) {
    // Unqualified reference
    return {
      type: reference,
      isQualified: false
    };
  }
  
  // Qualified reference
  const namespace = reference.substring(0, dotIndex);
  const type = reference.substring(dotIndex + 1);
  
  if (!namespace || !type) {
    throw new Error(`Invalid qualified reference: ${reference}. Expected namespace.Type format`);
  }
  
  // Validate namespace format
  parseNamespace(namespace); // Will throw if invalid
  
  return {
    namespace,
    type,
    isQualified: true
  };
}

/**
 * Validate namespace name format
 */
export function validateNamespace(namespaceName: string): string[] {
  const errors: string[] = [];
  
  try {
    const parsed = parseNamespace(namespaceName);
    
    // Validate organization format (if scoped)
    if (parsed.organization) {
      if (!/^@[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(parsed.organization)) {
        errors.push(`Invalid organization format: ${parsed.organization}. Must be @lowercase-with-hyphens`);
      }
    }
    
    // Validate domain format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(parsed.domain)) {
      errors.push(`Invalid domain format: ${parsed.domain}. Must be lowercase-with-hyphens`);
    }
    
    // Validate module format (if present)
    if (parsed.module && !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(parsed.module)) {
      errors.push(`Invalid module format: ${parsed.module}. Must be lowercase-with-hyphens`);
    }
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  
  return errors;
}

/**
 * Check if a reference is valid for the given context
 */
export function validateReference(reference: string, allowedNamespaces: Set<string>): string[] {
  const errors: string[] = [];
  
  try {
    const parsed = parseReference(reference);
    
    if (parsed.isQualified && parsed.namespace) {
      // Check if namespace is allowed (imported or current)
      if (!allowedNamespaces.has(parsed.namespace)) {
        errors.push(`Unknown namespace: ${parsed.namespace}. Must be imported or current component.`);
      }
      
      // Validate namespace format
      const namespaceErrors = validateNamespace(parsed.namespace);
      errors.push(...namespaceErrors);
    }
    
    // Validate type name format
    if (!/^[A-Z][A-Za-z0-9_]*$/.test(parsed.type)) {
      errors.push(`Invalid type name: ${parsed.type}. Must be PascalCase`);
    }
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  
  return errors;
}

/**
 * Resolve a reference in the context of a component
 */
export function resolveReference(
  reference: string, 
  currentNamespace: string,
  importedNamespaces: Map<string, string[]> // namespace -> imported types
): { 
  resolvedNamespace: string; 
  type: string; 
  isLocal: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  try {
    const parsed = parseReference(reference);
    
    if (!parsed.isQualified) {
      // Local reference - use current namespace
      return {
        resolvedNamespace: currentNamespace,
        type: parsed.type,
        isLocal: true,
        errors: []
      };
    }
    
    // Qualified reference
    if (!parsed.namespace) {
      errors.push(`Qualified reference missing namespace: ${reference}`);
      return { resolvedNamespace: '', type: parsed.type, isLocal: false, errors };
    }
    
    // Check if namespace is imported
    const importedTypes = importedNamespaces.get(parsed.namespace);
    if (!importedTypes) {
      errors.push(`Namespace ${parsed.namespace} not imported. Add to imports section.`);
      return { resolvedNamespace: parsed.namespace, type: parsed.type, isLocal: false, errors };
    }
    
    // Check if specific type is imported
    if (!importedTypes.includes(parsed.type)) {
      errors.push(`Type ${parsed.type} not imported from ${parsed.namespace}. Add to select list.`);
    }
    
    return {
      resolvedNamespace: parsed.namespace,
      type: parsed.type,
      isLocal: false,
      errors
    };
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return { resolvedNamespace: '', type: reference, isLocal: false, errors };
  }
}

/**
 * Generate fully qualified name
 */
export function qualifiedName(namespace: string, typeName: string): string {
  return `${namespace}.${typeName}`;
}

/**
 * Check if namespace matches a pattern (for version resolution)
 */
export function namespaceMatches(namespace: string, pattern: string): boolean {
  // Simple exact match for now
  // Later: support wildcards like @acme/*
  return namespace === pattern;
}