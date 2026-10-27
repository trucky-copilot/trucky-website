import test from 'node:test';
import assert from 'node:assert/strict';
import { replaceUnconfirmedPlan } from '../lib/server/change-checkout-plan.mjs';
function fixture(status='open', price='old') {
 const calls=[];
 const previous={id:'cs_test_a',livemode:false,client_reference_id:'org',metadata:{reservation_id:'a'},status,line_items:{data:[{price:{id:price}}]}};
 const stripe={checkout:{sessions:{retrieve:async()=>previous,expire:async()=>{calls.push('expire');return {status:'expired'};}}}};
 const coordinator={releaseExpired:async()=>{calls.push('release');return true;},reserve:async()=>{calls.push('reserve');return {id:'new'};}};
 return {stripe,coordinator,calls};
}
const attempt={id:'a',sessionId:'cs_test_a'};
test('different unpaid plan expires before release and new reservation',async()=>{const f=fixture();assert.deepEqual(await replaceUnconfirmedPlan(f.stripe,f.coordinator,'org',attempt,'new','actor'),{id:'new'});assert.deepEqual(f.calls,['expire','release','reserve']);});
test('completed checkout never starts a second subscription',async()=>{const f=fixture('complete');await assert.rejects(replaceUnconfirmedPlan(f.stripe,f.coordinator,'org',attempt,'new','actor'),/ALREADY_SUBSCRIBED/);assert.deepEqual(f.calls,[]);});
test('same open price reuses checkout',async()=>{const f=fixture('open','new');assert.equal(await replaceUnconfirmedPlan(f.stripe,f.coordinator,'org',attempt,'new','actor'),attempt);assert.deepEqual(f.calls,[]);});
test('expiration failure never releases or reserves',async()=>{const f=fixture();f.stripe.checkout.sessions.expire=async()=>{throw Error('network');};await assert.rejects(replaceUnconfirmedPlan(f.stripe,f.coordinator,'org',attempt,'new','actor'));assert.deepEqual(f.calls,[]);});
test('unknown unattached creation is not replaced',async()=>{const f=fixture();const unknown={id:'a'};assert.equal(await replaceUnconfirmedPlan(f.stripe,f.coordinator,'org',unknown,'new','actor'),unknown);assert.deepEqual(f.calls,[]);});
