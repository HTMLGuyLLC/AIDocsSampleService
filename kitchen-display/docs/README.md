# kitchen-display docs

Short on purpose: this project is small. Company-wide docs are in [`../../docs/`](../../docs/README.md).

## What it does

1. Calls `GET /internal/orders` on orders-api, signed as caller `kitchen-display` ([auth](../../docs/auth.md)).
2. Keeps only `paid` orders.
3. Adds up `quantity` per `sku`, sorted by sku.
4. For each item, lists the allergies found in `noteDetails.allergies` of the orders that include it, with the order ids to check.

Output:

```
  3 x Chocolate chip cookie (COOKIE)
  ALLERGY nuts: ord_12, ord_15
```

## Where the data comes from

The allergies were read from the customer's note by orders-api's AI feature (`noteDetails.source` is `ai` or `fallback`).
The fallback can miss things, so the kitchen should treat flags as help, not as a complete list.
How notes are read: [`../../orders-api/docs/order-notes-ai.md`](../../orders-api/docs/order-notes-ai.md).

## Configuration

| Env var | Meaning |
|---|---|
| `ORDERS_API_URL` | Where orders-api is. Default `http://localhost:3000` |
| `KITCHEN_DISPLAY_SECRET` | Our signing secret. From the vault ([secrets](../../docs/secrets.md)) |
