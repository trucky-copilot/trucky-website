import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('demo and both plans preserve selected language',()=>{
 const home=readFileSync('app/page.tsx','utf8');
 assert.ok(home.includes('/demo?lang=${lang}'));
 const plans=readFileSync('components/Sections.tsx','utf8');
 assert.ok(plans.includes('lang={lang}'));
 for(const file of ['app/demo/page.tsx','app/subscribe/page.tsx']){
  const source=readFileSync(file,'utf8');assert.ok(source.includes('useFlowLanguage'));
  assert.ok(source.includes('window.location.pathname'));
 }
});
test('English demo labels and plan login are present',()=>{
 assert.ok(readFileSync('app/demo/page.tsx','utf8').includes("'Phone'"));
 assert.ok(readFileSync('app/subscribe/page.tsx','utf8').includes("'Continue with Google'"));
});
