/**
 * The one place a model is used for catalog import: it PROPOSES a mapping for a new supplier format.
 * It sees only the header row and 3 sample rows, wrapped as untrusted data. A person reviews the result.
 * The import itself (importer.ts) is plain code. Rules: AGENTS.md in this folder.
 */
import { badRequest } from '../../lib/errors.ts';
import type { Guard } from '../../lib/ai/guard.ts';
import type { ModelClient } from '../../lib/ai/model.ts';
import { UNTRUSTED_RULE, wrapUntrusted } from '../../lib/ai/untrusted.ts';
import type { UsageLedger } from '../../lib/ai/usage.ts';
import { assertSupplierName, parseCsv } from './importer.ts';
import type { Mapping } from './types.ts';

export const FEATURE = 'catalog-import-mapping';
export const SAMPLE_LABEL = 'supplier_csv_sample';
export const SAMPLE_ROWS = 3;
const MAX_CELL = 80;
const MAX_OUTPUT_TOKENS = 150;

export const SYSTEM_PROMPT = [
  'You map the columns of a supplier price-list CSV to three fields of a bakery product catalog.',
  'You get the header row and 3 sample rows. Reply with JSON only, in exactly this shape:',
  '{"sku": string, "name": string, "price": string, "priceFormat": "dollars"}',
  'Each of sku, name and price must be one header copied exactly from the header row, each a different header.',
  'sku: the supplier\'s item code. name: the product description. price: the unit price in dollars.',
  UNTRUSTED_RULE,
].join('\n');

const quote = (cell: string) => {
  const short = cell.length > MAX_CELL ? `${cell.slice(0, MAX_CELL)}...` : cell;
  return /[",\n\r]/.test(short) ? `"${short.replace(/"/g, '""')}"` : short;
};

/** The header row and the first 3 data rows, as CSV text. Nothing else from the file is sent. */
export function sampleOf(csvText: string): { headers: string[]; sample: string } {
  const rows = parseCsv(csvText).filter((r) => r.some((c) => c.trim() !== ''));
  const [header, ...body] = rows;
  if (!header) throw badRequest('The file is empty');
  const headers = header.map((h) => h.trim());
  const lines = [headers, ...body.slice(0, SAMPLE_ROWS)].map((r) => r.map(quote).join(','));
  return { headers, sample: lines.join('\n') };
}

/** Checks the model's answer: exactly these keys, every target an existing header, no header used twice. No repairing. */
export function validateProposal(answer: string, headers: string[], supplier: string): Mapping {
  let value: unknown;
  try {
    value = JSON.parse(answer);
  } catch {
    throw badRequest('The model did not return JSON');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw badRequest('The model answer is not an object');
  if (Object.keys(value).sort().join(',') !== 'name,price,priceFormat,sku') throw badRequest('The model answer has the wrong keys');
  const { sku, name, price, priceFormat } = value as Record<string, unknown>;
  if (priceFormat !== 'dollars') throw badRequest('priceFormat must be dollars');
  const targets = { sku, name, price };
  for (const [field, header] of Object.entries(targets)) {
    if (typeof header !== 'string' || !headers.includes(header)) throw badRequest(`${field} is mapped to a header the file does not have`);
  }
  if (new Set([sku, name, price]).size !== 3) throw badRequest('Each field needs its own header');
  return {
    supplier,
    headers,
    fields: { sku: { header: sku as string }, name: { header: name as string }, price: { header: price as string, format: 'dollars' } },
  };
}

interface Deps {
  model: ModelClient;
  guard: Guard;
  usage: UsageLedger;
  modelName?: string;
}

/**
 * Asks the model for a mapping and validates it. Throws when the guard blocks the call (the fallback is a person
 * writing the mapping by hand), and when the answer is not valid. A call that was made is recorded either way.
 */
export async function proposeMapping({ model, guard, usage, modelName = 'small-model' }: Deps, csvText: string, supplier: string): Promise<Mapping> {
  assertSupplierName(supplier);
  const { headers, sample } = sampleOf(csvText);
  const prompt = `Supplier CSV sample:\n${wrapUntrusted(SAMPLE_LABEL, sample)}`;
  const estimate = usage.cost(modelName, {
    inputTokens: Math.ceil((SYSTEM_PROMPT.length + prompt.length) / 4),
    outputTokens: MAX_OUTPUT_TOKENS,
    cacheReadTokens: 0,
  }).costMicros;

  const reservation = guard.reserve(estimate);
  const answer = await model.complete({ model: modelName, system: SYSTEM_PROMPT, prompt, maxTokens: MAX_OUTPUT_TOKENS });
  const row = usage.record({ model: modelName, feature: FEATURE, ...answer });
  guard.settle(reservation, row.costMicros);
  return validateProposal(answer.text, headers, supplier);
}
