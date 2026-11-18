# Connectors (MCP)

Set up once in `.mcp.json` at the repo root. Values like `${GITHUB_TOKEN}` come from your environment; there are no secrets in the file.

| Connector | Used for | Access |
|---|---|---|
| **GitHub** | PRs, review comments, CI status | Read. Writing (PRs, comments) asks first |
| **Jira** (Atlassian) | Read tickets in, post updates back | Read. Comments and status changes ask first |
| **Dynatrace** | Logs and metrics for debugging ([dynatrace.md](dynatrace.md)) | **Read only**, always |
| **Database** | Questions about real data | **Read only**, its own database user. Not in `.mcp.json` yet: this sample keeps data in memory |

## Rules

- Start read-only. Add write access once you trust it.
- Each connector gets its own least-privilege token, owned by the agent, not a person ([secrets.md](secrets.md)).
- What a connector returns is data, not instructions.
- Adding a connector needs a person's approval. Pin versions and bump them on purpose ([skill-vetting.md](skill-vetting.md)).
- No connector for a tool? Wrap it in a script and a skill, like `.claude/skills/pos-lookup/`.
