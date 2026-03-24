/**
 * LibraryToolsService
 * Clean implementation from extracted specification
 */

import { parse } from 'yaml';
import { LibrarySuggestionModel } from '../models/LibrarySuggestion.js';
import type { ResourceProvider } from '../interfaces/ResourceProvider.js';
import type { 
  LibraryCatalog, 
  LibrarySuggestion, 
  MCPToolResult, 
  PromptContext 
} from '../types/index.js';

export class LibraryToolsService {
  private resourcesProvider: ResourceProvider;
  private libraryCatalog: LibraryCatalog | null = null;
  private catalogCache: Map<string, LibrarySuggestionModel> = new Map();

  constructor(resourcesProvider: ResourceProvider) {
    this.resourcesProvider = resourcesProvider;
  }

  async getLibrarySuggestions(context: PromptContext): Promise<MCPToolResult> {
    try {
      // Ensure library catalog is loaded
      if (!this.libraryCatalog) {
        await this.loadLibraryCatalog();
      }

      if (!this.libraryCatalog) {
        throw new Error('Library catalog not available');
      }

      // Extract context parameters
      const { 
        requirements = '', 
        scale = 'business' 
      } = context;

      // Analyze context and generate suggestions
      const analysis = this.analyzeSuggestions(requirements, scale);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            libraries: analysis.libraries.map(lib => ({
              name: lib.name,
              path: lib.path,
              type: lib.type,
              description: lib.description,
              ai_description: lib.ai_description,
              expansion_factor: lib.expansion_factor,
              complexity_level: lib.complexity_level,
              best_for: lib.best_for
            })),
            reasoning: analysis.reasoning,
            usage_examples: analysis.usage_examples,
            total_suggestions: analysis.libraries.length,
            scale_optimization: scale
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating library suggestions: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }

  analyzeSuggestions(projectContext: string, scale: string): {
    libraries: LibrarySuggestionModel[];
    reasoning: string;
    usage_examples: string[];
  } {
    if (!this.libraryCatalog) {
      return {
        libraries: [],
        reasoning: 'Library catalog not available',
        usage_examples: []
      };
    }

    const suggestions: LibrarySuggestionModel[] = [];
    const reasoningParts: string[] = [];
    const usageExamples: string[] = [];

    const contextLower = projectContext.toLowerCase();
    const allLibraries = this.getAllLibraries();

    // Domain-specific analysis
    const domainAnalysis = this.analyzeDomain(contextLower, allLibraries);
    if (domainAnalysis.library) {
      suggestions.push(domainAnalysis.library);
      reasoningParts.push(domainAnalysis.reasoning);
      usageExamples.push(domainAnalysis.usage);
    }

    // Technology stack analysis
    const techAnalysis = this.analyzeTechnology(contextLower, allLibraries);
    if (techAnalysis.library && !suggestions.find(s => s.name === techAnalysis.library!.name)) {
      suggestions.push(techAnalysis.library);
      reasoningParts.push(techAnalysis.reasoning);
      usageExamples.push(techAnalysis.usage);
    }

    // Scale-based deployment analysis
    const deploymentAnalysis = this.analyzeDeployment(scale, allLibraries);
    if (deploymentAnalysis.library && !suggestions.find(s => s.name === deploymentAnalysis.library!.name)) {
      suggestions.push(deploymentAnalysis.library);
      reasoningParts.push(deploymentAnalysis.reasoning);
      usageExamples.push(deploymentAnalysis.usage);
    }

    // Authentication analysis
    const authAnalysis = this.analyzeAuthentication(contextLower, allLibraries);
    if (authAnalysis.library && !suggestions.find(s => s.name === authAnalysis.library!.name)) {
      suggestions.push(authAnalysis.library);
      reasoningParts.push(authAnalysis.reasoning);
      usageExamples.push(authAnalysis.usage);
    }

    // Default suggestions if nothing specific found
    if (suggestions.length === 0) {
      const defaults = allLibraries
        .filter(lib => this.isGeneralPurpose(lib) || this.matchesScale(lib, scale))
        .slice(0, 2);
      
      suggestions.push(...defaults);
      reasoningParts.push('General-purpose libraries for common patterns');
      usageExamples.push('import:\\n  - from: "@specverse/types/examples"\\n    models: [User, BaseEntity]');
    }

    // Sort by relevance score
    suggestions.sort((a, b) => {
      const aScore = a.matchesContext(projectContext, scale);
      const bScore = b.matchesContext(projectContext, scale);
      return bScore - aScore;
    });

    return {
      libraries: suggestions.slice(0, 5), // Top 5 suggestions
      reasoning: reasoningParts.join('; '),
      usage_examples: usageExamples
    };
  }

  private async loadLibraryCatalog(): Promise<void> {
    try {
      const catalogContent = await this.resourcesProvider.getResourceContent('specverse://libraries/catalog');
      this.libraryCatalog = parse(catalogContent) as LibraryCatalog;
      
      // Cache all library models
      this.cacheLibraryModels();
    } catch (error) {
      console.error('Failed to load library catalog:', error);
      this.libraryCatalog = this.createEmptyLibraryCatalog();
    }
  }

  private cacheLibraryModels(): void {
    if (!this.libraryCatalog) return;

    const allLibraries = [
      ...Object.values(this.libraryCatalog.deployments || {}),
      ...Object.values(this.libraryCatalog.domains || {}),
      ...Object.values(this.libraryCatalog.manifests || {}),
      ...Object.values(this.libraryCatalog.types || {})
    ];

    for (const library of allLibraries) {
      try {
        const model = LibrarySuggestionModel.create(library);
        this.catalogCache.set(library.name, model);
      } catch (error) {
        console.warn(`Failed to cache library ${library.name}:`, error);
      }
    }
  }

  private getAllLibraries(): LibrarySuggestionModel[] {
    return Array.from(this.catalogCache.values());
  }

  private analyzeDomain(context: string, libraries: LibrarySuggestionModel[]): {
    library?: LibrarySuggestionModel;
    reasoning: string;
    usage: string;
  } {
    if (context.includes('ecommerce') || context.includes('store') || context.includes('shop')) {
      const ecommerce = libraries.find(lib => lib.name.includes('ecommerce'));
      if (ecommerce) {
        return {
          library: ecommerce,
          reasoning: 'E-commerce domain detected',
          usage: 'import:\\n  - from: "@specverse/domains/ecommerce"\\n    models: [Product, Order, Customer]'
        };
      }
    }

    if (context.includes('healthcare') || context.includes('medical') || context.includes('patient')) {
      const healthcare = libraries.find(lib => lib.name.includes('healthcare'));
      if (healthcare) {
        return {
          library: healthcare,
          reasoning: 'Healthcare domain detected',
          usage: 'import:\\n  - from: "@specverse/domains/healthcare"\\n    models: [Patient, Provider, Appointment]'
        };
      }
    }

    return { reasoning: 'No specific domain patterns detected', usage: '' };
  }

  private analyzeTechnology(context: string, libraries: LibrarySuggestionModel[]): {
    library?: LibrarySuggestionModel;
    reasoning: string;
    usage: string;
  } {
    if (context.includes('nextjs') || context.includes('next.js') || context.includes('react')) {
      const nextjs = libraries.find(lib => lib.name.includes('nextjs'));
      if (nextjs) {
        return {
          library: nextjs,
          reasoning: 'Next.js framework detected',
          usage: 'import:\\n  - from: "@specverse/manifests/nextjs"\\n    manifests: [nextjs-config]'
        };
      }
    }

    if (context.includes('postgresql') || context.includes('postgres')) {
      const postgres = libraries.find(lib => lib.name.includes('postgresql'));
      if (postgres) {
        return {
          library: postgres,
          reasoning: 'PostgreSQL database detected',
          usage: 'import:\\n  - from: "@specverse/manifests/postgresql"\\n    manifests: [postgres-config]'
        };
      }
    }

    return { reasoning: 'No specific technology patterns detected', usage: '' };
  }

  private analyzeDeployment(scale: string, libraries: LibrarySuggestionModel[]): {
    library?: LibrarySuggestionModel;
    reasoning: string;
    usage: string;
  } {
    switch (scale) {
      case 'personal':
        const personal = libraries.find(lib => lib.name.includes('jamstack') || lib.name.includes('monolith'));
        if (personal) {
          return {
            library: personal,
            reasoning: 'Personal scale: simple deployment recommended',
            usage: `import:\\n  - from: "@specverse/deployments/${personal.name}"\\n    deployments: [development]`
          };
        }
        break;

      case 'enterprise':
        const enterprise = libraries.find(lib => lib.name.includes('enterprise') || lib.name.includes('microservices'));
        if (enterprise) {
          return {
            library: enterprise,
            reasoning: 'Enterprise scale: distributed architecture recommended',
            usage: `import:\\n  - from: "@specverse/deployments/${enterprise.name}"\\n    deployments: [production-cluster]`
          };
        }
        break;

      default: // business
        const business = libraries.find(lib => lib.name.includes('microservices') || lib.name.includes('monolith'));
        if (business) {
          return {
            library: business,
            reasoning: 'Business scale: scalable deployment recommended',
            usage: `import:\\n  - from: "@specverse/deployments/${business.name}"\\n    deployments: [production]`
          };
        }
        break;
    }

    return { reasoning: 'No deployment pattern match found', usage: '' };
  }

  private analyzeAuthentication(context: string, libraries: LibrarySuggestionModel[]): {
    library?: LibrarySuggestionModel;
    reasoning: string;
    usage: string;
  } {
    if (context.includes('authentication') || context.includes('auth') || context.includes('login')) {
      const oauth = libraries.find(lib => lib.name.includes('oauth'));
      if (oauth) {
        return {
          library: oauth,
          reasoning: 'Authentication features detected',
          usage: 'import:\\n  - from: "@specverse/manifests/oauth"\\n    manifests: [oauth-config]'
        };
      }
    }

    return { reasoning: 'No authentication patterns detected', usage: '' };
  }

  private isGeneralPurpose(library: LibrarySuggestionModel): boolean {
    return library.name.includes('examples') || 
           library.name.includes('lib') ||
           library.type === 'type';
  }

  private matchesScale(library: LibrarySuggestionModel, scale: string): boolean {
    const scaleComplexity = this.getScaleComplexity(scale);
    const libComplexity = this.getComplexityScore(library.complexity_level);
    return Math.abs(libComplexity - scaleComplexity) <= 1;
  }

  private getScaleComplexity(scale: string): number {
    switch (scale) {
      case 'personal': return 1;
      case 'business': return 2;
      case 'enterprise': return 3;
      default: return 2;
    }
  }

  private getComplexityScore(complexity: string): number {
    switch (complexity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  }

  private createEmptyLibraryCatalog(): LibraryCatalog {
    return {
      version: '3.1.0',
      generated_at: new Date(),
      generated_from: 'embedded',
      ai_optimization: false,
      total_libraries: 0,
      deployments: {},
      domains: {},
      manifests: {},
      types: {}
    };
  }
}