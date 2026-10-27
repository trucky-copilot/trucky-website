import test from 'node:test';
import assert from 'node:assert/strict';
import {billingLinkPilotAllowed as allowed} from '../lib/server/billing-link-pilot.mjs';
const env={BILLING_LINK_PILOT_GOOGLE_SUB:'synthetic-sub',BILLING_LINK_PILOT_ORGANIZATION_ID:'synthetic-org'};
test('only exact pilot subject and organization may request a link',()=>{
 assert.equal(allowed('synthetic-sub','synthetic-org',env),true);
 assert.equal(allowed('different','synthetic-org',env),false);
 assert.equal(allowed('synthetic-sub','different',env),false);
});
test('missing configuration or malformed request never authorizes pilot',()=>{
 assert.equal(allowed('synthetic-sub','synthetic-org',{}),false);
 assert.equal(allowed(undefined,'synthetic-org',env),false);
 assert.equal(allowed('synthetic-sub',null,env),false);
 assert.equal(allowed('synthetic-sub','synthetic-org',{...env,BILLING_LINK_PILOT_GOOGLE_SUB:''}),false);
});
