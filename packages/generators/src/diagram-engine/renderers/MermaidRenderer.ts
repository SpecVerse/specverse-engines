/**
 * MermaidRenderer - Renders Mermaid diagrams from intermediate representation
 *
 * Converts MermaidDiagram objects to Mermaid syntax strings
 */

import {
  MermaidDiagram,
  MermaidNode,
  MermaidEdge,
  Subgraph,
  DiagramContext,
  ValidationResult
} from '../types/index.js';

/**
 * MermaidRenderer - Converts diagram objects to Mermaid syntax
 */
export class MermaidRenderer {
  /**
   * Escape special characters in Mermaid labels
   */
  private escapeLabel(label: string): string {
    // Handle edge case: standalone "*" needs special treatment
    if (label.trim() === '*') {
      return 'all (*)';
    }

    // Escape characters that have special meaning in Mermaid
    return label
      .replace(/\\/g, '\\\\')  // Backslash must be first
      .replace(/"/g, '\\"')     // Escape quotes
      .replace(/#/g, '\\#');    // Escape hash (can break styling)
  }

  /**
   * Render a diagram to Mermaid syntax
   */
  render(diagram: MermaidDiagram, context: DiagramContext): string {
    // Special handling for ER diagrams
    if (diagram.type === 'erDiagram') {
      return this.renderERDiagram(diagram, context);
    }

    // Special handling for state diagrams
    if (diagram.type === 'stateDiagram') {
      return this.renderStateDiagram(diagram, context);
    }

    // Special handling for sequence diagrams
    if (diagram.type === 'sequenceDiagram') {
      return this.renderSequenceDiagram(diagram, context);
    }

    // Special handling for class diagrams
    if (diagram.type === 'classDiagram') {
      return this.renderClassDiagram(diagram, context);
    }

    const lines: string[] = [];

    // Add diagram type and direction
    const direction = diagram.direction || context.options.direction || 'TD';
    lines.push(`${diagram.type} ${direction}`);

    // Add title if present
    if (diagram.title || context.options.title) {
      const title = diagram.title || context.options.title;
      lines.push(`  %% ${title}`);
      lines.push('');
    }

    // Render subgraphs
    if (diagram.subgraphs.length > 0) {
      for (const subgraph of diagram.subgraphs) {
        lines.push(...this.renderSubgraph(subgraph, context));
        lines.push('');  // Blank line after each subgraph
      }
    }

    // Render standalone nodes (not in subgraphs)
    const nodesInSubgraphs = new Set<string>();
    for (const subgraph of diagram.subgraphs) {
      for (const nodeId of subgraph.nodes) {
        nodesInSubgraphs.add(nodeId);
      }
    }

    // Render standalone nodes (not in subgraphs)
    // These need to be declared with proper shape syntax for Mermaid
    const standaloneNodes = [];
    for (const node of diagram.nodes) {
      if (!nodesInSubgraphs.has(node.id)) {
        // Use proper shape syntax based on node type
        const shape = this.getNodeShape(node, context);
        const label = this.escapeLabel(node.label);
        // Use 2-space indentation consistent with other top-level elements
        standaloneNodes.push(`  ${node.id}${shape[0]}"${label}"${shape[1]}`);
      }
    }

    if (standaloneNodes.length > 0) {
      lines.push(...standaloneNodes);
      lines.push('');
    }

    // Render edges
    if (diagram.edges.length > 0) {
      lines.push('');  // Blank line before relationships
      lines.push('  %% Relationships');
      for (const edge of diagram.edges) {
        lines.push(this.renderEdge(edge, context));
      }
    }

    // Add styling
    lines.push('');
    lines.push(...this.renderStyles(diagram, context));

    return lines.join('\n');
  }

  /**
   * Render a subgraph
   */
  private renderSubgraph(subgraph: Subgraph, context: DiagramContext): string[] {
    const lines: string[] = [];
    const direction = subgraph.direction || context.options.direction || 'LR';

    lines.push(`  subgraph ${subgraph.id}["${this.escapeLabel(subgraph.label)}"]`);
    lines.push(`    direction ${direction}`);

    // Render nodes in this subgraph
    for (const nodeId of subgraph.nodes) {
      const node = context.nodes.get(nodeId);
      if (node) {
        const nodeLines = this.renderNode(node, context);
        lines.push(...nodeLines.map(l => '  ' + l));
      }
    }

    lines.push('  end');

    return lines;
  }

  /**
   * Render a node
   */
  private renderNode(node: MermaidNode, context: DiagramContext): string[] {
    const lines: string[] = [];

    // Determine node shape
    const shape = this.getNodeShape(node, context);

    // Build node content
    let content = this.escapeLabel(node.label);

    // Add attributes if present
    if (node.attributes && node.attributes.length > 0 && context.options.includeAttributes !== false) {
      content += '<br/>' + node.attributes.map(a => this.escapeLabel(a)).join('<br/>');
    }

    // Add methods if present
    if (node.methods && node.methods.length > 0 && context.options.includeBehaviors !== false) {
      content += '<br/>' + node.methods.map(m => this.escapeLabel(m)).join('<br/>');
    }

    // Render node with shape
    lines.push(`  ${node.id}${shape[0]}"${content}"${shape[1]}`);

    return lines;
  }

  /**
   * Get node shape based on type
   */
  private getNodeShape(node: MermaidNode, context: DiagramContext): [string, string] {
    // Allow custom shape override
    if (node.shape) {
      switch (node.shape) {
        case 'rectangle': return ['[', ']'];
        case 'rounded': return ['(', ')'];
        case 'stadium': return ['([', '])'];
        case 'cylinder': return ['[(', ')]'];
        case 'circle': return ['((', '))'];
        case 'diamond': return ['{', '}'];
        case 'hexagon': return ['{{', '}}'];
        case 'trapezoid': return ['[/', '\\]'];
        default: return ['[', ']'];
      }
    }

    // Default shapes based on type
    const shapeConfig = context.theme.shapes;
    switch (node.type) {
      case 'model':
      case 'profile':
        return ['[', ']']; // Rectangle
      case 'controller':
      case 'service':
      case 'view':
        return ['(', ')']; // Rounded
      case 'event':
        return ['{{', '}}']; // Hexagon
      case 'deployment':
        return ['[[', ']]']; // Subroutine
      case 'manifest':
        return ['[/', '\\]']; // Trapezoid
      default:
        return ['[', ']'];
    }
  }

  /**
   * Render an edge
   */
  private renderEdge(edge: MermaidEdge, context: DiagramContext): string {
    const arrow = this.getArrowStyle(edge);
    const label = edge.label ? `|"${this.escapeLabel(edge.label)}"|` : '';

    return `  ${edge.from} ${arrow[0]}${label}${arrow[1]} ${edge.to}`;
  }

  /**
   * Get arrow style for edge
   */
  private getArrowStyle(edge: MermaidEdge): [string, string] {
    switch (edge.type) {
      case 'solid':
        return edge.arrow === 'none' ? ['---', '---'] : ['-->', ''];
      case 'dashed':
      case 'dotted':
        // Mermaid only supports solid (-->) and dashed (-.->)
        // Map both dashed and dotted to the same syntax
        return edge.arrow === 'none' ? ['-.-', '-.-'] : ['-.->',  ''];
      default:
        return ['-->', ''];
    }
  }

  /**
   * Render styles for nodes
   */
  private renderStyles(diagram: MermaidDiagram, context: DiagramContext): string[] {
    const lines: string[] = [];
    const styled = new Set<string>();

    for (const node of diagram.nodes) {
      if (node.color && !styled.has(node.id)) {
        const borderColor = this.getBorderColor(node.color);
        lines.push(`  style ${node.id} fill:${node.color},stroke:${borderColor},stroke-width:2px,color:#000`);
        styled.add(node.id);
      }
    }

    return lines;
  }

  /**
   * Get border color (darker version of fill color)
   */
  private getBorderColor(fillColor: string): string {
    // Simple darkening - could be enhanced
    const colorMap: Record<string, string> = {
      '#e1f5fe': '#01579b',
      '#e8f5e9': '#1b5e20',
      '#f3e5f5': '#4a148c',
      '#fff3e0': '#e65100',
      '#fce4ec': '#880e4f',
      '#ffe0b2': '#e65100'
    };

    return colorMap[fillColor] || '#333';
  }

  /**
   * Validate Mermaid syntax (basic validation)
   */
  validateSyntax(mermaid: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lines = mermaid.split('\n');

    // Check if diagram type is specified
    if (!lines[0] || !['graph', 'erDiagram', 'sequenceDiagram', 'stateDiagram'].some(type => lines[0].includes(type))) {
      errors.push('Diagram type not specified or invalid');
    }

    // Check for balanced brackets
    const brackets = mermaid.match(/[\[\](){}<>]/g) || [];
    const stack: string[] = [];
    for (const bracket of brackets) {
      if ('[({<'.includes(bracket)) {
        stack.push(bracket);
      } else {
        const open = stack.pop();
        const pairs: Record<string, string> = { ']': '[', ')': '(', '}': '{', '>': '<' };
        if (open !== pairs[bracket]) {
          warnings.push('Possibly unbalanced brackets');
          break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Render ER diagram (special case for entity-relationship)
   */
  renderERDiagram(diagram: MermaidDiagram, context: DiagramContext): string {
    const lines: string[] = ['erDiagram'];

    // Add title if present
    if (diagram.title || context.options.title) {
      const title = diagram.title || context.options.title;
      lines.push(`  %% ${title}`);
      lines.push('');
    }

    // Add models with attributes from diagram nodes
    for (const node of diagram.nodes) {
      if (node.type === 'model' || node.type === 'profile') {
        lines.push(`  ${node.id} {`);

        // Get attributes from metadata if available
        const attributes = node.metadata?.attributes || node.attributes || [];
        for (const attr of attributes) {
          lines.push(`    ${attr}`);
        }

        lines.push('  }');
      }
    }

    // Add relationships from diagram relations
    if (diagram.relations && diagram.relations.length > 0) {
      lines.push('');
      for (const relation of diagram.relations) {
        const cardinality = `${relation.fromCardinality}--${relation.toCardinality}`;
        const label = relation.label || relation.metadata?.type || 'related';
        lines.push(`  ${relation.from} ${cardinality} ${relation.to} : "${label}"`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Get ER diagram relationship type notation
   */
  private getERRelationType(type: string): string {
    switch (type) {
      case 'hasMany': return '||--o{';
      case 'hasOne': return '||--||';
      case 'belongsTo': return '}o--||';
      case 'manyToMany': return '}o--o{';
      default: return '||--||';
    }
  }

  /**
   * Render sequence diagram (special case)
   */
  renderSequenceDiagram(diagram: MermaidDiagram, context: DiagramContext): string {
    const lines: string[] = ['sequenceDiagram'];

    // Add title if present
    if (diagram.title || context.options.title) {
      const title = diagram.title || context.options.title;
      lines.push(`  %% ${title}`);
      lines.push('');
    }

    // Render sequences
    if (diagram.sequences && diagram.sequences.length > 0) {
      diagram.sequences.forEach(seq => {
        switch (seq.type) {
          case 'participant':
            if (seq.participant && seq.label) {
              lines.push(`  participant ${seq.participant} as ${seq.label}`);
            } else if (seq.participant) {
              lines.push(`  participant ${seq.participant}`);
            }
            break;

          case 'message':
            if (seq.from && seq.to && seq.message) {
              const arrow = seq.activate ? '->>' : '->';
              lines.push(`  ${seq.from}${arrow}+${seq.to}: ${seq.message}`);
            }
            break;

          case 'note':
            if (seq.message && seq.participants && seq.participants.length > 0) {
              const placement = seq.placement || 'over';
              const participantList = seq.participants.join(',');
              lines.push(`  Note ${placement} ${participantList}: ${seq.message}`);
            }
            break;

          case 'activate':
            if (seq.participant) {
              lines.push(`  activate ${seq.participant}`);
            }
            break;

          case 'deactivate':
            if (seq.participant) {
              lines.push(`  deactivate ${seq.participant}`);
            }
            break;
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * Render state diagram (special case for lifecycles)
   */
  renderStateDiagram(diagram: MermaidDiagram, context: DiagramContext): string {
    const lines: string[] = ['stateDiagram-v2'];

    // Add title if present
    if (diagram.title || context.options.title) {
      const title = diagram.title || context.options.title;
      lines.push(`  %% ${title}`);
      lines.push('');
    }

    // Render lifecycles from diagram
    if (diagram.lifecycles && diagram.lifecycles.length > 0) {
      diagram.lifecycles.forEach((lifecycle: any) => {
        // Add comment for lifecycle
        lines.push(`  %% ${lifecycle.modelName} - ${lifecycle.lifecycleName}`);
        lines.push('');

        // Add transitions
        lifecycle.transitions.forEach((transition: any) => {
          if (transition.label) {
            lines.push(`  ${transition.from} --> ${transition.to} : ${transition.label}`);
          } else {
            lines.push(`  ${transition.from} --> ${transition.to}`);
          }
        });

        lines.push('');
      });
    } else if (diagram.states && diagram.states.length > 0) {
      // Fallback: render simple states if no lifecycles
      diagram.states.forEach(state => {
        lines.push(`  ${state.id} : ${state.label}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Render class diagram (UML class diagram with attributes and methods)
   */
  private renderClassDiagram(diagram: MermaidDiagram, context: DiagramContext): string {
    const lines: string[] = ['classDiagram'];

    // Add title if present
    if (diagram.title || context.options.title) {
      const title = diagram.title || context.options.title;
      lines.push(`  %% ${title}`);
      lines.push('');
    }

    // Render classes with attributes and methods
    for (const node of diagram.nodes) {
      lines.push(`    class ${node.id} {`);

      // Add attributes
      if (node.attributes && node.attributes.length > 0) {
        for (const attr of node.attributes) {
          lines.push(`        ${attr}`);
        }
      }

      // Add methods
      if (node.methods && node.methods.length > 0) {
        for (const method of node.methods) {
          lines.push(`        ${method}`);
        }
      }

      lines.push('    }');
    }

    // Add relationships
    if (diagram.edges && diagram.edges.length > 0) {
      lines.push('');

      // Sort edges by metadata.order to ensure consistent ordering
      const sortedEdges = [...diagram.edges].sort((a, b) => {
        const orderA = a.metadata?.order || 999;
        const orderB = b.metadata?.order || 999;
        return orderA - orderB;
      });

      for (const edge of sortedEdges) {
        const arrow = edge.type === 'dashed' ? '..' : '--';
        lines.push(`    ${edge.from} ${arrow} ${edge.to} : ${edge.label}`);
      }
    }

    return lines.join('\n');
  }
}
