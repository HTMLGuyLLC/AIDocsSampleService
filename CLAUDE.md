@AGENTS.md

## Claude Code only

- Org-wide skills are in `.claude/skills/`: `ticket-ready-check`, `ticket-to-pr`, `update-docs`, `add-endpoint`, `pos-lookup`, `release-notes`, `audit-loop`, `debug-with-evidence`. Use them instead of improvising the same workflow.
- Each project may add its own skills in its own `.claude/skills/`. Project skills win when names clash.
- Models: start on Opus at low effort. For simple, mechanical work, hand it to a Sonnet or Haiku subagent, then check the result yourself. Details: `docs/model-selection.md`.
- Connectors (GitHub, Jira, Dynatrace) are set up in `.mcp.json`. Prefer them over asking a person to paste things in. Read `docs/connectors.md`.
- Permissions are in `.claude/settings.json`. If a command is blocked, ask instead of working around it.
- Project folders have their own `CLAUDE.md` (it just imports that project's `AGENTS.md`). Claude Code loads it when you work in that folder.
