# AI Docs Sample Service

An example work folder for a fictional bakery, **Crumb & Co.**, set up so AI coding agents (Claude Code, Copilot, Cursor, Codex and others)
can do good work in it. It's the companion example for HTMLGuy's AI for Dev Teams workshop.

```
AGENTS.md          company rules and a router to each project
CLAUDE.md          points Claude Code at AGENTS.md
docs/              company-wide docs
.claude/           permissions and shared skills
.mcp.json          connectors (placeholders, no secrets)
.github/           CI, PR template, opt-in AI workflows
plugins/           an example plugin
repos.txt          the projects in this workspace
scripts/           setup and helper scripts
orders-api/        project: ordering API, with AI features
kitchen-display/   project: today's bake list
```

## Run it

Node 24 or later. Everything is faked, so it runs offline with no accounts.

```bash
cd orders-api && npm install && npm run check && cd ..
cd kitchen-display && npm install && npm run check && cd ..
```

```bash
cd orders-api
npm run dev                                               # API on http://localhost:3000
npm run eval                                              # order-notes evals
npm run import -- imports/acme-flour-2026-11.csv acme-flour
```

Then open an agent in this folder and try a ticket from [`orders-api/tickets/`](orders-api/tickets/).

## Fictional

Crumb & Co., its hostnames (`.example`), the point-of-sale API, vault names and prices are made up.
The model, payment provider and vault are faked.

---

Made by [HTMLGuy](https://htmlguy.com/ai-software-development). Want the workshop for your team? [Get in touch](https://htmlguy.com/contact).
MIT licensed.
