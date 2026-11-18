# Secrets

A secret is anything that lets someone in: API keys, tokens, signing secrets, passwords.

## Where they live

**Azure Key Vault.** Two vaults: `crumb-kv-dev` and `crumb-kv-prod`. Nothing else is the source of truth.

- **Never commit a `.env` file.** `.gitignore` blocks `.env` and `.env.*`. Only `.env.example` is committed, and it holds **names only**.
- **Never put a secret in code, a doc, a ticket, a prompt or a log.**
- **Vault names use hyphens.** The variable `KITCHEN_DISPLAY_SECRET` is the vault secret `kitchen-display-secret`.

## Getting them onto your machine

```bash
scripts/load-secrets.sh orders-api          # dev vault
APP_ENV=prod scripts/load-secrets.sh orders-api   # prod: ask a person first
scripts/load-secrets.sh orders-api --fake   # placeholder values, no Azure needed
```

The script reads the names from `<project>/.env.example`, pipes each value **straight from Azure into a file**, sets the file to `chmod 600`,
and moves it to `.env`. It never echoes a value, and no value ever sits in a shell variable.

## How agents work with secrets without seeing them

- **Agents are denied reading `.env`** (`Read(**/.env)` and `Read(**/.env.*)` in `.claude/settings.json`). This is a guardrail, not a hint.
- An agent can **run** `scripts/load-secrets.sh`, because the script hides the values. It then runs the app or a script that reads the environment.
- An agent that needs a new secret writes the **name** into `.env.example` and tells a person to add the value to the vault.
- If an agent ever sees a secret by accident, it says so, and a person rotates it.

## CI

CI signs in to Azure with **OIDC** (a short-lived token from GitHub), not a long-lived key stored as a GitHub secret.
The current checks need no secrets at all.

## Agents get their own credentials

- Each connector or tool an agent uses has **its own least-privilege credential**: read-only where reading is enough ([connectors.md](connectors.md)).
- **Never lend an agent a person's token.** If the agent misbehaves, you can turn off its token without locking out a person.
- Rotate on a schedule, and right away if one leaks.

## Ask a person first

Adding, changing, rotating or reading a vault secret, and anything that touches `prod`.
