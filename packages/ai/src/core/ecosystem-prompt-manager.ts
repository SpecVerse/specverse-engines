/**
 * Ecosystem Prompt Manager
 * 
 * Central system for generating AI-optimized prompts across the three-tier SpecVerse ecosystem:
 * - LLM Terminal users (copy-paste prompts)  
 * - Claude Code users (CLAUDE.md integration)
 * - API Integration users (orchestrator workflows)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

export type EcosystemType = 'terminal' | 'claude' | 'api';

export interface ProjectContext {
  type?: string;
  domain?: string;
  scale?: 'small' | 'medium' | 'large' | 'enterprise';
  compliance?: string[];
  technology_preferences?: string[];
  existing_libraries?: string[];
}

export interface ClaudeContext {
  workingDirectory: string;
  sessionId: string;
  projectContext?: ProjectContext;
  previousInteractions?: string[];
  currentFiles?: string[];
}

export interface APIContext {
  workflowId: string;
  pipelineContext?: any;
  automationLevel?: 'basic' | 'full';
  integrationPoints?: string[];
}

export interface LibraryContext {
  deployments: LibraryGroup[];
  domains: LibraryGroup[];
  manifests: LibraryGroup[];
  types: LibraryGroup[];
  standards: LibraryGroup[];
}

export interface LibraryGroup {
  name: string;
  description: string;
  ai_description: string;
  path: string;
  expansion_factor: number;
  best_for: string[];
  [key: string]: any;
}

export interface TerminalPrompt {
  systemPrompt: string;
  contextPrompt: string;
  userPrompt: string;
  exampleUsage: string;
  copyInstructions: string;
  tokenEstimate: number;
}

export interface ClaudePrompt {
  claudeMdInstructions: string;
  sessionPrompt: string;
  fileContextInjection: string;
  workflowInstructions: string;
  libraryAwareness: string;
}

export interface APIPrompt {
  orchestratorPrompt: string;
  pipelineInstructions: string;
  contextInjection: string;
  responseHandling: string;
  validationCriteria: string;
}

export class LibraryContextGenerator {
  private catalogCache: any = null;
  private catalogPath: string;

  constructor(catalogPath?: string) {
    // Default to canonical catalog location for better package compatibility
    if (catalogPath) {
      this.catalogPath = catalogPath;
    } else {
      // Get package root directory (from src/ai/core/ to package root)
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const packageRoot = join(__dirname, '../../../'); // Go up from src/ai/core/ to package root
      this.catalogPath = join(packageRoot, 'libs/catalog.yaml');
    }
  }

  async loadLibraryCatalog(): Promise<any> {
    if (this.catalogCache) {
      return this.catalogCache;
    }

    try {
      const catalogContent = await readFile(this.catalogPath, 'utf8');
      this.catalogCache = yaml.load(catalogContent);
      return this.catalogCache;
    } catch (error) {
      console.warn(`Library catalog not found at ${this.catalogPath}. AI prompts will have limited library context.`);
      console.warn(`Provide catalogPath to LibraryContextGenerator constructor, or generate with: npm run library:catalog`);
      return {
        version: '3.1.0',
        generated_at: new Date().toISOString(),
        generated_from: 'fallback',
        ai_optimization: false,
        total_libraries: 0,
        deployments: {},
        domains: {},
        manifests: {},
        types: {},
        standards: {}
      };
    }
  }

  async generateLibraryContext(projectContext?: ProjectContext): Promise<LibraryContext> {
    const catalog = await this.loadLibraryCatalog();
    const relevantLibraries = await this.identifyRelevantLibraries(catalog, projectContext);
    
    return {
      deployments: this.formatLibraryGroup(relevantLibraries.deployments),
      domains: this.formatLibraryGroup(relevantLibraries.domains),
      manifests: this.formatLibraryGroup(relevantLibraries.manifests),
      types: this.formatLibraryGroup(relevantLibraries.types),
      standards: this.formatLibraryGroup(relevantLibraries.standards || [])
    };
  }

  private async identifyRelevantLibraries(catalog: any, projectContext?: ProjectContext): Promise<any> {
    const relevant: {
      deployments: any[];
      domains: any[];
      manifests: any[];
      types: any[];
      standards: any[];
    } = {
      deployments: [],
      domains: [],
      manifests: [],
      types: [],
      standards: []
    };

    // Score and select deployments
    if (catalog.deployments) {
      const deploymentScores = Object.entries(catalog.deployments).map(([name, lib]: [string, any]) => ({
        name,
        lib,
        score: this.scoreDeploymentRelevance(lib, projectContext)
      }));
      
      deploymentScores.sort((a, b) => b.score - a.score);
      relevant.deployments = deploymentScores.slice(0, 4).map(item => ({ ...item.lib, name: item.name }));
    }

    // Score and select domains  
    if (catalog.domains) {
      const domainScores = Object.entries(catalog.domains).map(([name, lib]: [string, any]) => ({
        name,
        lib,
        score: this.scoreDomainRelevance(lib, projectContext)
      }));
      
      domainScores.sort((a, b) => b.score - a.score);
      relevant.domains = domainScores.slice(0, 3).map(item => ({ ...item.lib, name: item.name }));
    }

    // Score and select manifests
    if (catalog.manifests) {
      const manifestScores = Object.entries(catalog.manifests).map(([name, lib]: [string, any]) => ({
        name,
        lib,
        score: this.scoreManifestRelevance(lib, projectContext)
      }));
      
      manifestScores.sort((a, b) => b.score - a.score);
      relevant.manifests = manifestScores.slice(0, 4).map(item => ({ ...item.lib, name: item.name }));
    }

    // Include relevant types
    if (catalog.types) {
      relevant.types = Object.entries(catalog.types).slice(0, 3).map(([name, lib]: [string, any]) => ({ ...lib, name }));
    }

    return relevant;
  }

  private scoreDeploymentRelevance(lib: any, context?: ProjectContext): number {
    let score = 1;

    // Scale-based scoring
    if (context?.scale) {
      const scaleScoring = {
        small: { monolith: 3, jamstack: 2, microservices: 1, enterprise: 0.5 },
        medium: { microservices: 3, monolith: 2, enterprise: 2, jamstack: 1 },
        large: { microservices: 3, enterprise: 3, monolith: 1, jamstack: 0.5 },
        enterprise: { enterprise: 3, microservices: 2, monolith: 1, jamstack: 0.5 }
      };
      score *= scaleScoring[context.scale][lib.name] || 1;
    }

    // Compliance-based scoring
    if (context?.compliance && context.compliance.length > 0) {
      if (lib.name === 'enterprise') score *= 2;
    }

    return score;
  }

  private scoreDomainRelevance(lib: any, context?: ProjectContext): number {
    let score = 1;

    // Domain matching
    if (context?.domain) {
      if (context.domain.includes(lib.name)) score *= 3;
      if (context.domain.includes('health') && lib.name === 'healthcare') score *= 3;
      if (context.domain.includes('store') || context.domain.includes('commerce') && lib.name === 'ecommerce') score *= 3;
    }

    // Type-based hints
    if (context?.type) {
      if (context.type.includes('healthcare') && lib.name === 'healthcare') score *= 2;
      if (context.type.includes('ecommerce') || context.type.includes('shop') && lib.name === 'ecommerce') score *= 2;
    }

    return score;
  }

  private scoreManifestRelevance(lib: any, context?: ProjectContext): number {
    let score = 1;

    // Technology preference matching
    if (context?.technology_preferences) {
      const prefs = context.technology_preferences.join(' ').toLowerCase();
      if (prefs.includes('next') && lib.name === 'nextjs') score *= 2;
      if (prefs.includes('postgres') && lib.name === 'postgresql') score *= 2;
      if (prefs.includes('auth') && lib.name === 'oauth') score *= 2;
      if (prefs.includes('sqlite') && lib.name === 'sqlite') score *= 2;
    }

    return score;
  }

  private formatLibraryGroup(libraries: any[]): LibraryGroup[] {
    return libraries.map(lib => ({
      name: lib.name,
      description: lib.description,
      ai_description: lib.ai_description,
      path: lib.path,
      expansion_factor: lib.expansion_factor || 1,
      best_for: lib.best_for || [],
      ...lib
    }));
  }
}

export class EcosystemPromptManager {
  private libraryContextGenerator: LibraryContextGenerator;
  private templateCache: Map<string, string> = new Map();

  constructor(libraryPath?: string) {
    this.libraryContextGenerator = new LibraryContextGenerator(libraryPath);
  }

  // Generate prompts for LLM Terminal users (copy-paste)
  async generateTerminalPrompt(
    userRequest: string,
    projectContext?: ProjectContext
  ): Promise<TerminalPrompt> {
    const libraryContext = await this.libraryContextGenerator.generateLibraryContext(projectContext);
    
    const systemPrompt = this.generateSystemPrompt('terminal');
    const contextPrompt = this.formatLibraryContextForTerminal(libraryContext);
    const exampleUsage = this.generateExampleUsage(userRequest, libraryContext);
    const copyInstructions = this.generateCopyInstructions();

    const userPrompt = `**User Request**: ${userRequest}

Based on the request, please:
1. Suggest the most relevant SpecVerse libraries from the catalog
2. Generate a minimal .specly specification using library imports
3. Explain the expected AI expansion and benefits
4. Show the complete workflow for implementation`;

    return {
      systemPrompt,
      contextPrompt,
      userPrompt,
      exampleUsage,
      copyInstructions,
      tokenEstimate: this.estimateTokens(systemPrompt + contextPrompt + userPrompt)
    };
  }

  // Generate prompts for Claude Code integration
  async generateClaudePrompt(
    userRequest: string,
    claudeContext: ClaudeContext
  ): Promise<ClaudePrompt> {
    const projectContext = claudeContext.projectContext;
    const libraryContext = await this.libraryContextGenerator.generateLibraryContext(projectContext);
    
    const claudeMdInstructions = this.generateClaudeMdInstructions(libraryContext);
    const sessionPrompt = this.formatSessionPrompt(userRequest, claudeContext);
    const fileContextInjection = this.generateFileContextInjection(libraryContext);
    const workflowInstructions = this.generateWorkflowInstructions();
    const libraryAwareness = this.generateLibraryAwareness(libraryContext);

    return {
      claudeMdInstructions,
      sessionPrompt,
      fileContextInjection,
      workflowInstructions,
      libraryAwareness
    };
  }

  // Generate prompts for API integration
  async generateAPIPrompt(
    workflowDefinition: any,
    apiContext: APIContext
  ): Promise<APIPrompt> {
    const projectContext = workflowDefinition.projectContext;
    const libraryContext = await this.libraryContextGenerator.generateLibraryContext(projectContext);
    
    const orchestratorPrompt = this.formatOrchestratorPrompt(workflowDefinition, libraryContext);
    const pipelineInstructions = this.generatePipelineInstructions(workflowDefinition);
    const contextInjection = this.generateAPIContextInjection(libraryContext);
    const responseHandling = this.generateResponseHandling();
    const validationCriteria = this.generateValidationCriteria();

    return {
      orchestratorPrompt,
      pipelineInstructions,
      contextInjection,
      responseHandling,
      validationCriteria
    };
  }

  private generateSystemPrompt(ecosystem: EcosystemType): string {
    const basePrompt = `You are a SpecVerse AI assistant specializing in library-first development with 90% code reduction.

SpecVerse v3.1.0 uses YAML + Conventions with AI inference that expands specifications 4x-7.6x.

Key principles:
- Library imports handle 90% of boilerplate code
- Focus on unique business logic only
- Leverage proven patterns from library ecosystem
- AI inference generates complete system architectures`;

    const ecosystemSpecific = {
      terminal: `\n\nYou're helping users create copy-paste specifications for external LLMs. Optimize for clarity and token efficiency.`,
      claude: `\n\nYou're integrated with Claude Code for file-based development. Maintain session context and provide workflow guidance.`,
      api: `\n\nYou're part of an automated orchestrator system. Generate structured, programmatically consumable responses.`
    };

    return basePrompt + ecosystemSpecific[ecosystem];
  }

  private formatLibraryContextForTerminal(libraryContext: LibraryContext): string {
    let context = '## 🚀 SpecVerse Libraries (90% Code Reduction)\n\n';

    // Format deployments
    if (libraryContext.deployments.length > 0) {
      context += '### Deployment Libraries (Choose deployment pattern)\n';
      libraryContext.deployments.forEach(lib => {
        const importPath = `@specverse/deployments/${lib.name}`;
        context += `- **${lib.name}**: ${lib.description} | \`${importPath}\` | ${lib.expansion_factor}x expansion | Best for: ${lib.best_for.slice(0, 2).join(', ')}\n`;
      });
      context += '\n';
    }

    // Format domains  
    if (libraryContext.domains.length > 0) {
      context += '### Domain Libraries (Pre-built business models)\n';
      libraryContext.domains.forEach(lib => {
        const importPath = `@specverse/domains/${lib.name}`;
        const models = lib.models ? ` | ${lib.models.slice(0, 3).join(', ')} models` : '';
        const compliance = lib.compliance && lib.compliance.length > 0 ? ` | ${lib.compliance.join(', ')} compliant` : '';
        context += `- **${lib.name}**: ${lib.description} | \`${importPath}\`${models}${compliance}\n`;
      });
      context += '\n';
    }

    // Format manifests
    if (libraryContext.manifests.length > 0) {
      context += '### Framework Libraries (Technology integration)\n';
      libraryContext.manifests.forEach(lib => {
        const importPath = `@specverse/manifests/${lib.name}`;
        const framework = lib.framework ? ` ${lib.framework}` : '';
        context += `- **${lib.name}**:${framework} ${lib.description} | \`${importPath}\`\n`;
      });
      context += '\n';
    }

    context += '💡 **Pro Tip**: Import libraries first, then add minimal business logic. AI inference handles the rest!\n';

    return context;
  }

  private generateExampleUsage(userRequest: string, libraryContext: LibraryContext): string {
    const suggestedDeployment = libraryContext.deployments[0]?.name || 'monolith';
    const suggestedDomains = libraryContext.domains.slice(0, 1).map(d => d.name);
    
    return `## 📝 Suggested Structure

\`\`\`yaml
version: "3.1.0"

imports:
  - "@specverse/deployments/${suggestedDeployment}"
${suggestedDomains.map(domain => `  - "@specverse/domains/${domain}"`).join('\n')}

components:
  YourApp:
    # Add your specific business logic here
    # Libraries provide 90% of standard functionality
    models:
      # Your domain-specific models
    
    controllers:
      # Your specific endpoints
      
# Result: ${libraryContext.deployments[0]?.expansion_factor || 4}x expansion with AI inference
\`\`\``;
  }

  private generateCopyInstructions(): string {
    return `## 📋 How to Use This Response

1. **Copy the .specly specification** to a file (e.g., \`main.specly\`)
2. **Install SpecVerse CLI**: \`npm install -g @specverse/lang\`  
3. **Generate full system**: \`specverse process main.specly\`
4. **View diagrams**: \`specverse generate main.specly --uml all\`

The AI inference will expand your minimal specification into a complete system architecture.`;
  }

  private generateClaudeMdInstructions(libraryContext: LibraryContext): string {
    return `# SpecVerse Project - Claude Code Integration

This project uses SpecVerse v3.1.0 with library ecosystem for 90% code reduction.

## Available Libraries Context

${this.formatLibraryContextForClaude(libraryContext)}

## Claude AI Assistant Instructions

**Library-First Development**: Always suggest relevant libraries before custom code
**90% Code Reduction**: Use imports to minimize boilerplate  
**AI Inference Awareness**: Specifications expand 4x-7.6x automatically

### When making suggestions:
- Recommend libraries from the catalog above
- Show import syntax with \`@specverse/\` prefix
- Focus on unique business logic
- Validate after changes with \`specverse validate\``;
  }

  private formatLibraryContextForClaude(libraryContext: LibraryContext): string {
    let context = '';

    context += '### 🚀 Deployment Libraries\n';
    libraryContext.deployments.forEach(lib => {
      context += `- **${lib.name}**: \`@specverse/deployments/${lib.name}\` - ${lib.description} (${lib.expansion_factor}x expansion)\n`;
    });

    if (libraryContext.domains.length > 0) {
      context += '\n### 📊 Domain Libraries\n';
      libraryContext.domains.forEach(lib => {
        context += `- **${lib.name}**: \`@specverse/domains/${lib.name}\` - ${lib.description}\n`;
      });
    }

    context += '\n### ⚙️ Framework Libraries\n';
    libraryContext.manifests.forEach(lib => {
      context += `- **${lib.name}**: \`@specverse/manifests/${lib.name}\` - ${lib.description}\n`;
    });

    return context;
  }

  private formatSessionPrompt(userRequest: string, claudeContext: ClaudeContext): string {
    return `**Session Context**: SpecVerse development with library integration

**User Request**: ${userRequest}

**Working Directory**: ${claudeContext.workingDirectory}
**Session ID**: ${claudeContext.sessionId}

**Library Recommendations**: Based on context, suggest relevant libraries and show how they reduce development effort.`;
  }

  private generateFileContextInjection(libraryContext: LibraryContext): string {
    return `## File Context Enhancement

When analyzing files, consider:
- Current library imports and opportunities for additional ones
- Business logic that could be replaced by library patterns
- Deployment complexity and appropriate library suggestions
- Domain model alignment with available libraries

**Available for import**: ${libraryContext.deployments.length + libraryContext.domains.length + libraryContext.manifests.length} libraries`;
  }

  private generateWorkflowInstructions(): string {
    return `## Workflow Commands

\`\`\`bash
# Validate specification
specverse validate specs/main.specly

# Process with AI inference
specverse process specs/main.specly  

# Generate diagrams
specverse generate specs/main.specly --uml all
\`\`\``;
  }

  private generateLibraryAwareness(libraryContext: LibraryContext): string {
    return `## Library Awareness Context

**Current session libraries**: Track usage and suggest complementary libraries
**Expansion tracking**: Monitor specification growth with library integration  
**Optimization opportunities**: Identify custom code that could use library patterns`;
  }

  private formatOrchestratorPrompt(workflowDefinition: any, libraryContext: LibraryContext): string {
    return `## API Orchestrator Context

**Workflow**: ${workflowDefinition.name || 'specification_generation'}
**Project Type**: ${workflowDefinition.projectType || 'general'}

**Available Libraries**: ${this.formatLibraryContextForAPI(libraryContext)}

**Instructions**: Generate structured specification with library imports optimized for the project requirements.`;
  }

  private formatLibraryContextForAPI(libraryContext: LibraryContext): string {
    const totalLibraries = libraryContext.deployments.length + libraryContext.domains.length + libraryContext.manifests.length;
    return `${totalLibraries} libraries available for integration (${libraryContext.deployments.length} deployment, ${libraryContext.domains.length} domain, ${libraryContext.manifests.length} manifest)`;
  }

  private generatePipelineInstructions(workflowDefinition: any): string {
    return `## Pipeline Integration

**Automation Level**: ${workflowDefinition.automationLevel || 'full'}
**Output Format**: Structured JSON with library metadata
**Validation**: Include library compatibility checks`;
  }

  private generateAPIContextInjection(libraryContext: LibraryContext): string {
    return `## Context Injection for API

Library recommendations based on:
- Project scale and complexity requirements
- Domain alignment with available models
- Technology stack compatibility
- Performance and expansion optimization
- Compliance and security requirements`;
  }

  private generateResponseHandling(): string {
    return `## API Response Handling

Return structured response with:
- Generated specification with imports
- Library usage analysis and expansion factor  
- Validation results and compatibility checks
- Optimization recommendations`;
  }

  private generateValidationCriteria(): string {
    return `## Validation Criteria

- Library imports are syntactically correct
- Compatibility between selected libraries verified
- Expansion factor calculation accurate
- Business logic properly separated from library functionality`;
  }

  private estimateTokens(text: string): number {
    // Rough token estimation (4 characters ≈ 1 token)
    return Math.ceil(text.length / 4);
  }
}

export default EcosystemPromptManager;