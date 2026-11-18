# Company docs

Things that are true for every Crumb & Co. project. One topic per file, so an agent loads only what it needs.
Project-specific docs live in each project's own `docs/` (for example `orders-api/docs/`).

| File | Read it when |
|---|---|
| [connectors.md](connectors.md) | You use or add an MCP connector (GitHub, Jira, Dynatrace) |
| [dynatrace.md](dynatrace.md) | You look at monitoring, dashboards or alerts, or chase a production problem |
| [auth.md](auth.md) | One service calls another |
| [logging.md](logging.md) | You add or read log lines |
| [secrets.md](secrets.md) | You need a key, token or password, or add one |
| [skill-vetting.md](skill-vetting.md) | You want to install a skill or plugin someone else wrote |
| [prompting.md](prompting.md) | You write a prompt, or a ticket an agent will work |
| [model-selection.md](model-selection.md) | You choose a model, or split work between agents |
| [ai-in-products.md](ai-in-products.md) | You decide whether a product feature should use AI |
| [ai-safety-and-cost.md](ai-safety-and-cost.md) | You build or change a feature that calls a model |
| [ai-pipeline.md](ai-pipeline.md) | You work on the ticket-to-production pipeline or its GitHub workflows |
| [decisions/](decisions/) | You wonder why the folder is set up this way |

## Keeping these useful

- **One topic per file.** If a doc needs a second topic, make a second doc.
- **Rules, not history.** Say why when a rule looks odd.
- **Fix a doc the moment you find it wrong**, in the same change as the code you were working on.
- **Link, don't copy.** If two docs need the same fact, one links to the other.
