import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidPhone} from '../lib/phone-validation.mjs';
test('phone requires 7 to 15 digits, not formatting characters',()=>{
 for(const phone of ['525412','12--34','abcdefg','+++++++','1234567890123456',''])assert.equal(isValidPhone(phone),false,phone);
 for(const phone of ['314789562','+57 (314) 789-5620','1234567'])assert.equal(isValidPhone(phone),true,phone);
});
