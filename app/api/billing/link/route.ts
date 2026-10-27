import { randomBytes, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { googleIdentity,sameOrigin,base44Call } from '@/lib/server/base44';
import { redisCommandFromEnv } from '@/lib/server/checkout-coordinator.mjs';
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return NextResponse.json({code:'FORBIDDEN'},{status:403});
 if(process.env.BILLING_IDENTITY_LINK_ENABLED!=='true')return NextResponse.json({code:'LINK_NOT_ENABLED'},{status:503});
 try{
  const identity=await googleIdentity(req);
  const session=await getToken({req,secret:process.env.NEXTAUTH_SECRET});
  const {organization_id}=await req.json();
  const resolved=await base44Call('resolveUserOrganizations',{google_id_token:identity.idToken});
  const org=resolved.organizations?.find((o:any)=>o.id===organization_id&&['owner','admin'].includes(o.role));
  if(!org||resolved.user?.google_sub!==identity.sub||!session?.email)return NextResponse.json({code:'FORBIDDEN'},{status:403});
  const code=randomBytes(32).toString('hex');
  const digest=createHash('sha256').update(code).digest('hex');
  const result=await redisCommandFromEnv()(['SET',`trucky:billing:handoff:v1:${digest}`,JSON.stringify({sub:identity.sub,email:session.email.toLowerCase(),orgId:org.id}),'EX','300','NX']);
  if(result!=='OK')throw Error();
  // Fixed destination; code is not a Google token. Fragment is never sent to HTTP logs.
  return NextResponse.json({url:`https://trucky-17a283d5.base44.app/#billing_link=${code}`},{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }catch{return NextResponse.json({code:'LINK_AUTHORIZATION_REQUIRED'},{status:503});}
}
