# Notifications

Owns: customer email wording and sending.
Code: `src/services/notifications/`.

## Emails

| Template | Sent when | Subject |
|---|---|---|
| `orderPaid` | An order is paid | `Order <id> confirmed` |
| `orderRefunded` | An order is refunded | `Order <id> refunded` |

## Rules

- All wording lives in `templates`. Add a function there for a new email.
- Plain, friendly, short. Money is shown with `formatCents` (`$8.50`).
- Sending is best effort. The caller logs failures and moves on.

## Locally and in tests

`createOutboxNotifier()` keeps emails in an `outbox` array instead of sending them. Tests check the
outbox to see what a customer would have received.
