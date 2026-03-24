// Promotion Rules
// Operational rules governing promotion lifecycle and application

module promotionRules {

  // A promotion can only be applied if it is currently active
  action applyPromotion(promo: Promotion, target: any): Result = {
    require(isActive(promo), "Promotion is not active")
    require(isEligible(promo, target), "Target is not eligible")
    require(!maxUsesExceeded(promo), "Maximum uses exceeded")

    val discount = calculateDiscount(promo, target)
    val result = { applied: true, discount: discount, promotion: promo.name }

    // Post-conditions
    ensure(promo.usageCount' == promo.usageCount + 1)
    ensure(target.totalDiscount' == target.totalDiscount + discount)

    result
  }

  // Check if a promotion is currently active
  pure def isActive(promo: Promotion): bool = {
    val now = currentDate()
    (promo.validFrom == "" or promo.validFrom <= now) and
    (promo.validUntil == "" or promo.validUntil >= now)
  }

  // Check eligibility based on promotion requirements
  pure def isEligible(promo: Promotion, target: any): bool = {
    promo.appliesTo.contains(target.modelName)
  }

  // Check if max uses have been exceeded
  pure def maxUsesExceeded(promo: Promotion): bool = {
    promo.maxUses > 0 and promo.usageCount >= promo.maxUses
  }

  // Calculate discount amount based on type
  pure def calculateDiscount(promo: Promotion, target: any): Decimal = {
    match promo.type {
      "percentage" => target.price * (promo.discount / 100)
      "fixed" => promo.discount
      _ => 0
    }
  }
}
