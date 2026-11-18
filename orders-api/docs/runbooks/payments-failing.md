# Runbook: payments are failing

**Symptom:** the "Payment failures" alert fired, customers say "my payment didn't go through", or logs show `payment failed`.

Logs for a day are in `logs/` (sample file: `logs/payments-2026-11-16.jsonl`). Field meanings: [../../../docs/logging.md](../../../docs/logging.md).

## 1. Measure it

1. In Dynatrace ([../dynatrace.md](../dynatrace.md)), read the failure rate and when it started. Was it sudden, or has it always been partly failing?
2. Count: how many `payment failed` against `payment succeeded` in the window? Write the numbers down.

## 2. Check the usual suspects

| Check | How |
|---|---|
| Provider outage | The provider's status page. Is `providerStatus` the same on every failure? |
| A deploy | `git log` and recent merged PRs for `orders-api` around the start time |
| Slow responses | `slow provider response` lines before the failures |
| Config or secrets | 401s or "key" errors in the provider's response (don't print the key) |

## 3. Compare failures with successes, field by field

This step finds most causes. Put a failed order next to a successful one and compare **every field**, not only the ones that look important:
skus, amounts, times of day, customers, durations, error codes. Then check the whole day, not two examples.
If two records look the same, the difference is in a field you skipped.

## 4. Don't

- **Don't retry charges by hand** and don't touch the provider's dashboard. A wrong retry can double-charge a customer.
- **Don't refund anything.** A person does that ([refund-failed.md](refund-failed.md)).

## 5. Escalate

If you find a pattern, or you can't, tell the on-call engineer with: the numbers from step 1, the field comparison from step 3, and the order ids you looked at.

Agents: you may read logs and summarize. **Never run a charge or refund yourself.** After the incident, use the `debug-with-evidence` skill's last step and add "what would have found this faster" to this runbook.
