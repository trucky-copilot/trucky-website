export function stripeMode(env = process.env) {
 const mode=env.STRIPE_MODE || 'test';
 if(!['test','live'].includes(mode)) throw Error('INVALID_STRIPE_MODE');
 if(mode==='live' && env.VERCEL_ENV!=='production') throw Error('LIVE_REQUIRES_PRODUCTION');
 const key=mode==='live'?env.STRIPE_LIVE_SECRET_KEY:env.STRIPE_SECRET_KEY;
 if(!(mode==='live' ? /^(sk|rk)_live_.+/.test(key || '') : key?.startsWith('sk_test_'))) throw Error('STRIPE_KEY_MODE_MISMATCH');
 return {mode,live:mode==='live'};
}
