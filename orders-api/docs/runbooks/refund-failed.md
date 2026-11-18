# Runbook: a refund failed

**Symptom:** a customer says they asked for a refund and didn't get one, or `POST /orders/:id/refund` returned a 500.

1. Look up the order: `GET /orders/<id>`.
   - `refunded`: our side finished. Check the provider's dashboard for the refund and give the customer its reference.
   - `paid`: the refund didn't finish. Go on.
2. Look up the payment: `GET /payments/<paymentId>`.
   - `refunded` while the order is still `paid`: billing refunded but orders didn't save. Tell the on-call engineer; don't refund again.
   - `succeeded`: nothing was refunded. Retry `POST /orders/<id>/refund` once.
3. If the retry fails, stop. Don't refund by hand in the provider's dashboard: it would leave our records wrong. Escalate to the on-call engineer with the order id and both responses.

Agents: you may read and summarize. **Never run a refund yourself.** A person does steps 2 and 3.
