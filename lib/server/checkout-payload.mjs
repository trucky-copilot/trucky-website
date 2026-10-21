export async function canonicalCheckoutPayload(command, attempt, candidate) {
  const key = `trucky:checkout:test:payload:${attempt.id}`;
  await command(['SET', key, JSON.stringify(candidate), 'NX']);
  const raw = await command(['GET', key]);
  if (!raw) throw new Error('CHECKOUT_PAYLOAD_UNAVAILABLE');
  return JSON.parse(raw);
}
