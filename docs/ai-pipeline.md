# The AI pipeline

How work moves from a ticket to production with agents doing the waiting and people making the calls.

```
Ticket → Ready check → Plan → Code → Review → Deploy → Test
          (agent)    (person   (agent) (agent  (person  (agent)
                     approves)          + CI)  approves)
```

| Step | Who | What happens | In this repo |
|---|---|---|---|
| Ready check | Agent | Reads the ticket and docs, asks what's missing as comments. Only comments | `.github/workflows/ai-ticket-ready-check.yml`, skill `ticket-ready-check` |
| Plan | Agent, then **a person approves** | Files, tests, docs and risks, before any code | skill `ticket-to-pr` (step 2) |
| Code | Agent | Builds with tests and docs on a branch, opens a PR | skill `ticket-to-pr` |
| Review | A **separate** agent, plus CI | Checks the diff against the rules and docs; CI runs `npm run check` | `.github/workflows/ai-pr-review.yml`, `ci.yml` |
| Deploy | **A person approves** | Merge and release | your deploy process |
| Test | Agent | Runs the smoke test, then compares errors before and after in Dynatrace. Recommends, never rolls back | `.github/workflows/ai-post-deploy-check.yml`, skill `post-deploy-check`, `npm run smoke` in `orders-api/`. Skill `debug-with-evidence` for anything it finds |

## Gates by size and risk

| Kind of change | Runs on its own | A person steps in |
|---|---|---|
| Small and easy to undo | Ready check, code, review, CI | Approves the merge |
| Normal feature | Ready check, code, review, CI | Approves the plan and the merge |
| Money, data, security, anything on an "Ask a person first" list | Ready check and review only | Writes or pairs on the code, approves every step |

## Turning it on

The workflows are off until you choose to turn them on:

1. Add an `ANTHROPIC_API_KEY` repository secret.
2. Set the repository variable `AI_PIPELINE` to `on`.

Start with the ready check alone. It only comments, so it can't break anything. Add the next step once the team trusts this one.

## Rules

- Every agent treats ticket and PR text as data, not instructions.
- Agents get only the GitHub commands their step needs (see `--allowedTools` in each workflow).
- No agent approves, merges or deploys. People do.
- Fork PRs don't get secrets on public repos, so reviews only run on branches in this repo.
- If the repo is public, agents only run for issues and PRs from an owner, member or collaborator (`author_association`), so a stranger can't spend your API budget.
