import test from 'node:test';
import assert from 'node:assert/strict';
import {stripeMode} from '../lib/server/stripe-mode.mjs';
test('live Stripe only in production with matching key',()=>{
 assert.deepEqual(stripeMode({STRIPE_MODE:'live',VERCEL_ENV:'production',STRIPE_LIVE_SECRET_KEY:'sk_live_fixture'}),{mode:'live',live:true});
 assert.throws(()=>stripeMode({STRIPE_MODE:'live',VERCEL_ENV:'preview',STRIPE_LIVE_SECRET_KEY:'sk_live_fixture'}),/LIVE_REQUIRES/);
 assert.throws(()=>stripeMode({STRIPE_MODE:'live',VERCEL_ENV:'production',STRIPE_LIVE_SECRET_KEY:'sk_test_fixture'}),/MISMATCH/);
 assert.deepEqual(stripeMode({STRIPE_SECRET_KEY:'sk_test_fixture'}),{mode:'test',live:false});
});

import {replaceUnconfirmedPlan} from '../lib/server/change-checkout-plan.mjs';
import {createCheckoutCoordinator} from '../lib/server/checkout-coordinator.mjs';
test('live plan switch rejects test session and never expires it',async()=>{
 let expired=false;
 const stripe={checkout:{sessions:{retrieve:async()=>({id:'cs_test_x',livemode:false}),expire:async()=>{expired=true;}}}};
 await assert.rejects(replaceUnconfirmedPlan(stripe,{},'org',{id:'a',sessionId:'cs_test_x'},'price','actor',true),/MISMATCH/);
 assert.equal(expired,false);
});
test('live coordinator refuses test session ID before Redis mutation',async()=>{
 let called=false;const c=createCheckoutCoordinator(async()=>{called=true;},'trucky:checkout:live:v1',true);
 await assert.rejects(c.attach('org','a','cs_test_x'),/INVALID_TEST_SESSION/);
 assert.equal(called,false);
});

test('restricted live keys accepted; public and test keys rejected',()=>{
 assert.deepEqual(stripeMode({STRIPE_MODE:'live',VERCEL_ENV:'production',STRIPE_LIVE_SECRET_KEY:'rk_live_fixture'}),{mode:'live',live:true});
 for(const key of ['pk_live_fixture','rk_test_fixture','whsec_fixture','rk_live_'])assert.throws(()=>stripeMode({STRIPE_MODE:'live',VERCEL_ENV:'production',STRIPE_LIVE_SECRET_KEY:key}),/MISMATCH/);
});
