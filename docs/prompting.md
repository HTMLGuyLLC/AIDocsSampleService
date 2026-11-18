# Prompting

An agent does what you ask. A better ask gets better work the first time.

## The formula

**Goal + context + guardrails + "done means".**

| Part | Say | Example |
|---|---|---|
| **Goal** | What you want, in one sentence | "Add the `SAVE10` discount code to orders." |
| **Context** | Where to look and what matters | "Ticket: `orders-api/tickets/102-discount-codes.md`. Read `orders-api/docs/orders.md`." |
| **Guardrails** | What not to do, what to ask about | "Money stays in cents. Don't touch billing. Ask me before adding any package." |
| **Done means** | How you both know it's finished | "`npm run check` passes, new tests cover unknown codes, the doc is updated." |

## Before and after (ticket 102)

**Before:**

> do the discount thing

The agent has to guess which discount, how it rounds, whether emails change, and how you'll judge it. It will guess, and the guesses look fine until review.

**After:**

> Implement ticket 102 (`orders-api/tickets/102-discount-codes.md`): a `SAVE10` code that takes 10% off each line.
> Read `orders-api/AGENTS.md` and `orders-api/docs/orders.md` first. Money is integer cents; round per line using `percentOf`.
> Don't change billing. If anything in the ticket is unclear, ask before you plan.
> Done means: `npm run check` passes in `orders-api`, there are tests for an unknown code and for rounding, and the docs match.

Same ticket, but now it takes one pass.

## "Ask me questions first"

When the task is vague or risky, add: **"Ask me questions first, and don't start until I've answered."**
Questions are cheap. A wrong build is not. A good agent lists its questions with the answer it would assume if you stayed quiet,
so you can reply "yes to all" in one line.

## Plan first for anything over about 30 minutes

If you'd expect the work to take a person more than about 30 minutes, ask for a **plan** before any code:
files to change, tests to add, what could go wrong. Read it, fix it, then say go.
A wrong plan costs you two minutes to correct. A wrong build costs you a review and a redo.

## Habits

- Point at files instead of describing them.
- Say what "not done" looks like too ("don't skip tests to make it pass").
- One task per prompt. Several at once get half-done.
- If a prompt works well and you'll use it again, turn it into a skill (`.claude/skills/`).
