#!/usr/bin/env node
// Counts JSON log lines grouped by one field. Use it to slice a log file instead of reading it.
// Usage:  node scripts/log-slice.mjs <file.jsonl> <groupField> [filterField=value]
// Example: node scripts/log-slice.mjs logs/payments-2026-11-16.jsonl errorCode level=error
// Array fields (like skus) count each item. Missing fields are counted as "(none)".
// Emails are shown only in the masked form the logs already use. An unmasked one is masked before printing.
import { readFileSync } from 'node:fs';

const [file, groupField, filter] = process.argv.slice(2);
if (!file || !groupField) {
  console.error('Usage: node scripts/log-slice.mjs <file.jsonl> <groupField> [filterField=value]');
  process.exit(2);
}

let filterField;
let filterValue;
if (filter !== undefined) {
  const at = filter.indexOf('=');
  if (at < 1) {
    console.error('The filter must look like field=value');
    process.exit(2);
  }
  filterField = filter.slice(0, at);
  filterValue = filter.slice(at + 1);
}

const safe = (value) => {
  const text = String(value);
  // Masked emails look like p***@example.com. Anything else with an @ gets masked the same way.
  if (!text.includes('@') || /^.\*\*\*/.test(text)) return text;
  const cut = text.search(/[+@]/);
  return cut <= 0 ? '***' : `${text[0]}***${text.slice(cut)}`;
};

const counts = new Map();
let total = 0;
let skipped = 0;
for (const line of readFileSync(file, 'utf8').split('\n')) {
  if (line.trim() === '') continue;
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    skipped++;
    continue;
  }
  if (filterField !== undefined && String(entry[filterField]) !== filterValue) continue;
  total++;
  const raw = entry[groupField];
  for (const value of Array.isArray(raw) ? raw : [raw]) {
    const key = value === undefined || value === null ? '(none)' : safe(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
}

const filterNote = filterField === undefined ? '' : ` where ${filterField}=${safe(filterValue)}`;
console.log(`${total} lines${filterNote}, grouped by ${groupField}${skipped ? ` (${skipped} unreadable lines skipped)` : ''}`);
for (const [key, count] of [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  console.log(`${String(count).padStart(6)}  ${key}`);
}
