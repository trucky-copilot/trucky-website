// Base44 owns duration, kind and expiry. Do not re-derive a grant from the code.
export function validateDemoDates(activation, now = Date.now()) {
 const start = typeof activation?.trial_started_at === 'string' ? Date.parse(activation.trial_started_at) : NaN;
 const end = typeof activation?.trial_ends_at === 'string' ? Date.parse(activation.trial_ends_at) : NaN;
 const valid = Number.isFinite(start) && Number.isFinite(end) && start <= now + 60000 && end > start;
 return { valid, expired: valid && (end <= now || activation.expired === true) };
}
