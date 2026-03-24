// Promotion Invariants
// Formal properties that must hold for all promotions in a SpecVerse specification

module promotionInvariants {

  // A promotion's discount must be positive
  val discountIsPositive = forall (p: Promotion) {
    p.discount > 0
  }

  // Percentage discounts must be between 0 and 100
  val percentageInRange = forall (p: Promotion) {
    p.type == "percentage" implies (p.discount >= 0 and p.discount <= 100)
  }

  // validFrom must be before validUntil when both are set
  val dateRangeValid = forall (p: Promotion) {
    (p.validFrom != "" and p.validUntil != "") implies p.validFrom < p.validUntil
  }

  // appliesTo must reference existing models
  val appliesToValidModels = forall (p: Promotion) {
    forall (modelName: p.appliesTo) {
      exists (m: Model) { m.name == modelName }
    }
  }

  // maxUses must be positive when set
  val maxUsesPositive = forall (p: Promotion) {
    p.maxUses > 0
  }

  // Promotion codes must be unique across all promotions
  val codesUnique = forall (p1: Promotion, p2: Promotion) {
    (p1.code != "" and p2.code != "" and p1.name != p2.name) implies p1.code != p2.code
  }
}
