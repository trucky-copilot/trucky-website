import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('both plan prices selected on server and posted explicitly',()=>{
 const api=readFileSync('app/api/checkout/route.ts','utf8');
 assert.ok(api.includes('STRIPE_PRICE_OWNER_OP'));
 assert.ok(api.includes('STRIPE_PRICE_FLEET'));
 assert.ok(api.includes('EXISTING_CHECKOUT_DIFFERENT_PLAN'));
 const ui=readFileSync('components/Sections.tsx','utf8');assert.ok(ui.includes('subscribe?plan='));
});
test('demo fields are empty initially and accepted send returns home',()=>{
 const ui=readFileSync('app/demo/page.tsx','utf8');
 assert.ok(!ui.includes('setName(session.user.name'));
 assert.ok(!ui.includes('setEmail(session.user.email'));
 assert.ok(ui.includes("window.location.assign('/?demo=sent')"));
 assert.ok(ui.includes('onChange={e=>setEmail'));
});
