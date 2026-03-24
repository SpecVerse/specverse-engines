/**
 * PromptToolsService
 * Updated to use new src/ai/ commands for Phase 3 integration
 */

import { LibraryToolsService } from './LibraryToolsService.js';
import type { ResourceProvider } from '../interfaces/ResourceProvider.js';
import type { 
  PromptContext, 
  MCPToolResult,
  LibrarySuggestion
} from '../types/index.js';

// Import AI commands from local package - same API as external developers
import { enhancePrompt, suggestLibraries } from '../../../../dist/index.js';
import type { UserRequirements, EnhancedPrompt } from '../../../../dist/index.js';

interface ExpandedPrompt {
  system_prompt: string;
  user_prompt: string;
  context?: string;
  examples?: string[];
  libraries?: LibrarySuggestion[];
}

interface ValidationInstructions {
  command: string;
  description: string;
  expected_output: string;
  common_issues: string[];
  fix_suggestions: string[];
}

export class PromptToolsService {
  private resourcesProvider: ResourceProvider;
  private libraryTools: LibraryToolsService;

  constructor(
    resourcesProvider: ResourceProvider, 
    libraryTools: LibraryToolsService
  ) {
    this.resourcesProvider = resourcesProvider;
    this.libraryTools = libraryTools;
  }

  async getCreationPrompt(context: PromptContext): Promise<MCPToolResult> {
    try {
      // Validate and sanitize input context
      const sanitizedContext = this.sanitizeContext(context);
      
      // Use CLI bridge to call the new AI API
      const result = await this.callAICommand('enhance', 'create', {
        requirements: sanitizedContext.requirements || '',
        scale: this.mapScale(sanitizedContext.scale),
        framework: sanitizedContext.preferredTech,
        technology_preferences: sanitizedContext.preferredTech ? [sanitizedContext.preferredTech] : undefined
      });

      // Format the response to match MCP expectations
      const expandedPrompt = {
        system_prompt: result.systemPrompt,
        user_prompt: result.userPrompt,
        context: result.contextPrompt,
        libraries: result.libraryContext?.suggestions?.slice(0, 5) || [],
        estimated_tokens: result.estimatedTokens,
        execution_options: result.executionOptions
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(expandedPrompt, null, 2)
        }]
      };
    } catch (error) {
      return this.createErrorResult('getCreationPrompt', error);
    }
  }

  async getAnalysisPrompt(context: PromptContext): Promise<MCPToolResult> {
    try {
      const sanitizedContext = this.sanitizeContext(context);
      
      const result = await this.callAICommand('enhance', 'analyse', {
        requirements: sanitizedContext.projectType || 'code analysis',
        framework: sanitizedContext.frameworkHint
      });

      const expandedPrompt = {
        system_prompt: result.systemPrompt,
        user_prompt: result.userPrompt,
        context: result.contextPrompt,
        estimated_tokens: result.estimatedTokens,
        execution_options: result.executionOptions
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(expandedPrompt, null, 2)
        }]
      };
    } catch (error) {
      return this.createErrorResult('getAnalysisPrompt', error);
    }
  }

  async getImplementationPrompt(context: PromptContext): Promise<MCPToolResult> {
    try {
      const sanitizedContext = this.sanitizeContext(context);
      
      const result = await this.callAICommand('enhance', 'materialise', {
        requirements: `implementation planning for ${sanitizedContext.targetFramework || 'specified framework'}`,
        framework: sanitizedContext.targetFramework,
        technology_preferences: sanitizedContext.deploymentType ? [sanitizedContext.deploymentType] : undefined
      });

      const expandedPrompt = {
        system_prompt: result.systemPrompt,
        user_prompt: result.userPrompt,
        context: result.contextPrompt,
        estimated_tokens: result.estimatedTokens,
        execution_options: result.executionOptions
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(expandedPrompt, null, 2)
        }]
      };
    } catch (error) {
      return this.createErrorResult('getImplementationPrompt', error);
    }
  }

  async getRealizationPrompt(context: PromptContext): Promise<MCPToolResult> {
    try {
      const sanitizedContext = this.sanitizeContext(context);
      
      const result = await this.callAICommand('enhance', 'realize', {
        requirements: `code generation for ${sanitizedContext.targetFramework || 'specified framework'}`,
        framework: sanitizedContext.targetFramework,
        scale: this.mapScale(sanitizedContext.implementationScope)
      });

      const expandedPrompt = {
        system_prompt: result.systemPrompt,
        user_prompt: result.userPrompt,
        context: result.contextPrompt,
        estimated_tokens: result.estimatedTokens,
        execution_options: result.executionOptions
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(expandedPrompt, null, 2)
        }]
      };
    } catch (error) {
      return this.createErrorResult('getRealizationPrompt', error);
    }
  }

  async getValidationInstructions(args: { validationType?: string }): Promise<MCPToolResult> {
    try {
      const validationType = args.validationType || 'syntax';
      const instructions = this.generateValidationInstructions(validationType);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(instructions, null, 2)
        }]
      };
    } catch (error) {
      return this.createErrorResult('getValidationInstructions', error);
    }
  }

  private parseTemplate(template: any): { systemRole: string, systemContext: string, userTemplate: string } {
    return {
      systemRole: template?.system?.role || template?.system_role || '',
      systemContext: template?.system?.context || template?.system_context || '',
      userTemplate: template?.user?.template || template?.user_template || ''
    };
  }

  private expandCreationPrompt(template: any, context: any): ExpandedPrompt {
    const { requirements, scale = 'business', preferredTech = 'auto', libraries = [], reasoning = '' } = context;

    // Parse template structure
    const { systemRole, systemContext, userTemplate } = this.parseTemplate(template);

    // Build system prompt
    let systemPrompt = systemRole + '\\n\\n' + systemContext;
    
    // Add scale-specific guidance
    systemPrompt += '\\n\\n' + this.getScaleGuidance(scale);

    // Add library context
    if (libraries.length > 0) {
      systemPrompt += '\\n\\nLIBRARY CONTEXT:\\n';
      systemPrompt += `Consider these relevant SpecVerse libraries: ${libraries.map((lib: any) => lib.name).join(', ')}\\n`;
      systemPrompt += `Library selection reasoning: ${reasoning}`;
    }

    // Expand user prompt with MAXIMUM safety
    let userPrompt = '';
    
    try {
      // Convert template to string safely
      if (userTemplate === null || userTemplate === undefined) {
        userPrompt = '';
      } else if (typeof userTemplate === 'string') {
        userPrompt = userTemplate;
      } else {
        userPrompt = String(userTemplate);
      }
      
      // Perform template variable replacements
      if (userPrompt && userPrompt.length > 0 && typeof userPrompt === 'string') {
        userPrompt = userPrompt.replace(/\\{\\{requirements\\}\\}/g, requirements || 'Not specified');
        userPrompt = userPrompt.replace(/\\{\\{scale\\}\\}/g, scale);
        userPrompt = userPrompt.replace(/\\{\\{preferredTech\\}\\}/g, preferredTech);
      }
    } catch (error) {
      userPrompt = '';
    }

    // Add constraints
    const constraints = template.system_constraints?.join('\\n- ') || '';
    const contextSection = constraints ? `\\nCONSTRAINTS:\\n- ${constraints}` : '';

    return {
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      context: contextSection,
      libraries: libraries.slice(0, 5)
    };
  }

  private expandAnalysisPrompt(template: any, context: any): ExpandedPrompt {
    const { projectType, frameworkHint } = context;
    
    const { systemRole, systemContext, userTemplate } = this.parseTemplate(template);
    let systemPrompt = systemRole + '\\n\\n' + systemContext;

    // Add project type guidance
    if (projectType) {
      systemPrompt += `\\n\\nPROJECT TYPE: ${projectType}`;
      systemPrompt += this.getProjectTypeGuidance(projectType);
    }

    let userPrompt = userTemplate || '';
    
    // Additional safety check - ensure userPrompt is a string
    if (typeof userPrompt !== 'string') {
      userPrompt = '';
    }
    
    if (userPrompt && userPrompt.length > 0) {
      try {
        userPrompt = userPrompt.replace(/\\{\\{frameworkType\\}\\}/g, frameworkHint || 'auto-detect');
      } catch (error) {
        console.warn('Error during analysis template replacement:', error);
        userPrompt = `Template expansion failed: ${userTemplate}`;
      }
    }

    const analysisInstructions = `
ANALYSIS INSTRUCTIONS:
1. Scan the following files for models, controllers, and services
2. Identify relationships between data models
3. Extract API endpoints and map to controller actions
4. Detect business logic patterns and event flows
5. Generate a clean SpecVerse specification

Please provide the directory structure and key file contents for analysis.`;

    return {
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      context: analysisInstructions
    };
  }

  private expandImplementationPrompt(template: any, context: any): ExpandedPrompt {
    const { targetFramework, deploymentType } = context;

    const { systemRole, systemContext, userTemplate } = this.parseTemplate(template);
    let systemPrompt = systemRole + '\\n\\n' + systemContext;
    systemPrompt += `\\n\\nTARGET FRAMEWORK: ${targetFramework}`;
    
    if (deploymentType) {
      systemPrompt += `\\nDEPLOYMENT TYPE: ${deploymentType}`;
    }

    let userPrompt = userTemplate || '';
    
    // Additional safety check - ensure userPrompt is a string
    if (typeof userPrompt !== 'string') {
      userPrompt = '';
    }
    
    if (userPrompt && userPrompt.length > 0) {
      try {
        userPrompt = userPrompt.replace(/\\{\\{targetFramework\\}\\}/g, targetFramework);
      } catch (error) {
        console.warn('Error during implementation template replacement:', error);
        userPrompt = `Template expansion failed: ${userTemplate}`;
      }
    }

    const implementationContext = `
IMPLEMENTATION PLANNING FOCUS:
1. Break down the specification into implementable modules
2. Define file structure and component organization  
3. Identify dependencies and integration points
4. Create development workflow and build process
5. Plan testing strategy and deployment pipeline

Framework-specific patterns for ${targetFramework} will be prioritized.`;

    return {
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      context: implementationContext
    };
  }

  private expandRealizationPrompt(template: any, context: any): ExpandedPrompt {
    const { targetFramework, implementationScope = 'full' } = context;

    const { systemRole, systemContext, userTemplate } = this.parseTemplate(template);
    let systemPrompt = systemRole + '\\n\\n' + systemContext;
    systemPrompt += `\\n\\nTARGET FRAMEWORK: ${targetFramework}`;
    systemPrompt += `\\nSCOPE: ${implementationScope}`;

    let userPrompt = userTemplate || '';
    
    // Additional safety check - ensure userPrompt is a string
    if (typeof userPrompt !== 'string') {
      userPrompt = '';
    }
    
    if (userPrompt && userPrompt.length > 0) {
      try {
        userPrompt = userPrompt.replace(/\\{\\{targetFramework\\}\\}/g, targetFramework);
      } catch (error) {
        console.warn('Error during realization template replacement:', error);
        userPrompt = `Template expansion failed: ${userTemplate}`;
      }
    }

    const scopeGuidance = this.getScopeGuidance(implementationScope);
    
    return {
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      context: scopeGuidance
    };
  }

  private getScaleGuidance(scale: string): string {
    switch (scale) {
      case 'personal':
        return `
PERSONAL SCALE GUIDANCE:
- Focus on simplicity and ease of use
- Minimize dependencies and complexity
- Single-user scenarios are acceptable
- SQLite and local storage are preferred
- Simple authentication patterns`;

      case 'enterprise':
        return `
ENTERPRISE SCALE GUIDANCE:
- Multi-tenant architecture required
- Comprehensive audit trails and logging
- Role-based access control (RBAC)
- High availability and scalability
- Compliance considerations (SOX, GDPR, HIPAA)
- Microservices patterns preferred`;

      default: // business
        return `
BUSINESS SCALE GUIDANCE:
- Multi-user support with role management
- Professional authentication (OAuth)
- Relational database (PostgreSQL preferred)
- API-first architecture
- Moderate scalability requirements`;
    }
  }

  private getProjectTypeGuidance(projectType: string): string {
    switch (projectType.toLowerCase()) {
      case 'web':
        return '\\nFocus on: Controllers for pages, Services for business logic, Events for user interactions';
      case 'api':
        return '\\nFocus on: RESTful endpoints, Data models, Service layers, Authentication';
      case 'mobile':
        return '\\nFocus on: Screen controllers, Local storage, Sync patterns, Offline support';
      default:
        return '\\nUse general analysis patterns for all architectural components';
    }
  }

  private getScopeGuidance(scope: string): string {
    switch (scope) {
      case 'mvp':
        return `
MVP SCOPE:
- Essential features only
- Minimal error handling
- Basic styling and UX
- Skip advanced features
- Focus on core user journey`;

      case 'prototype':
        return `
PROTOTYPE SCOPE:
- Rapid development approach
- Mock data acceptable
- Basic functionality demonstration
- Minimal production considerations`;

      default: // full
        return `
FULL IMPLEMENTATION SCOPE:
- Complete feature set
- Production-ready code quality
- Comprehensive error handling
- Full testing coverage
- Security best practices`;
    }
  }

  private generateValidationInstructions(validationType: string): ValidationInstructions {
    switch (validationType) {
      case 'syntax':
        return {
          command: 'specverse check specs/main.specly',
          description: 'Validate SpecVerse specification syntax',
          expected_output: 'Specification is valid',
          common_issues: [
            'Invalid YAML syntax',
            'Missing required fields',
            'Incorrect property names',
            'Invalid relationship syntax'
          ],
          fix_suggestions: [
            'Check YAML indentation (use spaces, not tabs)',
            'Ensure all required fields are present',
            'Verify property names match schema',
            'Use correct relationship syntax: hasMany, belongsTo, etc.'
          ]
        };

      case 'semantic':
        return {
          command: 'specverse check specs/main.specly --semantic',
          description: 'Validate semantic consistency and relationships',
          expected_output: 'No semantic errors found',
          common_issues: [
            'Circular relationship dependencies',
            'Missing relationship targets',
            'Inconsistent naming conventions',
            'Unreferenced models'
          ],
          fix_suggestions: [
            'Check for circular references in relationships',
            'Ensure all relationship targets exist',
            'Use consistent PascalCase for models',
            'Remove unused models or add references'
          ]
        };

      default:
        return {
          command: 'specverse check specs/main.specly',
          description: 'Basic specification validation',
          expected_output: 'Validation successful',
          common_issues: ['Syntax errors', 'Schema violations'],
          fix_suggestions: ['Fix syntax errors', 'Follow SpecVerse schema']
        };
    }
  }

  private mapScale(scale: string | undefined): 'personal' | 'business' | 'enterprise' {
    switch (scale) {
      case 'personal':
      case 'mvp':
      case 'prototype':
        return 'personal';
      case 'enterprise':
      case 'full':
        return 'enterprise';
      default:
        return 'business';
    }
  }

  /**
   * Call AI commands directly using src/ai/ API.
   * This provides better integration and type safety than CLI calls.
   */
  private async callAICommand(action: string, operation: string, params: any): Promise<EnhancedPrompt> {
    try {
      // Convert params to UserRequirements format
      const requirements: UserRequirements = {
        requirements: params.requirements || '',
        scale: params.scale as 'personal' | 'business' | 'enterprise' || 'business',
        framework: params.framework,
        technology_preferences: params.technology_preferences
      };

      // Call the enhance command directly from src/ai/
      if (action === 'enhance') {
        return await enhancePrompt(operation as any, requirements);
      } else {
        throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      console.warn('Direct API call failed, falling back to basic prompt:', error);
      // Fallback to basic prompt structure matching EnhancedPrompt interface
      return {
        systemPrompt: `You are a SpecVerse specification ${operation} expert.`,
        userPrompt: `Please ${operation} a specification for: ${params.requirements}`,
        contextPrompt: `Scale: ${params.scale || 'business'}, Framework: ${params.framework || 'auto'}`,
        estimatedTokens: 1000,
        variables: [],
        libraryContext: { 
          total: 0, 
          suggestions: [], 
          reasoning: 'Basic fallback mode - no library suggestions available' 
        },
        executionOptions: [
          { provider: 'interactive', description: 'Interactive copy-paste (Free)', estimatedCost: 0 },
          { provider: 'openai', description: 'OpenAI GPT-3.5 ($0.002)', estimatedCost: 0.002 },
          { provider: 'openai', description: 'OpenAI GPT-4 ($0.03)', estimatedCost: 0.03 }
        ]
      };
    }
  }

  private sanitizeContext(context: any): PromptContext {
    // Handle null/undefined context
    if (!context || typeof context !== 'object') {
      return { requirements: '', scale: 'business', preferredTech: 'auto' };
    }

    // Create sanitized context with string conversion for all values
    const sanitized: any = {};
    
    // Convert all values to proper strings, handling backticks and other issues
    for (const [key, value] of Object.entries(context)) {
      if (value === null || value === undefined) {
        sanitized[key] = '';
      } else if (typeof value === 'string') {
        // Clean up any backtick template literals that might have gotten through
        sanitized[key] = String(value).trim();
      } else {
        // Convert non-strings to strings
        sanitized[key] = String(value).trim();
      }
    }

    // Ensure required fields have safe defaults
    return {
      requirements: sanitized.requirements || '',
      scale: sanitized.scale || 'business',
      preferredTech: sanitized.preferredTech || 'auto',
      projectType: sanitized.projectType || '',
      frameworkHint: sanitized.frameworkHint || '',
      targetFramework: sanitized.targetFramework || '',
      deploymentType: sanitized.deploymentType || '',
      implementationScope: sanitized.implementationScope || 'full',
      ...sanitized
    };
  }

  private createErrorResult(operation: string, error: any): MCPToolResult {
    return {
      content: [{
        type: 'text',
        text: `Error in ${operation}: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}