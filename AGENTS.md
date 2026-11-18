# AGENTS.md (company-wide)

Instructions for AI coding agents (Claude Code, Codex, Copilot, Cursor and others) working anywhere in this folder.
People are welcome to read it too. Keep it short: details belong in `docs/`.

## What this folder is

The work folder for Crumb & Co., a small bakery company. **One folder per repo**, all side by side, so one
agent session can see across them. This file holds what is true for every project. Each project has its own `AGENTS.md` for the rest.

This folder is its own git repo, the **workspace repo**. It holds this file, `docs/`, the shared skills and connectors, and `repos.txt`.
`bash scripts/setup-workspace.sh` clones every project in `repos.txt` and updates the ones already here.

## Router: which project is this about?

When a request is vague ("fix the discount bug", "the screen is wrong"), find the project here, then read **that project's `AGENTS.md`** before anything else.

| If the request mentions | Go to |
|---|---|
| orders, checkout, refunds, payments, discounts, order notes, the AI feature, customer emails, pickup-time proposals, supplier imports | `orders-api/` |
| bake list, kitchen, prep, screen, allergy flags | `kitchen-display/` |
| connectors, MCP, secrets, logging, auth, Dynatrace, prompts, models, AI cost or safety | `docs/` (index below) |
| a repeatable workflow (ticket, release notes, debugging, review loop, PR comments, post-deploy check) | `.claude/skills/` |

Still unsure? Say which projects you looked at and ask. Don't guess.

## Company-wide rules

- **Money is integer cents.** Never floats, never dollars. Field names end in `Cents`.
- **Service-to-service calls are signed.** Follow `docs/auth.md`.
- **Logs are JSON with required fields.** Follow `docs/logging.md`. Never log secrets, card data or full emails.
- **Secrets come from the vault.** Follow `docs/secrets.md`. **Never read `.env`. Never print a secret.**
- **No runtime dependencies without approval.** Use Node's built-ins. Why: `orders-api/docs/decisions/0001-no-runtime-dependencies.md`.
- TypeScript runs directly in Node: no `enum`, no `namespace`, no constructor parameter properties. Import local files with `.ts`.
- Every change comes with tests next to the code, and docs in the same change.

## Keep the docs healthy

Docs are only useful while they are true. You are allowed, and expected, to fix them as you work.

- **Something is wrong in a markdown file?** Double-check it against the code (and any test or decision). If the doc is wrong, fix it in the same change.
- **Found a tool, idea or convention worth documenting that isn't?** Add it to the right doc.
- **Got lost, or took many steps to find something?** Save a shortcut. Put it in the relevant `AGENTS.md` only if it is likely to happen often. Otherwise put it in the nearest `docs/*.md` for that area.
- **Prune.** Delete rules that CI already enforces and anything that is no longer true. A short file gets read.

The `update-docs` skill does this check on request.

## Scripts or just do it?

- **Write a script** when a task repeats, touches many files, needs many tool calls and round trips, or processes lots of data. One command saves tokens and back-and-forth.
- **Just do it** when it is a one-off, small change.
- Keep useful scripts in `scripts/` (or the project's `scripts/`), with a usage line at the top. Never hard-code secrets in them.

## Models

- Default: Opus, low effort.
- Use Sonnet or Haiku for simple or mechanical work where it fits.
- Have Opus check their work before you call it done.
- Raise effort only for hard problems.

Details: `docs/model-selection.md`.

## Loops

Every loop needs a **measurable goal** and a **hard limit**. "Fix until clean" has neither.
Use the `audit-loop` or `pr-feedback-loop` skill, which have both.

## How much to trust it

| Kind of change | Examples | What it has to pass |
|---|---|---|
| Easy to undo, small impact | Copy, a test, a small bug fix | Let it run. CI and one reviewer. |
| Core behavior | Money, statuses, API shapes | Approve the plan first. Careful review. |
| Can't be undone | Production data, infrastructure, secrets | A person does it. AI helps plan. |

## Ask a person first (all projects)

Stop and ask before you:

- change how money is charged, refunded or priced
- touch secrets, vault entries, tokens or permissions
- change CI, `.claude/settings.json`, `.mcp.json` or anything under `.github/`
- touch production data or run anything against production
- do anything that can't be undone (deleting data, force-pushing, sending email)

Projects add their own ask-first items.

## Docs index (`docs/`)

| Doc | Read it when |
|---|---|
| `connectors.md` | You use or add an MCP connector (GitHub, Jira, Dynatrace) |
| `dynatrace.md` | You look at monitoring, dashboards or alerts |
| `auth.md` | One service calls another |
| `logging.md` | You add or read log lines |
| `secrets.md` | You need a key, token or password, or add one |
| `skill-vetting.md` | You install a skill or plugin someone else wrote |
| `prompting.md` | You write a prompt or a ticket for an agent |
| `model-selection.md` | You choose a model or split work between agents |
| `ai-in-products.md` | You decide whether a product feature should use AI |
| `ai-safety-and-cost.md` | You build or change an AI feature |
| `ai-pipeline.md` | You work on the ticket-to-production pipeline or its GitHub workflows |
| `decisions/` | You wonder why the folder is set up this way |

## Done means

1. `npm run check` passes in every project folder you changed.
2. New behavior has tests, including the failure cases.
3. Docs match the code, at the project level and here.
4. The PR description lists the changes **riskiest first**, each tagged high, medium or low, so a reviewer who only reads the top still sees what matters. Routine changes (docs, tests, renames) go last, in one short list.
