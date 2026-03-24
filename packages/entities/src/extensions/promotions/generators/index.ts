/**
 * Promotion Generators
 *
 * Provides code generation hints for the realize engine when
 * promotions are present in a specification.
 */

export const promotionGenerators = {
  /**
   * Generate promotion-related documentation snippets
   */
  generateDocs(promotions: any[]): string {
    if (!promotions || promotions.length === 0) return '';

    const lines: string[] = [];
    lines.push('## Promotions');
    lines.push('');
    for (const promo of promotions) {
      lines.push(`### ${promo.name}`);
      if (promo.description) lines.push(promo.description);
      lines.push(`- **Type**: ${promo.type}`);
      lines.push(`- **Discount**: ${promo.discount}`);
      if (promo.appliesTo?.length > 0) {
        lines.push(`- **Applies to**: ${promo.appliesTo.join(', ')}`);
      }
      if (promo.validUntil) lines.push(`- **Valid until**: ${promo.validUntil}`);
      if (promo.requires?.length > 0) {
        lines.push(`- **Requires**: ${promo.requires.join(', ')}`);
      }
      if (promo.stackable) lines.push(`- **Stackable**: yes`);
      if (promo.code) lines.push(`- **Code**: \`${promo.code}\``);
      lines.push('');
    }
    return lines.join('\n');
  },
};

export default promotionGenerators;
