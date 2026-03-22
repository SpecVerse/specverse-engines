/**
 * Processor interfaces — shared between parser and entity modules.
 *
 * These types break the circular dependency between parser and entities.
 * Both packages import from @specverse/types instead of from each other.
 */

export interface ProcessorContext {
  warnings: string[];
  addWarning(message: string): void;
}

export abstract class AbstractProcessor<TInput, TOutput> {
  constructor(protected context: ProcessorContext) {}

  protected addWarning(message: string): void {
    this.context.addWarning(message);
  }
}
