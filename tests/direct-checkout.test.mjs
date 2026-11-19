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
test('one click sends one checkout request, resumes OAuth once, and retains its label while loading',()=>{
 const source=readFileSync('components/PlanCheckoutButton.tsx','utf8');
 assert.equal(source.split("fetch('/api/checkout'").length-1,1);
 assert.ok(!source.includes("fetch('/api/organizations'"));
 assert.ok(source.includes('if(inFlight.current)return;inFlight.current=true'));
 assert.ok(source.includes("sessionStorage.removeItem('trucky.checkout.intent')"));
 assert.ok(source.includes("url.searchParams.delete('checkout_plan')"));
 assert.ok(source.includes('checkout_plan=${plan}#pricing'));
 assert.ok(source.includes('>{label}</button>'));
 assert.ok(source.includes('disabled={busy} aria-busy={busy}'));
 assert.ok(!source.includes('Abriendo pago…'));
});
