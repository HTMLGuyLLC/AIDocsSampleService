# Orders

Owns: orders, order lines, order status, the catalog.
Code: `src/services/orders/`. Tests: `orders.test.ts`, and `src/app.test.ts` for the routes.

## Order statuses

```
pending ──pay──▶ paid ──refund──▶ refunded
```

| From | Action | To | Rule |
|---|---|---|---|
| (new) | `create` | `pending` | Items must be in the catalog; quantity 1 to 50 per line |
| `pending` | `pay` | `paid` | Charges `totalCents` through billing, then emails the customer |
| `paid` | `refund` | `refunded` | Full refund through billing, then emails the customer |

Anything else is a `409 conflict`. Statuses never move backwards.

## Data

| Field | Notes |
|---|---|
| `id` | `ord_<n>` |
| `customerEmail` | Must contain `@`. Not verified further |
| `lines[]` | `sku`, `name`, `quantity`, `unitPriceCents`, `lineTotalCents` |
| `totalCents` | Sum of `lineTotalCents` |
| `status` | See above |
| `paymentId` | Set when paid. Points to a billing payment |
| `note` | Optional free text from the customer, up to 500 characters, as typed |
| `noteDetails` | What [order-notes](order-notes-ai.md) read from the note: `allergies[]`, `pickupAt`, `occasion`, and `source` (`ai` or `fallback`). Kitchen information only |
| `pickupAt` | Official pickup time, ISO 8601 UTC. Set only by confirming a [proposal](proposals.md) or by staff. Never read straight from a note |
| `createdAt`, `updatedAt` | ISO 8601 UTC |

## API

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/orders` | 200, list of orders | |
| `POST` | `/orders` | 201, the new order. Accepts an optional `note` | 400 bad input or bad note |
| `GET` | `/internal/orders` | 200, list of orders. **Signed requests only** ([auth](../../docs/auth.md)) | 401 |
| `GET` | `/admin/ai-usage` | 200, AI usage totals ([order-notes-ai.md](order-notes-ai.md)) | |
| `GET` | `/proposals/:id` | 200, the proposal with its before and after ([proposals.md](proposals.md)) | 404 |
| `POST` | `/proposals/:id/confirm` | 200, the confirmed proposal. Needs the `x-staff-user` header | 400 no staff user, 404, 409 expired, used, or order changed |
| `POST` | `/proposals/:id/undo` | 200, the undone proposal. Needs `x-staff-user` | 400, 404, 409 not confirmed, over 24 hours, or field changed since |
| `GET` | `/admin/audit` | 200, audit entries (who, what, before, after, when) | |
| `GET` | `/orders/:id` | 200, the order | 404 |
| `POST` | `/orders/:id/pay` | 200, the paid order | 404, 409 not pending |
| `POST` | `/orders/:id/refund` | 200, the refunded order | 404, 409 not paid |

Example:

```bash
curl -X POST localhost:3000/orders -d '{"customerEmail":"sam@example.com","items":[{"sku":"SOUR-LOAF","quantity":2}]}'
```

## Gotchas

- **Prices are copied onto each line when the order is created.** If the catalog price changes later,
  existing orders keep the old price. That is on purpose: the customer pays what they saw.
- **A failed email doesn't fail the request.** `notify()` logs and continues, so the payment still counts.
- **A note never changes the order's price, total or status.** It is stored and read for the kitchen. Notes can only be added while the order is `pending`.
- **A note can't fail an order.** If the AI can't read it, a keyword parser does, and `noteDetails.source` says `fallback`.
- **Callers get copies.** Changing an order object you got back does nothing to the stored order.

## Related

- [billing.md](billing.md) for how charges and refunds work
- [order-notes-ai.md](order-notes-ai.md) for how notes are read
- [proposals.md](proposals.md) for how a pickup time from a note becomes official
- [decisions/0002-money-in-cents.md](decisions/0002-money-in-cents.md)
