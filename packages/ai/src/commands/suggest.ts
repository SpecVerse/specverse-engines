/**
 * Action 3: Library Suggestions
 * Generate library recommendations based on user requirements
 */

import type { UserRequirements, AILibraryContext, AICommandOptions } from '../types/index.js';
import { LibraryContextGenerator } from '../core/ecosystem-prompt-manager.js';

export async function suggestLibraries(
  requirements: UserRequirements,
  options: AICommandOptions = {}
): Promise<AILibraryContext> {
  try {
    const libraryGenerator = new LibraryContextGenerator();
    
    // Convert UserRequirements to ProjectContext format expected by LibraryContextGenerator
    const projectContext = {
      type: inferProjectType(requirements),
      domain: requirements.domain || inferDomain(requirements),
      scale: mapScale(requirements.scale || 'business'),
      compliance: requirements.compliance,
      technology_preferences: requirements.technology_preferences
    };
    
    const libraryContext = await libraryGenerator.generateLibraryContext(projectContext);
    
    // Transform to our LibraryContext format
    const suggestions = [
      ...libraryContext.deployments.map(d => ({
        type: 'deployment' as const,
        name: d.name,
        description: d.ai_description || d.description,
        rationale: d.ai_description || `Best for ${d.description}`,
        expansion_factor: d.expansion_factor,
        compliance: d.compliance
      })),
      ...libraryContext.domains.map(d => ({
        type: 'domain' as const,
        name: d.name,
        description: d.ai_description || d.description,
        rationale: d.ai_description || `Provides ${d.description}`,
        compliance: d.compliance
      })),
      ...libraryContext.manifests.map(m => ({
        type: 'manifest' as const,
        name: m.name,
        description: m.ai_description || m.description,
        rationale: m.ai_description || `Integrates ${m.description}`,
        compliance: m.compliance
      })),
      ...libraryContext.types.map(t => ({
        type: 'types' as const,
        name: t.name,
        description: t.ai_description || t.description,
        rationale: t.ai_description || `Provides ${t.description}`
      }))
    ];
    
    return {
      suggestions,
      total: suggestions.length,
      reasoning: generateReasoning(requirements, suggestions)
    };
  } catch (error) {
    throw new Error(`Failed to generate library suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function mapScale(scale: 'personal' | 'business' | 'enterprise'): 'small' | 'medium' | 'large' | 'enterprise' {
  switch (scale) {
    case 'personal': return 'small';
    case 'business': return 'medium';
    case 'enterprise': return 'enterprise';
    default: return 'medium';
  }
}

function inferProjectType(requirements: UserRequirements): string {
  const req = requirements.requirements.toLowerCase();
  
  if (req.includes('ecommerce') || req.includes('store') || req.includes('shop')) {
    return 'ecommerce-store';
  }
  if (req.includes('blog') || req.includes('content') || req.includes('cms')) {
    return 'content-site';
  }
  if (req.includes('healthcare') || req.includes('medical') || req.includes('patient')) {
    return 'healthcare-management';
  }
  if (req.includes('business') || req.includes('enterprise') || req.includes('corporate')) {
    return 'business-application';
  }
  
  return 'general-application';
}

function inferDomain(requirements: UserRequirements): string {
  const req = requirements.requirements.toLowerCase();
  
  if (req.includes('ecommerce') || req.includes('store')) return 'ecommerce';
  if (req.includes('healthcare') || req.includes('medical')) return 'healthcare';
  if (req.includes('business') || req.includes('enterprise')) return 'business';
  
  return 'general';
}

function generateReasoning(requirements: UserRequirements, suggestions: any[]): string {
  const projectType = inferProjectType(requirements);
  const scale = requirements.scale || 'business';
  
  return `Based on your requirements for "${requirements.requirements}", ` +
         `I've identified this as a ${projectType} at ${scale} scale. ` +
         `The ${suggestions.length} suggested libraries will provide proven patterns and reduce development time significantly.`;
}

export default suggestLibraries;