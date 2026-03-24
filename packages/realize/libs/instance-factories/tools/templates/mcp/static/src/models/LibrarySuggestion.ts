/**
 * LibrarySuggestion Model
 * Clean implementation from extracted specification
 */

import { z } from 'zod';
import type { LibrarySuggestion } from '../types/index.js';

export const LibrarySuggestionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  path: z.string().min(1, 'Path is required'),
  type: z.enum(['deployment', 'domain', 'manifest', 'type', 'standard']),
  description: z.string().min(1, 'Description is required'),
  ai_description: z.string().min(1, 'AI description is required'),
  expansion_factor: z.number().min(1, 'Expansion factor must be >= 1'),
  complexity_level: z.enum(['low', 'medium', 'high']),
  best_for: z.array(z.string()).min(1, 'Must specify at least one use case')
});

export class LibrarySuggestionModel {
  private constructor(
    public readonly name: string,
    public readonly path: string,
    public readonly type: 'deployment' | 'domain' | 'manifest' | 'type' | 'standard',
    public readonly description: string,
    public readonly ai_description: string,
    public readonly expansion_factor: number,
    public readonly complexity_level: 'low' | 'medium' | 'high',
    public readonly best_for: string[]
  ) {}

  static create(data: LibrarySuggestion): LibrarySuggestionModel {
    const validated = LibrarySuggestionSchema.parse(data);
    
    return new LibrarySuggestionModel(
      validated.name,
      validated.path,
      validated.type,
      validated.description,
      validated.ai_description,
      validated.expansion_factor,
      validated.complexity_level,
      validated.best_for
    );
  }

  static fromJson(json: string): LibrarySuggestionModel {
    const data = JSON.parse(json);
    return this.create(data);
  }

  toJson(): string {
    return JSON.stringify({
      name: this.name,
      path: this.path,
      type: this.type,
      description: this.description,
      ai_description: this.ai_description,
      expansion_factor: this.expansion_factor,
      complexity_level: this.complexity_level,
      best_for: this.best_for
    });
  }

  matchesContext(context: string, scale: string): number {
    let score = 0;
    const contextLower = context.toLowerCase();
    
    // Check if library type matches context
    for (const useCase of this.best_for) {
      if (contextLower.includes(useCase.toLowerCase())) {
        score += 2;
      }
    }
    
    // Check complexity match with scale
    const scaleComplexity = this.getScaleComplexity(scale);
    const complexityScore = this.getComplexityScore();
    const complexityMatch = Math.abs(complexityScore - scaleComplexity);
    score += Math.max(0, 3 - complexityMatch);
    
    return score;
  }

  private getScaleComplexity(scale: string): number {
    switch (scale) {
      case 'personal': return 1;
      case 'business': return 2;
      case 'enterprise': return 3;
      default: return 2;
    }
  }

  private getComplexityScore(): number {
    switch (this.complexity_level) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  }

  getRelevanceScore(): number {
    return this.expansion_factor * this.getComplexityScore();
  }
}