# Prompting

Every prompt has four parts: **goal, context, guardrails, done means.**

## Template

> **Goal:** Implement ticket 102 (`orders-api/tickets/102-discount-codes.md`): `SAVE10` takes 10% off each item.
> **Context:** Read `orders-api/AGENTS.md` and `orders-api/docs/orders.md` first.
> **Guardrails:** Money is integer cents; round per line with `percentOf`. Don't touch billing. Ask before adding a package.
> **Done means:** `npm run check` passes in `orders-api`, with tests for an unknown code and for rounding, and the docs match.

## Habits

- **Ask me questions first** when the task is vague or risky. Don't start until they're answered.
- **Plan first** for anything over about 30 minutes: files, tests, risks. A person approves, then build.
- **Give it the review checklist:** tell it what review will check (tests incl. failure cases, docs updated, cents, the "Ask a person first" list), so it checks first.
- Point at files instead of describing them. One task per prompt.
- A prompt you'll reuse becomes a skill in `.claude/skills/`.
