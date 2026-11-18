# Testing

- Runner: Node's built-in `node:test` with `node:assert/strict`. No test framework to install.
- Tests sit next to the code: `orders.ts` → `orders.test.ts`.
- `npm test` runs them all. `node --test path/to/file.test.ts` runs one file.
- `src/app.test.ts` starts the real server on a random port and calls it over HTTP. Add a case there
  when you add or change a route.

## Smoke test

`npm run smoke` checks a running service: health, create an order with a note, pay it, fetch the payment, totals in cents.
`BASE_URL` sets the target (default `http://localhost:3000`). Exit code 1 means a check failed. It creates and pays a real order, so use dev or staging, never prod.
`src/smoke.test.ts` runs it against the app in `npm test`. The `post-deploy-check` skill runs it after a deploy.

## Writing a good test

- Build services with fakes: `createFakeProvider()`, `createOutboxNotifier()`, and a fixed `now`.
- Test the failure cases, not just the happy path: bad input, wrong status, missing records.
- Name the test after the rule it protects: `'pay twice is a conflict and does not charge again'`.
- Don't test private helpers directly. Test through the service's exported functions.

## When a test fails

Read the failing assertion first. If the test is right and the code is wrong, fix the code.
If the rule really changed, change the test **and** the doc that states the rule, in the same change.
Never delete or skip a failing test to make the build pass.

## AI tests and evals

- Tests never call a real model. Use `createFakeModel()` or a tiny hand-written `ModelClient` that returns bad output, throws or hangs.
- Every AI feature needs tests for: valid output, malformed output, timeout, budget used up, kill switch, and a prompt-injection attempt.
- `npm run eval` runs the cases in `evals/`. It is **not part of `npm run check`** and not in CI: real models cost money
  and answer a little differently each time. Run it by hand before and after you change a prompt, a model or the keyword rules. See [order-notes-ai.md](order-notes-ai.md).
- The shared signing test vector is in `src/lib/auth.test.ts`. `kitchen-display` has the same one. Keep them in step.
