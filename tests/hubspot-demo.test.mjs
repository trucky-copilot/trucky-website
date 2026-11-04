import test from 'node:test';
import assert from 'node:assert/strict';
import {recordDemoRequest} from '../lib/server/hubspot.mjs';
const lead={name:'Test <Lead>',phone:'+15555550123',email:'test@example.invalid'};
const result=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
function setup(responses){const calls=[];return {calls,token:'local-fixture',now:()=>new Date('2026-11-04T12:00:00Z'),fetcher:async(url,options)=>{calls.push({url,...options});assert.ok(responses.length);return responses.shift();}};}
test('creates contact and associated request note, escaping user text',async()=>{
 const s=setup([result(404,{}),result(201,{id:'12'}),result(201,{id:'34'})]);
 await recordDemoRequest(lead,s);
 assert.equal(s.calls.length,3);
 assert.deepEqual(JSON.parse(s.calls[1].body).properties,{firstname:lead.name,phone:lead.phone,email:lead.email});
 const note=JSON.parse(s.calls[2].body);assert.equal(note.associations[0].to.id,'12');
 assert.equal(note.associations[0].types[0].associationTypeId,202);
 assert.ok(note.properties.hs_note_body.includes('Test &lt;Lead&gt;'));
 assert.ok(!note.properties.hs_note_body.includes('<Lead>'));
});
test('updates contact without overwriting lifecycle, owner or consent',async()=>{
 const s=setup([result(200,{id:'12'}),result(200,{id:'12'}),result(201,{id:'34'})]);await recordDemoRequest(lead,s);
 assert.equal(s.calls[1].method,'PATCH');assert.deepEqual(Object.keys(JSON.parse(s.calls[1].body).properties).sort(),['firstname','phone']);
});
test('concurrent create conflict resolves same contact',async()=>{
 const s=setup([result(404,{}),result(409,{}),result(200,{id:'12'}),result(200,{id:'12'}),result(201,{id:'34'})]);await recordDemoRequest(lead,s);assert.equal(s.calls.length,5);
});
test('missing token never calls external API',async()=>{
 await assert.rejects(recordDemoRequest(lead,{token:'',fetcher:()=>assert.fail()}),/CRM_NOT_CONFIGURED/);
});
test('auth failure stops before writes and does not expose response body',async()=>{
 const s=setup([result(401,{message:'private-provider-message'})]);await assert.rejects(recordDemoRequest(lead,s),/^Error: CRM_NOT_SAVED$/);assert.equal(s.calls.length,1);
});
test('lost note response is not retried',async()=>{
 const s=setup([result(200,{id:'12'}),result(200,{id:'12'})]);const f=s.fetcher;
 s.fetcher=async(u,o)=>{if(u.endsWith('/notes')){s.calls.push({url:u,...o});throw Error('network credentials');}return f(u,o);};
 await assert.rejects(recordDemoRequest(lead,s),/^Error: CRM_REQUIRES_REVIEW$/);assert.equal(s.calls.length,3);
});
