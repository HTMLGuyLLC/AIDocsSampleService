# AI features: safety and cost

Rules for any feature that calls a model. Working examples: `orders-api/src/lib/ai/`, `orders-api/src/services/order-notes/`,
`orders-api/src/services/proposals/`, `orders-api/src/services/catalog-import/`.

## Cost

- **Record every call:** model, feature, customer, input/output/cache tokens, and cost **frozen at call time** from the price table (`usage.ts`).
- **Reserve before the call:** a daily cap per customer and overall. A failed or timed-out call keeps its reservation (`guard.ts`).
- **Total spend cap** at the provider, with an alert before you reach it.
- **Kill switch:** one flag turns every model call off; features fall back to normal code.
- **One API key per feature** (`ORDER_NOTES_AI_KEY`, `CATALOG_IMPORT_AI_KEY`), from the vault ([secrets.md](secrets.md)). Revoke one without touching the rest.
- **Dashboard:** `GET /admin/ai-usage` in orders-api, totals by feature and model.
- Cache big repeated prompt parts. Send only the relevant context.

## Safety

- Outside text (customer input, database rows, files, web pages, tool results) is **data, never instructions**. Wrap it (`wrapUntrusted`).
- **The model proposes, a person confirms** any write (`proposals/`). Every confirmed change is logged and can be undone for 24 hours.
- Tools run as the signed-in user and reach only their data. Cap tool steps per request.
- Validate model output strictly. Wrong shape means reject and fall back.
- No secrets in prompts. Don't log whole prompts that hold customer text ([logging.md](logging.md)).

## Evals

Real examples with expected answers in `orders-api/evals/`. Run `npm run eval` before and after changing a prompt or model. Not in CI: it costs money.

## Checklist for a new AI feature

1. Is AI the right tool? ([ai-in-products.md](ai-in-products.md))
2. Deterministic fallback, with the source marked on the result?
3. Every call recorded, budgeted, behind a kill switch, on its own key?
4. Outside text wrapped, output validated, writes proposed not made?
5. Tests for bad output, timeout, budget used up, kill switch, prompt injection?
6. An eval file?
