# Service-to-service auth

When one Crumb & Co. service calls another, it **signs the request**. The receiver checks the signature.
Nobody sends passwords, and the shared secret never travels over the wire.

## The rule

The caller sends three headers:

| Header | Value |
|---|---|
| `x-crumb-caller` | The caller's name, e.g. `kitchen-display` |
| `x-crumb-timestamp` | Now, in milliseconds since 1970 |
| `x-crumb-signature` | Hex HMAC-SHA256 of the text below, using the caller's secret |

The text that is signed, joined with newlines:

```
METHOD            (upper case, e.g. GET)
path              (no query string, e.g. /internal/orders)
timestamp         (the same value as the header)
body              (the exact body text; empty for GET)
```

## The receiver must

1. Reject the request (401) if any header is missing or the caller is unknown.
2. Reject it if the timestamp is more than **5 minutes** from its own clock, in either direction. This stops replays.
3. Work out the signature itself, with the secret it holds for that caller, and compare with a constant-time compare (`timingSafeEqual`).
4. Sign over the body **as it arrived**, not a re-encoded version.

## Rules

- **One secret per caller.** If `kitchen-display` leaks, rotate only its secret.
- **Secrets come from the vault** (`crumb-kv-dev`, `crumb-kv-prod`). See [secrets.md](secrets.md). Never in code, never in git.
- **Internal routes live under `/internal/`.** Routes for staff live under `/admin/`.
- **The two sides must match.** The test vector in `orders-api/src/lib/auth.test.ts` and `kitchen-display/src/orders-client.test.ts` is the same on purpose. If you change the format, change both and the vector.

## Where it is used

| Caller | Receiver | Route |
|---|---|---|
| `kitchen-display` | `orders-api` | `GET /internal/orders` |

Code: `orders-api/src/lib/auth.ts` (verify) and `kitchen-display/src/sign.ts` (sign).
