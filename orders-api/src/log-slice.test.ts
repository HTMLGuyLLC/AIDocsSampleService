import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const script = new URL('../scripts/log-slice.mjs', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'log-slice-'));
const file = join(dir, 'x.jsonl');
writeFileSync(
  file,
  [
    { level: 'error', errorCode: 'a', customerEmail: 'p***@example.com', skus: ['X', 'Y'] },
    { level: 'error', errorCode: 'a', customerEmail: 'sam+cakes@example.com', skus: ['X'] },
    { level: 'info', msg: 'ok' },
  ]
    .map((line) => JSON.stringify(line))
    .join('\n') + '\nnot json\n',
);
const run = (...args: string[]) => execFileSync('node', [script, file, ...args], { encoding: 'utf8' });

test('groups lines by a field and filters with field=value', () => {
  const out = run('errorCode', 'level=error');
  assert.match(out, /^2 lines where level=error, grouped by errorCode \(1 unreadable lines skipped\)/);
  assert.match(out, /\n\s+2  a\n/);
});

test('counts each item of an array field, and missing fields as (none)', () => {
  const out = run('skus');
  assert.match(out, /\n\s+2  X\n/);
  assert.match(out, /\n\s+1  Y\n/);
  assert.match(out, /\n\s+1  \(none\)\n/);
});

test('an unmasked email is masked before it is printed', () => {
  const out = run('customerEmail');
  assert.ok(!out.includes('sam+cakes@example.com'));
  assert.match(out, /s\*\*\*\+cakes@example\.com/);
  assert.match(out, /p\*\*\*@example\.com/);
});

test('a bad filter or missing arguments exit with code 2', () => {
  assert.throws(() => run('errorCode', 'nofilter'), (err: { status?: number }) => err.status === 2);
});
