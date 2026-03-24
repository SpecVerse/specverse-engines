/**
 * Promotion Convention Processor
 *
 * Expands shorthand promotion definitions into full structured format.
 *
 * Shorthand: "percentage=15 appliesTo=[Product,Order] validUntil=2026-12-31"
 * Expanded: { type: 'percentage', discount: '15', appliesTo: ['Product', 'Order'], validUntil: '2026-12-31' }
 */

export interface PromotionSpec {
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy-x-get-y' | 'bundle' | 'tiered';
  discount: string;
  appliesTo: string[];
  validFrom?: string;
  validUntil?: string;
  requires?: string[];
  stackable: boolean;
  maxUses?: number;
  code?: string;
}

interface ProcessorContext {
  warnings: string[];
  addWarning(msg: string): void;
}

export class PromotionProcessor {
  private context: ProcessorContext;

  constructor(context: ProcessorContext) {
    this.context = context;
  }

  process(input: any): PromotionSpec[] {
    if (!input || typeof input !== 'object') return [];

    const promotions: PromotionSpec[] = [];

    for (const [name, def] of Object.entries(input)) {
      if (typeof def === 'string') {
        promotions.push(this.parseShorthand(name, def));
      } else if (typeof def === 'object' && def !== null) {
        promotions.push(this.parseObject(name, def as any));
      }
    }

    return promotions;
  }

  private parseShorthand(name: string, shorthand: string): PromotionSpec {
    const parts = this.smartSplit(shorthand);
    const promo: PromotionSpec = {
      name,
      type: 'percentage',
      discount: '0',
      appliesTo: [],
      stackable: false,
    };

    for (const part of parts) {
      if (part.startsWith('percentage=')) {
        promo.type = 'percentage';
        promo.discount = part.split('=')[1];
      } else if (part.startsWith('fixed=')) {
        promo.type = 'fixed';
        promo.discount = part.split('=')[1];
      } else if (part.startsWith('buy=')) {
        promo.type = 'buy-x-get-y';
        promo.discount = part.replace('buy=', '').replace('-get=', ':');
      } else if (part.startsWith('appliesTo=')) {
        const match = part.match(/=\[([^\]]*)\]/);
        if (match) {
          promo.appliesTo = match[1].split(',').map(s => s.trim());
        }
      } else if (part.startsWith('validUntil=')) {
        promo.validUntil = part.split('=')[1];
      } else if (part.startsWith('validFrom=')) {
        promo.validFrom = part.split('=')[1];
      } else if (part.startsWith('requires=')) {
        const match = part.match(/=\[([^\]]*)\]/);
        if (match) {
          promo.requires = match[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          promo.requires = [part.split('=')[1].replace(/^["']|["']$/g, '')];
        }
      } else if (part === 'stackable') {
        promo.stackable = true;
      } else if (part.startsWith('maxUses=')) {
        promo.maxUses = parseInt(part.split('=')[1], 10);
      } else if (part.startsWith('code=')) {
        promo.code = part.split('=')[1].replace(/^["']|["']$/g, '');
      } else if (part.startsWith('description=')) {
        const match = part.match(/=["']([^"']*)["']/);
        promo.description = match ? match[1] : part.split('=')[1];
      }
    }

    return promo;
  }

  private parseObject(name: string, def: any): PromotionSpec {
    return {
      name,
      description: def.description,
      type: def.type || 'percentage',
      discount: String(def.discount || '0'),
      appliesTo: Array.isArray(def.appliesTo) ? def.appliesTo : (def.appliesTo ? [def.appliesTo] : []),
      validFrom: def.validFrom,
      validUntil: def.validUntil,
      requires: Array.isArray(def.requires) ? def.requires : (def.requires ? [def.requires] : undefined),
      stackable: def.stackable === true,
      maxUses: def.maxUses,
      code: def.code,
    };
  }

  private smartSplit(text: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inBrackets = 0;
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if ((char === '"' || char === "'") && (i === 0 || text[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      }
      if (!inQuotes) {
        if (char === '[') inBrackets++;
        if (char === ']') inBrackets--;
      }
      if (char === ' ' && !inQuotes && inBrackets === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }
}
