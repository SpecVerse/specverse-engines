/**
 * Promotion Documentation
 *
 * Provides documentation generation for the promotions entity type.
 */

export const promotionDocs = {
  entityType: 'promotions',
  description: 'Promotional offers, discounts, and campaigns',
  syntaxExamples: [
    {
      title: 'Shorthand syntax',
      code: `promotions:
  earlyBird: percentage=15 appliesTo=[Subscription] validUntil=2026-12-31
  welcome10: fixed=10.00 code="WELCOME10" maxUses=1000`,
    },
    {
      title: 'Object syntax',
      code: `promotions:
  summerSale:
    type: percentage
    discount: 20
    appliesTo: [Product, Subscription]
    validFrom: 2026-06-01
    validUntil: 2026-08-31
    requires: ["cart total > 50"]
    stackable: true`,
    },
  ],
  conventionPatterns: [
    'percentage=N — percentage discount',
    'fixed=N — fixed amount discount',
    'buy=X-get=Y — buy X get Y free',
    'appliesTo=[Model1,Model2] — target models',
    'validUntil=DATE — expiry date',
    'code="CODE" — promo code',
    'stackable — can combine with other promotions',
    'maxUses=N — usage limit',
  ],
};

export default promotionDocs;
