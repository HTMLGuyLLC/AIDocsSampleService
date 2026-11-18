/**
 * Imports a supplier CSV with a reviewed mapping and prints a summary. No model calls.
 * Usage: npm run import -- <csv> <supplier>      e.g. npm run import -- imports/acme-flour-2026-11.csv acme-flour
 * Exit 0: imported. Exit 1: the format changed, or the file could not be read.
 * Docs: docs/catalog-import.md
 */
import { readFileSync } from 'node:fs';
import { AppError } from '../src/lib/errors.ts';
import { checkFormat, importCsv, loadMapping, parseCsv } from '../src/services/catalog-import/importer.ts';
import { formatCents } from '../src/lib/money.ts';

const [csvPath, supplier] = process.argv.slice(2);
if (!csvPath || !supplier) {
  console.error('Usage: npm run import -- <csv> <supplier>');
  process.exit(2);
}

try {
  const mapping = loadMapping(supplier);
  const text = readFileSync(csvPath, 'utf8');
  const check = checkFormat(parseCsv(text)[0] ?? [], mapping);
  if (check.status === 'format_changed') {
    console.log(`format_changed: ${csvPath} does not match the ${supplier} mapping.`);
    console.log(`  new headers:     ${check.added.join(', ') || '(none)'}`);
    console.log(`  missing headers: ${check.removed.join(', ') || '(none)'}`);
    console.log(`Nothing was imported. Run: npm run map:supplier -- ${csvPath} ${supplier}`);
    console.log('Then review the proposed mapping, rename it to replace the old one, and import again.');
    process.exit(1);
  }
  const { products, rejected } = importCsv(text, mapping);
  console.log(`Imported ${products.length} products from ${csvPath} (${supplier}).`);
  for (const p of products) console.log(`  ${p.sku}  ${formatCents(p.priceCents)}  ${p.name}`);
  if (rejected.length > 0) {
    console.log(`Rejected ${rejected.length} rows:`);
    for (const r of rejected) console.log(`  row ${r.row}: ${r.reason}`);
  }
} catch (err) {
  console.error(err instanceof AppError || err instanceof Error ? err.message : String(err));
  process.exit(1);
}
