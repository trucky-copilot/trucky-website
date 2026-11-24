import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';
import{reserveAcademy,completeAcademy,academyAccount,ACADEMY_RESERVE,ACADEMY_COMPLETE}from'../lib/server/academy-offer.mjs';
const engine=process.env.LUA_ENGINE_PATH;
test('production Lua serializes account reservations and binds one subscription with replay safe',{skip:!engine},async()=>{
 const{lua,lauxlib,lualib,to_luastring:s,to_jsstring:js}=createRequire(import.meta.url)(engine);
 const L=lauxlib.luaL_newstate();lualib.luaL_openlibs(L);
 function run(code){if(lauxlib.luaL_dostring(L,s(code))!==lua.LUA_OK)throw Error(js(lua.lua_tostring(L,-1)));}
 // JSON bridge for production scripts using actual Lua tables and JS JSON parsing.
 function push(value){if(value==null){lua.lua_pushnil(L);return;}if(typeof value==='string'){lua.lua_pushstring(L,s(value));return;}if(typeof value==='number'){lua.lua_pushnumber(L,value);return;}lua.lua_newtable(L);for(const[k,v]of Object.entries(value)){push(v);lua.lua_setfield(L,-2,s(k));}}
 function decode(){try{const v=JSON.parse(js(lua.lua_tostring(L,1)));push(v);return 1;}catch{lua.lua_pushnil(L);return 1;}}
 function encode(){const obj={};lua.lua_pushnil(L);while(lua.lua_next(L,1)!==0){const k=js(lua.lua_tostring(L,-2));obj[k]=lua.lua_isnumber(L,-1)?lua.lua_tonumber(L,-1):js(lua.lua_tostring(L,-1));lua.lua_pop(L,1);}lua.lua_pushstring(L,s(JSON.stringify(obj)));return 1;}
 lua.lua_pushjsfunction(L,decode);lua.lua_setglobal(L,s('decode'));lua.lua_pushjsfunction(L,encode);lua.lua_setglobal(L,s('encode'));
 run(`store={};cjson={decode=decode,encode=encode};redis={call=function(op,key,value,flag) if op=='GET' then return store[key] elseif op=='SET' then if flag=='NX' and store[key] then return nil end;store[key]=value;return 'OK' else error('unexpected') end end};function reserve() ${ACADEMY_RESERVE} end;function finish() ${ACADEMY_COMPLETE} end`);
 const redis=async c=>{run(`KEYS={${JSON.stringify(c[3])}};ARGV={${c.slice(4).map(v=>JSON.stringify(String(v))).join(',')}};result=${c[1]===ACADEMY_RESERVE?'reserve':'finish'}()`);lua.lua_getglobal(L,s('result'));const r=lua.lua_tointeger(L,-1);lua.lua_pop(L,1);return r;};
 try{const results=await Promise.allSettled(['org1','org2'].map(org=>reserveAcademy(redis,'google1',org,'attempt'+org,'coupon1','price1')));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);await reserveAcademy(redis,'google1','org1','attemptorg1','coupon1','price1');const sub={id:'sub_real',livemode:true,metadata:{academy_offer:'ACADEMY',academy_account:academyAccount('google1'),org_id:'org1',reservation_id:'attemptorg1'}};await completeAcademy(redis,sub);await completeAcademy(redis,sub);await assert.rejects(completeAcademy(redis,{...sub,id:'sub_foreign'}));await assert.rejects(reserveAcademy(redis,'google1','org1','another','coupon1','price1'));await reserveAcademy(redis,'google2','org2','other','coupon1','price1');}finally{lua.lua_close(L);}
});
