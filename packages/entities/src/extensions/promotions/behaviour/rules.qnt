// Promotion Rules
// Operational rules governing promotion lifecycle and application

module promotionRules {

  // Calculate discount amount based on type
  pure def calculateDiscount(promoType: str, discountValue: int, price: int): int = {
    if (promoType == "percentage") price * discountValue / 100
    else if (promoType == "fixed") discountValue
    else 0
  }

  // Check if a promotion is currently active (simplified date comparison)
  pure def isActive(hasValidFrom: bool, hasValidUntil: bool, withinRange: bool): bool = {
    if (hasValidFrom and hasValidUntil) withinRange
    else if (hasValidUntil) withinRange
    else true
  }

  // Check if max uses have been exceeded
  pure def canUse(usageCount: int, maxUses: int): bool = {
    if (maxUses == 0) true  // 0 means unlimited
    else usageCount < maxUses
  }
}
