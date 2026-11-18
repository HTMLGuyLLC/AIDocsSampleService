# Order-notes service (the AI feature)

Read `docs/order-notes-ai.md` and `../../../../docs/ai-safety-and-cost.md` before changing anything here.

- **The model never sees prices and never changes them.** Output is kitchen info only: allergies, pickup time, occasion. ([why](../../../docs/decisions/0003-ai-only-for-order-notes.md))
- **Wrap the customer's note** with `wrapUntrusted` before it goes in a prompt. Never build a prompt by pasting note text in directly.
- **Validate the answer by hand** (`validate.ts`). Anything off means the keyword fallback answers and `source` is `'fallback'`.
- **`parseNote` never throws and never blocks an order.** Bad output, timeout, budget used up and kill switch all fall back.
- **Reserve budget before the call**, record usage after. A failed call keeps its reservation.
- **Changing the prompt, the model or the keyword rules?** Run `npm run eval` before and after, and say both results in the PR.
- Tests use `createFakeModel()` or a small hand-written `ModelClient`. Never call a real model from tests.
