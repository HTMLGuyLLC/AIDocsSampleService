# 0002: Money is integer cents

Status: accepted

## Decision

Every amount of money is a whole number of cents (`Cents` in `src/lib/money.ts`). Field names end in `Cents`.

## Why

Floating point can't hold most decimal amounts exactly: `0.1 + 0.2` is `0.30000000000000004`.
Add enough of those up and totals drift by a cent, which customers and accountants notice.
Payment providers also take whole cents.

## What this means

- Never store or pass dollars. Convert to dollars only for display, with `formatCents`.
- Percentages (discounts, tax) use `percentOf`, which rounds half up to a whole cent. Round once, at the end of each line, not on the order total.
- `assertCents` guards anything that reaches billing.
