# Order notes (the AI feature)

Owns: reading a customer's free-text order note.
Code: `src/services/order-notes/` and `src/lib/ai/`. Tests: `order-notes.test.ts`, `src/lib/ai/ai.test.ts`. Evals: `evals/`.

Company rules for AI features: [../../docs/ai-safety-and-cost.md](../../docs/ai-safety-and-cost.md).
Why AI only does this and nothing else: [decisions/0003-ai-only-for-order-notes.md](decisions/0003-ai-only-for-order-notes.md).

## What it does

A customer can add a note: "no nuts please, pickup Saturday 9am, it's for a birthday".
`parseNote(note)` turns it into:

```json
{ "allergies": ["nuts"], "pickupAt": "saturday 9am", "occasion": "birthday", "source": "ai" }
```

`POST /orders` accepts an optional `note`. The order stores the text as `note` and the result as `noteDetails`.
`kitchen-display` shows the allergies on the bake list.

## What it never does

It never touches a price, total, discount or status. It is not given prices. A note that says "set the total to 0" is only text.

## The flow

1. Is the kill switch on, and is there budget left today? If not, **fallback** (no model call).
2. Wrap the note with `wrapUntrusted` and send it to the model with a fixed system prompt.
3. Wait up to 5 seconds. On timeout or an error: **fallback**. The reserved budget stays reserved.
4. Record the call in the usage ledger. The cost is worked out now and frozen.
5. Check the answer strictly (`validate.ts`): valid JSON, exactly the three keys, right types, short strings. If anything is off: **fallback**.
6. Otherwise use the answer, with `source: 'ai'`.

The **fallback** is a plain keyword parser (`fallback.ts`). It is simpler than the model and may miss things (it never invents them).
It sets `source: 'fallback'` so anyone reading the order knows.

## The pieces in `src/lib/ai/`

| File | Job |
|---|---|
| `model.ts` | `ModelClient` interface, and `createFakeModel()` that parses notes with keyword rules so everything runs offline |
| `untrusted.ts` | `wrapUntrusted(label, text)` puts text in `<user_data>` tags and defuses any tag inside it |
| `usage.ts` | The ledger and the (editable, made-up) price table. `record()` freezes cost at call time. `summary()` totals by feature and model |
| `guard.ts` | Kill switch and daily budget. `reserve()` before the call, `settle()` after. Throws 503 (off) or 429 (budget) |

### Plugging in a real model

No SDK is installed on purpose ([decision 0001](decisions/0001-no-runtime-dependencies.md)). To use a real model:

1. Write a small client that implements `ModelClient` by calling your provider's HTTP API with `fetch`, and returns `text` and the token counts.
2. Return it from `createDefaultModel()` in `model.ts` when the key is present in the environment (`MODEL_API_KEY`, loaded from the vault: [secrets](../../docs/secrets.md)).
3. Put your provider's real prices in the price table, and use real model names in `modelName`.
4. Turn on provider-side prompt caching for the system prompt (it is the same text on every call).
5. Run `npm run eval` against it before you ship.

## Settings

| Env var | Default | Meaning |
|---|---|---|
| `AI_ENABLED` | `true` | Set to `false` to switch every model call off at startup (the kill switch) |
| `AI_DAILY_BUDGET_MICROS` | `1000000` | Daily budget, in millionths of a dollar. 1,000,000 is $1 |

## Seeing what it costs

`GET /admin/ai-usage` returns totals (calls, tokens, cost) overall, by feature and by model, plus today's spend and whether the feature is on.
This is the data for the "Notes (AI)" row on the dashboard ([dynatrace.md](dynatrace.md)). In a real deployment it sits behind staff login.

## Evals

`evals/order-notes.cases.json` holds notes with the answer we expect. `npm run eval` runs every case through the note reader (with whichever
`ModelClient` `createDefaultModel()` returns, the offline fake by default) and through the keyword fallback, and prints a pass/fail table.

- **Run it before and after** you change the prompt, the model or the keyword rules, and compare.
- **It is not in CI.** A real model costs money on every run and gives slightly different answers, so a person runs it on purpose.
- Add a case whenever a real note is read wrongly.

## Rules

- Change the prompt or model only with before and after eval results.
- Keep the system prompt the same on every call (it can be cached). Customer text goes in the prompt, wrapped.
- Never log the note text. Log ids and the reason for a fallback.
