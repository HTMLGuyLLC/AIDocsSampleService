# Catalog import (AI writes the rules once)

Owns: reading a supplier's price-list CSV into products.
Code: `src/services/catalog-import/`, `scripts/import-catalog.ts`, `scripts/map-supplier.ts`. Tests: `catalog-import.test.ts`.
Sample files: `imports/`. Company rules for AI: [../../docs/ai-safety-and-cost.md](../../docs/ai-safety-and-cost.md).

## Steps

1. **New format.** A supplier sends a file we have no mapping for, or the format changed.
2. **AI proposes a mapping.** `npm run map:supplier -- <csv> <supplier>`. Only the header row and 3 sample rows go to the model, wrapped as untrusted data. It writes `mappings/<supplier>.proposed.json`.
3. **A person reviews it.** Check each field against the real file, then rename it to `mappings/<supplier>.json`.
4. **Code runs every file.** `npm run import -- <csv> <supplier>`. No model is called. Prices go from dollars to integer cents.
5. **Format change.** Headers added, removed or renamed: the import stops, prints what changed and imports nothing.
6. **AI proposes again.** Back to step 2.

## Commands

| Command | What |
|---|---|
| `npm run import -- imports/acme-flour-2026-11.csv acme-flour` | Check the format, import, print a summary |
| `npm run map:supplier -- imports/acme-flour-2026-12.csv acme-flour` | Propose a mapping (uses a model). Needs `CATALOG_IMPORT_AI_KEY` when a real model is plugged in |

## Mapping file

`mappings/<supplier>.json`: `headers` (every header the file must have), and `fields` for `sku`, `name` and `price`. `price.format` is `dollars`: `12.50` and `$3` become `1250` and `300` cents.

## Rules

- A file is accepted only if its headers are exactly the mapping's `headers` (order does not matter).
- A bad row is rejected with its row number (header is row 1). Good rows still import.
- The model's mapping is checked by code: every field must point at a header the file has, each a different one.
- The importer never loads a `.proposed.json`. A person renames it.
- Usage is recorded under feature `catalog-import-mapping`, with the same kill switch and budget as other AI features.
- If the model can't help (off, over budget, bad answer), write the mapping by hand. Nothing else depends on it.
