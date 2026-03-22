/**
 * ManifestPlugin - Implementation manifest visualization
 *
 * Supports:
 * - manifest-mapping: Component → Manifest → Implementation mapping
 * - technology-stack: Technology stack visualization
 * - capability-bindings: Capability → Implementation bindings
 */

import { BaseDiagramPlugin } from '../../core/BaseDiagramPlugin.js';
import {
  DiagramType,
  DiagramContext,
  MermaidDiagram,
  MermaidNode,
  ValidationResult
} from '../../types/index.js';
import { SpecVerseAST } from '@specverse/types';

interface ManifestSpec {
  name: string;
  specVersion?: string;
  version?: string;
  description?: string;
  component?: {
    componentSource: string;
    componentVersion: string;
  };
  deployment?: {
    deploymentSource: string;
    deploymentVersion: string;
  };
  implementationTypes?: Record<string, any>;
  behaviorMappings?: Record<string, any>;
  capabilityMappings?: Record<string, any>;
  communicationChannels?: Record<string, any>;
}

export class ManifestPlugin extends BaseDiagramPlugin {
  name = 'manifest-plugin';
  version = '1.0.0';
  description = 'Implementation manifest visualization with traceability';
  supportedTypes: DiagramType[] = ['manifest-mapping', 'technology-stack', 'capability-bindings'];

  /**
   * Generate diagram based on type
   */
  generate(context: DiagramContext, type: DiagramType): MermaidDiagram {
    this.validateType(type);

    switch (type) {
      case 'manifest-mapping':
        return this.generateManifestMapping(context);
      case 'technology-stack':
        return this.generateTechnologyStack(context);
      case 'capability-bindings':
        return this.generateCapabilityBindings(context);
      default:
        throw new Error(`Unsupported diagram type: ${type}`);
    }
  }

  /**
   * Validate AST for manifest diagram generation
   */
  validate(ast: SpecVerseAST): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for manifests
    const manifests = this.extractManifests(ast);

    if (manifests.length === 0) {
      warnings.push('No manifests found - manifest diagrams will be minimal');
    }

    // Check for implementation types
    const hasImplementationTypes = manifests.some(m => m.implementationTypes);
    if (!hasImplementationTypes) {
      warnings.push('No implementation types found - technology stack will be empty');
    }

    // Check for capability mappings
    const hasCapabilityMappings = manifests.some(m => m.capabilityMappings);
    if (!hasCapabilityMappings) {
      warnings.push('No capability mappings found - capability bindings will be minimal');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate manifest mapping diagram (spec → manifest → implementation)
   */
  private generateManifestMapping(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'LR');
    diagram.title = context.options.title || 'Manifest Mapping';

    const manifests = this.extractManifests(context.ast);
    const allComponents = context.ast.components || [];

    // Layer 1: Components
    const componentNodes: string[] = [];
    allComponents.forEach(component => {
      componentNodes.push(component.name);
      const node: MermaidNode = {
        id: component.name,
        label: `${component.name}<br>v${component.version}`,
        type: 'component' as const,
        color: context.theme.colors.component || '#E8F5E9',
        shape: 'rounded'
      };
      diagram.nodes.push(node);
      context.nodes.set(component.name, node);
    });

    if (componentNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'components_layer',
        label: '📦 COMPONENTS (Specification)',
        nodes: componentNodes,
        direction: 'TB'
      });
    }

    // Layer 2: Manifests
    const manifestNodes: string[] = [];
    manifests.forEach(manifest => {
      const manifestId = `manifest_${manifest.name}`;
      manifestNodes.push(manifestId);

      const techTypes = manifest.implementationTypes ?
        Object.keys(manifest.implementationTypes).length : 0;
      const behaviorCount = manifest.behaviorMappings ?
        Object.keys(manifest.behaviorMappings).length : 0;

      const node: MermaidNode = {
        id: manifestId,
        label: `${manifest.name}<br>v${manifest.version || '1.0.0'}<br>Types: ${techTypes} | Behaviors: ${behaviorCount}`,
        type: 'manifest' as const,
        color: context.theme.colors.deployment || '#FFF9C4',
        shape: 'hexagon'
      };
      diagram.nodes.push(node);
      context.nodes.set(manifestId, node);

      // Connect manifest to component
      if (manifest.component?.componentSource) {
        const componentName = this.extractComponentName(manifest.component.componentSource);
        const componentExists = allComponents.some(c => c.name === componentName);
        if (componentExists) {
          diagram.edges.push({
            from: componentName,
            to: manifestId,
            label: 'specifies',
            type: 'solid',
            arrow: 'single'
          });
        }
      }
    });

    if (manifestNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'manifests_layer',
        label: '📋 MANIFESTS (Implementation Mapping)',
        nodes: manifestNodes,
        direction: 'TB'
      });
    }

    // Layer 3: Implementation Types
    const implNodes: string[] = [];
    manifests.forEach(manifest => {
      if (manifest.implementationTypes) {
        Object.entries(manifest.implementationTypes).forEach(([typeName, typeSpec]: [string, any]) => {
          const implId = `impl_${manifest.name}_${typeName}`;
          implNodes.push(implId);

          const tech = typeSpec.technology || 'Unknown';
          const framework = typeSpec.framework || '';

          const node: MermaidNode = {
            id: implId,
            label: `${typeName}<br>${tech}${framework ? ` / ${framework}` : ''}`,
            type: 'implementation' as const,
            color: context.theme.colors.service || '#E3F2FD',
            shape: 'rounded'
          };
          diagram.nodes.push(node);
          context.nodes.set(implId, node);

          // Connect manifest to implementation
          diagram.edges.push({
            from: `manifest_${manifest.name}`,
            to: implId,
            label: 'implements',
            type: 'solid',
            arrow: 'single'
          });
        });
      }
    });

    if (implNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'implementation_layer',
        label: '🔧 IMPLEMENTATION (Technology)',
        nodes: implNodes,
        direction: 'TB'
      });
    }

    return diagram;
  }

  /**
   * Generate technology stack diagram
   */
  private generateTechnologyStack(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'TB');
    diagram.title = context.options.title || 'Technology Stack';

    const manifests = this.extractManifests(context.ast);
    const techStack = this.analyzeTechnologyStack(manifests);

    // Group by technology category
    const categories = ['Frontend', 'Backend', 'Database', 'Infrastructure', 'Testing', 'Other'];

    categories.forEach(category => {
      const techsInCategory = techStack.filter(t => t.category === category);
      if (techsInCategory.length > 0) {
        const categoryNodes: string[] = [];

        techsInCategory.forEach(tech => {
          // Include framework in ID to make it unique
          const techName = tech.framework ? `${tech.name}_${tech.framework}` : tech.name;
          const techId = `tech_${techName.replace(/[^a-zA-Z0-9]/g, '_')}`;
          categoryNodes.push(techId);

          const node: MermaidNode = {
            id: techId,
            label: `${tech.name}<br>${tech.framework || ''}<br>v${tech.version || 'latest'}`,
            type: 'technology' as const,
            color: this.getTechnologyColor(category, context),
            shape: 'rounded'
          };
          diagram.nodes.push(node);
          context.nodes.set(techId, node);
        });

        diagram.subgraphs.push({
          id: `${category.toLowerCase()}_layer`,
          label: `${this.getCategoryIcon(category)} ${category.toUpperCase()}`,
          nodes: categoryNodes,
          direction: 'LR'
        });
      }
    });

    return diagram;
  }

  /**
   * Generate capability bindings diagram
   */
  private generateCapabilityBindings(context: DiagramContext): MermaidDiagram {
    const diagram = this.createEmptyDiagram('graph', 'LR');
    diagram.title = context.options.title || 'Capability Bindings';

    const manifests = this.extractManifests(context.ast);

    // Collect all capabilities and their implementations
    const capabilityMap = new Map<string, Set<string>>();

    manifests.forEach(manifest => {
      if (manifest.capabilityMappings) {
        Object.entries(manifest.capabilityMappings).forEach(([capability, mapping]: [string, any]) => {
          if (!capabilityMap.has(capability)) {
            capabilityMap.set(capability, new Set());
          }

          // Get implementation from mapping
          const implementation = mapping.implementation || mapping.implementationType;
          if (implementation) {
            capabilityMap.get(capability)!.add(`${manifest.name}.${implementation}`);
          }
        });
      }
    });

    // Create capability nodes
    const capabilityNodes: string[] = [];
    capabilityMap.forEach((implementations, capability) => {
      const capId = `cap_${capability.replace(/[^a-zA-Z0-9]/g, '_')}`;
      capabilityNodes.push(capId);

      const capNode: MermaidNode = {
        id: capId,
        label: `${capability}<br>(${implementations.size} impl${implementations.size !== 1 ? 's' : ''})`,
        type: 'capability' as const,
        color: context.theme.colors.domainEvent || '#FFF3E0',
        shape: 'hexagon'
      };
      diagram.nodes.push(capNode);
      context.nodes.set(capId, capNode);

      // Create implementation nodes and edges
      implementations.forEach(impl => {
        const implId = `impl_${impl.replace(/[^a-zA-Z0-9]/g, '_')}`;

        const implNode: MermaidNode = {
          id: implId,
          label: impl,
          type: 'implementation' as const,
          color: context.theme.colors.service || '#E3F2FD',
          shape: 'rounded'
        };
        diagram.nodes.push(implNode);
        context.nodes.set(implId, implNode);

        diagram.edges.push({
          from: capId,
          to: implId,
          label: 'binds to',
          type: 'solid',
          arrow: 'single'
        });
      });
    });

    if (capabilityNodes.length > 0) {
      diagram.subgraphs.push({
        id: 'capabilities_layer',
        label: '🎯 CAPABILITIES',
        nodes: capabilityNodes,
        direction: 'TB'
      });
    }

    return diagram;
  }

  /**
   * Extract manifests from AST
   */
  private extractManifests(ast: SpecVerseAST): ManifestSpec[] {
    const manifests: ManifestSpec[] = [];

    // Check if AST has manifests (v3.2+)
    if ((ast as any).manifests) {
      Object.entries((ast as any).manifests).forEach(([name, manifest]: [string, any]) => {
        manifests.push({
          name,
          ...manifest
        });
      });
    }

    return manifests;
  }

  /**
   * Analyze technology stack from manifests
   */
  private analyzeTechnologyStack(manifests: ManifestSpec[]): Array<{
    name: string;
    category: string;
    framework?: string;
    version?: string;
  }> {
    const stack: Array<{ name: string; category: string; framework?: string; version?: string }> = [];
    const seen = new Set<string>();

    manifests.forEach(manifest => {
      if (manifest.implementationTypes) {
        Object.values(manifest.implementationTypes).forEach((typeSpec: any) => {
          const tech = typeSpec.technology;
          const framework = typeSpec.framework;
          const version = typeSpec.version;

          // Create unique key including framework to allow multiple entries for same tech
          const uniqueKey = framework ? `${tech}:${framework}` : tech;

          if (tech && !seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            stack.push({
              name: tech,  // Always use technology name
              category: this.categorizeTechnology(tech),
              framework: framework,  // Keep framework for display
              version
            });
          }
        });
      }
    });

    return stack;
  }

  /**
   * Categorize technology by name
   */
  private categorizeTechnology(tech: string): string {
    const techLower = tech.toLowerCase();

    if (techLower.includes('react') || techLower.includes('vue') || techLower.includes('angular') ||
        techLower.includes('nextjs') || techLower.includes('svelte')) {
      return 'Frontend';
    }
    if (techLower.includes('node') || techLower.includes('express') || techLower.includes('fastify') ||
        techLower.includes('nest') || techLower.includes('python') || techLower.includes('django') ||
        techLower.includes('flask') || techLower.includes('spring') || techLower.includes('rails')) {
      return 'Backend';
    }
    if (techLower.includes('postgres') || techLower.includes('mysql') || techLower.includes('mongo') ||
        techLower.includes('redis') || techLower.includes('database')) {
      return 'Database';
    }
    if (techLower.includes('docker') || techLower.includes('kubernetes') || techLower.includes('aws') ||
        techLower.includes('azure') || techLower.includes('gcp') || techLower.includes('cloud')) {
      return 'Infrastructure';
    }
    if (techLower.includes('test') || techLower.includes('jest') || techLower.includes('vitest') ||
        techLower.includes('cypress') || techLower.includes('playwright')) {
      return 'Testing';
    }

    return 'Other';
  }

  /**
   * Get color for technology category
   */
  private getTechnologyColor(category: string, context: DiagramContext): string {
    const colors: Record<string, string> = {
      Frontend: context.theme.colors.view || '#E8EAF6',
      Backend: context.theme.colors.service || '#E3F2FD',
      Database: context.theme.colors.model || '#E8F5E9',
      Infrastructure: context.theme.colors.deployment || '#FFF9C4',
      Testing: context.theme.colors.controller || '#FCE4EC',
      Other: '#F5F5F5'
    };

    return colors[category] || '#F5F5F5';
  }

  /**
   * Get icon for category
   */
  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      Frontend: '🎨',
      Backend: '⚙️',
      Database: '🗄️',
      Infrastructure: '🏗️',
      Testing: '🧪',
      Other: '📦'
    };

    return icons[category] || '📦';
  }

  /**
   * Extract component name from source path
   */
  private extractComponentName(source: string): string {
    // Extract from paths like './components/MyComponent.specly' or '@org/package'
    const parts = source.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/\.specly$/, '').replace(/\.yaml$/, '');
  }

  /**
   * Get default options for manifest diagrams
   */
  getDefaultOptions() {
    return {
      includeImplementationTypes: true,
      includeCapabilityMappings: true,
      includeBehaviorMappings: true,
      title: 'Manifest Mapping'
    };
  }
}
