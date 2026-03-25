/**
 * EntityModuleService
 *
 * Provides entity module metadata as MCP resources and tools.
 * Loads the entity registry from @specverse/engine-entities and exposes:
 * - Entity module registry (all modules, their facets, dependencies)
 * - Convention grammars per entity (what behavioural constraints are available)
 * - Inference rules per entity (what gets generated from what)
 * - Diagram plugins per entity
 * - Behavioural constraint expansion (tool)
 */

import type { SpecVerseResource, MCPToolResult } from '../types/index.js';

interface EntityModuleInfo {
  name: string;
  type: string;
  version: string;
  dependsOn: string[];
  hasConventionProcessor: boolean;
  inferenceRuleCount: number;
  inferenceRules: Array<{ id: string; description: string; triggeredBy: string; generates?: string[] }>;
  diagramPlugins: Array<{ type: string; variants?: string[] }>;
  generatorCount: number;
}

interface ConventionInfo {
  entity: string;
  domain: string;
  conventions: Array<{
    name: string;
    pattern: string;
    description: string;
    expandsTo: string;
  }>;
}

export class EntityModuleService {
  private registry: any = null;
  private behaviouralProcessor: any = null;
  private loaded = false;

  /**
   * Attempt to load the entity registry from @specverse/engine-entities.
   * Fails gracefully if not available.
   */
  async initialize(): Promise<boolean> {
    try {
      // Dynamic imports — paths resolved at runtime, not compile time
      // The MCP server sits in tools/specverse-mcp/ but needs to reach src/entities/
      const { resolve, dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      const baseDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

      const entitiesPath = resolve(baseDir, 'dist', 'entities', 'index.js');
      const conventionPath = resolve(baseDir, 'dist', 'entities', '_shared', 'behaviour', 'convention-processor.js');

      const entitiesModule = await import(entitiesPath);
      entitiesModule.bootstrapEntityModules();
      this.registry = entitiesModule.getEntityRegistry();

      const { BehaviouralConventionProcessor } = await import(conventionPath);
      this.behaviouralProcessor = new BehaviouralConventionProcessor();

      // Load grammars from entity module source (grammar.yaml files)
      const entitiesDir = resolve(baseDir, 'src', 'entities');
      this.behaviouralProcessor.loadGrammarsFromEntities(entitiesDir);

      this.loaded = true;
      return true;
    } catch (error) {
      // Entity modules not available in this deployment context
      this.loaded = false;
      return false;
    }
  }

  isAvailable(): boolean {
    return this.loaded;
  }

  /**
   * Get entity module metadata for all registered modules.
   */
  getEntityModules(): EntityModuleInfo[] {
    if (!this.registry) return [];

    const modules = this.registry.getInDependencyOrder();
    return modules.map((mod: any) => ({
      name: mod.name,
      type: mod.type,
      version: mod.version,
      dependsOn: mod.dependsOn || [],
      hasConventionProcessor: !!mod.conventionProcessor,
      inferenceRuleCount: mod.inferenceRules?.length || 0,
      inferenceRules: (mod.inferenceRules || []).map((r: any) => ({
        id: r.id,
        description: r.description,
        triggeredBy: r.triggeredBy,
        generates: r.generates,
      })),
      diagramPlugins: mod.diagramPlugins || [],
      generatorCount: mod.generators?.length || 0,
    }));
  }

  /**
   * Get behavioural convention grammars for all entities.
   */
  getConventionGrammars(): ConventionInfo[] {
    if (!this.behaviouralProcessor) return [];

    return this.behaviouralProcessor.getGrammars().map((g: any) => ({
      entity: g.entity,
      domain: g.domain,
      conventions: Object.values(g.conventions).map((c: any) => ({
        name: c.name,
        pattern: c.pattern,
        description: c.description,
        expandsTo: c.expandsTo,
      })),
    }));
  }

  /**
   * Expand a behavioural constraint string.
   */
  expandConstraint(input: string): { success: boolean; result?: any; error?: string } {
    if (!this.behaviouralProcessor) {
      return { success: false, error: 'Behavioural convention processor not available' };
    }

    const result = this.behaviouralProcessor.expand(input);
    if (result) {
      return { success: true, result };
    }
    return { success: false, error: `No matching convention pattern for: "${input}"` };
  }

  /**
   * Generate MCP resources from entity module metadata.
   */
  generateResources(): SpecVerseResource[] {
    if (!this.loaded) return [];

    const resources: SpecVerseResource[] = [];

    // 1. Entity registry overview
    const modules = this.getEntityModules();
    resources.push({
      uri: 'specverse://entities/registry',
      name: 'Entity Module Registry',
      description: `All ${modules.length} registered entity modules with their facets, dependencies, and capabilities`,
      mimeType: 'application/json',
      content: JSON.stringify({ entityModules: modules }, null, 2),
    });

    // 2. Behavioural conventions catalog
    const grammars = this.getConventionGrammars();
    const totalConventions = grammars.reduce((sum, g) => sum + g.conventions.length, 0);
    resources.push({
      uri: 'specverse://entities/conventions',
      name: 'Behavioural Conventions Catalog',
      description: `${totalConventions} behavioural conventions across ${grammars.length} entities. Use in constraints: section of .specly files.`,
      mimeType: 'application/json',
      content: JSON.stringify({ grammars }, null, 2),
    });

    // 3. Inference rules summary
    const allRules = modules.flatMap(m => m.inferenceRules);
    resources.push({
      uri: 'specverse://entities/inference-rules',
      name: 'Inference Rules Summary',
      description: `${allRules.length} inference rules that generate architecture from specifications`,
      mimeType: 'application/json',
      content: JSON.stringify({ rules: allRules }, null, 2),
    });

    // 4. Diagram plugins summary
    const allPlugins = modules.flatMap(m =>
      m.diagramPlugins.map(p => ({ ...p, entity: m.name }))
    );
    resources.push({
      uri: 'specverse://entities/diagram-plugins',
      name: 'Diagram Plugins',
      description: `${allPlugins.length} diagram types available for visualization`,
      mimeType: 'application/json',
      content: JSON.stringify({ plugins: allPlugins }, null, 2),
    });

    return resources;
  }

  /**
   * Generate MCP tools for entity module interaction.
   */
  generateTools(): any[] {
    if (!this.loaded) return [];

    return [
      {
        name: 'specverse_expand_constraint',
        description: 'Expand a behavioural constraint string into a Quint invariant. Example: "models must have attributes"',
        inputSchema: {
          type: 'object',
          properties: {
            constraint: {
              type: 'string',
              description: 'Human-readable constraint to expand (e.g., "models must have attributes")',
            },
          },
          required: ['constraint'],
        },
      },
      {
        name: 'specverse_list_conventions',
        description: 'List available behavioural conventions for a specific entity type',
        inputSchema: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              description: 'Entity type (e.g., "models", "controllers", "services")',
            },
          },
          required: ['entity'],
        },
      },
      {
        name: 'specverse_entity_info',
        description: 'Get detailed metadata about an entity module (conventions, inference rules, diagram plugins)',
        inputSchema: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              description: 'Entity name (e.g., "models", "controllers", "deployments")',
            },
          },
          required: ['entity'],
        },
      },
    ];
  }

  /**
   * Execute an entity module tool.
   */
  async executeTool(name: string, args: Record<string, any>): Promise<MCPToolResult> {
    switch (name) {
      case 'specverse_expand_constraint': {
        const result = this.expandConstraint(args.constraint);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case 'specverse_list_conventions': {
        const grammars = this.getConventionGrammars();
        const grammar = grammars.find(g => g.entity === args.entity);
        if (!grammar) {
          return {
            content: [{
              type: 'text',
              text: `No conventions found for entity "${args.entity}". Available: ${grammars.map(g => g.entity).join(', ')}`,
            }],
          };
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(grammar, null, 2),
          }],
        };
      }

      case 'specverse_entity_info': {
        const modules = this.getEntityModules();
        const mod = modules.find(m => m.name === args.entity);
        if (!mod) {
          return {
            content: [{
              type: 'text',
              text: `Entity "${args.entity}" not found. Available: ${modules.map(m => m.name).join(', ')}`,
            }],
          };
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(mod, null, 2),
          }],
        };
      }

      default:
        return {
          content: [{
            type: 'text',
            text: `Unknown entity module tool: ${name}`,
          }],
        };
    }
  }
}
