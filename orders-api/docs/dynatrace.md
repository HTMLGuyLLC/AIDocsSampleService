# orders-api in Dynatrace

How orders-api shows up in monitoring. The company-wide setup (tags, dashboard layout, what agents may do) is in [../../docs/dynatrace.md](../../docs/dynatrace.md). **Agents only read.**

## Where it runs

| Env | Host | Tags |
|---|---|---|
| dev | `orders-api.dev.crumb.example` | `service:orders-api`, `env:dev` |
| prod | `orders-api.crumb.example` | `service:orders-api`, `env:prod` |

## Dashboards

- `orders-api (dev)` and `orders-api (prod)`: the standard top row, then one row for each part below.
- `Crumb & Co. overview`: failure rate of every service side by side.

| Row | Shows |
|---|---|
| Orders | Orders created, paid and refunded per hour |
| Payments | Payment success and failure rate, provider response time |
| Notes (AI) | Model calls, spend today, fallback rate, kill-switch state |
| Internal | `GET /internal/orders` request rate and 401 count (a spike in 401s can mean a bad secret or clock) |

## Key metrics and alerts

| Alert | Fires when | First thing to check |
|---|---|---|
| Payment failures | Payment failure rate above 5% for 10 minutes in `prod` | [runbooks/payments-failing.md](runbooks/payments-failing.md) |
| Slow provider | Median provider response time above 2 seconds for 10 minutes | The provider's status page, then `slow provider response` log lines |
| Refund failures | Any `refund failed` error in `prod` | [runbooks/refund-failed.md](runbooks/refund-failed.md) |
| AI budget | Spend today above 80% of the daily budget | `GET /admin/ai-usage`; see [order-notes-ai.md](order-notes-ai.md) |
| AI fallback rate | More than 20% of notes read by the fallback for 30 minutes | Model errors or timeouts; the kill switch is a last resort |
| Internal auth | More than 10 `401` on `/internal/orders` in 5 minutes | Is the caller's secret or clock wrong? ([auth](../../docs/auth.md)) |

The thresholds above are starting points for this sample. Tune them to real traffic.

## Example queries

The wording below is DQL-style and approximate. Check the exact field names in your Dynatrace environment, or ask the connector.

```
fetch logs
| filter service == "orders-api" and env == "prod" and msg == "payment failed"
| summarize failures = count(), by: { errorCode }

fetch logs
| filter service == "orders-api" and env == "prod" and matchesValue(msg, "order note parsed by fallback")
| summarize fallbacks = count(), by: { reason }

fetch logs
| filter requestId == "req_ab12cd34"
| sort ts asc
```

Our logs are JSON lines ([logging.md](../../docs/logging.md)), so every field there (`orderId`, `requestId`, `errorCode`) can be filtered on.
