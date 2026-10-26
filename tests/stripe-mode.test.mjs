import test from 'node:test';
import assert from 'node:assert/strict';
import {stripeMode} from '../lib/server/stripe-mode.mjs';
test('live Stripe only in production with matching key',()=>{
 assert.deepEqual(stripeMode({STRIPE_MODE:'live',VERCEL_ENV:'production',STRIPE_SECRET_KEY:'sk_live_fixture'}),{mode:'live',live:true});
 assert.throws(()=>stripeMode({STRIPE_MODE:'live',VERCEL_ENV:'preview',STRIPE_SECRET_KEY:'sk_live_fixture'}),/LIVE_REQUIRES/);
 assert.throws(()=>stripeMode({STRIPE_MODE:'live',VERCEL_ENV:'production',STRIPE_SECRET_KEY:'sk_test_fixture'}),/MISMATCH/);
 assert.deepEqual(stripeMode({STRIPE_SECRET_KEY:'sk_test_fixture'}),{mode:'test',live:false});
});
