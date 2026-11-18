---
name: audit-loop
description: Review the current diff, fix what is found, review again, and repeat until only minor issues remain or 5 rounds are done. Use for bigger changes, before a PR, or when asked to "audit", "review and fix", or "loop until clean".
---

# Audit loop

A loop with two ways out. Every loop needs both, or it runs forever or stops too soon.

- **Goal (measurable):** the latest review finds **no high or medium severity issues**. Only low-severity items or rare edge cases are left.
- **Hard limit:** **5 rounds**. After round 5, stop even if issues remain, and report them.

Say both out loud at the start: "I'll stop when a review finds only low-severity or rare edge-case issues, or after 5 rounds."

## Each round

1. **Review with a separate pass.** Don't review in the same breath that you wrote the code: it will agree with itself.
   Start a fresh reviewer (a subagent, or a new `/code-review` run) and give it **only the diff and the project's `AGENTS.md`**,
   not your reasoning. Ask it to list issues with a severity: high (wrong behavior, money, security, data loss),
   medium (missing test, wrong error, doc mismatch), low (style, naming, rare edge case).
2. **Check the exit.** If there are no high or medium issues, stop: goal met. If this was round 5, stop: limit hit.
3. **Fix.** Fix every high and medium issue. Add a test for each bug. Don't fix low items unless they are one-line changes.
4. **Prove it.** Run `npm run check` in the project folder. Don't start the next round until it passes.
5. Go to the next round.

## Report

- Rounds used (of 5) and which exit you took: goal met or limit hit
- Issues fixed, one line each
- Issues left (low, or anything still open after round 5), so a person can decide
