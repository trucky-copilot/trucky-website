import {NextRequest,NextResponse} from 'next/server';
import {senderSession,SENDER,TOKEN_KEY,decryptGmailToken} from '@/lib/server/gmail';
import {sameOrigin} from '@/lib/server/base44';
import {redisCommandFromEnv} from '@/lib/server/checkout-coordinator.mjs';
import {logoDiagnosticRaw} from '@/lib/server/logo-diagnostic.mjs';
export async function POST(req:NextRequest){
 const reply=(code:string,status:number)=>NextResponse.json({code},{status,headers:{'Cache-Control':'no-store'}});
 if(!sameOrigin(req))return reply('FORBIDDEN',403);
 try{await senderSession(req);}catch{return reply('SENDER_LOGIN_REQUIRED',403);}
 try{
  const redis=redisCommandFromEnv();const encrypted=await redis(['GET',TOKEN_KEY]);
  if(typeof encrypted!=='string')return reply('SENDER_NOT_CONNECTED',503);
  const refresh=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||'',client_secret:process.env.GOOGLE_CLIENT_SECRET||'',grant_type:'refresh_token',refresh_token:decryptGmailToken(encrypted)}),signal:AbortSignal.timeout(15000)});
  if(!refresh.ok)return reply('SENDER_REAUTH_REQUIRED',503);
  const token=await refresh.json();if(!token.access_token)return reply('SENDER_REAUTH_REQUIRED',503);
  const raw=logoDiagnosticRaw(SENDER);
  // One diagnostic total. Keep this marker even on a timeout: delivery may be uncertain.
  if(await redis(['SET','trucky:gmail:logo-diagnostic:v1','reserved','NX'])!=='OK')return reply('DIAGNOSTIC_ALREADY_REQUESTED',409);
  const sent=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({raw}),signal:AbortSignal.timeout(15000)});
  return sent.ok?reply('DIAGNOSTIC_ACCEPTED',200):reply('DIAGNOSTIC_REQUIRES_REVIEW',503);
 }catch{return reply('DIAGNOSTIC_REQUIRES_REVIEW',503);}
}
