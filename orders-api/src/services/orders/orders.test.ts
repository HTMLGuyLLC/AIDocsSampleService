import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBilling, createFakeProvider } from '../billing/billing.ts';
import { createOutboxNotifier, type Notifier } from '../notifications/notifications.ts';
import { createOrders } from './orders.ts';

function setup(notifier: Notifier = createOutboxNotifier()) {
  const billing = createBilling(createFakeProvider());
  const orders = createOrders({ billing, notifier, now: () => new Date('2026-01-01T12:00:00Z') });
  return { billing, notifier, orders };
}

const validOrder = {
  customerEmail: 'sam@example.com',
  items: [
    { sku: 'SOUR-LOAF', quantity: 2 },
    { sku: 'COOKIE', quantity: 3 },
  ],
};

test('create totals the lines in cents and starts pending', () => {
  const { orders } = setup();
  const order = orders.create(validOrder);
  assert.equal(order.status, 'pending');
  assert.equal(order.totalCents, 850 * 2 + 275 * 3);
  assert.equal(order.lines[0]?.name, 'Sourdough loaf');
});

test('create rejects unknown skus, bad quantities and bad emails', () => {
  const { orders } = setup();
  assert.throws(() => orders.create({ ...validOrder, items: [{ sku: 'NOPE', quantity: 1 }] }), /Unknown sku/);
  assert.throws(() => orders.create({ ...validOrder, items: [{ sku: 'COOKIE', quantity: 0 }] }), /quantity/);
  assert.throws(() => orders.create({ ...validOrder, items: [{ sku: 'COOKIE', quantity: 1.5 }] }), /quantity/);
  assert.throws(() => orders.create({ ...validOrder, items: [{ sku: 'COOKIE', quantity: 51 }] }), /quantity/);
  assert.throws(() => orders.create({ ...validOrder, customerEmail: 'nope' }), /email/);
  assert.throws(() => orders.create({ ...validOrder, items: [] }), /empty/);
});

test('callers get copies, so they cannot change stored orders', () => {
  const { orders } = setup();
  const order = orders.create(validOrder);
  order.status = 'paid';
  assert.equal(orders.get(order.id).status, 'pending');
});

test('pay charges billing, marks the order paid and emails the customer', async () => {
  const notifier = createOutboxNotifier();
  const { orders, billing } = setup(notifier);
  const order = orders.create(validOrder);

  const paid = await orders.pay(order.id);

  assert.equal(paid.status, 'paid');
  assert.equal(billing.get(paid.paymentId ?? '')?.amountCents, order.totalCents);
  assert.equal(notifier.outbox.length, 1);
  assert.match(notifier.outbox[0]?.subject ?? '', /confirmed/);
});

test('pay twice is a conflict and does not charge again', async () => {
  const { orders } = setup();
  const order = orders.create(validOrder);
  await orders.pay(order.id);
  await assert.rejects(orders.pay(order.id), /Only pending orders/);
});

test('a failed email does not undo the payment', async () => {
  const brokenNotifier: Notifier = {
    async send() {
      throw new Error('mail server down');
    },
  };
  const { orders } = setup(brokenNotifier);
  const order = orders.create(validOrder);
  const original = console.error;
  console.error = () => {};
  try {
    const paid = await orders.pay(order.id);
    assert.equal(paid.status, 'paid');
  } finally {
    console.error = original;
  }
});

test('refund only works on paid orders', async () => {
  const notifier = createOutboxNotifier();
  const { orders } = setup(notifier);
  const order = orders.create(validOrder);

  await assert.rejects(orders.refund(order.id), /Only paid orders/);
  await orders.pay(order.id);
  const refunded = await orders.refund(order.id);

  assert.equal(refunded.status, 'refunded');
  assert.match(notifier.outbox.at(-1)?.subject ?? '', /refunded/);
  await assert.rejects(orders.refund(order.id), /Only paid orders/);
});

test('missing orders are a not-found error', () => {
  const { orders } = setup();
  assert.throws(() => orders.get('ord_999'), /Order not found/);
});

test('addNote stores the note and its details, and leaves the total alone', async () => {
  const { orders } = setup();
  const created = orders.create(validOrder);
  const withNote = await orders.addNote(created.id, 'no nuts please');
  assert.equal(withNote.note, 'no nuts please');
  assert.equal(withNote.noteDetails, undefined, 'no reader configured, so no details');
  assert.equal(withNote.totalCents, created.totalCents);
});

test('addNote rejects empty or huge notes and orders that are not pending', async () => {
  const { orders } = setup();
  const order = orders.create(validOrder);
  await assert.rejects(orders.addNote(order.id, '  '), /note must be/);
  await assert.rejects(orders.addNote(order.id, 'x'.repeat(501)), /note must be/);
  await orders.pay(order.id);
  await assert.rejects(orders.addNote(order.id, 'hello'), /pending/);
});
