import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBakeList, formatBakeList } from './bake-list.ts';
import type { Order } from './orders-client.ts';

const order = (id: string, status: Order['status'], lines: [string, number][], allergies?: string[]): Order => ({
  id,
  status,
  lines: lines.map(([sku, quantity]) => ({ sku, name: `Name of ${sku}`, quantity })),
  ...(allergies ? { noteDetails: { allergies } } : {}),
});

test('adds up quantities per sku across paid orders, sorted by sku', () => {
  const list = buildBakeList([
    order('ord_1', 'paid', [['SOUR-LOAF', 2], ['COOKIE', 3]]),
    order('ord_2', 'paid', [['SOUR-LOAF', 1]]),
  ]);
  assert.deepEqual(list.map((i) => [i.sku, i.quantity]), [['COOKIE', 3], ['SOUR-LOAF', 3]]);
});

test('pending and refunded orders are left out', () => {
  const list = buildBakeList([order('ord_1', 'pending', [['COOKIE', 5]]), order('ord_2', 'refunded', [['COOKIE', 5]])]);
  assert.deepEqual(list, []);
});

test('allergies are flagged on the items of the orders that mention them', () => {
  const list = buildBakeList([
    order('ord_1', 'paid', [['COOKIE', 1]], ['nuts']),
    order('ord_2', 'paid', [['COOKIE', 1], ['SOUR-LOAF', 1]], ['nuts', 'dairy']),
    order('ord_3', 'paid', [['SOUR-LOAF', 1]]),
  ]);
  const cookie = list.find((i) => i.sku === 'COOKIE');
  assert.deepEqual(cookie?.allergyFlags, [
    { allergy: 'nuts', orderIds: ['ord_1', 'ord_2'] },
    { allergy: 'dairy', orderIds: ['ord_2'] },
  ]);
  assert.deepEqual(list.find((i) => i.sku === 'SOUR-LOAF')?.allergyFlags.map((f) => f.allergy), ['nuts', 'dairy']);
});

test('formatBakeList prints quantities and allergy lines, or says there is nothing to bake', () => {
  assert.equal(formatBakeList([]), 'Nothing to bake yet.');
  const text = formatBakeList(buildBakeList([order('ord_1', 'paid', [['COOKIE', 12]], ['nuts'])]));
  assert.match(text, /12 x Name of COOKIE \(COOKIE\)/);
  assert.match(text, /ALLERGY nuts: ord_1/);
});
