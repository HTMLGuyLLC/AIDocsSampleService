# 107: Supplier changed their file format

Acme Flour sent this month's price list, `imports/acme-flour-2026-12.csv`. The import refuses it. November's file still imports fine.

```bash
npm run import -- imports/acme-flour-2026-12.csv acme-flour
```

## Acceptance criteria

- The December file imports: 5 products, prices in integer cents, no rejected rows.
- November's file still imports with the old mapping.
- The new mapping was **proposed by the tool and reviewed by you**, not edited into place blindly. Say what you checked.
- The import code (`importer.ts`) is unchanged and makes no model calls.
- A test covers the December file with the new mapping.

## Notes

- Read `docs/catalog-import.md` first.
- Don't change the importer to accept any header. The point is that a format change stops the import.
- Keep the old mapping for November if both files must keep working (for example `acme-flour-2026-12.json`), or say why one mapping is enough.
