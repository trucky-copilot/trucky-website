export async function canonicalCheckoutPayload(command, attempt, candidate) {
  const key = `trucky:checkout:test:payload:${attempt.id}`;
  await command(['SET', key, JSON.stringify(candidate), 'NX']);
  const raw = await command(['GET', key]);
  if (!raw) throw new Error('CHECKOUT_PAYLOAD_UNAVAILABLE');
  return JSON.parse(raw);
}

// Enable only for an individually audited attempt whose original Stripe request
// failed validation before creating any resource. Never use for timeouts/5xx.
export async function recoverRejectedPayload(command, attempt, payload, approvedAttemptId, now = Date.now()) {
  if (attempt.sessionId || approvedAttemptId !== attempt.id || !Object.hasOwn(payload, 'payment_method_types')) {
    throw new Error('RECONCILIATION_REQUIRED');
  }
  const { payment_method_types, ...supported } = payload;
  const key = `trucky:checkout:test:recovery-v2:${attempt.id}`;
  const candidate = {
    payload: { ...supported, expires_at: Math.floor(now / 1000) + 3600 },
    idempotencyKey: `${attempt.idempotencyKey}_validated_recovery_v2`,
  };
  await command(['SET', key, JSON.stringify(candidate), 'NX']);
  const raw = await command(['GET', key]);
  if (!raw) throw new Error('RECONCILIATION_REQUIRED');
  const stored = JSON.parse(raw);
  if (stored.payload.expires_at <= Math.floor(now / 1000) + 60) throw new Error('RECONCILIATION_REQUIRED');
  return stored;
}
