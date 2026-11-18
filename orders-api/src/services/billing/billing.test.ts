import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBilling, createFakeProvider, type PaymentProvider } from './billing.ts';

test('charge records a payment', async () => {
  const billing = createBilling(createFakeProvider());
  const payment = await billing.charge('ord_1', 1250);
  assert.equal(payment.status, 'succeeded');
  assert.equal(billing.get(payment.id)?.amountCents, 1250);
});

test('charge is idempotent per order: the provider is only called once', async () => {
  let calls = 0;
  const provider: PaymentProvider = {
    async charge() {
      calls++;
      return { providerId: 'pay_x' };
    },
    async refund() {},
  };
  const billing = createBilling(provider);
  const first = await billing.charge('ord_1', 1250);
  const second = await billing.charge('ord_1', 1250);
  assert.equal(calls, 1);
  assert.equal(second.id, first.id);
});

test('charge rejects zero, negative and fractional cents', async () => {
  const billing = createBilling(createFakeProvider());
  await assert.rejects(billing.charge('ord_1', 0), /zero/);
  await assert.rejects(billing.charge('ord_2', -5), /cents/);
  await assert.rejects(billing.charge('ord_3', 12.5), /cents/);
});

test('refund marks the payment refunded once', async () => {
  const billing = createBilling(createFakeProvider());
  const payment = await billing.charge('ord_1', 1250);
  const refunded = await billing.refund(payment.id);
  assert.equal(refunded.status, 'refunded');
  assert.ok(refunded.refundedAt);
  await assert.rejects(billing.refund(payment.id), /already refunded/);
  await assert.rejects(billing.refund('pay_missing'), /not found/);
});
