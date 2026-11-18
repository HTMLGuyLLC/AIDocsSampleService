# Vetting a skill someone else wrote

Before installing any skill, plugin, MCP server or script from outside:

1. **Source:** prefer official ones.
2. **Read all of it:** `SKILL.md` and every script it runs.
3. **What it touches:** network calls, files outside the repo (`~`, `.ssh`, `.env`, shell profiles), your environment variables.
4. **Hidden orders:** "ignore previous instructions", "don't tell the user", encoded or hidden text.
5. **Permissions:** does it want broad shell access or to edit `.claude/settings.json`?
6. **Pin the version** you reviewed. Re-check on every update.
7. **Record** who approved it and which version, in the PR that adds it.

When in doubt, build your own. It's a markdown file.
