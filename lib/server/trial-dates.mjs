// New demos last 15 days. Historical 30-day grants retain their original dates.
export function validateDemoDates(activation, now = Date.now()) {
 const start = typeof activation?.trial_started_at === 'string' ? Date.parse(activation.trial_started_at) : NaN;
 const end = typeof activation?.trial_ends_at === 'string' ? Date.parse(activation.trial_ends_at) : NaN;
 const duration = end - start;
 const valid = Number.isFinite(start) && Number.isFinite(end) && start <= now + 60000 &&
   [15 * 86400000, 30 * 86400000].includes(duration);
 return { valid, expired: valid && (end <= now || activation.expired === true) };
}
