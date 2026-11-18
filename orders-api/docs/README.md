# orders-api docs

Written for people and AI agents alike. Each file answers one question. Company-wide docs (auth, logging, secrets, Dynatrace, AI rules) are in [`../../docs/`](../../docs/README.md).

| File | Read it when |
|---|---|
| [architecture.md](architecture.md) | You need the big picture, or a change touches more than one service |
| [orders.md](orders.md) | You change ordering, order statuses or the catalog |
| [billing.md](billing.md) | You change charges, refunds or the payment provider |
| [notifications.md](notifications.md) | You change customer emails |
| [order-notes-ai.md](order-notes-ai.md) | You change how customer notes are read, or anything that calls a model |
| [proposals.md](proposals.md) | You change what AI output is allowed to lead to (propose, confirm, undo, audit) |
| [catalog-import.md](catalog-import.md) | You import a supplier price list, or a supplier's file changed |
| [dynatrace.md](dynatrace.md) | You look at this service in monitoring, or chase a production problem |
| [testing.md](testing.md) | You write or fix tests |
| [glossary.md](glossary.md) | A word means something specific here |
| [decisions/](decisions/) | You wonder why something is the way it is |
| [runbooks/](runbooks/) | Something is broken in production (`refund-failed`, `payments-failing`) |

## Keeping docs useful

- **One topic per file**, named after the service or question, so an agent can load only what it needs.
- **Write rules, not history.** "Refunds are full only" beats "we discussed partial refunds in March".
- **Say why** when a rule looks odd. Agents follow rules better when they know the reason, and they stop "fixing" things on purpose.
- **Change docs in the same PR as the code.** A wrong doc is worse than no doc: the agent will trust it.
- **Link, don't copy.** If two docs need the same fact, one links to the other.
