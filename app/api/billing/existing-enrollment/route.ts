import {NextRequest,NextResponse} from 'next/server';import {getToken} from 'next-auth/jwt';import {sameOrigin} from '@/lib/server/base44';
import {approvalSessionReady} from '@/lib/server/legacy-owner-approval.mjs';
export async function POST(req:NextRequest){
 const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
 const reply=(code:string,status:number)=>NextResponse.json({code},{status,headers});
 if(!sameOrigin(req))return reply('FORBIDDEN',403);
 if(process.env.BILLING_EXISTING_ENROLLMENT_ENABLED!=='true')return reply('EXISTING_ENROLLMENT_DISABLED',503);
 try{
  const token=await getToken({req,secret:process.env.NEXTAUTH_SECRET});if(!approvalSessionReady(token))return reply('FRESH_SIGN_IN_REQUIRED',401);
  const body=await req.json();const valid=(s:unknown)=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(s);
  if(!valid(body.organization_id)||!valid(body.member_id)||body.owner_consent!==true)return reply('INVALID_REQUEST',400);
  const secret=process.env.TRUCKY_SERVER_SECRET;if(!secret)return reply('INTEGRATION_PENDING',503);
  const r=await fetch('https://trucky-17a283d5.base44.app/api/functions/enrollExistingBillingOrganization',{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({mode:'owner_approval',organization_id:body.organization_id,member_id:body.member_id,google_id_token:token!.googleIdToken,owner_consent:true})});
  const data=await r.json();if(!r.ok||data.code!=='EXISTING_GOOGLE_APPROVAL_RECORDED'||!valid(data.request_id))return reply('EXISTING_ENROLLMENT_REQUIRES_REVIEW',503);
  const hash=new URLSearchParams({billing_existing:data.request_id,billing_org:body.organization_id,billing_member:body.member_id});
  return NextResponse.json({url:`https://trucky-17a283d5.base44.app/#${hash}`},{headers});
 }catch{return reply('EXISTING_ENROLLMENT_REQUIRES_REVIEW',503);}
}
