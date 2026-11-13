import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('both plan prices selected on server and posted explicitly',()=>{
 const api=readFileSync('app/api/checkout/route.ts','utf8');
 assert.ok(api.includes('STRIPE_PRICE_OWNER_OP'));
 assert.ok(api.includes('STRIPE_PRICE_FLEET'));
 assert.ok(api.includes('EXISTING_CHECKOUT_DIFFERENT_PLAN'));
 const ui=readFileSync('components/Sections.tsx','utf8');
 assert.ok(ui.includes('<PlanCheckoutButton'));
 const checkout=readFileSync('components/PlanCheckoutButton.tsx','utf8');
 assert.ok(checkout.includes('organization_id:id,plan'));
 assert.ok(checkout.includes("fetch('/api/checkout'"));
});
test('demo fields are empty initially and accepted send returns home',()=>{
 const ui=readFileSync('app/demo/page.tsx','utf8');
 assert.ok(!ui.includes('setName(session.user.name'));
 assert.ok(!ui.includes('setEmail(session.user.email'));
 assert.ok(ui.includes("window.location.assign('/?demo=sent&lang='"));
 assert.ok(ui.includes('onChange={e=>setEmail'));
});

test('copy update leaves checkout trial configuration unchanged and cached trial attempts fail closed',()=>{
 const api=readFileSync('app/api/checkout/route.ts','utf8');
 assert.ok(!api.includes('trial_period_days: 30'));
 assert.ok(api.includes('LEGACY_TRIAL_CHECKOUT_REQUIRES_REVIEW'));
 assert.ok(api.includes('payload.subscription_data?.trial_end'));
 const copy=readFileSync('lib/i18n.ts','utf8');
 // Marketing follows the new brief; enabling the offer remains a separate billing change.
 assert.ok(copy.includes('Planes mensuales de US$29 y US$99, sin mes gratis. Los 15 días gratuitos corresponden solo a la demo.'));
 assert.ok(copy.includes('US$29 and US$99 monthly plans, with no free month. The 15-day free period applies only to the demo.'));
});
