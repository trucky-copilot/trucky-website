import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { sameOrigin } from '@/lib/server/base44';
import { approvalSessionReady, approvalPilotAllowed, requestOwnerApproval } from '@/lib/server/legacy-owner-approval.mjs';
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
export async function GET(req:NextRequest) {
  const session=await getToken({req,secret:process.env.NEXTAUTH_SECRET});
  return NextResponse.json({enabled:process.env.LEGACY_OWNER_APPROVAL_ENABLED==='true',
    signedIn:!!session?.sub, eligible:approvalPilotAllowed(session), fresh:approvalSessionReady(session)}, {headers});
}
export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return NextResponse.json({code:'FORBIDDEN'},{status:403,headers});
  try {
    const session=await getToken({req,secret:process.env.NEXTAUTH_SECRET});
    const body=await req.json();
    // Target and mode are fixed server-side. Ignore no client-supplied token or identity.
    if(Object.keys(body).some(key=>key!=='owner_consent'))return NextResponse.json({code:'INVALID_REQUEST'},{status:400,headers});
    const result=await requestOwnerApproval(session,body.owner_consent);
    return NextResponse.json({code:result.code},{status:result.status,headers});
  } catch {return NextResponse.json({code:'OWNER_APPROVAL_REQUIRES_REVIEW'},{status:503,headers});}
}
