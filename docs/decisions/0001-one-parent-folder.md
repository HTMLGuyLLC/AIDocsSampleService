# 0001: One parent folder for all repos, with a router AGENTS.md

Status: accepted

## Decision

Every Crumb & Co. repo is cloned side by side inside one parent folder. That folder has a root `AGENTS.md` with a
**router table** (keyword → project), shared `docs/`, shared skills in `.claude/skills/`, and shared connectors in `.mcp.json`.
Each project keeps its own `AGENTS.md` with only what is unique to it.

## Why

- **People ask vague things** ("the kitchen screen is missing nut warnings"). The work often crosses projects. An agent opened in one repo can't see the others, so it guesses.
- **Services talk to each other.** With every repo in view, the agent can follow one request through every service it touches, instead of guessing how the others behave.
- **Company rules** (auth, logging, secrets, money) would otherwise be copied into every repo and drift apart.
- **One place for skills and connectors** means every project gets the same workflows and the same read-only access.
- A router costs a few lines of always-loaded text, and saves the agent from reading the wrong project.

## What this means

- Open your agent in the parent folder when a task might touch more than one project. Open it in a project folder for focused work.
- **One folder per company.** If you also work on another company's projects, they get their own parent folder and their own `AGENTS.md`. Different companies have different rules, and one company's code and secrets should never be in view while you work on another's.
- Put a rule in the root `AGENTS.md` only if it is true for every project. Everything else goes in the project.
- **The parent folder is its own git repo (the workspace repo).** Rules, docs, skills and connectors change through pull requests like code. A new person clones it and runs `bash scripts/setup-workspace.sh`, which clones every project in `repos.txt`. Cloned projects are ignored locally, so they're never committed into the workspace repo.
- A new project means a line in `repos.txt`, a new row in the router table, and a new `AGENTS.md`.
- When there are many shared skills, they can also ship as a Claude Code plugin. The rules and docs stay here, where every tool can read them.
- Keep the root file short. Details go in `docs/`, with a pointer.
