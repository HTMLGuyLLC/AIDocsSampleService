# Glossary

| Word | Means here |
|---|---|
| **Order** | One customer's request for items, with a total and a status |
| **Line** | One item on an order: a sku and how many |
| **SKU** | The catalog id for a product, e.g. `SOUR-LOAF` |
| **Cents** | All money. `850` means $8.50 |
| **Payment** | A successful charge for one order, stored by billing |
| **Provider** | The outside payment company (faked in this repo) |
| **Idempotent** | Safe to call twice: the second call changes nothing |
| **Outbox** | The in-memory list of emails used instead of really sending them |
| **Note** | Free text a customer adds to an order, such as "no nuts please" |
| **Fallback** | The plain keyword parser that reads a note when the AI can't. Marked `source: 'fallback'` |
| **Eval** | A file of examples with expected answers, run to check a prompt or model change |
| **Micros** | Millionths of a dollar. Used only for AI cost, so tiny amounts stay whole numbers |
| **Kill switch** | One flag that turns all model calls off |
