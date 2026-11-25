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
 assert.ok(checkout.includes('organization_id:id') && checkout.includes(',plan})'));
 assert.ok(checkout.includes("fetch('/api/checkout'"));
});
test('demo fields are empty initially and accepted send stays with confirmation',()=>{
 const ui=readFileSync('app/demo/page.tsx','utf8');
 assert.ok(!ui.includes('setName(session.user.name'));
 assert.ok(!ui.includes('setEmail(session.user.email'));
 assert.ok(ui.includes('setSent(true)'));assert.ok(ui.includes('Tu información ya fue enviada'));assert.ok(!ui.includes("window.location.assign('/?demo=sent"));
 assert.ok(ui.includes("onChange={e=>{setEmail(e.target.value);clear('email');}}"));
});

test('copy update leaves checkout trial configuration unchanged and cached trial attempts fail closed',()=>{
 const api=readFileSync('app/api/checkout/route.ts','utf8');
 assert.ok(!api.includes('trial_period_days: 30'));
 assert.ok(api.includes('LEGACY_TRIAL_CHECKOUT_REQUIRES_REVIEW'));
 assert.ok(api.includes('payload.subscription_data?.trial_end'));
 const copy=readFileSync('lib/i18n.ts','utf8');
 // Marketing follows the new brief; enabling the offer remains a separate billing change.
 assert.ok(copy.includes('Planes mensuales de US$29 y US$99. Solo ACADEMY en el plan US$29 incluye la primera mensualidad gratis. La demo de 15 días es independiente.'));
 assert.ok(copy.includes('US$29 and US$99 monthly plans. Only ACADEMY on the US$29 plan includes the first monthly payment free. The 15-day demo is separate.'));
});
