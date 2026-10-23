import { randomUUID } from 'node:crypto';

// Never import this module from client components.
// Pending attempts deliberately have NO TTL: an expired lease must not permit
// a second Stripe session while the first creation has an unknown outcome.
export const ATTACH = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local attempt = cjson.decode(raw)
if attempt.id ~= ARGV[1] then return 0 end
if attempt.sessionId and attempt.sessionId ~= ARGV[2] then return 0 end
attempt.sessionId = ARGV[2]
redis.call('SET', KEYS[1], cjson.encode(attempt))
return 1`;
export const RELEASE = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local attempt = cjson.decode(raw)
if attempt.id ~= ARGV[1] then return 0 end
return redis.call('DEL', KEYS[1])`;

export function redisCommandFromEnv(env = process.env) {
  return async (command) => {
    const url = env.KV_REST_API_URL;
    const token = env.KV_REST_API_TOKEN;
    if (!url || !token || new URL(url).protocol !== 'https:') throw new Error('REDIS_UNAVAILABLE');
    let response;
    try {
      response = await fetch(url, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(command), cache: 'no-store', signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error();
      const body = await response.json();
      if (body.error || !Object.hasOwn(body, 'result')) throw new Error();
      return body.result;
    } catch { throw new Error('REDIS_UNAVAILABLE'); }
  };
}

export function createCheckoutCoordinator(command, namespace = 'trucky:checkout:test:v1') {
  const keyFor = (orgId) => {
    if (typeof orgId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(orgId)) throw new Error('INVALID_ORGANIZATION');
    return `${namespace}:${orgId}`;
  };
  return {
    // orgId must already be authorized by the server; never call from a browser.
    async reserve(orgId, actorSub) {
      if (typeof actorSub !== 'string' || !actorSub) throw new Error('UNAUTHORIZED');
      const key = keyFor(orgId);
      const id = randomUUID();
      const candidate = { id, orgId, actorSub, createdAt: Date.now(), idempotencyKey: `trucky_checkout_${id}` };
      const inserted = await command(['SET', key, JSON.stringify(candidate), 'NX']);
      if (inserted === 'OK') return candidate;
      const raw = await command(['GET', key]);
      if (!raw) throw new Error('RESERVATION_RETRY_REQUIRED');
      const existing = JSON.parse(raw);
      if (existing.orgId !== orgId || existing.actorSub !== actorSub) throw new Error('CHECKOUT_LOCKED');
      // Return the original attempt, not a new Stripe idempotency key.
      return existing;
    },
    async attach(orgId, attemptId, sessionId) {
      if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_test_')) throw new Error('INVALID_TEST_SESSION');
      if (await command(['EVAL', ATTACH, '1', keyFor(orgId), attemptId, sessionId]) !== 1) throw new Error('RESERVATION_MISMATCH');
    },
    async releaseExpired(orgId, attemptId, stripe) {
      const key = keyFor(orgId);
      const raw = await command(['GET', key]);
      if (!raw) return false;
      const attempt = JSON.parse(raw);
      if (attempt.id !== attemptId) throw new Error('RESERVATION_MISMATCH');
      // No session ID may mean Stripe created it but the attach call failed.
      // Do not release; recover via the same idempotent create request first.
      if (!attempt.sessionId) throw new Error('RECONCILIATION_REQUIRED');
      const session = await stripe.checkout.sessions.retrieve(attempt.sessionId);
      if (session.id !== attempt.sessionId || session.livemode !== false) throw new Error('STRIPE_SESSION_MISMATCH');
      if (session.status !== 'expired') throw new Error('SESSION_NOT_EXPIRED');
      return await command(['EVAL', RELEASE, '1', key, attemptId]) === 1;
    },
  };
}
