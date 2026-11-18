# Billing

Owns: payments. Talks to the payment provider.
Code: `src/services/billing/`. Tests: `billing.test.ts`.

**Changes here need a person's approval before merging.** Mistakes cost real money.

## What it does

| Function | Does | Errors |
|---|---|---|
| `charge(orderId, amountCents)` | Charges the provider and stores a payment | 400 zero amount, `RangeError` for floats or negatives |
| `refund(paymentId)` | Refunds the whole payment | 404 unknown payment, 409 already refunded |
| `get(paymentId)` | Returns a copy of the payment | |

## Rules

- **One payment per order.** `charge` remembers which payment belongs to each order and returns it
  instead of charging again. It also sends the provider an idempotency key (`order:<id>`), so a retry
  after a timeout can't double-charge.
- **Full refunds only.** Partial refunds would need order lines to track what was refunded. Write a
  decision record before adding them.
- **Store only the provider's payment id.** Never card numbers, tokens or provider secrets.

## The provider

`PaymentProvider` is the boundary to the outside world:

```ts
interface PaymentProvider {
  charge(amountCents: Cents, idempotencyKey: string): Promise<{ providerId: string }>;
  refund(providerId: string): Promise<void>;
}
```

`createFakeProvider()` always succeeds. Tests that need failures write their own small provider.

## API

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/payments/:id` | 200, the payment | 404 |

## Related

- [runbooks/refund-failed.md](runbooks/refund-failed.md)
- [runbooks/payments-failing.md](runbooks/payments-failing.md)
