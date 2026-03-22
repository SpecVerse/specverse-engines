import { SpecVerseAST } from '../types/ast.js';

export interface ProcessorContext {
  warnings: string[];
  addWarning(message: string): void;
}

export abstract class AbstractProcessor<TInput, TOutput> {
  constructor(protected context: ProcessorContext) {}

  // abstract process(input: TInput): TOutput; - Removed to allow flexible signatures

  protected addWarning(message: string): void {
    this.context.addWarning(message);
  }
}
