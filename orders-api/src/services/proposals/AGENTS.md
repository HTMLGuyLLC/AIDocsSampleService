# Proposals service

Read `docs/proposals.md` before changing anything here.

- **AI code gets `Proposer` (`propose` only).** It never gets `confirm`, `undo` or an order. Don't widen that.
- **`before` and `after` come from stored data**, built by our code (`resolvePickup`). Never from model text, a request body or a note.
- **Only `pickupAt` can be proposed.** Price, total and status are never proposable. Adding a field needs a person's approval first.
- **Proposals expire after 15 minutes.** Confirm after that is a 409.
- **Every confirm and undo writes an audit entry** (who, what, before, after, when). No change without one.
- **Undo works for 24 hours**, and only if the field still holds the confirmed value.
- **No route creates a proposal.** Don't add one.
- Tests inject `now`. Never sleep in a test.
