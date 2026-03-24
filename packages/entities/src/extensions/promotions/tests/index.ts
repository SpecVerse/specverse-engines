/**
 * Promotion Tests
 *
 * Test fixtures and helpers for the promotions entity module.
 */

export const promotionTests = {
  entityType: 'promotions',
  fixtures: {
    validShorthand: {
      earlyBird: 'percentage=15 appliesTo=[Subscription] validUntil=2026-12-31',
      welcome10: 'fixed=10.00 code="WELCOME10" maxUses=1000',
    },
    validObject: {
      summerSale: {
        type: 'percentage',
        discount: 20,
        appliesTo: ['Product'],
        validFrom: '2026-06-01',
        validUntil: '2026-08-31',
        stackable: true,
      },
    },
    invalidPercentage: {
      tooMuch: 'percentage=150 appliesTo=[Product]',
    },
    invalidDateRange: {
      backwards: {
        type: 'percentage',
        discount: 10,
        validFrom: '2026-12-31',
        validUntil: '2026-01-01',
      },
    },
  },
};

export default promotionTests;
