import { validateDemoDates } from './trial-dates.mjs';
// Code validity and one-time entitlement belong exclusively to Base44.
export function dispatcherCodeInput(value) {
 if (value === undefined || value === null) return '';
 if (typeof value !== 'string' || value.length > 64) throw Error('INVALID_DISPATCHER_CODE');
 return value.trim();
}
export async function activateDemoForInvitation({idToken, dispatcherCode}, call, now = Date.now()) {
 const activation = await call('activateDemoTrial', {
  google_id_token: idToken,
  dispatcher_code: dispatcherCodeInput(dispatcherCode),
 });
 if (activation?.code === 'INVALID_DISPATCHER_CODE') throw Error('INVALID_DISPATCHER_CODE');
 if (activation?.code !== 'DEMO_TRIAL_ACTIVATED') throw Error('TRIAL_ACTIVATION_FAILED');
 const trial = validateDemoDates(activation, now);
 if (!trial.valid) throw Error('TRIAL_DATES_INVALID');
 if (trial.expired) throw Error('DEMO_TRIAL_EXPIRED');
 // Never compute a replacement expiry from the code or write trial dates here.
 return activation;
}
export function activationErrorCode(name, status, payload) {
 if (name !== 'activateDemoTrial') return null;
 if (status === 400 && payload?.code === 'INVALID_DISPATCHER_CODE') return payload.code;
 if (status === 409 && payload?.code === 'DEMO_TRIAL_EXPIRED') return payload.code;
 const allowed = ['ACTIVATION_NOT_ENABLED','ACTIVATION_REQUIRES_REVIEW','INVALID_TOKEN','UNAUTHORIZED','METHOD_NOT_ALLOWED'];
 return allowed.includes(payload?.code) ? payload.code : null;
}
