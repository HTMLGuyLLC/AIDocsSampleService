/**
 * Plain code that reads a supplier CSV with a reviewed mapping. No model calls here, ever:
 * the model only proposes mappings (proposeMapping.ts). Rules: AGENTS.md in this folder.
 */
import { readFileSync } from 'node:fs';
import { badRequest, conflict } from '../../lib/errors.ts';
import type { Cents } from '../../lib/money.ts';
import type { FormatCheck, ImportResult, ImportedProduct, Mapping, RejectedRow } from './types.ts';

const SUPPLIER_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAPPINGS_DIR = new URL('./mappings/', import.meta.url);

/** Splits CSV text into rows of cells. Handles quotes, escaped quotes and CRLF. Blank lines come back as `['']`. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** `12.50` → 1250, `$3` → 300, `1,200` → 120000. Returns null for anything else (negative, 3 decimals, text). Never uses floats. */
export function dollarsToCents(text: string): Cents | null {
  const m = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(text.trim().replace(/^\$\s*/, ''));
  if (!m) return null;
  const cents = Number((m[1] ?? '').replace(/,/g, '')) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Compares the file's headers with the mapping's expected headers. Order does not matter; names do. */
export function checkFormat(headers: string[], mapping: Mapping): FormatCheck {
  const got = headers.map((h) => h.trim());
  const added = got.filter((h) => !mapping.headers.includes(h)).sort();
  const removed = mapping.headers.filter((h) => !got.includes(h)).sort();
  return added.length === 0 && removed.length === 0 ? { status: 'ok' } : { status: 'format_changed', added, removed };
}

/** Reads the products. Bad rows are rejected with their row number; good rows still import. Throws if the format changed. */
export function importCsv(text: string, mapping: Mapping): ImportResult {
  const [header, ...body] = parseCsv(text);
  if (!header) throw badRequest('The file is empty');
  const headers = header.map((h) => h.trim());
  const check = checkFormat(headers, mapping);
  if (check.status !== 'ok') {
    throw conflict(`format_changed: added [${check.added.join(', ')}], removed [${check.removed.join(', ')}]`);
  }
  const at = (field: keyof Mapping['fields']) => headers.indexOf(mapping.fields[field].header);
  const [skuAt, nameAt, priceAt] = [at('sku'), at('name'), at('price')];

  const products: ImportedProduct[] = [];
  const rejected: RejectedRow[] = [];
  const seen = new Set<string>();
  body.forEach((cells, index) => {
    const row = index + 2;
    if (cells.every((c) => c.trim() === '')) return;
    const reject = (reason: string) => rejected.push({ row, reason });
    if (cells.length !== headers.length) return reject(`expected ${headers.length} columns, found ${cells.length}`);
    const sku = (cells[skuAt] ?? '').trim();
    const name = (cells[nameAt] ?? '').trim();
    if (!sku) return reject('sku is empty');
    if (!name) return reject('name is empty');
    const priceCents = dollarsToCents(cells[priceAt] ?? '');
    if (priceCents === null) return reject('price is not a dollar amount like 12.50');
    if (seen.has(sku)) return reject(`sku ${sku} appears twice`);
    seen.add(sku);
    products.push({ sku, name, priceCents });
  });
  return { products, rejected };
}

/** Checks the shape of a mapping read from a file. Used for reviewed mappings. */
export function parseMapping(value: unknown): Mapping {
  const m = value as Partial<Mapping> | null;
  const header = (field: unknown): field is { header: string } => typeof (field as { header?: unknown } | null)?.header === 'string';
  if (
    !m ||
    typeof m.supplier !== 'string' ||
    !Array.isArray(m.headers) ||
    !m.headers.every((h) => typeof h === 'string') ||
    !header(m.fields?.sku) ||
    !header(m.fields?.name) ||
    !header(m.fields?.price) ||
    m.fields.price.format !== 'dollars'
  ) {
    throw badRequest('Mapping file is not in the expected shape');
  }
  const missing = [m.fields.sku.header, m.fields.name.header, m.fields.price.header].filter((h) => !m.headers?.includes(h));
  if (missing.length > 0) throw badRequest(`Mapping points at headers it does not list: ${missing.join(', ')}`);
  return m as Mapping;
}

export function assertSupplierName(supplier: string): void {
  if (!SUPPLIER_NAME.test(supplier)) throw badRequest('supplier must be lower-case letters, digits and dashes, like acme-flour');
}

/** Loads the reviewed mapping `mappings/<supplier>.json`. A `.proposed.json` is never loaded: a person renames it first. */
export function loadMapping(supplier: string): Mapping {
  assertSupplierName(supplier);
  let raw: string;
  try {
    raw = readFileSync(new URL(`${supplier}.json`, MAPPINGS_DIR), 'utf8');
  } catch {
    throw badRequest(`No reviewed mapping for ${supplier}. Run npm run map:supplier, review the proposal, and rename it.`);
  }
  return parseMapping(JSON.parse(raw));
}

export const mappingPath = (supplier: string, proposed = false): URL => new URL(`${supplier}${proposed ? '.proposed' : ''}.json`, MAPPINGS_DIR);
