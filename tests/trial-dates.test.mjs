import test from 'node:test';import assert from 'node:assert/strict';
import {validateDemoDates} from '../lib/server/trial-dates.mjs';
const now=Date.parse('2026-11-13T12:00:00Z');
const dates=(days,start=now)=>({trial_started_at:new Date(start).toISOString(),trial_ends_at:new Date(start+days*86400000).toISOString()});
test('15 days accepted; historical 30 days unchanged',()=>{for(const n of [15,30]){const d=dates(n);assert.deepEqual(validateDemoDates(d,now),{valid:true,expired:false});assert.equal(d.trial_ends_at,dates(n).trial_ends_at);}});
test('invalid/missing/reversed/excess dates denied',()=>{for(const d of [{},{trial_started_at:'bad',trial_ends_at:'bad'},dates(0),dates(-1),dates(31),dates(14),dates(15,now+3600000)])assert.equal(validateDemoDates(d,now).valid,false);});
test('expired grant never sends invitation even if backend omits expired flag',()=>{assert.deepEqual(validateDemoDates(dates(15,now-15*86400000),now),{valid:true,expired:true});assert.equal(validateDemoDates({...dates(15),expired:true},now).expired,true);});
