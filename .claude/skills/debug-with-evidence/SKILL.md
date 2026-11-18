---
name: debug-with-evidence
description: Debug a production problem by gathering all the evidence first, ranking hypotheses, reproducing with a failing test, then fixing and updating the runbook. Use when asked to debug, investigate an incident, or find out why something is failing.
---

# Debug with evidence

Don't start with a theory. Start with what you can see.

## 1. Gather everything first

Collect all of this before you reason about causes:

- **Logs** for the time window. Read the runbook in `<project>/docs/runbooks/` and any log file you were given. Use the log fields from `docs/logging.md`.
- **Dynatrace**, through the MCP connector, read-only: failure rate, response time and errors for the service and environment. See `docs/dynatrace.md` and `<project>/docs/dynatrace.md`.
- **Recent deploys and changes:** `git log --since=...`, and merged PRs for the project.
- **Who is affected and who is not.** Compare failing records with succeeding ones, **field by field**, not just the fields that look important.

If something is missing and you need it, ask for it. Don't fill the gap with a guess.

## 2. State the symptom, not the theory

One or two sentences of what is observed, with numbers: "20 of 54 payment attempts between 08:00 and 18:00 failed with `provider_invalid_request`."
Not: "The payment provider is down."

## 3. Three ranked hypotheses

List three. For each: what evidence supports it, what evidence argues against it, and the cheapest check that would settle it.
Rank them. Say which evidence you have **not** seen yet.

## 4. Reproduce with a failing test

Write a test that fails the way production fails. If you can't reproduce it, say so and say what you'd need. Don't fix what you can't reproduce.

## 5. Fix

Smallest change that makes the test pass. Follow the project's `AGENTS.md`. Anything on its "Ask a person first" list (billing, statuses, API shapes) needs approval first.
Run `npm run check`.

## 6. Update the runbook

Add to `<project>/docs/runbooks/<topic>.md`:

- The symptom and how it showed up
- The cause
- **What would have found this faster** (a log field, a dashboard, a check, a doc). Then add that thing if it's small.

## More moves

- **It used to work?** Find the change with `git bisect run`. Write the failing test first (step 4), then:
  `git bisect start <bad> <good>` and `git bisect run npm test -- <the test file>`. Reset with `git bisect reset`.
- **Lots of log lines?** Don't read them. Write a throwaway script that slices them (count by a field, filter, compare).
  In orders-api: `node scripts/log-slice.mjs <file.jsonl> <groupField> [field=value]`.
- **Need a number from monitoring?** Use the Dynatrace connector, not screenshots of dashboards.

## Don't

- Don't run production actions (refunds, retries, data changes). Read and summarize; a person acts.
- Don't read or print secrets while collecting evidence.
