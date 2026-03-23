/**
 * Action 4: Enhanced Prompt (MOST VALUABLE)
 * Combine parameter-filled template with library suggestions and cost estimates
 */

import type { AIOperation, EnhancedPrompt, UserRequirements, AICommandOptions, ExecutionOption, CostEstimate, AILibraryContext } from '../types/index.js';
import { fillTemplate } from './fill.js';
import { suggestLibraries } from './suggest.js';

export async function enhancePrompt(
  operation: AIOperation,
  requirements: UserRequirements,
  options: AICommandOptions = {}
): Promise<EnhancedPrompt> {
  try {
    // Get filled template (Action 2)
    const filledPrompt = await fillTemplate(operation, requirements, options);
    
    // Get library suggestions (Action 3)  
    const libraryContext = await suggestLibraries(requirements, options);
    
    // Generate library context string for prompt
    const libraryContextString = generateLibraryContextString(libraryContext);
    
    // Enhance the prompts with library context
    const enhancedSystemPrompt = filledPrompt.systemPrompt + '\n\n' + generateSystemLibraryGuidance();
    const enhancedUserPrompt = filledPrompt.userPrompt + '\n\n' + libraryContextString;
    
    // Calculate token estimates and costs
    const combinedContent = enhancedSystemPrompt + enhancedUserPrompt + (filledPrompt.contextPrompt || '');
    const estimatedTokens = estimateTokens(combinedContent);
    const costEstimate = calculateCosts(estimatedTokens);
    const executionOptions = generateExecutionOptions(costEstimate);
    
    return {
      systemPrompt: enhancedSystemPrompt,
      userPrompt: enhancedUserPrompt,
      contextPrompt: filledPrompt.contextPrompt,
      variables: filledPrompt.variables,
      libraryContext,
      estimatedTokens,
      estimatedCost: costEstimate.costByProvider,
      executionOptions
    };
  } catch (error) {
    throw new Error(`Failed to enhance prompt for operation '${operation}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function generateLibraryContextString(libraryContext: AILibraryContext): string {
  let context = '## 🚀 SpecVerse Library Recommendations\n\n';
  
  const deployments = libraryContext.suggestions.filter((s: any) => s.type === 'deployment');
  const domains = libraryContext.suggestions.filter((s: any) => s.type === 'domain');
  const manifests = libraryContext.suggestions.filter((s: any) => s.type === 'manifest');
  const types = libraryContext.suggestions.filter((s: any) => s.type === 'types');
  
  if (deployments.length > 0) {
    context += '### Deployment Patterns\n';
    deployments.forEach((d: any) => {
      const expansionInfo = d.expansion_factor ? ` (${d.expansion_factor}x expansion)` : '';
      context += `- **${d.name}**${expansionInfo}: ${d.rationale}\n`;
    });
    context += '\n';
  }
  
  if (domains.length > 0) {
    context += '### Domain Libraries\n';
    domains.forEach((d: any) => {
      context += `- **${d.name}**: ${d.rationale}\n`;
    });
    context += '\n';
  }
  
  if (manifests.length > 0) {
    context += '### Framework Integrations\n';
    manifests.forEach((m: any) => {
      context += `- **${m.name}**: ${m.rationale}\n`;
    });
    context += '\n';
  }
  
  if (types.length > 0) {
    context += '### Type Libraries\n';
    types.forEach((t: any) => {
      context += `- **${t.name}**: ${t.rationale}\n`;
    });
    context += '\n';
  }
  
  context += `**Reasoning**: ${libraryContext.reasoning}\n\n`;
  context += `💡 **Tip**: Import these libraries first, then add your specific business logic. The AI inference engine will handle the integration automatically.\n`;
  
  return context;
}

function generateSystemLibraryGuidance(): string {
  return `## Library-First Development Guidance

You are now equipped with SpecVerse library recommendations that can reduce development time by 60-90%. 

Key principles:
- **Import suggested libraries first** before defining custom models
- **Reference library models** in your relationships and attributes  
- **Focus on unique business logic** - libraries handle the boilerplate
- **Use SpecVerse v3.1 syntax** with proper import statements

Example import syntax:
\`\`\`yaml
imports:
  - from: "@specverse/deployments/monolith"  
  - from: "@specverse/domains/ecommerce"
    select: [Product, Order, Customer]
\`\`\``;
}

// Simple token estimation (rough approximation)
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

function calculateCosts(tokens: number): CostEstimate {
  // Cost per 1K tokens (as of 2024, approximate)
  const costs = {
    'openai-gpt4': 0.03,
    'openai-gpt3.5': 0.002,
    'anthropic-claude': 0.015,
    'local': 0,
    'interactive': 0
  };
  
  const costByProvider: Record<string, number> = {};
  Object.entries(costs).forEach(([provider, costPer1K]) => {
    costByProvider[provider] = (tokens / 1000) * costPer1K;
  });
  
  return {
    estimatedTokens: tokens,
    costByProvider,
    cheapestOption: 'local',
    fastestOption: 'openai-gpt3.5'
  };
}

function generateExecutionOptions(costEstimate: CostEstimate): ExecutionOption[] {
  return [
    {
      provider: 'interactive',
      description: 'Copy prompt to ChatGPT/Claude web interface (Free)',
      estimatedCost: 0
    },
    {
      provider: 'local', 
      model: 'llama2',
      description: 'Use local model via Ollama (Free)',
      estimatedCost: 0
    },
    {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      description: 'OpenAI GPT-3.5 (Fast, affordable)',
      estimatedCost: costEstimate.costByProvider['openai-gpt3.5']
    },
    {
      provider: 'anthropic',
      model: 'claude-3-sonnet',
      description: 'Anthropic Claude (High quality)',
      estimatedCost: costEstimate.costByProvider['anthropic-claude']
    },
    {
      provider: 'openai',
      model: 'gpt-4',
      description: 'OpenAI GPT-4 (Highest quality)',
      estimatedCost: costEstimate.costByProvider['openai-gpt4']
    }
  ];
}

export default enhancePrompt;