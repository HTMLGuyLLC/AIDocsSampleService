import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { runSmoke } from '../scripts/smoke.ts';
import { createApp } from './app.ts';

const server = createServer(createApp().handler).listen(0);
after(() => server.close());
const base = () => `http://localhost:${(server.address() as AddressInfo).port}`;

test('the smoke test passes against the real app', async () => {
  const result = await runSmoke(base());
  assert.deepEqual(result.checks.filter((c) => !c.ok), []);
  assert.equal(result.ok, true);
  assert.ok(result.checks.length >= 5);
});

test('the smoke test fails, with a reason, when the service is not there', async () => {
  const result = await runSmoke('http://127.0.0.1:1', { timeoutMs: 1000 });
  assert.equal(result.ok, false);
  assert.equal(result.checks[0]?.name, 'health');
});
