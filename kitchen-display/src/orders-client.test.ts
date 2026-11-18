import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrdersClient } from './orders-client.ts';
import { CALLER_HEADER, SIGNATURE_HEADER, TIMESTAMP_HEADER, signRequest } from './sign.ts';

const now = () => new Date(1_700_000_000_000);

test('signRequest matches the shared test vector (orders-api checks the same one)', () => {
  const signature = signRequest({ method: 'GET', path: '/internal/orders', timestamp: '1700000000000', body: '', secret: 'test-secret' });
  assert.equal(signature, 'eb80109c8613159e00dd81191af76e3fe858adf70dba5771b4a3a32dc06b7f2b');
});

test('listOrders calls /internal/orders with the three signed headers', async () => {
  let seen: { url: string; headers: Record<string, string> } | undefined;
  const fakeFetch = (async (url: string, init: { headers: Record<string, string> }) => {
    seen = { url, headers: init.headers };
    return new Response('[]', { status: 200 });
  }) as unknown as typeof fetch;

  const client = createOrdersClient({ baseUrl: 'http://orders.test', secret: 'test-secret', fetch: fakeFetch, now });
  assert.deepEqual(await client.listOrders(), []);

  assert.equal(seen?.url, 'http://orders.test/internal/orders');
  assert.equal(seen?.headers[CALLER_HEADER], 'kitchen-display');
  assert.equal(seen?.headers[TIMESTAMP_HEADER], '1700000000000');
  assert.equal(seen?.headers[SIGNATURE_HEADER], 'eb80109c8613159e00dd81191af76e3fe858adf70dba5771b4a3a32dc06b7f2b');
});

test('listOrders throws when orders-api says no', async () => {
  const fakeFetch = (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
  const client = createOrdersClient({ baseUrl: 'http://orders.test', secret: 'x', fetch: fakeFetch, now });
  await assert.rejects(client.listOrders(), /401/);
});
