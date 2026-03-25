// Promotion Invariants
// Formal properties that must hold for all promotions in a SpecVerse specification

module promotionInvariants {

  // Percentage discounts must be between 0 and 100
  pure def percentageInRange(discount: int, promoType: str): bool = {
    if (promoType == "percentage") discount >= 0 and discount <= 100
    else true
  }

  // maxUses must be positive when set
  pure def maxUsesValid(maxUses: int): bool = {
    maxUses >= 0
  }

  // Discount must be non-negative
  pure def discountNonNegative(discount: int): bool = {
    discount >= 0
  }
}
