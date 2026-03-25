/**
 * Promotion Generator for Logical Inference
 *
 * When a component has promotions, generates:
 * - PromotionService with apply/validate/check operations
 * - PromotionApplied and PromotionExpired events
 *
 * This demonstrates the extension entity inference pattern:
 * an entity module provides a generator that plugs into the
 * inference engine's generator registry.
 */

import {
  ModelDefinition,
  ServiceSpec,
  EventSpec,
  InferenceContext,
  ValidationResult,
} from '../../core/types.js';

export interface PromotionGenerationResult {
  services: Record<string, ServiceSpec>;
  events: Record<string, EventSpec>;
  rulesUsed: number;
  validation: ValidationResult;
}

export class PromotionGenerator {
  name = 'PromotionGenerator';

  constructor(private debug: boolean = false) {}

  async loadRules(): Promise<ValidationResult> {
    // Promotion inference doesn't use JSON rule files — logic is inline
    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Generate promotion services and events from models + context.
   *
   * The context.metadata.promotions field contains the parsed promotions
   * from the convention processor.
   */
  async generate(
    models: ModelDefinition[],
    baseContext: InferenceContext
  ): Promise<PromotionGenerationResult> {
    const promotions = (baseContext as any).metadata?.promotions || [];

    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    if (promotions.length === 0) {
      return {
        services: {},
        events: {},
        rulesUsed: 0,
        validation,
      };
    }

    if (this.debug) {
      console.log(`📋 Generating inference for ${promotions.length} promotions`);
    }

    // Validate promotion targets reference real models
    const modelNames = new Set(models.map(m => m.name));
    for (const promo of promotions) {
      for (const target of promo.appliesTo || []) {
        if (!modelNames.has(target)) {
          validation.warnings.push({
            code: 'PROMO_TARGET_MISSING',
            message: `Promotion "${promo.name}" references model "${target}" which is not defined`,
            location: `promotions.${promo.name}.appliesTo`,
          });
        }
      }
    }

    // Generate PromotionService
    const promoNames = promotions.map((p: any) => p.name);
    const services: Record<string, ServiceSpec> = {
      PromotionService: {
        name: 'PromotionService',
        description: `Manages ${promotions.length} promotional offers: ${promoNames.join(', ')}`,
        operations: {
          applyPromotion: {
            description: 'Apply a promotion to an order or cart',
            parameters: [
              { name: 'promotionName', type: 'String', required: true },
              { name: 'targetId', type: 'UUID', required: true },
            ],
            returns: '{ applied: Boolean, discount: Number, message: String }',
            requires: ['promotion is active', 'target is eligible'],
            ensures: ['discount calculated correctly', 'usage count incremented'],
            publishes: ['PromotionApplied'],
          },
          validatePromoCode: {
            description: 'Validate a promotion code',
            parameters: [
              { name: 'code', type: 'String', required: true },
            ],
            returns: '{ valid: Boolean, promotion: Object | null }',
          },
          checkEligibility: {
            description: 'Check if a target is eligible for a promotion',
            parameters: [
              { name: 'promotionName', type: 'String', required: true },
              { name: 'targetId', type: 'UUID', required: true },
            ],
            returns: '{ eligible: Boolean, reasons: String[] }',
          },
          getActivePromotions: {
            description: 'Get all currently active promotions',
            returns: 'Promotion[]',
          },
        },
        subscribesTo: [],
      } as any,
    };

    // Generate events
    const events: Record<string, EventSpec> = {
      PromotionApplied: {
        name: 'PromotionApplied',
        description: 'Fired when a promotion is successfully applied',
        attributes: [
          { name: 'promotionName', type: 'String', required: true },
          { name: 'targetId', type: 'UUID', required: true },
          { name: 'discountAmount', type: 'Decimal', required: true },
          { name: 'discountType', type: 'String', required: true },
        ],
      } as any,
      PromotionExpired: {
        name: 'PromotionExpired',
        description: 'Fired when a promotion reaches its end date',
        attributes: [
          { name: 'promotionName', type: 'String', required: true },
          { name: 'totalUsageCount', type: 'Integer', required: true },
        ],
      } as any,
    };

    if (this.debug) {
      console.log(`   ✅ Generated PromotionService with ${Object.keys(services.PromotionService.operations || {}).length} operations`);
      console.log(`   ✅ Generated ${Object.keys(events).length} promotion events`);
    }

    return {
      services,
      events,
      rulesUsed: promotions.length,
      validation,
    };
  }
}
