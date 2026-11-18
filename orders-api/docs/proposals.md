# Proposals (propose, then confirm)

Owns: the only path from AI output to a change on an order.
Code: `src/services/proposals/`. Tests: `proposals.test.ts`.
Why AI may not change orders directly: [decisions/0003-ai-only-for-order-notes.md](decisions/0003-ai-only-for-order-notes.md).

## What it does

The note reader may find a pickup time ("pickup Saturday 9am"). That is only a suggestion until a person says yes.

1. A note is stored. If it holds a pickup time, the server calls `propose({ orderId, field: 'pickupAt' })`. The order does not change.
2. The server builds the proposal itself: `before` is the order's stored `pickupAt`; `after` is worked out by `resolvePickup` from the stored note details (next such day and time after the order was created, UTC). Text that is not exactly a day and a time makes no proposal.
3. A person calls `POST /proposals/:id/confirm` within **15 minutes**. The order's `pickupAt` is set and an audit entry is written.
4. Within **24 hours** a person can call `POST /proposals/:id/undo`. The old value goes back and another audit entry is written.

## Rules

- AI code gets `Proposer`: `propose` and nothing else. No route creates a proposal.
- Only `pickupAt` can be proposed. Price, total and status never can.
- `before` and `after` come from stored data, never from model text or a request body.
- Confirm is a 409 when the proposal expired, was already used, or the order's `pickupAt` changed since it was proposed.
- Undo is a 409 when the proposal was not confirmed, 24 hours have passed, or `pickupAt` no longer holds the confirmed value.
- Confirm and undo need the `x-staff-user` header (the person's name). In a real deployment it comes from staff login.
- Times are UTC in this sample.

## API

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/proposals/:id` | 200, the proposal | 404 |
| `POST` | `/proposals/:id/confirm` | 200, the confirmed proposal | 400 no staff user, 404, 409 |
| `POST` | `/proposals/:id/undo` | 200, the undone proposal | 400, 404, 409 |
| `GET` | `/admin/audit` | 200, audit entries | |

Audit entry: `id`, `at`, `actor`, `action` (`confirm` or `undo`), `proposalId`, `orderId`, `field`, `before`, `after`.
In a real deployment `/admin/audit` sits behind staff login, and entries go in a table that cannot be edited.

```bash
curl -X POST localhost:3000/proposals/prop_1/confirm -H 'x-staff-user: maya'
```

## Adding a field

Needs a person's approval first. Add it to `ProposalField`, give it a resolver that reads stored data, add tests for confirm, expiry, undo and injection, and update this file.
