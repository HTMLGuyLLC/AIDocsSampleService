# AGENTS.md: orders-api

Company-wide rules (money in cents, auth, logging, secrets, models, loops) are in `../AGENTS.md`. Read that first.
This file holds what is unique to orders-api.

## What this is

The ordering API for Crumb & Co. Customers place an order (optionally with a free-text note), pay for it, and can get a refund.
Services live in one Node process: **orders**, **billing**, **notifications**, **order-notes** (the AI feature), **proposals** (confirm-before-change for AI suggestions) and **catalog-import** (supplier CSVs, with AI proposing mappings only).

## Commands

Run these in this folder.

- `npm install`: install (dev tools only; there are no runtime dependencies)
- `npm run check`: typecheck and all tests. **Run this before you say a change is done.**
- `npm test`: tests only
- `node --test src/services/orders/orders.test.ts`: one test file
- `npm run eval`: run the order-notes eval cases and print pass/fail (not part of `check`)
- `npm run dev`: run the API on http://localhost:3000 with reload
- `npm run smoke`: smoke test a running API (`BASE_URL`, default http://localhost:3000). Dev or staging only: it creates and pays an order
- `npm run import -- <csv> <supplier>`: import a supplier CSV with its reviewed mapping (no model)
- `npm run map:supplier -- <csv> <supplier>`: ask the model to propose a mapping (costs a little)
- `node scripts/log-slice.mjs <file.jsonl> <field> [field=value]`: count log lines by a field

## Where things are

| Path | What |
|---|---|
| `src/app.ts` | Wires the services together |
| `src/lib/` | Shared code: money, errors, the HTTP router, signed-request auth, logging |
| `src/lib/ai/` | Model client, untrusted-text wrapper, usage ledger, budget guard |
| `src/services/<name>/` | One folder per service. `billing/`, `order-notes/`, `proposals/` and `catalog-import/` have their own `AGENTS.md` |
| `docs/architecture.md` | How the services fit together. Read before a change that crosses services |
| `docs/<service>.md` | Each service's rules, data and API. Read before changing that service |
| `docs/dynatrace.md` | This service's hostnames, dashboards, alerts and queries |
| `docs/runbooks/` | What to do when it breaks |
| `docs/decisions/` | Why things are the way they are. Don't undo one without a new one |
| `evals/`, `scripts/` | Order-notes eval cases, plus the eval, smoke, import, supplier-mapping and log-slice scripts |
| `imports/` | Sample supplier CSVs |
| `logs/` | Sample production logs, for practicing debugging |
| `tickets/` | Sample work items for practicing with an agent |

## Rules

- **Services talk through their exported functions**, never by reaching into another service's files or data.
- **Throw `AppError` helpers** (`badRequest`, `notFound`, `conflict`, ...) from `src/lib/errors.ts` for anything the caller did wrong.
- **AI only reads order notes.** It never touches a price, total, discount or status. ([why](docs/decisions/0003-ai-only-for-order-notes.md))
- **AI can only propose.** A change to an order from AI output goes through `src/services/proposals/` and a person confirms it. ([docs](docs/proposals.md))
- **One API key per AI feature.** Pass the key's variable name to `createDefaultModel(keyName)`. Names go in `.env.example`.
- **New routes** follow the `add-endpoint` skill: route, test in `src/app.test.ts`, row in the service doc.
- **Update `docs/<service>.md` in the same change** as the code.

## Ask a person first

On top of the company-wide list, stop and ask before you:

- change how money is charged or refunded (`src/services/billing/`)
- change an order status or add a new one
- change an API response shape that callers (including `kitchen-display`) may depend on
- change the signed-request format in `src/lib/auth.ts` (kitchen-display has its own copy)
- change the order-notes prompt or model without running `npm run eval` before and after

## Done means

1. `npm run check` passes here, and `kitchen-display` still passes if you changed `/internal/orders` or the order shape.
2. New behavior has tests, including the failure cases.
3. `docs/` matches the code.
4. The PR description lists changes riskiest first (see "Done means" in the root `AGENTS.md`).
