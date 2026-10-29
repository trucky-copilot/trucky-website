import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('homepage demo buttons preserve language and avoid booking modal', () => {
 const home=readFileSync('app/page.tsx','utf8');
 assert.ok(!home.includes('<TrialPlan'));
 assert.ok(!home.includes('onOpenDemo={() => setDemoOpen(true)}'));
 const header=readFileSync('components/Header.tsx','utf8');
 assert.ok(header.includes('<AccountButton'));
 assert.ok(home.includes('window.location.assign(`/demo?lang=${lang}`)'));
 assert.ok(!header.includes('{signedIn &&'));
 assert.ok(header.includes('{t.nav.cta}'));
});
test('checkout return waits for server subscription confirmation', () => {
 const source=readFileSync('app/subscribe/page.tsx','utf8');
 assert.ok(source.includes('status.organizations.some(hasAccess)'));
 assert.ok(source.includes('SUBSCRIPTION_CONFIRMATION_PENDING'));
 const api=readFileSync('app/api/checkout/route.ts','utf8');
 assert.ok(api.includes('/subscribe?checkout=returned'));
});
