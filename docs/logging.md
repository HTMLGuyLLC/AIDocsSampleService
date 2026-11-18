# Logging

Logs are how we find out what happened in production, and what agents read when they debug. So they need to be the same everywhere.

## Format

**One JSON object per line.** No pretty-printing, no plain-text lines.

```json
{"ts":"2026-11-16T09:14:03.221Z","level":"error","service":"orders-api","env":"prod","msg":"payment failed","requestId":"req_ab12cd34","orderId":"ord_4120","errorCode":"provider_invalid_request"}
```

## Required fields

| Field | Meaning |
|---|---|
| `ts` | ISO 8601, UTC |
| `level` | `debug`, `info`, `warn` or `error` |
| `service` | The project folder name. Same as the Dynatrace tag ([dynatrace.md](dynatrace.md)) |
| `env` | `dev` or `prod` |
| `msg` | A short, fixed sentence. Put changing values in other fields, not in `msg` |
| `requestId` | The id of the request being handled. Pass it along when calling another service |
| `orderId` | Whenever the line is about an order |

Add other fields freely (`amountCents`, `durationMs`, `errorCode`). Use `camelCase`. Money is in cents.

## Never log

- **Secrets:** keys, tokens, passwords, signatures, the contents of `.env`.
- **Card data:** card numbers, expiry, security codes, provider tokens. Log only the provider's payment id.
- **Full email addresses.** Log them masked: keep the first letter and everything from the first `+` or `@`, so `sam+cakes@example.com` becomes `s***+cakes@example.com`. Use `maskEmail` in `orders-api/src/lib/log.ts`.
- **Whole request bodies or customer notes.** Log what you need (ids, counts, status), not everything.

## Levels

- `error`: something failed and a person may need to act.
- `warn`: it worked, but only because of a fallback or retry (for example an AI call that fell back).
- `info`: normal events worth keeping (a payment succeeded).
- `debug`: only for local work. Off in prod.

## Rules

- Use the project's logger (`orders-api/src/lib/log.ts`), not `console.log` with text.
- Log the failure where you handle it, once. Don't log it again higher up.
- A log line a person will search for should have a stable `msg`. Don't change it without a reason.
