# AI Docs Sample Service

A sample work folder for a fictional bakery company, **Crumb & Co.**, set up the way I set up a team's repos so AI coding
agents (Claude Code, Codex, Copilot, Cursor and others) do good work in them. It is the demo for a workshop on how dev teams
should work with AI coding agents.

The code is deliberately small and works. **The point is the files around it**: what an agent reads, when, and why.

## How to read this repo

This folder is the company's **parent folder**: one folder per repo, side by side.

```
AGENTS.md                  ← company-wide rules and the router ("which project is this about?")
CLAUDE.md                  ← "@AGENTS.md" plus Claude-only notes
.github/                   ← copilot pointer, CI for both projects, PR template
.claude/                   ← permissions, and skills every project shares
.mcp.json                  ← connectors: GitHub, Jira, Dynatrace (placeholders only, no secrets)
docs/                      ← company-wide docs, one topic per file
scripts/                   ← load-secrets.sh
orders-api/                ← project 1: bakery ordering API (orders, billing, notifications, AI order notes)
kitchen-display/           ← project 2: today's bake list, built from orders-api
```

Each project has its own `AGENTS.md` (only what is unique to it) and `docs/`.

## Deck section → where to see it

| Section of the deck | Files |
|---|---|
| Context files: one source of truth, thin pointers | [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md), [`.github/copilot-instructions.md`](.github/copilot-instructions.md), [`orders-api/AGENTS.md`](orders-api/AGENTS.md) |
| One parent folder and a router | [`AGENTS.md`](AGENTS.md) (router table), [`docs/decisions/0001-one-parent-folder.md`](docs/decisions/0001-one-parent-folder.md) |
| Sharing it: the workspace repo | [`repos.txt`](repos.txt), [`scripts/setup-workspace.sh`](scripts/setup-workspace.sh) |
| Three layers of context (always, by location, on demand) | Root `AGENTS.md`, [`orders-api/src/services/*/AGENTS.md`](orders-api/src/services/), [`docs/`](docs/README.md) and [`orders-api/docs/`](orders-api/docs/README.md) |
| Rules with reasons, decision records | [`orders-api/docs/decisions/`](orders-api/docs/decisions/), [`docs/decisions/`](docs/decisions/) |
| Keeping docs healthy (self-healing) | "Keep the docs healthy" in [`AGENTS.md`](AGENTS.md), [`.claude/skills/update-docs`](.claude/skills/update-docs/SKILL.md) |
| Scripts vs just doing it | "Scripts or just do it?" in [`AGENTS.md`](AGENTS.md), [`scripts/load-secrets.sh`](scripts/load-secrets.sh), [`pos-lookup.mjs`](.claude/skills/pos-lookup/scripts/pos-lookup.mjs) |
| Skills (org-wide workflows) | [`.claude/skills/`](.claude/skills/): `ticket-ready-check`, `ticket-to-pr`, `update-docs`, `add-endpoint`, `release-notes`, `audit-loop`, `debug-with-evidence` |
| Wrapping software that has no connector | [`.claude/skills/pos-lookup`](.claude/skills/pos-lookup/SKILL.md) |
| Vetting third-party skills | [`docs/skill-vetting.md`](docs/skill-vetting.md) |
| Connectors (MCP) | [`.mcp.json`](.mcp.json), [`docs/connectors.md`](docs/connectors.md) |
| Guardrails and permissions | [`.claude/settings.json`](.claude/settings.json), "Ask a person first" in each `AGENTS.md`, [`.github/pull_request_template.md`](.github/pull_request_template.md) |
| Secrets agents can't see | [`docs/secrets.md`](docs/secrets.md), [`scripts/load-secrets.sh`](scripts/load-secrets.sh), `.env.example` files, [`.gitignore`](.gitignore) |
| CI as the backstop | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| Prompting (goal, context, guardrails, done means) | [`docs/prompting.md`](docs/prompting.md), [tickets 102 and 103](orders-api/tickets/README.md) |
| Model selection | [`docs/model-selection.md`](docs/model-selection.md), "Models" in [`AGENTS.md`](AGENTS.md) |
| Loops need a goal and a limit | [`.claude/skills/audit-loop`](.claude/skills/audit-loop/SKILL.md), [ticket 106](orders-api/tickets/106-ai-order-notes-improve.md) |
| Automating the pipeline (ticket to production) | [`docs/ai-pipeline.md`](docs/ai-pipeline.md), [`.claude/skills/ticket-ready-check`](.claude/skills/ticket-ready-check/SKILL.md), [`ai-ticket-ready-check.yml`](.github/workflows/ai-ticket-ready-check.yml), [`ai-pr-review.yml`](.github/workflows/ai-pr-review.yml) |
| Debugging with evidence | [`.claude/skills/debug-with-evidence`](.claude/skills/debug-with-evidence/SKILL.md), [ticket 105](orders-api/tickets/105-some-payments-failing.md), [`orders-api/logs/`](orders-api/logs/), [`orders-api/docs/runbooks/`](orders-api/docs/runbooks/) |
| Monitoring and logging | [`docs/dynatrace.md`](docs/dynatrace.md), [`orders-api/docs/dynatrace.md`](orders-api/docs/dynatrace.md), [`docs/logging.md`](docs/logging.md) |
| Service-to-service auth | [`docs/auth.md`](docs/auth.md), [`orders-api/src/lib/auth.ts`](orders-api/src/lib/auth.ts), [`kitchen-display/src/sign.ts`](kitchen-display/src/sign.ts) |
| AI or normal code inside a product | [`docs/ai-in-products.md`](docs/ai-in-products.md), [decision 0003](orders-api/docs/decisions/0003-ai-only-for-order-notes.md) |
| AI features: safety and cost | [`docs/ai-safety-and-cost.md`](docs/ai-safety-and-cost.md), [`orders-api/src/lib/ai/`](orders-api/src/lib/ai/), [`orders-api/src/services/order-notes/`](orders-api/src/services/order-notes/), [`orders-api/docs/order-notes-ai.md`](orders-api/docs/order-notes-ai.md) |
| Evals | [`orders-api/evals/`](orders-api/evals/), [`orders-api/scripts/eval-order-notes.ts`](orders-api/scripts/eval-order-notes.ts) |
| Practice tickets | [`orders-api/tickets/`](orders-api/tickets/README.md) |

## Try it

Requires Node 24 or later.

```bash
cd orders-api && npm install && npm run check && cd ..
cd kitchen-display && npm install && npm run check && cd ..
cd orders-api && npm run eval          # order-notes eval table (offline fake model)
```

Run the API and try a note:

```bash
cd orders-api && npm run dev            # http://localhost:3000
curl -X POST localhost:3000/orders \
  -d '{"customerEmail":"sam@example.com","items":[{"sku":"SOUR-LOAF","quantity":2}],"note":"no nuts please, pickup Saturday 9am"}'
curl localhost:3000/admin/ai-usage
```

Try the helper scripts, which need no accounts:

```bash
scripts/load-secrets.sh orders-api --fake                      # writes orders-api/.env with placeholders (gitignored)
node .claude/skills/pos-lookup/scripts/pos-lookup.mjs --fake sales
```

Then open an agent in **this** folder and give it a ticket from [`orders-api/tickets/`](orders-api/tickets/README.md).
Try it with the context files, and again after deleting the `AGENTS.md` files and `docs/`. The difference is the point.

## Everything here is fictional

Crumb & Co., its hostnames (`.example`), the point-of-sale API, the vault names and the model prices are made up for the demo.
There is no real model, payment provider or vault behind the code: they are faked so it all runs offline.

## Adapting this to your repos

1. Put your repos in one folder. Write a root `AGENTS.md` under about 100 lines: what it is, a router, company rules, ask-first list, definition of done.
2. Give each project a short `AGENTS.md` and a `docs/` with one file per topic people get wrong. Start with one.
3. Add a decision record the next time someone asks "why is it like this?"
4. Turn your most common workflow into a skill. Wrap tools without a connector in a small script.
5. Set permissions so safe commands run freely and risky ones ask. Deny reading `.env`.
6. Keep it current: docs change in the same PR as the code, and agents are told to fix docs they find wrong.

---

Made by [HTMLGuy](https://htmlguy.com/ai-software-development). I help dev teams adopt AI coding tools safely.
MIT licensed: copy anything here into your own repos.
