// Resolve on the server once per click. Never trust a client-supplied role or
// membership, and never choose an arbitrary company for multi-company users.
export async function resolveCheckoutTarget({requested,sub,idToken,live,creationEnabled,name},call){
 const read=async()=>{
  const result=await call('resolveUserOrganizations',{google_id_token:idToken});
  if(result?.user?.google_sub!==sub||!Array.isArray(result.organizations))throw Error('BASE44_UNAVAILABLE');
  if(live&&result.mode!=='live')throw Error('LIVE_BACKEND_NOT_READY');
  return result;
 };
 let result=await read();
 let rows=result.organizations.filter(o=>typeof o.id==='string'&&typeof o.name==='string'&&['owner','admin'].includes(o.role));
 if(requested!==undefined)return {org:rows.find(o=>o.id===requested),result};
 if(rows.length>1)return {choices:rows.map(({id,name})=>({id,name}))};
 if(!rows.length){
  if(!creationEnabled)throw Error('PUBLIC_SIGNUPS_CLOSED');
  const created=await call('createOrganizationForUser',{google_id_token:idToken,company_name:`Cuenta ${name||'Trucky'}`.slice(0,120)});
  if(typeof created?.org_id!=='string'||created.role!=='owner')throw Error('BASE44_UNAVAILABLE');
  // Re-read authoritative membership; creation's payload alone does not grant checkout.
  result=await read();
  rows=result.organizations.filter(o=>o.id===created.org_id&&['owner','admin'].includes(o.role));
 }
 return {org:rows[0],result};
}
