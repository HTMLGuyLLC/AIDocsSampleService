/**
 * Runs the order-note cases against the note reader and prints a pass/fail table.
 * Usage: npm run eval            (add --strict to exit 1 when a case fails)
 * Uses the model from createDefaultModel() (the offline fake unless you plug in a real client),
 * and also runs each case through the keyword fallback so you can compare the two paths.
 * Docs: docs/order-notes-ai.md
 */
import { readFileSync } from 'node:fs';
import { createGuard } from '../src/lib/ai/guard.ts';
import { createDefaultModel } from '../src/lib/ai/model.ts';
import { createUsageLedger } from '../src/lib/ai/usage.ts';
import { silentLog } from '../src/lib/log.ts';
import { parseNoteFallback } from '../src/services/order-notes/fallback.ts';
import { createOrderNotes } from '../src/services/order-notes/order-notes.ts';
import type { NoteFields } from '../src/services/order-notes/types.ts';

interface Case {
  name: string;
  note: string;
  expect: NoteFields;
}

const cases = JSON.parse(readFileSync(new URL('../evals/order-notes.cases.json', import.meta.url), 'utf8')) as Case[];

const usage = createUsageLedger();
const guard = createGuard({ dailyBudgetMicros: 10_000_000 });
const notes = createOrderNotes({ model: createDefaultModel(), guard, usage, log: silentLog });

const same = (got: NoteFields, want: NoteFields) =>
  [...got.allergies].sort().join(',') === [...want.allergies].sort().join(',') &&
  (got.pickupAt ?? null) === want.pickupAt &&
  (got.occasion ?? null) === want.occasion;

const rows: { name: string; model: boolean; fallback: boolean; source: string }[] = [];
for (const c of cases) {
  const viaModel = await notes.parseNote(c.note);
  rows.push({ name: c.name, model: same(viaModel, c.expect), fallback: same(parseNoteFallback(c.note), c.expect), source: viaModel.source });
}

const mark = (ok: boolean) => (ok ? 'pass' : 'FAIL');
console.log(`${'case'.padEnd(46)} ${'model path'.padEnd(11)} fallback`);
for (const r of rows) {
  const via = r.source === 'ai' ? '' : ' (model fell back)';
  console.log(`${r.name.padEnd(46)} ${mark(r.model).padEnd(11)} ${mark(r.fallback)}${via}`);
}
const modelPassed = rows.filter((r) => r.model).length;
const fallbackPassed = rows.filter((r) => r.fallback).length;
console.log(`\nmodel path: ${modelPassed}/${rows.length} passed   fallback: ${fallbackPassed}/${rows.length} passed`);
console.log(`model calls: ${usage.summary().calls}, cost: ${usage.summary().costMicros} micros`);

if (process.argv.includes('--strict') && modelPassed < rows.length) process.exitCode = 1;
