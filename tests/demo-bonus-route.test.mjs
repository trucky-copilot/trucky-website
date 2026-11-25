import {demoEmailRaw} from '../lib/server/demo-email.mjs';
import {invalidDemoFields} from '../lib/demo-details.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
import * as activation from '../lib/server/demo-activation.mjs';
const src=readFileSync('app/api/demo/route.ts','utf8');
const compiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function world(){
 const state={attempts:0,mailQuota:0,crm:0,sent:0,activated:[],grant:null,rawMail:null};
 const getToken=async()=>({sub:'fixture_google',email:'fixture@example.invalid'});
 const base44Call=async(name,payload)=>{
  assert.equal(name,'activateDemoTrial');state.activated.push(payload);
  if(payload.dispatcher_code==='bad')throw Error('INVALID_DISPATCHER_CODE');
  if(!state.grant){const start=Date.now()-1000,days=payload.dispatcher_code?30:15;state.grant={code:'DEMO_TRIAL_ACTIVATED',trial_kind:days===30?'dispatcher':'demo',trial_started_at:new Date(start).toISOString(),trial_ends_at:new Date(start+days*86400000).toISOString()};}
  return state.grant;
 };
 const redis=async c=>{if(c[0]==='GET')return 'fixture-encrypted';if(String(c[3]).startsWith('trucky:demo:activation:attempts:'))return ++state.attempts;if(String(c[3]).startsWith('trucky:demo:mail:quota:'))return ++state.mailQuota;assert.fail('unexpected redis');};
 const modules={
  '@/lib/server/demo-email.mjs':{demoEmailRaw},
  '@/lib/server/demo-activation.mjs':activation,
  '@/lib/server/hubspot.mjs':{recordDemoRequest:async()=>{state.crm++;}},
  '@/lib/demo-details.mjs':{invalidDemoFields},
  'next/server':{NextResponse:{json:(body,{status})=>Response.json(body,{status})}},
  'next-auth/jwt':{getToken},
  '@/lib/server/base44':{sameOrigin:()=>true,googleIdentity:async()=>({sub:'fixture_google',idToken:'fixture-id-token'}),base44Call},
  '@/lib/server/checkout-coordinator.mjs':{redisCommandFromEnv:()=>redis},
  '@/lib/server/gmail':{SENDER:'sender@example.invalid',TOKEN_KEY:'fixture-token-key',decryptGmailToken:()=> 'fixture-refresh'},
 };
 const exports={};vm.runInNewContext(compiled,{exports,require:name=>{assert.ok(modules[name],name);return modules[name];},Error,Date,Response,Buffer,URLSearchParams,AbortSignal,process:{env:{DEMO_TRIAL_ACTIVATION_ENABLED:'true'}},console:{error:()=>{}},fetch:async(url,options)=>{if(url==='https://oauth2.googleapis.com/token')return Response.json({access_token:'fixture-access'});if(url==='https://gmail.googleapis.com/gmail/v1/users/me/messages/send'){state.sent++;state.rawMail=JSON.parse(options.body).raw;return Response.json({id:'fixture-message'});}assert.fail('unexpected network');}});
 return {state,post:body=>exports.POST(new Request('https://example.invalid/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Fixture',phone:'1234567890',email:'fixture@example.invalid',...body})}))};
}
test('actual route invalid code 400, no trial/quota/CRM/Gmail; corrected request succeeds',async()=>{const w=world();const invalid=await w.post({dispatcher_code:'bad'});assert.equal(invalid.status,400);assert.deepEqual(await invalid.json(),{code:'INVALID_DISPATCHER_CODE'});assert.equal(w.state.grant,null);assert.equal(w.state.mailQuota,0);assert.equal(w.state.crm,0);assert.equal(w.state.sent,0);const corrected=await w.post({dispatcher_code:'fixture-bonus'});assert.equal(corrected.status,200);assert.deepEqual(await corrected.json(),{code:'EMAIL_ACCEPTED'});assert.equal(w.state.grant.trial_kind,'dispatcher');assert.equal(w.state.mailQuota,1);assert.equal(w.state.sent,1);});
test('actual route empty code activates demo, later bonus leaves grant unchanged',async()=>{const w=world();assert.equal((await w.post({})).status,200);const original=structuredClone(w.state.grant);assert.equal(original.trial_kind,'demo');assert.equal(w.state.activated[0].dispatcher_code,'');assert.equal((await w.post({dispatcher_code:'fixture-bonus'})).status,200);assert.deepEqual(w.state.grant,original);assert.equal(w.state.sent,2);});
test('actual route rejects wrong type before any request and expired/malformed grants before mail',async()=>{const w=world();assert.equal((await w.post({dispatcher_code:{bad:true}})).status,400);assert.equal(w.state.activated.length,0);const now=Date.now();w.state.grant={code:'DEMO_TRIAL_ACTIVATED',trial_started_at:new Date(now-30*86400000).toISOString(),trial_ends_at:new Date(now-1).toISOString()};assert.equal((await w.post({})).status,409);assert.equal(w.state.sent,0);assert.equal(w.state.mailQuota,0);});
test('wrong email returns exact field before any trial/CRM/email operation, then corrected input succeeds',async()=>{const w=world();const r=await w.post({email:'other@example.invalid'});assert.equal(r.status,400);assert.deepEqual(await r.json(),{code:'INVALID_DETAILS',fields:['email']});assert.equal(w.state.activated.length,0);assert.equal(w.state.sent,0);assert.equal(w.state.mailQuota,0);assert.equal((await w.post({email:'fixture@example.invalid'})).status,200);});
test('name and phone failures are marked without activating or emailing',async()=>{const w=world();const r=await w.post({name:' ',phone:'123'});assert.equal(r.status,400);assert.deepEqual(await r.json(),{code:'INVALID_DETAILS',fields:['name','phone']});assert.equal(w.state.activated.length,0);});

test('real route sends multipart HTML invitation with same app link after successful trial and CRM',async()=>{const w=world();assert.equal((await w.post({lang:'en'})).status,200);const mime=Buffer.from(w.state.rawMail,'base64url').toString();assert.ok(mime.includes('multipart/alternative'));assert.ok(mime.includes('text/html; charset=UTF-8'));assert.equal(w.state.sent,1);assert.equal(w.state.crm,1);assert.equal(w.state.activated.length,1);});
