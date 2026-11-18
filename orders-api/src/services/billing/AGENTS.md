# Billing service

Read `docs/billing.md` before changing anything here. **Ask a person before changing how charges or refunds work.**

- `charge` must stay idempotent: one payment per order, however many times it is called.
- Only full refunds. Partial refunds need a decision record first.
- Never log or return card details or provider secrets. This service only stores the provider's payment id.
- Tests use `createFakeProvider()` or a hand-written `PaymentProvider`. Never call a real provider from tests.
