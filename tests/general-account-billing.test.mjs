import test from 'node:test';import assert from 'node:assert/strict';import {verifyLiveCheckoutEligibility} from '../lib/server/live-checkout-pilot.mjs';
test('multiple unrelated Google identities can use own verified company without pilot variables',async()=>{
 for(const [sub,org] of [['google_one','org_one'],['google_two','org_two'],['google_three','org_three']]){
  let calls=0;await verifyLiveCheckoutEligibility(sub,org,{env:{TRUCKY_SERVER_SECRET:'fixture-only'},fetcher:async(url,o)=>{calls++;assert.deepEqual(JSON.parse(o.body),{google_sub:sub,organization_id:org});return new Response(JSON.stringify({code:'LIVE_CHECKOUT_ELIGIBLE',can_checkout:true,google_sub:sub,organization_id:org}));}});assert.equal(calls,1);
 }
});
test('any account is not any company: server denial, altered identity or lost response still reject',async()=>{
 for(const [status,data] of [[403,{}],[200,{code:'LIVE_CHECKOUT_ELIGIBLE',can_checkout:true,google_sub:'other',organization_id:'org'}],[503,{}]])await assert.rejects(verifyLiveCheckoutEligibility('google','org',{env:{TRUCKY_SERVER_SECRET:'fixture-only'},fetcher:async()=>new Response(JSON.stringify(data),{status})}),/LIVE_BACKEND_NOT_READY/);
});
test('malformed identity never reaches provider',async()=>{let called=false;await assert.rejects(verifyLiveCheckoutEligibility('bad:sub','org',{env:{TRUCKY_SERVER_SECRET:'fixture-only'},fetcher:async()=>{called=true;}}),/INVALID_BILLING_IDENTITY/);assert.equal(called,false);});
