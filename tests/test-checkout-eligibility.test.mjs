import test from 'node:test';
import assert from 'node:assert/strict';
import {testCheckoutEligible as eligible} from '../lib/server/test-checkout-eligibility.mjs';
const ids = new Set(['test-org']);
test('explicit test organization does not require public demo marker',()=>{
 for(const enabled of [true,false])for(const marker of [undefined,false,true])assert.equal(eligible({id:'test-org',billing_demo_enabled:marker},ids,enabled),true);
});
test('unlisted organizations require server demo marker and enabled demo flag',()=>{
 assert.equal(eligible({id:'other',billing_demo_enabled:true},ids,true),true);
 for(const [enabled,marker] of [[false,true],[true,false],[true,undefined]])assert.equal(eligible({id:'other',billing_demo_enabled:marker},ids,enabled),false);
});
test('missing membership cannot be authorized even by an allowlist',()=>{
 for(const org of [null,undefined,{}, {billing_demo_enabled:true}])assert.equal(eligible(org,ids,true),false);
});
