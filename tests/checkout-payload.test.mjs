import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCheckoutPayload } from '../lib/server/checkout-payload.mjs';
test('concurrent retries preserve canonical creation parameters despite config changes', async () => {
  const data = new Map();
  const command = async ([op, key, value]) => {
    if (op === 'SET') { if (data.has(key)) return null; data.set(key, value); return 'OK'; }
    return data.get(key);
  };
  const attempt = { id: 'attempt' };
  const results = await Promise.all([
    canonicalCheckoutPayload(command, attempt, { price: 'original', expires_at: 100 }),
    canonicalCheckoutPayload(command, attempt, { price: 'changed', expires_at: 200 }),
  ]);
  assert.deepEqual(results[0], results[1]);
  assert.equal(results[0].price, 'original');
});
