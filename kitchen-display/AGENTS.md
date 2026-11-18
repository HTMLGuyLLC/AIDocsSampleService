# AGENTS.md: kitchen-display

Company-wide rules are in `../AGENTS.md`. Read that first. This file holds what is unique to kitchen-display.

## What this is

Builds today's **bake list** for the kitchen screen: each sku with its total quantity, and allergy flags from customer notes.
It reads orders from `orders-api` and has no data of its own.

## Commands

Run these in this folder.

- `npm install`, then `npm run check` (typecheck and tests). **Run it before you say a change is done.**
- `npm start`: print the bake list. Needs `ORDERS_API_URL` and `KITCHEN_DISPLAY_SECRET` (load with `../scripts/load-secrets.sh kitchen-display`).

## Where things are

| Path | What |
|---|---|
| `src/bake-list.ts` | `buildBakeList` and `formatBakeList`: the logic |
| `src/orders-client.ts` | Calls `GET /internal/orders` with a signed request |
| `src/sign.ts` | Builds the signature headers ([company auth rule](../docs/auth.md)) |
| `docs/README.md` | Short notes on this project |

## Rules

- **Only paid orders go on the bake list.** Pending ones may never be paid; refunded ones aren't wanted.
- **Allergy flags are safety information.** A missed flag is worse than an extra one. Don't hide or drop a flag to make output tidier.
- **Don't import from `orders-api`.** The projects talk over HTTP only. `src/sign.ts` is our own copy of the signing code, kept honest by the shared test vector in `src/orders-client.test.ts`.
- If `orders-api` changes the order shape or `/internal/orders`, update `src/orders-client.ts` and its tests in the same change.

## Ask a person first

Changing the signing format, or anything that would make the kitchen screen show wrong allergy information.

## Done means

`npm run check` passes, new behavior has tests, and `docs/` matches the code.
