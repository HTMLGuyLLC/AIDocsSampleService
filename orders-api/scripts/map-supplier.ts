/**
 * Asks the model to PROPOSE a column mapping for a supplier CSV. Uses a model, so it costs a little.
 * Sends only the header row and 3 sample rows. Writes the proposal for a person to review; it never replaces a reviewed mapping.
 * Usage: npm run map:supplier -- <csv> <supplier>    e.g. npm run map:supplier -- imports/acme-flour-2026-12.csv acme-flour
 * Docs: docs/catalog-import.md
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createGuard } from '../src/lib/ai/guard.ts';
import { createDefaultModel } from '../src/lib/ai/model.ts';
import { createUsageLedger } from '../src/lib/ai/usage.ts';
import { mappingPath } from '../src/services/catalog-import/importer.ts';
import { proposeMapping } from '../src/services/catalog-import/proposeMapping.ts';

const [csvPath, supplier] = process.argv.slice(2);
if (!csvPath || !supplier) {
  console.error('Usage: npm run map:supplier -- <csv> <supplier>');
  process.exit(2);
}

const usage = createUsageLedger();
const guard = createGuard({ dailyBudgetMicros: Number(process.env.AI_DAILY_BUDGET_MICROS ?? 1_000_000), enabled: process.env.AI_ENABLED !== 'false' });

try {
  const mapping = await proposeMapping({ model: createDefaultModel('CATALOG_IMPORT_AI_KEY'), guard, usage }, readFileSync(csvPath, 'utf8'), supplier);
  const out = mappingPath(supplier, true);
  writeFileSync(out, `${JSON.stringify(mapping, null, 2)}\n`);
  console.log(`Proposed mapping written to ${fileURLToPath(out)}`);
  console.log(`  sku <- ${mapping.fields.sku.header}`);
  console.log(`  name <- ${mapping.fields.name.header}`);
  console.log(`  price <- ${mapping.fields.price.header} (dollars)`);
  console.log(`Model calls: ${usage.summary().calls}, cost: ${usage.summary().costMicros} micros.`);
  console.log(`A person reviews it, then renames it to ${supplier}.json to use it.`);
} catch (err) {
  console.error(`No mapping written: ${err instanceof Error ? err.message : String(err)}`);
  console.error('Write the mapping by hand instead. Docs: docs/catalog-import.md');
  process.exit(1);
}
