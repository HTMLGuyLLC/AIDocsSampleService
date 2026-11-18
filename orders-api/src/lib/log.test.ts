import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskEmail } from './log.ts';

test('maskEmail keeps the first letter, any +tag and the domain', () => {
  assert.equal(maskEmail('sam@example.com'), 's***@example.com');
  assert.equal(maskEmail('sam+cakes@example.com'), 's***+cakes@example.com');
});

test('maskEmail hides anything that is not an email', () => {
  assert.equal(maskEmail('nope'), '***');
  assert.equal(maskEmail(''), '***');
});
