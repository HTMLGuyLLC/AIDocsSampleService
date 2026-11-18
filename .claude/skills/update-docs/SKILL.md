---
name: update-docs
description: Check that docs and AGENTS.md files still match the code, verify what looks wrong, and fix it. Use after a change, before a PR, when a doc and the code disagree, or when asked to "check the docs" or "update the docs".
---

# Update docs

Docs that are wrong are worse than no docs: the next agent trusts them. This skill checks, then fixes.

1. Find what changed: `git diff main...HEAD --stat` (or the uncommitted diff). If nothing changed and you were asked
   to "check the docs", pick the project or folder named in the request.
2. For each changed service, read `docs/<service>.md` and the service's `AGENTS.md` next to the new code.
   Check statuses, rules, API tables, error codes, commands and examples against the code.
3. If a cross-service flow changed, check the project's `docs/architecture.md`. If a company-wide convention changed
   (auth, logging, secrets), check the root `docs/`.

## Self-healing: verify, then fix

When a doc and the code disagree, **don't guess which one is right**:

1. Read the code that the doc describes. Run the command, or call the endpoint, if you can.
2. Look for a test or a decision record that settles it (`docs/decisions/`, `git log` for the file).
3. If the **doc** is wrong: fix the doc in this same change.
4. If the **code** looks wrong and a test or decision says so: don't edit the doc to match. Flag it for a person.
5. If you can't tell: leave both alone and list it in your report.

Also fix: dead links, renamed paths, commands that no longer exist, and a rule that CI now enforces (delete it from the doc).

## Style

Short, plain words. Rules, not history. Say why when a rule looks odd.
If a change goes against a file in `docs/decisions/`, don't edit the decision. Flag it and suggest a new record.

## Report

What you changed, what you checked and found correct, and anything you weren't sure the code meant on purpose.
