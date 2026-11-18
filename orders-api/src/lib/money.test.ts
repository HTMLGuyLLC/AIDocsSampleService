import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertCents, formatCents, percentOf } from './money.ts';

test('formatCents shows dollars with two decimals', () => {
  assert.equal(formatCents(850), '$8.50');
  assert.equal(formatCents(5), '$0.05');
});

test('percentOf rounds half up to a whole cent', () => {
  assert.equal(percentOf(1000, 10), 100);
  assert.equal(percentOf(275, 10), 28); // 27.5 rounds up
});

test('assertCents rejects floats and negatives', () => {
  assert.throws(() => assertCents(1.5));
  assert.throws(() => assertCents(-1));
  assert.doesNotThrow(() => assertCents(0));
});
