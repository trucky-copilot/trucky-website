import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { sameOrigin, googleIdentity, base44Call } from '@/lib/server/base44';
import { redisCommandFromEnv } from '@/lib/server/checkout-coordinator.mjs';
import { SENDER, TOKEN_KEY, decryptGmailToken } from '@/lib/server/gmail';
export async function POST(req: NextRequest) {
  const reply = (code: string, status: number) => NextResponse.json({ code }, { status });
  if (!sameOrigin(req)) return reply('FORBIDDEN',403);
  try {
    const user = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!user?.sub || !user.email) return reply('SIGN_IN_REQUIRED',401);
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    // Fixed verified recipient prevents turning this form into an email relay.
    if (!name || name.length>100 || !/^[+\d ()-]{7,30}$/.test(phone) || email !== user.email.toLowerCase()) return reply('INVALID_DETAILS',400);
    const redis = redisCommandFromEnv();
    const quota = await redis(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],86400) end; return n",'1',`trucky:demo:mail:quota:${user.sub}`]);
    if (quota > 3) return reply('DAILY_LIMIT',429);
    if (process.env.DEMO_TRIAL_ACTIVATION_ENABLED !== 'true') return reply('TRIAL_ACTIVATION_NOT_READY',503);
    const identity = await googleIdentity(req);
    const activation = await base44Call('activateDemoTrial', { google_id_token: identity.idToken });
    if (activation.code !== 'DEMO_TRIAL_ACTIVATED') return reply('TRIAL_ACTIVATION_FAILED',503);
    const start = Date.parse(activation.trial_started_at || '');
    const end = Date.parse(activation.trial_ends_at || '');
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start !== 30 * 86400000) return reply('TRIAL_DATES_INVALID',503);
    if (activation.expired === true) return reply('DEMO_TRIAL_EXPIRED',409);
    const encrypted = await redis(['GET',TOKEN_KEY]);
    if (!encrypted) return reply('SENDER_NOT_CONNECTED',503);
    const refreshed = await fetch('https://oauth2.googleapis.com/token', {
      method:'POST', signal:AbortSignal.timeout(15000),
      body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID || '', client_secret:process.env.GOOGLE_CLIENT_SECRET || '', grant_type:'refresh_token', refresh_token:decryptGmailToken(encrypted)}),
    });
    if (!refreshed.ok) return reply('SENDER_REAUTH_REQUIRED',503);
    const token = await refreshed.json();
    if (!token.access_token) return reply('SENDER_REAUTH_REQUIRED',503);
    const text = `Gracias por probar nuestra app puedes darle clic al siguiente link:\nhttps://trucky-17a283d5.base44.app/\n`;
    const raw = Buffer.from(`From: Trucky <${SENDER}>\r\nTo: ${email}\r\nSubject: Tu demo de Trucky\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(text).toString('base64')}`).toString('base64url');
    // Do not retry automatically: send outcome can be unknown after a timeout.
    const sent = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({raw}),signal:AbortSignal.timeout(15000)});
    if (!sent.ok) return reply('EMAIL_NOT_SENT',503);
    return reply('EMAIL_ACCEPTED',200);
  } catch (error) {
    if (error instanceof Error && ['ACTIVATION_NOT_ENABLED','ACTIVATION_REQUIRES_REVIEW','INVALID_TOKEN','UNAUTHORIZED'].includes(error.message)) return reply(error.message,503);
    if (error instanceof Error && error.message === 'SIGN_IN_REQUIRED') return reply('SIGN_IN_REQUIRED',401);
    return reply('DEMO_REQUEST_REQUIRES_REVIEW',503);
  }
}
