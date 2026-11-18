# Architecture

## The pieces

```
HTTP request
    │
    ▼
src/lib/http.ts  (router: matches the path, reads JSON, turns AppError into a response)
    │
    ▼
src/services/orders ──charge / refund──▶ src/services/billing ──▶ PaymentProvider (fake here)
    │
    ├──email──▶ src/services/notifications ──▶ Notifier (outbox here)
    │
    └──note──▶ src/services/order-notes ──▶ ModelClient (fake here), guarded by src/lib/ai
```

- **orders** owns orders and the catalog. It is the only service that calls the others.
- **billing** owns payments. It knows nothing about orders beyond an order id.
- **notifications** owns email wording and sending. It knows nothing about the other services.
- **order-notes** owns reading a customer's free-text note. It knows nothing about orders, prices or billing: it takes text in and gives kitchen details out.

`src/app.ts` builds each service and passes in what it needs. That is the only place that decides
which payment provider, notifier and model are used, which is why tests can swap in fakes.

`src/lib/` holds code every service shares: money, errors, the router, signed-request auth (`auth.ts`), JSON logging (`log.ts`),
and `ai/` (model client, untrusted-text wrapper, usage ledger, budget guard).

Other projects call us over HTTP. `kitchen-display` reads `GET /internal/orders` with a signed request ([auth](../../docs/auth.md)).

## How a request flows

`POST /orders/ord_1/pay`:

1. The router matches `/orders/:id/pay` in `src/services/orders/routes.ts`.
2. `orders.pay('ord_1')` checks the order is `pending`.
3. It calls `billing.charge(orderId, totalCents)`. Billing calls the provider and stores the payment.
4. Orders marks the order `paid` and saves the `paymentId`.
5. Orders sends the "order confirmed" email. If that fails, it logs and carries on.
6. The router returns the updated order as JSON.

## Data

Everything is kept in memory and lost on restart (orders, payments, the AI usage ledger). That keeps the sample simple. A real service would
put each service's data in its own tables, and the rule "services don't read each other's data" would still hold.

## Errors

Services throw `AppError` (`badRequest` 400, `notFound` 404, `conflict` 409). The router sends
`{ "error": { "code": "...", "message": "..." } }`. Any other error becomes a 500 with a generic message,
and the real error is only logged.

## Boundaries

| Service | Can call | Must not |
|---|---|---|
| orders | billing, notifications, order-notes | Store card or provider data |
| billing | the payment provider | Import from orders or notifications |
| notifications | the mail sender | Import from orders or billing |
| order-notes | the model client, through `src/lib/ai` | Import from orders, billing or notifications. Be given prices |
