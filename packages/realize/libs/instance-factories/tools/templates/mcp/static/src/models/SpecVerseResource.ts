/**
 * SpecVerseResource Model
 * Clean implementation from extracted specification
 */

import { z } from 'zod';
import type { SpecVerseResource } from '../types/index.js';

export const SpecVerseResourceSchema = z.object({
  uri: z.string().min(1, 'URI is required').regex(/^specverse:\/\//, 'URI must start with specverse://'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  content: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export class SpecVerseResourceModel {
  private constructor(
    public readonly uri: string,
    public readonly name: string,
    public readonly description: string,
    public readonly mimeType: string,
    public readonly content?: string,
    public readonly metadata?: Record<string, any>
  ) {}

  static create(data: SpecVerseResource): SpecVerseResourceModel {
    const validated = SpecVerseResourceSchema.parse(data);
    
    return new SpecVerseResourceModel(
      validated.uri,
      validated.name,
      validated.description,
      validated.mimeType,
      validated.content,
      validated.metadata
    );
  }

  static fromJson(json: string): SpecVerseResourceModel {
    const data = JSON.parse(json);
    return this.create(data);
  }

  toJson(): string {
    return JSON.stringify({
      uri: this.uri,
      name: this.name,
      description: this.description,
      mimeType: this.mimeType,
      content: this.content,
      metadata: this.metadata
    });
  }

  withContent(content: string): SpecVerseResourceModel {
    return new SpecVerseResourceModel(
      this.uri,
      this.name,
      this.description,
      this.mimeType,
      content,
      this.metadata
    );
  }

  matches(uri: string): boolean {
    return this.uri === uri;
  }

  isLoaded(): boolean {
    return this.content !== undefined;
  }
}