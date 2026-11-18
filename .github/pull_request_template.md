## What and why

<!-- Project (orders-api, kitchen-display, docs...), ticket number, and what this changes in a sentence or two. -->

## Changes, riskiest first

<!-- One line each: HIGH / MEDIUM / LOW, what could go wrong, file.
     Money, statuses, auth, secrets and data at the top. If a reviewer only reads three lines, these are the three. -->

1. 

## Routine

<!-- Docs, tests, renames: one short list. -->

## Unsure about

<!-- Anything you'd like a second opinion on. -->

## Checklist

- [ ] `npm run check` passes in each project folder I changed
- [ ] New behavior has tests, including failure cases
- [ ] `docs/` and `AGENTS.md` files match the code (the project's and the root's)
- [ ] Nothing from an "Ask a person first" list (root or project `AGENTS.md`), or a person approved it
- [ ] No secrets, `.env` files or full customer emails in code, logs or docs

## AI use

- [ ] An AI agent wrote some or all of this
- [ ] A person read every line of the diff before asking for review
- [ ] If a prompt or model changed: `npm run eval` was run before and after (orders-api)
