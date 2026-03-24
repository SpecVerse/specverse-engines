/**
 * Promotion Inference Rules
 *
 * When a component has promotions defined, infer:
 * - A PromotionService with apply/validate/check operations
 * - Events for promotion application and expiry
 */

export const promotionInferenceRules = {
  rules: [],

  /**
   * Infer services and events from promotions definitions.
   * Called by the inference engine when promotions are present.
   */
  inferFromPromotions(promotions: any[]): { services: any[]; events: any[] } {
    if (!promotions || promotions.length === 0) return { services: [], events: [] };

    const services: any[] = [{
      name: 'PromotionService',
      description: 'Manages promotional offers — application, validation, and eligibility checking',
      operations: {
        applyPromotion: {
          description: 'Apply a promotion to an order or cart',
          parameters: ['promotionName: String', 'targetId: UUID', 'context: Object'],
          returns: '{ applied: Boolean, discount: Number, message: String }',
          requires: ['promotion must be active', 'target must be eligible'],
          ensures: ['discount is calculated correctly', 'usage count is incremented'],
        },
        validatePromoCode: {
          description: 'Validate a promotion code',
          parameters: ['code: String'],
          returns: '{ valid: Boolean, promotion: Object | null }',
        },
        checkEligibility: {
          description: 'Check if a target is eligible for a promotion',
          parameters: ['promotionName: String', 'targetId: UUID'],
          returns: '{ eligible: Boolean, reasons: String[] }',
        },
        getActivePromotions: {
          description: 'Get all currently active promotions',
          returns: 'Promotion[]',
        },
      },
    }];

    const events: any[] = [
      {
        name: 'PromotionApplied',
        description: 'Fired when a promotion is successfully applied',
        attributes: [
          { name: 'promotionName', type: 'String', required: true },
          { name: 'targetId', type: 'UUID', required: true },
          { name: 'discountAmount', type: 'Decimal', required: true },
          { name: 'discountType', type: 'String', required: true },
        ],
      },
      {
        name: 'PromotionExpired',
        description: 'Fired when a promotion reaches its end date',
        attributes: [
          { name: 'promotionName', type: 'String', required: true },
          { name: 'totalUsageCount', type: 'Integer', required: true },
        ],
      },
    ];

    return { services, events };
  },
};

export default promotionInferenceRules;
