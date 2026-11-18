#!/usr/bin/env node
// Looks up data in Crumb & Co.'s point-of-sale (POS) system and prints a short JSON summary.
// Usage:  node pos-lookup.mjs [--fake] sales [YYYY-MM-DD]
//         node pos-lookup.mjs [--fake] item <SKU>
// Needs POS_API_URL and POS_API_KEY in the environment (see docs/secrets.md). The key is never printed.
// --fake returns canned data, so this runs offline with no key. The POS API here is fictional.

const args = process.argv.slice(2);
const fake = args.includes('--fake');
const [command, arg] = args.filter((a) => a !== '--fake');

const FAKE = {
  sales: {
    date: '2026-11-16',
    transactions: 3,
    items: [
      { sku: 'SOUR-LOAF', quantity: 4, grossCents: 3400 },
      { sku: 'COOKIE', quantity: 9, grossCents: 2475 },
      { sku: 'CROIS-6', quantity: 2, grossCents: 3000 },
    ],
  },
  item: { sku: 'SOUR-LOAF', name: 'Sourdough loaf', priceCents: 850, onHand: 12 },
};

function usage() {
  console.error('Usage: pos-lookup.mjs [--fake] sales [YYYY-MM-DD] | item <SKU>');
  process.exit(2);
}

async function get(path) {
  const base = process.env.POS_API_URL;
  const key = process.env.POS_API_KEY;
  if (!base || !key) {
    console.error('POS_API_URL and POS_API_KEY must be set. Load them with scripts/load-secrets.sh, or use --fake.');
    process.exit(1);
  }
  const res = await fetch(new URL(path, base), { headers: { authorization: `Bearer ${key}` } });
  // Only the status is reported on failure: error bodies can echo request details.
  if (!res.ok) {
    console.error(`POS answered ${res.status}`);
    process.exit(1);
  }
  return res.json();
}

function summarizeSales(data) {
  const items = [...data.items].sort((a, b) => b.grossCents - a.grossCents);
  return {
    date: data.date,
    transactions: data.transactions,
    totalCents: items.reduce((sum, i) => sum + i.grossCents, 0),
    topItems: items.slice(0, 5).map(({ sku, quantity, grossCents }) => ({ sku, quantity, grossCents })),
  };
}

let result;
if (command === 'sales') {
  if (arg !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(arg)) usage();
  const data = fake ? FAKE.sales : await get(`/v1/sales?date=${arg ?? new Date().toISOString().slice(0, 10)}`);
  result = summarizeSales(data);
} else if (command === 'item') {
  if (!arg || !/^[A-Z0-9-]+$/.test(arg)) usage();
  const data = fake ? FAKE.item : await get(`/v1/items/${arg}`);
  result = { sku: data.sku, name: data.name, priceCents: data.priceCents, onHand: data.onHand };
} else {
  usage();
}

console.log(JSON.stringify(result));
