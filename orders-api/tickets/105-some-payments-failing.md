# 105: Some payments are failing

Customers are saying their payment didn't go through. Support sees it for some orders but not others.

This ticket comes in two versions of the same request. Give an agent one at a time, in a fresh session, and compare what it finds.

---

## Version A: Narrow

Here is one payment that worked and one that failed. What is different?

Success:

```json
{"ts":"2026-11-16T08:11:06.831Z","level":"info","service":"orders-api","env":"prod","msg":"payment succeeded","requestId":"req_3746d108","orderId":"ord_4102","skus":["BAGEL-12"],"amountCents":7200,"customerEmail":"p***@example.com","paymentId":"pay_436149","durationMs":827}
```

Failure: take the first `"msg":"payment failed"` line from `logs/payments-2026-11-16.jsonl`.

Find the cause.

---

## Version B: Wide

Payments are failing for some customers in prod. Find the pattern and the cause.

Context:

- All of yesterday's payment logs: `logs/payments-2026-11-16.jsonl`
- The runbook: `docs/runbooks/payments-failing.md`
- Log field meanings: `../docs/logging.md`
- If you can reach Dynatrace through the connector, use it (read only)

Guardrails:

- Read and summarize only. Don't retry charges, refund anything or change billing.
- Don't guess. List the evidence for each idea.

Done means:

- The symptom, with counts (how many failed, out of how many)
- Three ranked hypotheses, with the evidence for and against each
- The pattern, if there is one, and how you know
- A failing test that reproduces it, if you can write one
- What you'd change in `docs/runbooks/payments-failing.md` so the next person finds it faster
