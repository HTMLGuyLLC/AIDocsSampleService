# Catalog import service

Read `docs/catalog-import.md` before changing anything here.

- **`importer.ts` makes no model calls.** It must not import anything from `src/lib/ai/`. A test checks this.
- **The model only proposes a mapping** (`proposeMapping.ts`). It sends the header row and 3 sample rows, wrapped with `wrapUntrusted`. Never the whole file.
- **A person reviews every mapping.** The proposal is written as `mappings/<supplier>.proposed.json`. The importer never loads a `.proposed` file.
- **Validate the model's mapping by hand.** Every target field must point at a header the file has. No repairing.
- **Prices are dollars in the file and integer cents everywhere else.** No floats.
- Format changed? The import stops and reports what changed. Don't guess columns.
- Record usage under feature `catalog-import-mapping`. Use `CATALOG_IMPORT_AI_KEY` for its key.
- Tests use `createFakeModel()` or a hand-written `ModelClient`. Never a real model.
