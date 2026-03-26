# Promotions Entity Module

Domain extension for promotional offers, discounts, and campaigns in e-commerce specifications.

Supports both shorthand convention syntax and full object definitions, with five discount types and date-range/stacking/code controls.

## Facets

| Facet | Path | Status |
|-------|------|--------|
| Schema | `schema/promotions.schema.json` | Implemented |
| Structural conventions | `conventions/promotion-processor.ts` | Implemented |
| Behavioural conventions | `behaviour/conventions/grammar.yaml` | Implemented |
| Behaviour (Quint) | `behaviour/rules.qnt`, `behaviour/invariants.qnt` | Implemented |
| Inference rules | `inference/index.ts` | Stub (handled by PromotionGenerator in logical engine) |
| Generators | `generators/index.ts` | Implemented |
| Docs | `docs/index.ts` | Implemented |
| Tests | `tests/index.ts` | Implemented |
| Examples | `examples/` | 1 example |

## Schema Properties

Promotions accept shorthand strings or full objects. The full `PromotionDefinition` supports:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `description` | string | no | Human-readable description |
| `type` | enum | yes | One of: `percentage`, `fixed`, `buy-x-get-y`, `bundle`, `tiered` |
| `discount` | string/number | yes | Discount value (e.g., `15`, `10.00`, `"buy=3-get=1"`) |
| `appliesTo` | string[] | no | Model names this promotion targets |
| `validFrom` | string | no | Start date (ISO 8601) |
| `validUntil` | string | no | End date (ISO 8601) |
| `requires` | string/string[] | no | Conditions for the promotion to apply |
| `stackable` | boolean | no | Whether this promotion combines with others (default: false) |
| `maxUses` | integer | no | Maximum redemption count |
| `code` | string | no | Promo code that activates this promotion |

### Shorthand Syntax

```yaml
earlyBird: percentage=15 appliesTo=[Subscription] validUntil=2026-12-31 requires="signup within 7 days"
welcome10: fixed=10.00 code="WELCOME10" maxUses=1000 appliesTo=[Order]
```

## Examples

- `examples/promotions.specly` -- Full e-commerce store with 6 promotions demonstrating shorthand and object syntax

## Delivery

- Parser: yes
- Inference: yes
- Realize: yes
- CLI: no

## Dependencies

- `models` (promotions reference model names via `appliesTo`)

## See Also

- `examples/promotions.specly` -- Complete working example with Product, Customer, Order models
- `_shared/types.ts` -- `EntityModule`, `EntityConventionProcessor` interfaces
