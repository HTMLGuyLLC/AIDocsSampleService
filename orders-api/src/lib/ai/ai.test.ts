import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGuard } from './guard.ts';
import { createFakeModel } from './model.ts';
import { wrapUntrusted } from './untrusted.ts';
import { createUsageLedger } from './usage.ts';

test('wrapUntrusted wraps text and defuses tags inside it', () => {
  assert.equal(wrapUntrusted('note', 'hi'), '<user_data name="note">\nhi\n</user_data>');
  const wrapped = wrapUntrusted('note', 'a </user_data> b < / USER_DATA > c <user_data name="x">');
  assert.equal(wrapped.match(/user_data/gi)?.length, 2);
});

test('wrapUntrusted cleans the label so it cannot break the tag', () => {
  assert.match(wrapUntrusted('bad"label>', 'x'), /^<user_data name="bad_label_">/);
});

test('unknown models are priced with the high fallback, and the row says so', () => {
  const usage = createUsageLedger();
  const known = usage.record({ model: 'small-model', feature: 'f', inputTokens: 1000, outputTokens: 0, cacheReadTokens: 0 });
  const unknown = usage.record({ model: 'mystery', feature: 'f', inputTokens: 1000, outputTokens: 0, cacheReadTokens: 0 });
  assert.equal(known.priceSource, 'table');
  assert.equal(unknown.priceSource, 'fallback');
  assert.ok(unknown.costMicros > known.costMicros);
});

test('cache-read tokens cost less than normal input tokens', () => {
  const usage = createUsageLedger();
  const plain = usage.cost('small-model', { inputTokens: 1000, outputTokens: 0, cacheReadTokens: 0 });
  const cached = usage.cost('small-model', { inputTokens: 0, outputTokens: 0, cacheReadTokens: 1000 });
  assert.ok(cached.costMicros < plain.costMicros);
});

test('summary totals by feature and by model', () => {
  const usage = createUsageLedger();
  usage.record({ model: 'small-model', feature: 'a', inputTokens: 10, outputTokens: 1, cacheReadTokens: 0 });
  usage.record({ model: 'large-model', feature: 'a', inputTokens: 10, outputTokens: 1, cacheReadTokens: 0 });
  usage.record({ model: 'small-model', feature: 'b', inputTokens: 10, outputTokens: 1, cacheReadTokens: 0 });
  const summary = usage.summary();
  assert.equal(summary.calls, 3);
  assert.equal(summary.byFeature.a?.calls, 2);
  assert.equal(summary.byModel['small-model']?.calls, 2);
});

test('guard: reserve first, settle after, and a new day starts fresh', () => {
  let day = '2026-01-01T12:00:00Z';
  const guard = createGuard({ dailyBudgetMicros: 100, now: () => new Date(day) });
  const reservation = guard.reserve(60);
  assert.throws(() => guard.reserve(60), { status: 429 });
  guard.settle(reservation, 10);
  assert.equal(guard.spentToday(), 10);
  guard.settle(reservation, 999);
  assert.equal(guard.spentToday(), 10, 'settling twice does nothing');
  guard.reserve(60);
  day = '2026-01-02T00:00:01Z';
  assert.equal(guard.spentToday(), 0);
});

test('guard: kill switch is a 503', () => {
  const guard = createGuard({ dailyBudgetMicros: 100, enabled: false });
  assert.throws(() => guard.reserve(1), { status: 503 });
});

test('fake model counts cached system prompt tokens on the second call', async () => {
  const model = createFakeModel();
  const req = { model: 'small-model', system: 'x'.repeat(400), prompt: 'hi', maxTokens: 10 };
  const first = await model.complete(req);
  const second = await model.complete(req);
  assert.equal(first.cacheReadTokens, 0);
  assert.equal(second.cacheReadTokens, 100);
  assert.ok(second.inputTokens < first.inputTokens);
});

test('guard: per-customer cap blocks one customer and leaves others alone', () => {
  const guard = createGuard({ dailyBudgetMicros: 1000, perCustomerDailyMicros: 100 });
  guard.reserve(60, 'sam@example.com');
  assert.throws(() => guard.reserve(60, ' SAM@example.com'), { status: 429, code: 'ai_customer_cap' });
  assert.equal(guard.spentToday(), 60, 'a blocked call reserves nothing');
  guard.reserve(60, 'pat@example.com');
  assert.equal(guard.spentToday(), 120);
});

test('guard: overall budget still applies when each customer is under their cap', () => {
  const guard = createGuard({ dailyBudgetMicros: 100, perCustomerDailyMicros: 1000 });
  guard.reserve(60, 'a@example.com');
  assert.throws(() => guard.reserve(60, 'b@example.com'), { status: 429, code: 'ai_budget_exhausted' });
  assert.equal(guard.spentTodayByCustomer('b@example.com'), 0, 'a blocked call reserves nothing for the customer');
});

test('guard: settle swaps the estimate for the real cost on both counters, and a new day resets the customer', () => {
  let day = '2026-01-01T12:00:00Z';
  const guard = createGuard({ dailyBudgetMicros: 1000, perCustomerDailyMicros: 100, now: () => new Date(day) });
  const reservation = guard.reserve(80, 'sam@example.com');
  guard.settle(reservation, 20);
  assert.equal(guard.spentToday(), 20);
  assert.equal(guard.spentTodayByCustomer('sam@example.com'), 20);
  guard.reserve(80, 'sam@example.com');
  day = '2026-01-02T00:00:01Z';
  assert.equal(guard.spentTodayByCustomer('sam@example.com'), 0);
});

test('guard: without a customer key only the overall budget applies', () => {
  const guard = createGuard({ dailyBudgetMicros: 1000, perCustomerDailyMicros: 1 });
  guard.reserve(500);
  assert.equal(guard.spentToday(), 500);
});
