import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('pricing opens Stripe without navigating to subscribe; cancel returns home',()=>{
 const component=readFileSync('components/PlanCheckoutButton.tsx','utf8');
 assert.ok(component.includes("fetch('/api/checkout'"));
 assert.ok(!component.includes('location.assign(`/subscribe'));
 assert.ok(component.includes("url.hostname!=='checkout.stripe.com'"));
 assert.ok(readFileSync('app/api/checkout/route.ts','utf8').includes('cancel_url: `${origin}/#pricing`'));
});
