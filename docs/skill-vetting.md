# Vetting a skill someone else wrote

A skill is instructions plus, often, scripts. Installing one lets it steer your agent and run code on your machine.
Treat it like installing a program, not like reading a document.

## Checklist (all of it, before installing)

1. **Where is it from?** Prefer official sources (the tool's own vendor, our own repo). Be careful with a random gist or a repo with few users and no history.
2. **Read `SKILL.md` completely.** Does it do what its name and description say, and nothing more?
3. **Read every script and file it ships.** Not just the first one. If you can't follow a script, don't install it.
4. **Check network calls.** What URLs does it contact? Is anything about your files, env vars or repo sent out? Anything downloaded and run (`curl | sh`, `npx` with an unpinned package)?
5. **Check for hidden instructions.** Search for phrases like "ignore previous", "do not tell the user", "you must", text in odd places (comments, long lines, encoded blobs, markdown that hides text).
6. **Check file writes and reads outside the repo.** Anything touching `~`, `.ssh`, `.env`, shell profiles, or other repos is a stop sign.
7. **Check permissions it asks for.** Does it want broad shell access, or to edit `.claude/settings.json`? Why?
8. **Pin the version.** Copy it at a commit or release you reviewed. Don't auto-update: a good skill can turn bad in an update.
9. **Try it somewhere harmless first**, with no secrets in the environment.
10. **Write down** who approved it and what version, in the PR that adds it.

## When in doubt

**Build your own.** A skill is a short markdown file. Often it is faster to write one that does exactly what you want than to review a stranger's.
Use the third-party one as inspiration, and copy only what you understand.

## Same rule for

Plugins, MCP servers ([connectors.md](connectors.md)), editor extensions, and scripts from the internet.
