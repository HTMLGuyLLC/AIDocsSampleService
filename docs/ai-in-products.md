# AI or normal code inside a product?

| If... | Then | Example here |
|---|---|---|
| There is one right answer you can write as a rule | Normal code | Prices, totals, discounts, statuses ([decision 0003](../orders-api/docs/decisions/0003-ai-only-for-order-notes.md)) |
| The input is messy human text | A model, with validation and a fallback | Order notes (`orders-api/src/services/order-notes/`) |
| The input is messy but the job repeats | AI writes the rules once; normal code runs them; AI returns only when the format changes | Supplier imports ([catalog-import.md](../orders-api/docs/catalog-import.md)) |
| High volume, simple labels, or private data | A decision table, classic ML, or a small language model | Tagging every incoming email |
| A wrong answer costs money or trust | Normal code, or a model that only proposes and a person confirms | Pickup-time changes ([proposals.md](../orders-api/docs/proposals.md)) |

## Always

- The model never decides money, status or access.
- Validate model output. Reject anything that doesn't fit.
- Keep a deterministic fallback, and mark which one answered (`source: 'ai' | 'fallback'`).
- Record cost, keep a kill switch ([ai-safety-and-cost.md](ai-safety-and-cost.md)). Run evals before changing a prompt or model.
