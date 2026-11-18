import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CALLER_HEADER, SIGNATURE_HEADER, TIMESTAMP_HEADER, signRequest, verifySignature } from './auth.ts';

const secrets = { 'kitchen-display': 'test-secret' };
const now = new Date(1_700_000_000_000);
const timestamp = String(now.getTime());

function signedHeaders(overrides: Record<string, string> = {}) {
  return {
    [CALLER_HEADER]: 'kitchen-display',
    [TIMESTAMP_HEADER]: timestamp,
    [SIGNATURE_HEADER]: signRequest({ method: 'GET', path: '/internal/orders', timestamp, body: '', secret: 'test-secret' }),
    ...overrides,
  };
}

const verify = (headers: Record<string, string>, rawBody = '') =>
  verifySignature({ method: 'GET', path: '/internal/orders', rawBody, headers, secrets, now });

test('signRequest matches the shared test vector (kitchen-display checks the same one)', () => {
  assert.equal(
    signRequest({ method: 'GET', path: '/internal/orders', timestamp, body: '', secret: 'test-secret' }),
    'eb80109c8613159e00dd81191af76e3fe858adf70dba5771b4a3a32dc06b7f2b',
  );
});

test('a correctly signed request returns the caller name', () => {
  assert.equal(verify(signedHeaders()), 'kitchen-display');
});

test('missing headers, unknown callers and bad signatures are 401', () => {
  assert.throws(() => verify({}), { status: 401 });
  assert.throws(() => verify(signedHeaders({ [CALLER_HEADER]: 'someone-else' })), { status: 401 });
  assert.throws(() => verify(signedHeaders({ [SIGNATURE_HEADER]: 'abc' })), { status: 401 });
  assert.throws(() => verify(signedHeaders(), '{"changed":true}'), { status: 401 });
});

test('a caller named like an object property is unknown, not a crash', () => {
  assert.throws(() => verify(signedHeaders({ [CALLER_HEADER]: 'constructor' })), { status: 401 });
});

test('timestamps more than 5 minutes off are rejected, in both directions', () => {
  const old = String(now.getTime() - 5 * 60 * 1000 - 1);
  const future = String(now.getTime() + 5 * 60 * 1000 + 1);
  for (const ts of [old, future]) {
    const signature = signRequest({ method: 'GET', path: '/internal/orders', timestamp: ts, body: '', secret: 'test-secret' });
    assert.throws(() => verify(signedHeaders({ [TIMESTAMP_HEADER]: ts, [SIGNATURE_HEADER]: signature })), { status: 401 });
  }
});
