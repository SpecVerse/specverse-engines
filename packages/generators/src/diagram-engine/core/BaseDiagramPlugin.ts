/**
 * BaseDiagramPlugin - Abstract base class for diagram plugins
 *
 * Provides common functionality and contract for all diagram plugins
 */

import {
  DiagramPlugin,
  DiagramType,
  DiagramOptions,
  DiagramContext,
  MermaidDiagram,
  ValidationResult
} from '../types/index.js';

import { SpecVerseAST } from '@specverse/types';

/**
 * Abstract base class for diagram plugins
 */
export abstract class BaseDiagramPlugin implements DiagramPlugin {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  abstract supportedTypes: DiagramType[];

  /**
   * Generate diagram - must be implemented by subclasses
   */
  abstract generate(context: DiagramContext, type: DiagramType): MermaidDiagram;

  /**
   * Validate AST - default implementation (can be overridden)
   */
  validate(ast: SpecVerseAST): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!ast.components || ast.components.length === 0) {
      errors.push('No components found in AST');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get default options - can be overridden by subclasses
   */
  getDefaultOptions(): Partial<DiagramOptions> {
    return {
      includeAttributes: true,
      includeRelationships: true,
      includeLifecycles: true,
      includeBehaviors: true
    };
  }

  /**
   * Helper: Check if diagram type is supported
   */
  protected isTypeSupported(type: DiagramType): boolean {
    return this.supportedTypes.includes(type);
  }

  /**
   * Helper: Validate diagram type
   */
  protected validateType(type: DiagramType): void {
    if (!this.isTypeSupported(type)) {
      throw new Error(`Plugin ${this.name} does not support diagram type: ${type}`);
    }
  }

  /**
   * Helper: Create empty diagram structure
   */
  protected createEmptyDiagram(
    type: 'graph' | 'erDiagram' | 'sequenceDiagram' | 'stateDiagram' | 'classDiagram',
    direction?: 'TB' | 'TD' | 'BT' | 'LR' | 'RL'
  ): MermaidDiagram {
    return {
      type,
      direction: direction || 'TD',
      nodes: [],
      edges: [],
      subgraphs: []
    };
  }
}
