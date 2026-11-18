# Practice tickets

Sample work for trying an agent on orders-api. Each one tests something different, and maps to a section of the workshop deck.
Open your agent in the **parent folder** (`..`) so it can use the router, company docs and skills. Try one with the context files, then again
with the `AGENTS.md` files and `docs/` removed, and compare.

| Ticket | What it tests | Deck section |
|---|---|---|
| [101](101-cancel-pending-order.md) | A clear ticket. Does the agent follow the status rules, add tests and update `docs/orders.md`? | Context files, docs, definition of done |
| [102](102-discount-codes.md) | Money. Does the agent keep cents and round per line, as `decisions/0002` says? Good one for the prompt formula in `../docs/prompting.md` | Rules with reasons, prompting |
| [103](103-make-checkout-better.md) | A vague ticket. Does the agent ask questions instead of guessing? | "Ask me questions first", plan first |
| [104](104-partial-refunds.md) | A risky ticket. Does the agent stop to ask, since billing and a decision record are involved? | Ask-a-person-first, guardrails |
| [105](105-some-payments-failing.md) | Debugging with evidence. A narrow ask against a wide one with the full log and a runbook | Debugging, context, connectors, runbooks |
| [106](106-ai-order-notes-improve.md) | A loop with evals. Improve allergy detection, running `npm run eval` before and after | Loops (goal and limit), evals, AI in products |

Other things to try from the parent folder:

- "Add an endpoint that returns today's orders for one customer" (the `add-endpoint` skill)
- "Check the docs are right" (the `update-docs` skill; plant a wrong line in a doc first and watch it get verified and fixed)
- "Review and fix this diff until it's clean" (the `audit-loop` skill)
- "What sold today?" (the `pos-lookup` skill, with `--fake`)
- A vague cross-project request: "the kitchen screen should show pickup times" (the router in `../../AGENTS.md`)

## Facilitator notes (private: don't give these to the agent or to participants)

**105, the answer:** every failed payment is for an order whose customer email contains a `+` (for example `sam+cakes@example.com`; logs mask it as `s***+cakes@example.com`).
The fictional payment provider rejects `+` in receipt emails and answers `provider_invalid_request`. Successful payments never have a `+`.
Nothing else lines up: skus, amounts, times of day and durations are all mixed.

- **Narrow version:** with one success and one failure the agent sees two different emails, skus, amounts and times, and tends to blame whatever differs most (amount, sku, time). Many will guess wrong or report "can't tell from two records".
- **Wide version:** with the whole file it can compare fields across all 54 attempts, and the `+` stands out. The point: the more evidence and runbook context the agent has, the better it debugs. A one-record question is the worst way to ask.
- Check that the agent counts failures against successes, lists hypotheses with evidence, and does **not** suggest retrying charges.
- Good "what would have found this faster" answers: log the provider's rejection reason, add a `failureRate by field` dashboard, validate emails before charging, add this case to the runbook.

**106, the answer:** the keyword fallback and the offline fake model both miss "lactose intolerant". The agent should add rules (and an eval case), and re-run the eval to prove it.
Watch for: fixing it by flagging every mention of dairy (breaks the "loves almonds" style no-false-alarm case), skipping the before/after, or looping with no limit.
