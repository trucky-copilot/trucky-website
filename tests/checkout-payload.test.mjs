import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCheckoutPayload, recoverRejectedPayload } from '../lib/server/checkout-payload.mjs';
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

test('audited validation recovery is stable across retries and rejects unapproved attempts', async () => {
  const data = new Map();
  const command = async ([op, key, value]) => {
    if (op === 'SET') { if (data.has(key)) return null; data.set(key, value); return 'OK'; }
    return data.get(key);
  };
  const attempt = { id: 'audit', idempotencyKey: 'original' };
  const payload = { payment_method_types: ['card'], subscription_data: { trial_period_days: 30 }, expires_at: 1 };
  await assert.rejects(recoverRejectedPayload(command, attempt, payload, undefined), /RECONCILIATION_REQUIRED/);
  const a = await recoverRejectedPayload(command, attempt, payload, 'audit', 1000000);
  const b = await recoverRejectedPayload(command, attempt, payload, 'audit', 1100000);
  assert.deepEqual(a, b);
  assert.notEqual(a.idempotencyKey, attempt.idempotencyKey);
  assert.ok(!Object.hasOwn(a.payload, 'payment_method_types'));
  assert.equal(a.payload.subscription_data.trial_period_days, 30);
  await assert.rejects(recoverRejectedPayload(command, { ...attempt, sessionId: 'cs_test_existing' }, payload, 'audit'), /RECONCILIATION_REQUIRED/);
});
