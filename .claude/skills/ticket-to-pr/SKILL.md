---
name: ticket-to-pr
description: Take a ticket from a project's tickets/ folder (or a pasted ticket) to a reviewed pull request. Use when asked to work a ticket, build a feature from a ticket, or "take TICKET-123".
---

# Ticket to PR

Work one ticket from start to a pull request a person can review. Stop at the marked checkpoints.

## 1. Understand

1. Read the ticket. Use the router in the root `AGENTS.md` to find the project, then read that project's `AGENTS.md`,
   its `docs/architecture.md`, and `docs/<service>.md` for each service the ticket touches.
2. If the ticket is unclear, missing acceptance criteria, or conflicts with a doc or a decision in `docs/decisions/`,
   **stop and ask**. List your questions, each with the answer you'd assume if nobody replies.
3. Ask questions first: don't plan until the unknowns that change the design are answered.

## 2. Plan (checkpoint)

Write a short plan and **wait for approval** before writing code:

- Files you'll change and why
- Tests you'll add, including failure cases
- Docs you'll update
- Anything on a "Ask a person first" list (root `AGENTS.md` and the project's `AGENTS.md`)

## 3. Build

1. Write the tests first when the behavior is clear from the ticket.
2. Make the change in the smallest set of files that works. Follow the service's `AGENTS.md`.
3. Update the project's `docs/<service>.md` (and `docs/architecture.md` if boundaries changed) in the same change.
   If a new endpoint is involved, use the `add-endpoint` skill.
4. Run `npm run check` in the project folder. Fix until it passes. Never skip or delete a test to make it pass.

## 4. Self-review

Read your own diff as a reviewer would. Check:

- Money stays in integer cents
- No new dependencies
- Error cases return the right `AppError`
- Logs follow `docs/logging.md`, with no secrets or full emails
- Docs match the code

For a bigger change, run the `audit-loop` skill instead of a single read-through.

## 5. Open the PR (checkpoint)

Fill in `.github/pull_request_template.md`. Name the ticket and summarize the change. Then list every change
**riskiest first**: tag each high, medium or low, say in one line what could go wrong, and name the file.
Money, statuses, auth, secrets and data go at the top. Docs, tests and renames go last, in one short list.
Write it for a reviewer who only reads the first three lines. Say what you were unsure about.
**Ask before pushing or opening the PR.**
