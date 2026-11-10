export async function registeredPublicOrganization(redis,orgId,sub,env=process.env){
 // This is recognition of existing customers, NOT permission to register new ones.
 if(typeof orgId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(orgId))return false;
 const raw=await redis(['GET',`trucky:billing:enrollment:v1:org:${orgId}`]);if(raw==null)return false;
 const entry=JSON.parse(String(raw));
 return entry?.version===1&&entry.orgId===orgId&&typeof entry.memberId==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(entry.memberId)&&typeof entry.googleSub==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(entry.googleSub)&&entry.role==='owner'&&(sub===undefined||sub===entry.googleSub);
}
