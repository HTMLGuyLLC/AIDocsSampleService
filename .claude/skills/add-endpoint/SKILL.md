---
name: add-endpoint
description: Add a new HTTP endpoint to a service the same way every time, with the route, a test, and the API table row in the service doc. Use when asked to add a route, endpoint or API method to orders-api or a similar service.
---

# Add an endpoint

Every endpoint is built the same way, so reviews are quick and nothing gets forgotten.

1. **Read first.** The project's `AGENTS.md` and `docs/<service>.md`. If the endpoint changes a response callers use,
   or touches billing or statuses, stop and ask a person.
2. **Route.** Add it to `src/services/<service>/routes.ts` as `{ method, path, handler }`. Keep the handler thin:
   check input, call a service function, return `{ status, body }`. Put logic in the service, not the route.
3. **Errors.** Throw `badRequest`, `notFound` or `conflict` from `src/lib/errors.ts`. Never return error shapes by hand.
4. **Auth.** A route for another service goes under `/internal/` and calls `verifySignature` (`src/lib/auth.ts`).
   See `docs/auth.md` at the repo root. A route for staff goes under `/admin/`.
5. **Test.** Add a case to `src/app.test.ts` (it calls the real server over HTTP) for the success path and each
   error path. Add service-level tests next to the service code if there is new logic.
6. **Doc.** Add a row to the API table in `docs/<service>.md`: method, path, success, errors. Add a `curl` example if it helps.
7. **Check.** Run `npm run check` in the project folder. It must pass.
8. **Report** the new route, the tests, and the doc row you added.

Don't add a dependency, a new framework or a new folder layout for one route.
