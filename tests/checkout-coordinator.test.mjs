import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutCoordinator, redisCommandFromEnv, ATTACH, RELEASE } from '../lib/server/checkout-coordinator.mjs';

// Model of atomic Redis commands. These tests verify application sequencing;
// they do not substitute integration tests against the provisioned Redis.
function fixture() {
  const map = new Map();
  const command = async ([op, ...args]) => {
    if (op === 'SET') {
      assert.deepEqual(args.slice(2), ['NX']); // No unsafe lease expiry.
      if (map.has(args[0])) return null;
      map.set(args[0], args[1]); return 'OK';
    }
    if (op === 'GET') return map.get(args[0]) ?? null;
    const [script, , key, id, sessionId] = args;
    const value = JSON.parse(map.get(key) || 'null');
    if (!value || value.id !== id) return 0;
    if (script === ATTACH) {
      if (value.sessionId && value.sessionId !== sessionId) return 0;
      map.set(key, JSON.stringify({ ...value, sessionId })); return 1;
    }
    assert.equal(script, RELEASE); map.delete(key); return 1;
  };
  return createCheckoutCoordinator(command);
}

test('concurrent retries reuse one attempt and idempotency key', async () => {
  const c = fixture();
  const results = await Promise.all(Array.from({ length: 100 }, () => c.reserve('org_1', 'google_1')));
  assert.equal(new Set(results.map(x => x.id)).size, 1);
  assert.equal(new Set(results.map(x => x.idempotencyKey)).size, 1);
});
test('other actor cannot take over an existing attempt', async () => {
  const c = fixture(); await c.reserve('org_1', 'google_1');
  await assert.rejects(c.reserve('org_1', 'google_2'), /CHECKOUT_LOCKED/);
});
test('unknown creation outcome remains blocked without a session ID', async () => {
  const c = fixture(); const a = await c.reserve('org_1', 'google_1');
  await assert.rejects(c.releaseExpired('org_1', a.id, {}), /RECONCILIATION_REQUIRED/);
  assert.equal((await c.reserve('org_1', 'google_1')).id, a.id);
});
test('open or complete sessions cannot release a reservation', async () => {
  const c = fixture(); const a = await c.reserve('org_1', 'google_1');
  await c.attach('org_1', a.id, 'cs_test_1');
  for (const status of ['open', 'complete']) {
    await assert.rejects(c.releaseExpired('org_1', a.id, { checkout: { sessions: { retrieve: async () => ({ id: 'cs_test_1', livemode: false, status }) } } }), /SESSION_NOT_EXPIRED/);
  }
});
test('expired session allows release; stale owner cannot modify new reservation', async () => {
  const c = fixture(); const a = await c.reserve('org_1', 'google_1');
  await c.attach('org_1', a.id, 'cs_test_1');
  assert.equal(await c.releaseExpired('org_1', a.id, { checkout: { sessions: { retrieve: async () => ({ id: 'cs_test_1', livemode: false, status: 'expired' }) } } }), true);
  const b = await c.reserve('org_1', 'google_1'); assert.notEqual(a.id, b.id);
  await assert.rejects(c.attach('org_1', a.id, 'cs_test_old'), /RESERVATION_MISMATCH/);
});
test('Redis errors fail closed without fallback', async () => {
  await assert.rejects(redisCommandFromEnv({})(['GET', 'key']), /REDIS_UNAVAILABLE/);
  const c = createCheckoutCoordinator(async () => { throw Error('REDIS_UNAVAILABLE'); });
  await assert.rejects(c.reserve('org_1', 'google_1'), /REDIS_UNAVAILABLE/);
});
