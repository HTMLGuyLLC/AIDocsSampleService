# 101: Let customers cancel an unpaid order

Customers sometimes place an order by mistake and want to cancel it before paying.

## Acceptance criteria

- `POST /orders/:id/cancel` cancels a `pending` order. The order's status becomes `cancelled`.
- Cancelling an order that is `paid` or `refunded` returns `409`. (Paid orders use refunds.)
- Cancelling an order that is already `cancelled` returns `409`.
- A cancelled order can't be paid.
- No email is sent for a cancellation.
