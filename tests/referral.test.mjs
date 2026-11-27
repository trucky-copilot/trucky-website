import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeReferral,referralMetadata} from '../lib/referral.mjs';

test('código válido viaja a Stripe en mayúsculas',()=>{
 assert.deepEqual(referralMetadata(' k7q2m9xa '),{referral_code:'K7Q2M9XA'});
});
test('códigos inválidos no se envían',()=>{
 for(const v of [undefined,null,'','ACADEMY','K7Q2M9X0','K7Q2M9XA1',"x'] OR 1=1",{a:1}])assert.deepEqual(referralMetadata(v),{});
 assert.equal(normalizeReferral('abc'),null);
});
