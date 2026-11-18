# AI features: safety and cost

Company rules for any feature that calls a model. The working example is `orders-api/src/lib/ai/` and `orders-api/src/services/order-notes/`.

## Cost: know it, cap it, be able to stop it

- **Record every model call:** the model, the feature, input tokens, output tokens, cache-read tokens, and the **cost, frozen at call time**
  from a price table. Changing prices later must not rewrite old rows. (`usage.ts`)
- **Reserve the daily budget before the call.** Set money aside first, call the model, then replace the reservation with the real cost.
  A call that fails or times out **keeps its reservation**, because it may still have been billed. (`guard.ts`)
- **Have a total spend cap** as well as the daily one, set at the provider (and in code if you can). Alert before you reach it. The sample implements the daily budget only; a total cap works the same way.
- **Have a kill switch.** One flag turns every model call off, and the feature falls back to normal code.
- **Show spend on a dashboard.** `GET /admin/ai-usage` in orders-api returns totals by feature and model.
- **Use prompt caching** for the big parts of a prompt that repeat (system prompt, long instructions, reference text).
- **Send only the context that is relevant** (search for the right few passages, don't paste the whole database). Smaller prompts are cheaper, faster and less confusing.

## Safety: the model is not trusted

- **Treat anything from outside as untrusted:** customer text, database rows, uploaded files, web pages, tool results.
  Wrap it as data (`wrapUntrusted`) and tell the model, in the system prompt, that text in the wrapper is never instructions.
  Wrapping reduces the risk. It doesn't remove it, so design as if a note could say anything.
- **The model proposes, a person confirms writes.** Anything that changes data, sends a message or moves money needs a person's yes, or doesn't use a model at all.
- **Scope tools to the user.** If the model can call tools, they run as the signed-in user and can only reach what that user can.
- **Cap tool steps.** A model that can loop will loop. Set a maximum number of steps per request.
- **Validate the output** by hand, strictly. Wrong shape or limits means reject and fall back. ([ai-in-products.md](ai-in-products.md))
- **Never put secrets in a prompt**, and never log whole prompts that hold customer text ([logging.md](logging.md)).

## Quality: evals before changing anything

- Keep a small file of real examples with the expected answers (`orders-api/evals/`).
- **Run it before and after** you change a prompt or a model. Compare. Don't ship a change that makes it worse.
- Evals are **not in CI**: they call real models, which cost money and give slightly different answers each run. A person runs them on purpose.

## Checklist for a new AI feature

1. Is AI the right tool here? ([ai-in-products.md](ai-in-products.md))
2. Is there a deterministic fallback, and is the source marked on the result?
3. Is every call recorded, budgeted, and behind a kill switch?
4. Is outside text wrapped, and the output validated?
5. Are there tests for: bad output, timeout, budget used up, kill switch, and a prompt-injection attempt?
6. Is there an eval file?
