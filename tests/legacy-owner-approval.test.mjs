import test from 'node:test';
import assert from 'node:assert/strict';
import {requestOwnerApproval,approvalSessionReady} from '../lib/server/legacy-owner-approval.mjs';
const org='6aac0718ff3a5154cb00ddb1';
const session={sub:'synthetic-sub',googleIdToken:'fixture-not-a-token',googleAuthenticatedAt:990,googleTokenExpires:2000};
const env={LEGACY_OWNER_APPROVAL_ENABLED:'true',BILLING_LINK_PILOT_GOOGLE_SUB:session.sub,BILLING_LINK_PILOT_ORGANIZATION_ID:org,TRUCKY_SERVER_SECRET:'local-test-fixture'};
function setup(status=200,body={code:'OWNER_APPROVAL_RECORDED'}){const calls=[];return {calls,env,now:1000,fetcher:async(url,options)=>{calls.push({url,...options});return new Response(JSON.stringify(body),{status});}};}
test('owner request uses only fixed target and never sends token to browser',async()=>{
 const s=setup();const r=await requestOwnerApproval(session,true,s);assert.deepEqual(r,{status:200,code:'OWNER_APPROVAL_RECORDED'});
 assert.equal(s.calls.length,1);const req=s.calls[0];assert.equal(req.redirect,'error');
 assert.equal(req.headers.Authorization,'Bearer local-test-fixture');
 assert.deepEqual(JSON.parse(req.body),{mode:'owner_approval',organization_id:org,member_id:'6aac0719be8a03dcc9d4562a',google_id_token:session.googleIdToken,owner_consent:true});
 assert.ok(!JSON.stringify(r).includes(session.googleIdToken));
});
test('disabled, wrong identity, stale or missing session and no consent make no request',async()=>{
 const cases=[
  [session,true,{...env,LEGACY_OWNER_APPROVAL_ENABLED:'false'},'OWNER_APPROVAL_DISABLED'],
  [null,true,env,'SIGN_IN_REQUIRED'],
  [{...session,sub:'other'},true,env,'OWNER_APPROVAL_FORBIDDEN'],
  [session,true,{...env,BILLING_LINK_PILOT_ORGANIZATION_ID:'other'},'OWNER_APPROVAL_FORBIDDEN'],
  [{...session,googleAuthenticatedAt:400},true,env,'FRESH_SIGN_IN_REQUIRED'],
  [session,false,env,'CONSENT_REQUIRED'],
  [session,'true',env,'CONSENT_REQUIRED'],
 ];
 for(const [who,consent,settings,expected] of cases){const s=setup();const r=await requestOwnerApproval(who,consent,{...s,env:settings});assert.equal(r.code,expected);assert.equal(s.calls.length,0);}
});
test('fresh sign-in boundaries and expired provider token fail closed',()=>{
 assert.equal(approvalSessionReady({...session,googleAuthenticatedAt:460},1000),false);
 assert.equal(approvalSessionReady({...session,googleAuthenticatedAt:1001},1000),false);
 assert.equal(approvalSessionReady({...session,googleTokenExpires:1030},1000),false);
 assert.equal(approvalSessionReady({...session,googleAuthenticatedAt:undefined},1000),false);
});
test('backend status is sanitized and no response details leak',async()=>{
 for(const status of [400,401,403,409,410,503,500]){
  const s=setup(status,{token:'private',message:'secret'});const r=await requestOwnerApproval(session,true,s);
  assert.equal(r.status,status===500?503:status);assert.ok(!JSON.stringify(r).includes('secret'));assert.equal(s.calls.length,1);
 }
 const s=setup(200,{code:'UNEXPECTED',token:'private'});assert.equal((await requestOwnerApproval(session,true,s)).code,'OWNER_APPROVAL_REQUIRES_REVIEW');
});
test('network uncertainty never retries or claims approval',async()=>{
 let calls=0;const r=await requestOwnerApproval(session,true,{env,now:1000,fetcher:async()=>{calls++;throw Error('secret');}});
 assert.equal(r.code,'OWNER_APPROVAL_REQUIRES_REVIEW');assert.equal(calls,1);
});
