import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('activation is verified before attempting Gmail and dates come from backend',()=>{
 const source=readFileSync('app/api/demo/route.ts','utf8');
 assert.ok(source.indexOf("base44Call('activateDemoTrial'")<source.indexOf("const encrypted ="));
 assert.ok(source.includes('30 * 86400000'));
 assert.ok(source.includes("reply('DEMO_TRIAL_EXPIRED',409)"));
 assert.ok(!source.includes('trial_started_at: new Date'));
});
