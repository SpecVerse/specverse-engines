/**
 * Measure Convention Processor
 *
 * Transforms raw YAML measure definitions into structured MeasureSpec objects.
 * Measures define aggregation semantics — computed values over model fields
 * with dimensional breakdowns for analytics, KPIs, and metrics.
 */

import { AbstractProcessor } from '@specverse/types';

/**
 * A fully-expanded measure specification.
 *
 * Each measure defines an aggregation over a source model's field(s),
 * optionally filtered and broken down by dimensions.
 */
export interface MeasureSpec {
  /** Measure identifier (camelCase) */
  name: string;
  /** Human-readable description of what this measure computes */
  description?: string;
  /** Source model name that this measure aggregates over */
  source: string;
  /** Aggregation function: sum, count, avg, min, max, custom */
  aggregation: string;
  /** Field on the source model to aggregate (for simple aggregations) */
  field?: string;
  /** Computation expression (for derived/custom aggregations) */
  computation?: string;
  /** Filter expression limiting which records are included */
  filter?: string;
  /** Dimensional breakdowns for slicing the measure */
  dimensions?: string[];
  /** Display format hint (e.g., 'currency', 'percentage', 'integer') */
  format?: string;
}

/**
 * Processes raw YAML measure definitions into MeasureSpec objects.
 *
 * Input format:
 * ```yaml
 * measures:
 *   revenue:
 *     source: Order
 *     aggregation: sum
 *     field: totalAmount
 *     filter: "status = completed"
 *     dimensions: [time, region]
 * ```
 */
export class MeasureProcessor extends AbstractProcessor<any, MeasureSpec[]> {
  process(measuresData: any): MeasureSpec[] {
    if (!measuresData || typeof measuresData !== 'object') {
      return [];
    }

    return Object.entries(measuresData).map(([measureName, measureDef]: [string, any]) => {
      if (!measureDef || typeof measureDef !== 'object') {
        this.addWarning(`Measure '${measureName}' has invalid definition, skipping.`);
        return null;
      }

      if (!measureDef.source) {
        this.addWarning(`Measure '${measureName}' is missing required 'source' property.`);
      }

      if (!measureDef.aggregation) {
        this.addWarning(`Measure '${measureName}' is missing required 'aggregation' property.`);
      }

      const spec: MeasureSpec = {
        name: measureName,
        source: measureDef.source,
        aggregation: measureDef.aggregation,
      };
      if (measureDef.description) spec.description = measureDef.description;
      if (measureDef.field) spec.field = measureDef.field;
      if (measureDef.computation) spec.computation = measureDef.computation;
      if (measureDef.filter) spec.filter = measureDef.filter;
      if (measureDef.dimensions) spec.dimensions = measureDef.dimensions;
      if (measureDef.format) spec.format = measureDef.format;
      return spec;
    }).filter((m): m is MeasureSpec => m !== null);
  }
}
