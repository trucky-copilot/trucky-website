// Only known attached test sessions can be replaced. Unknown create outcomes
// remain blocked until reconciled; never infer failure from a missing session ID.
export async function replaceUnconfirmedPlan(stripe, coordinator, orgId, attempt, priceId, actorSub) {
  if (!attempt.sessionId) return attempt;
  const previous = await stripe.checkout.sessions.retrieve(attempt.sessionId, { expand: ['line_items'] });
  if (previous.livemode !== false || previous.client_reference_id !== orgId || previous.metadata?.reservation_id !== attempt.id) throw Error('STRIPE_SESSION_MISMATCH');
  if (previous.status === 'complete') throw Error('ALREADY_SUBSCRIBED');
  const samePrice = previous.line_items?.data[0]?.price?.id === priceId;
  if (samePrice && previous.status === 'open') return attempt;
  if (previous.status === 'open') {
    const expired = await stripe.checkout.sessions.expire(previous.id);
    if (expired.status !== 'expired') throw Error('RECONCILIATION_REQUIRED');
  } else if (previous.status !== 'expired') throw Error('RECONCILIATION_REQUIRED');
  if (!await coordinator.releaseExpired(orgId, attempt.id, stripe)) throw Error('RESERVATION_MISMATCH');
  return coordinator.reserve(orgId, actorSub);
}
